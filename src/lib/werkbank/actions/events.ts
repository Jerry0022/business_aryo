"use server";

import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { addDays, eventDateKeys, formatInstant, todayKey } from "@/lib/business/calendar";
import { getSettings } from "@/lib/business/data";
import { planByKey } from "@/lib/business/subscriptions";
import { isDateKey } from "../calendar-view";
import { CUSTOMER_KINDS, LEAD_KINDS, LEAD_STATUSES, labelOf } from "../constants";
import { eventWarnings, needsConfirmation, timesToInstants, type ContextEvent } from "../event-rules";
import { assertAdmin, failure, logActionError, revalidateWerkbank, SAVE_FAILED } from "../guard";
import { allCustomers, allFloorPasses, allProjects, allSubscriptions, allTools, normalizeChecklist, warningContext } from "../repo";
import { eventInputSchema, fieldErrors, idSchema, rentalInputSchema, type EventInput, type RentalInput } from "../schemas";
import type { ActionResult, SelectOption, Warning } from "../types";

// Calendar mutations. Warnings are computed again on the server; critical ones (vacation, holiday,
// overlap) are only saved after the admin confirmed them in the form.

export interface EventFormContext {
  rhythm: Awaited<ReturnType<typeof getSettings>>["rhythm"];
  events: ContextEvent[];
  options: {
    customers: SelectOption[];
    projects: SelectOption[];
    leads: SelectOption[];
    tools: SelectOption[];
    officeHours: SelectOption[];
    subscriptions: SelectOption[];
    floorPasses: SelectOption[];
  };
}

export async function loadEventFormContext(date: string | null): Promise<EventFormContext> {
  await assertAdmin();
  const today = todayKey();
  const focus = isDateKey(date) ? date : today;
  const start = addDays(focus < today ? focus : today, -60);
  const end = addDays(focus > today ? focus : today, 400);
  const db = getDb();
  const [settings, events, customers, projects, leads, tools, officeHours, subscriptions, passes] = await Promise.all([
    getSettings(),
    warningContext(start, end),
    allCustomers(),
    allProjects(),
    db.select().from(schema.lead).orderBy(desc(schema.lead.createdAt)).limit(200),
    allTools(),
    db.select().from(schema.officeHour).orderBy(desc(schema.officeHour.startsAt)).limit(60),
    allSubscriptions(),
    allFloorPasses(),
  ]);
  const names = new Map(customers.map((customer) => [customer.id, customer.name]));
  return {
    rhythm: settings.rhythm,
    events,
    options: {
      customers: customers.map((customer) => ({ id: customer.id, label: customer.name, meta: labelOf(CUSTOMER_KINDS, customer.kind) })),
      projects: projects.map((project) => ({
        id: project.id,
        label: project.title,
        meta: project.customerId ? names.get(project.customerId) : undefined,
        customerId: project.customerId,
      })),
      leads: leads.map((lead) => ({
        id: lead.id,
        label: `${labelOf(LEAD_KINDS, lead.kind)} · ${lead.name}`,
        meta: labelOf(LEAD_STATUSES, lead.status),
        customerId: lead.customerId,
      })),
      tools: tools.map((tool) => ({ id: tool.id, label: tool.name, meta: tool.category ?? undefined })),
      officeHours: officeHours.map((row) => ({ id: row.id, label: `${formatInstant(row.startsAt)} · ${row.topic}` })),
      subscriptions: subscriptions.map((item) => ({
        id: item.id,
        label: `${planByKey(item.plan)?.name ?? item.plan}${item.customerId && names.get(item.customerId) ? ` · ${names.get(item.customerId)}` : ""}`,
        customerId: item.customerId,
      })),
      floorPasses: passes.map((pass) => ({
        id: pass.id,
        label: pass.title,
        meta: pass.customerId ? names.get(pass.customerId) : undefined,
        customerId: pass.customerId,
        projectId: pass.projectId,
      })),
    },
  };
}

async function serverWarnings(draft: Parameters<typeof eventWarnings>[0]): Promise<Warning[]> {
  const settings = await getSettings();
  const events = await warningContext(addDays(draft.date, -7), addDays(draft.allDay ? draft.endDate : draft.date, 7));
  return eventWarnings(draft, { events, rhythm: settings.rhythm });
}

