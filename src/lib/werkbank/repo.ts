import "server-only";
import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { addDays, berlinToUtc, type DateKey } from "@/lib/business/calendar";
import type { ContextEvent } from "./event-rules";
import type { CalEvent, ChecklistItem } from "./types";

// Internal data access for the Werkbank. No authorization here: every exported loader in
// queries.ts and every server action calls requireAdmin() before using these helpers.

export type EventRow = typeof schema.calendarEvent.$inferSelect;
export type CustomerRow = typeof schema.customer.$inferSelect;
export type ProjectRow = typeof schema.project.$inferSelect;
export type LeadRow = typeof schema.lead.$inferSelect;
export type ToolRow = typeof schema.tool.$inferSelect;
export type OfficeHourRow = typeof schema.officeHour.$inferSelect;
export type RegistrationRow = typeof schema.officeHourRegistration.$inferSelect;
export type SubscriptionRow = typeof schema.subscription.$inferSelect;
export type FloorPassRow = typeof schema.floorPass.$inferSelect;
export type PartnerRow = typeof schema.partner.$inferSelect;

export function normalizeChecklist(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return { text: item, done: false };
      if (item && typeof item === "object" && typeof (item as { text?: unknown }).text === "string") {
        return { text: (item as { text: string }).text, done: (item as { done?: unknown }).done === true };
      }
      return null;
    })
    .filter((item): item is ChecklistItem => item !== null && item.text.trim() !== "");
}

export function toCalEvent(row: EventRow): CalEvent {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    allDay: row.allDay,
    location: row.location,
    notes: row.notes,
    status: row.status,
    checklist: normalizeChecklist(row.checklist),
    customerId: row.customerId,
    projectId: row.projectId,
    toolId: row.toolId,
    officeHourId: row.officeHourId,
    subscriptionId: row.subscriptionId,
    leadId: row.leadId,
    floorPassId: row.floorPassId,
  };
}

export function toContextEvent(event: Pick<CalEvent, "id" | "type" | "title" | "startsAt" | "endsAt" | "allDay" | "status">): ContextEvent {
  return {
    id: event.id,
    type: event.type,
    title: event.title,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    allDay: event.allDay,
    status: event.status,
  };
}

/** Instants bounding the Berlin dates `start`..`end` (inclusive). */
export function rangeInstants(start: DateKey, end: DateKey) {
  return { from: berlinToUtc(start, "00:00"), to: berlinToUtc(addDays(end, 1), "00:00") };
}

/** Events touching the Berlin date range (inclusive). */
export async function eventsBetween(start: DateKey, end: DateKey): Promise<CalEvent[]> {
  const { from, to } = rangeInstants(start, end);
  const rows = await getDb()
    .select()
    .from(schema.calendarEvent)
    .where(and(lt(schema.calendarEvent.startsAt, to), gt(schema.calendarEvent.endsAt, from)))
    .orderBy(asc(schema.calendarEvent.startsAt));
  return rows.map(toCalEvent);
}

export async function vacationEvents(): Promise<CalEvent[]> {
  const rows = await getDb()
    .select()
    .from(schema.calendarEvent)
    .where(eq(schema.calendarEvent.type, "urlaub"))
    .orderBy(asc(schema.calendarEvent.startsAt));
  return rows.map(toCalEvent);
}

/**
 * Events in a range, every vacation entry and the stored office hours without a calendar event:
 * the context the warning rules need.
 */
export async function warningContext(start: DateKey, end: DateKey): Promise<ContextEvent[]> {
  const [inRange, vacations, hours] = await Promise.all([eventsBetween(start, end), vacationEvents(), officeHoursBetween(start, end)]);
  const linked = new Set(inRange.map((event) => event.officeHourId).filter((id): id is string => Boolean(id)));
  const byId = new Map<string, ContextEvent>();
  for (const event of [...inRange, ...vacations]) byId.set(event.id, toContextEvent(event));
  for (const pseudo of officeHoursAsContext(hours, linked)) byId.set(pseudo.id, pseudo);
  return [...byId.values()];
}

/** Office hours as timed pseudo-events, unless a calendar event already represents them. */
export function officeHoursAsContext(rows: readonly OfficeHourRow[], linkedIds: ReadonlySet<string>): ContextEvent[] {
  return rows
    .filter((row) => !linkedIds.has(row.id))
    .map((row) => ({
      id: `oh:${row.id}`,
      type: "sprechstunde",
      title: `Sprechstunde: ${row.topic}`,
      startsAt: row.startsAt,
      endsAt: new Date(row.startsAt.getTime() + row.durationMinutes * 60_000),
      allDay: false,
      status: row.status === "abgesagt" ? "abgesagt" : "geplant",
    }));
}

export async function officeHoursBetween(start: DateKey, end: DateKey): Promise<OfficeHourRow[]> {
  const { from, to } = rangeInstants(start, end);
  return getDb()
    .select()
    .from(schema.officeHour)
    .where(and(lt(schema.officeHour.startsAt, to), gt(schema.officeHour.startsAt, new Date(from.getTime() - 4 * 3_600_000))))
    .orderBy(asc(schema.officeHour.startsAt));
}

export async function allCustomers() {
  return getDb().select().from(schema.customer).orderBy(asc(schema.customer.name));
}

export async function allProjects() {
  return getDb().select().from(schema.project).orderBy(desc(schema.project.createdAt));
}

export async function allLeads() {
  return getDb().select().from(schema.lead).orderBy(desc(schema.lead.createdAt));
}

export async function allTools() {
  return getDb().select().from(schema.tool).orderBy(asc(schema.tool.sortOrder), asc(schema.tool.name));
}

export async function allSubscriptions() {
  return getDb().select().from(schema.subscription).orderBy(desc(schema.subscription.createdAt));
}

export async function allFloorPasses() {
  return getDb().select().from(schema.floorPass).orderBy(asc(schema.floorPass.nextCareAt), asc(schema.floorPass.title));
}

export async function allPartners() {
  return getDb().select().from(schema.partner).orderBy(asc(schema.partner.company));
}

export async function allOfficeHours() {
  return getDb().select().from(schema.officeHour).orderBy(asc(schema.officeHour.startsAt));
}

export async function allRegistrations() {
  return getDb()
    .select()
    .from(schema.officeHourRegistration)
    .orderBy(asc(schema.officeHourRegistration.createdAt), asc(schema.officeHourRegistration.firstName), asc(schema.officeHourRegistration.id));
}

export async function projectSlots() {
  return getDb()
    .select({
      id: schema.project.id,
      title: schema.project.title,
      status: schema.project.status,
      slotYear: schema.project.slotYear,
      slotMonth: schema.project.slotMonth,
    })
    .from(schema.project);
}

export function customerName(customers: ReadonlyMap<string, { name: string }>, id: string | null | undefined): string | null {
  return id ? customers.get(id)?.name ?? null : null;
}