export async function saveEvent(input: EventInput): Promise<ActionResult<{ id: string }>> {
  await assertAdmin();
  const parsed = eventInputSchema.safeParse(input);
  if (!parsed.success) return failure("Bitte prüf die markierten Felder.", fieldErrors(parsed.error));
  const value = parsed.data;
  const times = { date: value.date, endDate: value.allDay ? value.endDate : value.date, start: value.start, end: value.end, allDay: value.allDay };

  const warnings = await serverWarnings({ ...times, id: value.id, type: value.type, status: value.status });
  if (needsConfirmation(warnings) && !value.confirmed) {
    return { ok: false, needsConfirm: true, warnings, message: "Der Termin kollidiert. Bitte bestätige, dass du ihn trotzdem eintragen willst." };
  }

  const { startsAt, endsAt } = timesToInstants(times);
  const now = new Date();
  const record = {
    type: value.type,
    title: value.title,
    startsAt,
    endsAt,
    allDay: value.allDay,
    location: value.location,
    notes: value.notes,
    status: value.status,
    checklist: value.checklist.length > 0 ? value.checklist : null,
    customerId: value.customerId,
    projectId: value.projectId,
    toolId: value.toolId,
    officeHourId: value.officeHourId,
    subscriptionId: value.subscriptionId,
    leadId: value.leadId,
    floorPassId: value.floorPassId,
    updatedAt: now,
  };
  const db = getDb();
  let id = value.id ?? null;
  let previousType: string | null = null;
  try {
    if (id) {
      const [existing] = await db.select({ type: schema.calendarEvent.type }).from(schema.calendarEvent).where(eq(schema.calendarEvent.id, id)).limit(1);
      if (!existing) return failure("Diesen Termin gibt es nicht mehr.");
      previousType = existing.type;
      await db.update(schema.calendarEvent).set(record).where(eq(schema.calendarEvent.id, id));
    } else {
      id = crypto.randomUUID();
      await db.insert(schema.calendarEvent).values({ id, ...record, createdAt: now });
    }
  } catch (error) {
    logActionError("saveEvent", error);
    return failure(SAVE_FAILED);
  }
  revalidateWerkbank({ publicSite: value.type === "erstberatung" || previousType === "erstberatung" });
  return { ok: true, message: value.id ? "Termin gespeichert." : "Termin angelegt.", data: { id } };
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  await assertAdmin();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return failure("Ungültiger Termin.");
  const db = getDb();
  const [existing] = await db.select({ type: schema.calendarEvent.type }).from(schema.calendarEvent).where(eq(schema.calendarEvent.id, parsed.data)).limit(1);
  if (!existing) return failure("Diesen Termin gibt es nicht mehr.");
  await db.delete(schema.calendarEvent).where(eq(schema.calendarEvent.id, parsed.data));
  revalidateWerkbank({ publicSite: existing.type === "erstberatung" });
  return { ok: true, message: "Termin gelöscht." };
}

const statusSchema = z.object({ id: idSchema, status: z.enum(["geplant", "erledigt", "abgesagt"]) });

export async function setEventStatus(id: string, status: string): Promise<ActionResult> {
  await assertAdmin();
  const parsed = statusSchema.safeParse({ id, status });
  if (!parsed.success) return failure("Ungültiger Status.");
  const db = getDb();
  const [existing] = await db.select({ type: schema.calendarEvent.type }).from(schema.calendarEvent).where(eq(schema.calendarEvent.id, parsed.data.id)).limit(1);
  if (!existing) return failure("Diesen Termin gibt es nicht mehr.");
  await db.update(schema.calendarEvent).set({ status: parsed.data.status, updatedAt: new Date() }).where(eq(schema.calendarEvent.id, parsed.data.id));
  revalidateWerkbank({ publicSite: existing.type === "erstberatung" });
  return { ok: true, message: "Status geändert." };
}

const checklistSchema = z.object({ id: idSchema, index: z.number().int().min(0).max(39), done: z.boolean() });

export async function toggleChecklistItem(id: string, index: number, done: boolean): Promise<ActionResult> {
  await assertAdmin();
  const parsed = checklistSchema.safeParse({ id, index, done });
  if (!parsed.success) return failure("Ungültige Eingabe.");
  const db = getDb();
  const [row] = await db.select({ checklist: schema.calendarEvent.checklist }).from(schema.calendarEvent).where(eq(schema.calendarEvent.id, parsed.data.id)).limit(1);
  if (!row) return failure("Diesen Termin gibt es nicht mehr.");
  const checklist = normalizeChecklist(row.checklist);
  const item = checklist[parsed.data.index];
  if (!item) return failure("Diesen Punkt gibt es nicht mehr.");
  item.done = parsed.data.done;
  await db.update(schema.calendarEvent).set({ checklist, updatedAt: new Date() }).where(eq(schema.calendarEvent.id, parsed.data.id));
  revalidateWerkbank();
  return { ok: true };
}

const bridgeSchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), reason: z.string().trim().max(160) });

/** Books a bridge day as vacation (one all-day entry). */
export async function addBridgeVacation(date: string, reason: string): Promise<ActionResult> {
  await assertAdmin();
  const parsed = bridgeSchema.safeParse({ date, reason });
  if (!parsed.success || !isDateKey(parsed.data.date)) return failure("Ungültiges Datum.");
  const context = await warningContext(parsed.data.date, parsed.data.date);
  if (context.some((event) => event.type === "urlaub" && event.status !== "abgesagt" && eventDateKeys(event).includes(parsed.data.date))) {
    return { ok: true, message: "Dieser Tag ist schon als Urlaub eingetragen." };
  }
  const now = new Date();
  const { startsAt, endsAt } = timesToInstants({ date: parsed.data.date, endDate: parsed.data.date, start: "00:00", end: "00:00", allDay: true });
  await getDb().insert(schema.calendarEvent).values({
    id: crypto.randomUUID(),
    type: "urlaub",
    title: "Brückentag",
    startsAt,
    endsAt,
    allDay: true,
    notes: parsed.data.reason || null,
    status: "geplant",
    createdAt: now,
    updatedAt: now,
  });
  revalidateWerkbank();
  return { ok: true, message: "Brückentag als Urlaub eingetragen." };
}

/**
 * Plans a tool rental: an all-day "Verleih" entry for the whole period (it blocks the tool in the
 * availability timeline) plus, optionally, short handover appointments for issue and return.
 */
export async function planRental(input: RentalInput): Promise<ActionResult<{ id: string }>> {
  await assertAdmin();
  const parsed = rentalInputSchema.safeParse(input);
  if (!parsed.success) return failure("Bitte prüf die markierten Felder.", fieldErrors(parsed.error));
  const value = parsed.data;
  const db = getDb();
  const [tool] = await db.select().from(schema.tool).where(eq(schema.tool.id, value.toolId)).limit(1);
  if (!tool) return failure("Dieses Werkzeug gibt es nicht mehr.");
  const [customer] = value.customerId
    ? await db.select().from(schema.customer).where(eq(schema.customer.id, value.customerId)).limit(1)
    : [];
  const who = customer ? ` · ${customer.name}` : "";

  const handovers = value.handovers
    ? [
        { kind: "Ausgabe", date: value.fromDate, start: value.fromTime },
        { kind: "Rückgabe", date: value.toDate, start: value.toTime },
      ].map((item) => {
        const [hour = 0, minute = 0] = item.start.split(":").map(Number);
        const endMinutes = Math.min(hour * 60 + minute + 30, 23 * 60 + 59);
        const end = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
        return { ...item, end };
      })
    : [];

  if (!value.confirmed) {
    const warnings: Warning[] = [];
    for (const item of handovers) {
      const found = await serverWarnings({ date: item.date, endDate: item.date, start: item.start, end: item.end, allDay: false, type: "werkzeug" });
      warnings.push(...found.filter((warning) => warning.level === "crit").map((warning) => ({ ...warning, message: `${item.kind}: ${warning.message}` })));
    }
    if (needsConfirmation(warnings)) {
      return { ok: false, needsConfirm: true, warnings, message: "Eine Übergabe kollidiert. Bitte bestätige oder wähl einen anderen Termin." };
    }
  }

  const now = new Date();
  const periodId = crypto.randomUUID();
  const period = timesToInstants({ date: value.fromDate, endDate: value.toDate, start: "00:00", end: "00:00", allDay: true });
  const base = { type: "werkzeug", status: "geplant", toolId: tool.id, customerId: customer?.id ?? null, createdAt: now, updatedAt: now };
  try {
    await db.insert(schema.calendarEvent).values({
      id: periodId,
      ...base,
      title: `Verleih: ${tool.name}${who}`,
      startsAt: period.startsAt,
      endsAt: period.endsAt,
      allDay: true,
      notes: value.notes,
    });
    for (const item of handovers) {
      const instants = timesToInstants({ date: item.date, endDate: item.date, start: item.start, end: item.end, allDay: false });
      await db.insert(schema.calendarEvent).values({
        id: crypto.randomUUID(),
        ...base,
        title: `Werkzeug-${item.kind}: ${tool.name}${who}`,
        startsAt: instants.startsAt,
        endsAt: instants.endsAt,
        allDay: false,
        location: "Werkstatt",
      });
    }
  } catch (error) {
    logActionError("planRental", error);
    return failure(SAVE_FAILED);
  }
  revalidateWerkbank();
  return { ok: true, message: handovers.length > 0 ? "Verleih mit Ausgabe und Rückgabe eingetragen." : "Verleih eingetragen.", data: { id: periodId } };
}
