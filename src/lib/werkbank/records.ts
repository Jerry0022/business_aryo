import "server-only";
import { asc, eq, or } from "drizzle-orm";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import {
  addDays,
  berlinDateKey,
  berlinTime,
  daysBetween,
  eventDateKeys,
  eventHours,
  eventTypeLabel,
  EVENT_STATUSES,
  formatDateKey,
  formatInstant,
  isoWeek,
  MONTH_NAMES,
  todayKey,
  weekLoadHours,
  weekType,
  WEEK_TYPE_LABELS,
} from "@/lib/business/calendar";
import { PROJECT_STATUSES, projectContingent, SLOT_BOOKED_STATUSES } from "@/lib/business/contingent";
import { getSettings } from "@/lib/business/data";
import { MAX_PRIVATE_MIN_TERM_MONTHS, planByKey, SUBSCRIPTION_STATUSES, HOURS_PER_SUBSCRIPTION_YEAR } from "@/lib/business/subscriptions";
import { calendarHref } from "./calendar-view";
import {
  CUSTOMER_KINDS,
  LEAD_KINDS,
  LEAD_STATUSES,
  labelOf,
  OFFICE_HOUR_STATUSES,
  PARTNER_STATUSES,
  TOOL_STATUSES,
} from "./constants";
import { eventWarnings, instantsToTimes, workingDays } from "./event-rules";
import { formatDateRange, formatHours, formatNumber, relativeDays } from "./format";
import { describeLeadPayload } from "./lead-payload";
import { projectSlots, toCalEvent, warningContext } from "./repo";
import type { CalEvent, EventLine, LinkItem, RecordDetail, RecordRef } from "./types";

// Builds the drawer view of a record: its data, warnings and everything it is linked to.

const db = () => getDb();

function eventLine(event: CalEvent): EventLine {
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

function area(value: number | null): string {
  return value !== null ? `${formatNumber(value)} m²` : "";
}

function date(value: string | null): string {
  return value ? formatDateKey(value) : "";
}

function compact<T extends { value: string }>(rows: T[]): T[] {
  return rows.filter((row) => row.value !== "");
}

async function eventsWhere(column: "customerId" | "projectId" | "toolId" | "officeHourId" | "subscriptionId" | "leadId" | "floorPassId", id: string) {
  const rows = await db()
    .select()
    .from(schema.calendarEvent)
    .where(eq(schema.calendarEvent[column], id))
    .orderBy(asc(schema.calendarEvent.startsAt));
  return rows.map(toCalEvent);
}

async function customerLink(id: string | null): Promise<LinkItem | null> {
  if (!id) return null;
  const [row] = await db().select().from(schema.customer).where(eq(schema.customer.id, id)).limit(1);
  return row ? { ref: { kind: "customer", id: row.id }, label: row.name, meta: labelOf(CUSTOMER_KINDS, row.kind) } : null;
}

function present<T>(items: (T | null | undefined)[]): T[] {
  return items.filter((item): item is T => item !== null && item !== undefined);
}

// ---- Event ---------------------------------------------------------------------------------------

async function eventDetail(id: string): Promise<RecordDetail | null> {
  const [row] = await db().select().from(schema.calendarEvent).where(eq(schema.calendarEvent.id, id)).limit(1);
  if (!row) return null;
  const event = toCalEvent(row);
  const settings = await getSettings();
  const times = instantsToTimes(event);
  const fullContext = await warningContext(addDays(times.date, -7), addDays(times.endDate, 7));
  const warnings = eventWarnings({ ...times, id: event.id, type: event.type, status: event.status }, { events: fullContext, rhythm: settings.rhythm }).filter(
    (warning) => warning.level !== "ok",
  );

  const [customer, project, lead, tool, officeHour, subscription, floorPass] = await Promise.all([
    customerLink(event.customerId),
    event.projectId ? db().select().from(schema.project).where(eq(schema.project.id, event.projectId)).limit(1) : [],
    event.leadId ? db().select().from(schema.lead).where(eq(schema.lead.id, event.leadId)).limit(1) : [],
    event.toolId ? db().select().from(schema.tool).where(eq(schema.tool.id, event.toolId)).limit(1) : [],
    event.officeHourId ? db().select().from(schema.officeHour).where(eq(schema.officeHour.id, event.officeHourId)).limit(1) : [],
    event.subscriptionId ? db().select().from(schema.subscription).where(eq(schema.subscription.id, event.subscriptionId)).limit(1) : [],
    event.floorPassId ? db().select().from(schema.floorPass).where(eq(schema.floorPass.id, event.floorPassId)).limit(1) : [],
  ]);
  const links = present<LinkItem>([
    customer,
    project[0] ? { ref: { kind: "project", id: project[0].id }, label: project[0].title, meta: labelOf(PROJECT_STATUSES, project[0].status) } : null,
    lead[0] ? { ref: { kind: "lead", id: lead[0].id }, label: `${labelOf(LEAD_KINDS, lead[0].kind)} · ${lead[0].name}`, meta: labelOf(LEAD_STATUSES, lead[0].status) } : null,
    tool[0] ? { ref: { kind: "tool", id: tool[0].id }, label: tool[0].name, meta: tool[0].category ?? undefined } : null,
    officeHour[0] ? { ref: { kind: "officeHour", id: officeHour[0].id }, label: officeHour[0].topic, meta: formatInstant(officeHour[0].startsAt) } : null,
    subscription[0]
      ? { ref: { kind: "subscription", id: subscription[0].id }, label: planByKey(subscription[0].plan)?.name ?? subscription[0].plan, meta: labelOf(SUBSCRIPTION_STATUSES, subscription[0].status) }
      : null,
    floorPass[0] ? { ref: { kind: "floorPass", id: floorPass[0].id }, label: floorPass[0].title, meta: "Boden-Pass" } : null,
  ]);

  const week = isoWeek(times.date);
  const monday = times.date;
  const load = weekLoadHours(fullContext, monday);
  const detail: RecordDetail = {
    ref: { kind: "event", id },
    title: event.title,
    badges: [
      { label: eventTypeLabel(event.type), tone: "oak" },
      { label: labelOf(EVENT_STATUSES, event.status), tone: event.status === "abgesagt" ? "crit" : event.status === "erledigt" ? "ok" : "neutral" },
      ...(warnings.some((warning) => warning.level === "crit") ? [{ label: "Konflikt", tone: "crit" as const }] : []),
    ],
    banners: warnings.map((warning) => ({ tone: warning.level === "ok" ? "ok" : warning.level, text: warning.message })),
    sections: [],
    links,
    events: [],
    event,
    context: {
      customerId: event.customerId,
      projectId: event.projectId,
      leadId: event.leadId,
      toolId: event.toolId,
      subscriptionId: event.subscriptionId,
      floorPassId: event.floorPassId,
      officeHourId: event.officeHourId,
      date: times.date,
    },
    calendarHref: calendarHref("woche", times.date),
  };
  if (event.allDay) {
    detail.subtitle = `${formatDateRange(times.date, times.endDate)} · ganztägig`;
  } else {
    const gross = (event.endsAt.getTime() - event.startsAt.getTime()) / 3_600_000;
    const net = eventHours(event);
    detail.subtitle = `${formatInstant(event.startsAt)}–${berlinTime(event.endsAt)} · ${formatHours(gross)} h${net !== gross && net > 0 ? ` (${formatHours(net)} h netto)` : ""}`;
  }
  detail.sections.push({
    title: "Details",
    rows: compact([
      { label: "Ort", value: event.location ?? "" },
      { label: "Woche", value: `KW ${week.week} · ${WEEK_TYPE_LABELS[weekType(times.date, settings.rhythm)]} · ${formatHours(load)} / ${formatHours(settings.rhythm.weeklyHoursTarget)} h` },
      ...(event.type === "urlaub" ? [{ label: "Urlaubstage", value: `${workingDays(times.date, times.endDate)} (Mo–Fr ohne Feiertage)` }] : []),
      { label: "Notiz", value: event.notes ?? "" },
    ]),
  });
  if (event.type === "urlaub") {
    const days = daysBetween(todayKey(), times.date);
    if (days > 0) detail.banners.unshift({ tone: "info", text: `Noch ${days} Tage bis zum Urlaub.` });
  }
  return detail;
}

// ---- Customer ------------------------------------------------------------------------------------

async function customerDetail(id: string): Promise<RecordDetail | null> {
  const [row] = await db().select().from(schema.customer).where(eq(schema.customer.id, id)).limit(1);
  if (!row) return null;
  const [projects, passes, subscriptions, leads, events] = await Promise.all([
    db().select().from(schema.project).where(eq(schema.project.customerId, id)),
    db().select().from(schema.floorPass).where(eq(schema.floorPass.customerId, id)),
    db().select().from(schema.subscription).where(eq(schema.subscription.customerId, id)),
    db().select().from(schema.lead).where(eq(schema.lead.customerId, id)),
    eventsWhere("customerId", id),
  ]);
  const address = [row.street, [row.postalCode, row.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return {
    ref: { kind: "customer", id },
    title: row.name,
    subtitle: address || undefined,
    badges: [{ label: labelOf(CUSTOMER_KINDS, row.kind), tone: "neutral" }],
    banners: [],
    sections: [
      {
        title: "Kontakt",
        rows: compact([
          { label: "E-Mail", value: row.email ?? "" },
          { label: "Telefon", value: row.phone ?? "" },
          { label: "Adresse", value: address },
          { label: "Notiz", value: row.notes ?? "" },
          { label: "Kunde seit", value: formatDateKey(berlinDateKey(row.createdAt)) },
        ]),
      },
    ],
    links: [
      ...projects.map((project) => ({
        ref: { kind: "project" as const, id: project.id },
        label: project.title,
        meta: `${labelOf(PROJECT_STATUSES, project.status)}${project.slotYear ? ` · Platz ${project.slotMonth ? MONTH_NAMES[project.slotMonth - 1] + " " : ""}${project.slotYear}` : ""}`,
      })),
      ...passes.map((pass) => ({ ref: { kind: "floorPass" as const, id: pass.id }, label: pass.title, meta: "Boden-Pass" })),
      ...subscriptions.map((item) => ({
        ref: { kind: "subscription" as const, id: item.id },
        label: planByKey(item.plan)?.name ?? item.plan,
        meta: labelOf(SUBSCRIPTION_STATUSES, item.status),
      })),
      ...leads.map((lead) => ({
        ref: { kind: "lead" as const, id: lead.id },
        label: labelOf(LEAD_KINDS, lead.kind),
        meta: `${labelOf(LEAD_STATUSES, lead.status)} · ${formatDateKey(berlinDateKey(lead.createdAt))}`,
      })),
    ],
    events: events.map(eventLine),
    context: { customerId: id, title: row.name, location: row.city ?? row.postalCode ?? null },
  };
}

// ---- Project -------------------------------------------------------------------------------------

async function projectDetail(id: string): Promise<RecordDetail | null> {
  const [row] = await db().select().from(schema.project).where(eq(schema.project.id, id)).limit(1);
  if (!row) return null;
  const settings = await getSettings();
  const [customer, passes, events, slots] = await Promise.all([
    customerLink(row.customerId),
    db().select().from(schema.floorPass).where(eq(schema.floorPass.projectId, id)),
    eventsWhere("projectId", id),
    projectSlots(),
  ]);
  const banners: RecordDetail["banners"] = [];
  let slotText = "kein Projektplatz";
  if (row.slotYear) {
    const contingent = projectContingent(slots, row.slotYear, settings.contingent.projectSlotsPerYear);
    slotText = `${row.slotMonth ? `${MONTH_NAMES[row.slotMonth - 1]} ` : ""}${row.slotYear} · noch ${contingent.free} von ${contingent.total} frei`;
    const sameMonth = slots.filter(
      (slot) => slot.id !== id && slot.slotYear === row.slotYear && slot.slotMonth === row.slotMonth && row.slotMonth && SLOT_BOOKED_STATUSES.has(slot.status),
    );
    if (sameMonth.length > 0) banners.push({ tone: "warn", text: `Im ${MONTH_NAMES[(row.slotMonth ?? 1) - 1]} ${row.slotYear} ist schon ${sameMonth.map((slot) => `„${slot.title}“`).join(", ")} gebucht.` });
    if (contingent.booked > contingent.total) banners.push({ tone: "crit", text: `${row.slotYear} sind mehr Projekte gebucht (${contingent.booked}) als Projektplätze (${contingent.total}).` });
  }
  return {
    ref: { kind: "project", id },
    title: row.title,
    subtitle: [area(row.areaM2), row.floorType, row.city].filter(Boolean).join(" · ") || undefined,
    badges: [
      { label: labelOf(PROJECT_STATUSES, row.status), tone: SLOT_BOOKED_STATUSES.has(row.status) ? "ok" : row.status === "storniert" ? "crit" : "neutral" },
      ...(row.slotYear ? [{ label: `Projektplatz ${row.slotMonth ? MONTH_NAMES[row.slotMonth - 1] + " " : ""}${row.slotYear}`, tone: "oak" as const }] : []),
    ],
    banners,
    sections: [
      {
        title: "Details",
        rows: compact([
          { label: "Kunde", value: customer?.label ?? "" },
          { label: "Boden", value: row.floorType ?? "" },
          { label: "Fläche", value: area(row.areaM2) },
          { label: "Ort", value: row.city ?? "" },
          { label: "Projektplatz", value: slotText },
          { label: "Notiz", value: row.notes ?? "" },
        ]),
      },
    ],
    links: present<LinkItem>([customer, ...passes.map((pass) => ({ ref: { kind: "floorPass" as const, id: pass.id }, label: pass.title, meta: "Boden-Pass" }))]),
    events: events.map(eventLine),
    context: { projectId: id, customerId: row.customerId, title: row.title, location: row.city },
  };
}

// ---- Lead ----------------------------------------------------------------------------------------

async function leadDetail(id: string): Promise<RecordDetail | null> {
  const [row] = await db().select().from(schema.lead).where(eq(schema.lead.id, id)).limit(1);
  if (!row) return null;
  const settings = await getSettings();
  const view = describeLeadPayload(row.kind, row.payload);
  const [customer, events, partners, slots] = await Promise.all([
    customerLink(row.customerId),
    eventsWhere("leadId", id),
    db().select().from(schema.partner).where(eq(schema.partner.email, row.email.toLowerCase())),
    row.kind === "projekt" ? projectSlots() : Promise.resolve([]),
  ]);
  const banners: RecordDetail["banners"] = [];
  if (row.kind === "notfall") banners.push({ tone: "crit", text: "Notfall: Bitte zeitnah melden und um Fotos bitten." });
  if (row.kind === "projekt") {
    const contingent = projectContingent(slots, settings.contingent.slotYear, settings.contingent.projectSlotsPerYear);
    banners.push({ tone: "info", text: `Projektplätze ${contingent.year}: noch ${contingent.free} von ${contingent.total} frei.` });
  }
  const partner = partners[0];
  const detail: RecordDetail = {
    ref: { kind: "lead", id },
    title: `${labelOf(LEAD_KINDS, row.kind)} · ${row.name}`,
    subtitle: `eingegangen am ${formatInstant(row.createdAt)}`,
    badges: [
      { label: labelOf(LEAD_KINDS, row.kind), tone: row.kind === "notfall" ? "crit" : "oak" },
      { label: labelOf(LEAD_STATUSES, row.status), tone: row.status === "neu" ? "warn" : row.status === "erledigt" ? "ok" : row.status === "abgelehnt" ? "crit" : "info" },
    ],
    banners,
    sections: [
      {
        title: "Kontakt",
        rows: compact([
          { label: "Name", value: row.name },
          { label: "E-Mail", value: row.email },
          { label: "Telefon", value: row.phone ?? "" },
          { label: "PLZ", value: row.postalCode ?? "" },
        ]),
      },
      ...view.sections,
      ...(row.message ? [{ title: "Nachricht", rows: [{ label: "Text", value: row.message }] }] : []),
    ],
    bullets:
      view.recommendations.length > 0
        ? {
            title: "Empfehlungen im Bodenprofil",
            items: view.recommendations.map(
              (item) => `${item.name}${item.viaMasterPartner ? " (über Meisterpartner)" : ""}${item.why ? `: ${item.why}` : ""}${item.care ? ` ${item.care}` : ""}`,
            ),
          }
        : undefined,
    links: present<LinkItem>([
      customer,
      partner ? { ref: { kind: "partner", id: partner.id }, label: partner.company, meta: labelOf(PARTNER_STATUSES, partner.status) } : null,
    ]),
    events: events.map(eventLine),
    lead: { kind: row.kind, status: row.status, customerId: row.customerId, partnerId: partner?.id ?? null },
    context: {
      leadId: id,
      customerId: row.customerId,
      title: row.name,
      location: row.postalCode,
      notes: [view.floorWish, view.areaM2 !== null ? `${formatNumber(view.areaM2)} m²` : null].filter(Boolean).join(" · ") || null,
      areaM2: view.areaM2,
      floorType: view.floorWish,
    },
  };
  return detail;
}

// ---- Tool ----------------------------------------------------------------------------------------

async function toolDetail(id: string): Promise<RecordDetail | null> {
  const [row] = await db().select().from(schema.tool).where(eq(schema.tool.id, id)).limit(1);
  if (!row) return null;
  const events = await eventsWhere("toolId", id);
  const today = todayKey();
  const current = events.find((event) => event.allDay && event.status !== "abgesagt" && eventDateKeys(event).includes(today));
  const customerIds = [...new Set(events.map((event) => event.customerId).filter((value): value is string => Boolean(value)))];
  const customers = await Promise.all(customerIds.map((customerId) => customerLink(customerId)));
  return {
    ref: { kind: "tool", id },
    title: row.name,
    subtitle: row.category ?? undefined,
    badges: [
      { label: labelOf(TOOL_STATUSES, row.status), tone: row.status === "verfuegbar" ? "ok" : "warn" },
      ...(current ? [{ label: `verliehen bis ${formatDateKey(eventDateKeys(current).at(-1) ?? today, false)}`, tone: "info" as const }] : []),
    ],
    banners: [],
    sections: [{ title: "Details", rows: compact([{ label: "Kategorie", value: row.category ?? "" }, { label: "Notiz", value: row.notes ?? "" }]) }],
    links: present(customers),
    events: events.map(eventLine),
    context: { toolId: id, title: row.name },
  };
}

// ---- Office hour ---------------------------------------------------------------------------------

async function officeHourDetail(id: string): Promise<RecordDetail | null> {
  const [row] = await db().select().from(schema.officeHour).where(eq(schema.officeHour.id, id)).limit(1);
  if (!row) return null;
  const [registrations, events] = await Promise.all([
    db().select().from(schema.officeHourRegistration).where(eq(schema.officeHourRegistration.officeHourId, id)).orderBy(asc(schema.officeHourRegistration.createdAt), asc(schema.officeHourRegistration.firstName), asc(schema.officeHourRegistration.id)),
    eventsWhere("officeHourId", id),
  ]);
  const unconfirmed = registrations.filter((registration) => !registration.confirmedAt).length;
  const end = new Date(row.startsAt.getTime() + row.durationMinutes * 60_000);
  return {
    ref: { kind: "officeHour", id },
    title: `Sprechstunde: ${row.topic}`,
    subtitle: `${formatInstant(row.startsAt)}–${berlinTime(end)} · ${row.durationMinutes} min`,
    badges: [{ label: labelOf(OFFICE_HOUR_STATUSES, row.status), tone: row.status === "abgesagt" ? "crit" : row.status === "durchgefuehrt" ? "ok" : "neutral" }],
    banners: unconfirmed > 0 ? [{ tone: "info", text: `${unconfirmed} ${unconfirmed === 1 ? "Anmeldung ist" : "Anmeldungen sind"} noch unbestätigt (Double-Opt-In).` }] : [],
    sections: [
      {
        title: "Zahlen",
        rows: [
          { label: "Anmeldungen", value: String(registrations.length), mono: true },
          { label: "Bestätigt", value: String(registrations.length - unconfirmed), mono: true },
          { label: "Live oder Aufzeichnung", value: String(registrations.filter((item) => item.attended || item.watchedRecording).length), mono: true },
          { label: "Gutscheine", value: `${registrations.filter((item) => item.voucherIssuedAt).length} ausgestellt · ${registrations.filter((item) => item.voucherRedeemedAt).length} eingelöst`, mono: true },
        ],
      },
    ],
    links: [],
    events: events.map(eventLine),
    registrations: registrations.map((item) => ({
      id: item.id,
      firstName: item.firstName,
      email: item.email,
      confirmed: Boolean(item.confirmedAt),
      attended: item.attended,
      watchedRecording: item.watchedRecording,
      voucherCode: item.voucherCode,
      voucherRedeemed: Boolean(item.voucherRedeemedAt),
    })),
    context: { officeHourId: id, date: berlinDateKey(row.startsAt), title: `Sprechstunde: ${row.topic}` },
    calendarHref: calendarHref("woche", berlinDateKey(row.startsAt)),
  };
}

// ---- Subscription --------------------------------------------------------------------------------

async function subscriptionDetail(id: string): Promise<RecordDetail | null> {
  const [row] = await db().select().from(schema.subscription).where(eq(schema.subscription.id, id)).limit(1);
  if (!row) return null;
  const settings = await getSettings();
  const plan = planByKey(row.plan);
  const [customer, events, passes] = await Promise.all([
    customerLink(row.customerId),
    eventsWhere("subscriptionId", id),
    row.customerId ? db().select().from(schema.floorPass).where(eq(schema.floorPass.customerId, row.customerId)) : Promise.resolve([]),
  ]);
  const minTerm = row.minTermMonths ?? settings.subscriptions.minTermMonths[row.plan] ?? null;
  const banners: RecordDetail["banners"] = [];
  if (plan?.private && minTerm !== null && minTerm > MAX_PRIVATE_MIN_TERM_MONTHS) {
    banners.push({ tone: "crit", text: `Für Privatkunden sind höchstens ${MAX_PRIVATE_MIN_TERM_MONTHS} Monate Erstlaufzeit erlaubt (danach monatlich kündbar).` });
  }
  return {
    ref: { kind: "subscription", id },
    title: `${plan?.name ?? row.plan}${customer ? ` · ${customer.label}` : ""}`,
    subtitle: plan?.audience,
    badges: [
      { label: labelOf(SUBSCRIPTION_STATUSES, row.status), tone: row.status === "aktiv" ? "ok" : row.status === "gekuendigt" ? "crit" : "warn" },
      { label: plan?.private ? "Privat" : "Gewerbe", tone: "neutral" },
      ...(plan?.usesSlot ? [{ label: "Abo-Platz", tone: "oak" as const }] : []),
    ],
    banners,
    sections: [
      {
        title: "Vertrag",
        rows: compact([
          { label: "Kunde", value: customer?.label ?? "" },
          { label: "Start", value: date(row.startedAt) },
          { label: "Mindestlaufzeit", value: minTerm !== null ? `${minTerm} Monate` : "" },
          { label: "Fläche", value: area(row.areaM2) },
          { label: "Aufwand", value: plan?.usesSlot ? `ca. ${formatHours(HOURS_PER_SUBSCRIPTION_YEAR)} h pro Jahr vor Ort` : "remote, zählt nicht auf die Abo-Plätze" },
          { label: "Notiz", value: row.notes ?? "" },
        ]),
      },
    ],
    bullets: plan ? { title: "Enthalten", items: [...plan.features] } : undefined,
    links: present<LinkItem>([customer, ...passes.map((pass) => ({ ref: { kind: "floorPass" as const, id: pass.id }, label: pass.title, meta: "Boden-Pass" }))]),
    events: events.map(eventLine),
    context: { subscriptionId: id, customerId: row.customerId, floorPassId: passes[0]?.id ?? null, title: plan?.name ?? row.plan },
  };
}

// ---- Floor pass ----------------------------------------------------------------------------------

async function floorPassDetail(id: string): Promise<RecordDetail | null> {
  const [row] = await db().select().from(schema.floorPass).where(eq(schema.floorPass.id, id)).limit(1);
  if (!row) return null;
  const [customer, projectRows, events, subscriptions] = await Promise.all([
    customerLink(row.customerId),
    row.projectId ? db().select().from(schema.project).where(eq(schema.project.id, row.projectId)).limit(1) : Promise.resolve([]),
    eventsWhere("floorPassId", id),
    row.customerId ? db().select().from(schema.subscription).where(eq(schema.subscription.customerId, row.customerId)) : Promise.resolve([]),
  ]);
  const project = projectRows[0];
  const subscription = subscriptions.find((item) => item.status === "aktiv" && item.plan === "boden-pass-plus") ?? subscriptions.find((item) => item.status === "aktiv");
  const banners: RecordDetail["banners"] = [];
  if (row.nextCareAt) {
    const days = daysBetween(todayKey(), row.nextCareAt);
    banners.push({
      tone: days < 0 ? "crit" : days <= 45 ? "warn" : "info",
      text: `Nächste Pflege: ${formatDateKey(row.nextCareAt)} (${relativeDays(days)}).`,
    });
  }
  return {
    ref: { kind: "floorPass", id },
    title: row.title,
    subtitle: [customer?.label, area(row.areaM2)].filter(Boolean).join(" · ") || undefined,
    badges: [{ label: "Boden-Pass", tone: "oak" }, ...(subscription ? [{ label: planByKey(subscription.plan)?.name ?? "Abo", tone: "ok" as const }] : [])],
    banners,
    sections: [
      {
        title: "Was verlegt wurde",
        rows: compact([
          { label: "Holz / Belag", value: row.wood ?? "" },
          { label: "Oberfläche", value: row.surface ?? "" },
          { label: "Charge", value: row.batch ?? "", mono: true },
          { label: "Fläche", value: area(row.areaM2) },
          { label: "Verlegt am", value: date(row.installedAt) },
          { label: "Nächste Pflege", value: date(row.nextCareAt) },
        ]),
      },
      ...(row.carePlan ? [{ title: "Pflegeplan", rows: [{ label: "Plan", value: row.carePlan }] }] : []),
      ...(row.notes ? [{ title: "Notiz", rows: [{ label: "Notiz", value: row.notes }] }] : []),
    ],
    links: present<LinkItem>([
      customer,
      project ? { ref: { kind: "project", id: project.id }, label: project.title, meta: labelOf(PROJECT_STATUSES, project.status) } : null,
      subscription ? { ref: { kind: "subscription", id: subscription.id }, label: planByKey(subscription.plan)?.name ?? subscription.plan, meta: labelOf(SUBSCRIPTION_STATUSES, subscription.status) } : null,
    ]),
    events: events.map(eventLine),
    context: {
      floorPassId: id,
      customerId: row.customerId,
      projectId: row.projectId,
      subscriptionId: subscription?.id ?? null,
      date: row.nextCareAt,
      title: row.title,
    },
  };
}

// ---- Partner -------------------------------------------------------------------------------------

async function partnerDetail(id: string): Promise<RecordDetail | null> {
  const [row] = await db().select().from(schema.partner).where(eq(schema.partner.id, id)).limit(1);
  if (!row) return null;
  const leads = row.email
    ? await db().select().from(schema.lead).where(or(eq(schema.lead.email, row.email), eq(schema.lead.email, row.email.toLowerCase())))
    : [];
  const unlocks = row.isMasterPartner && row.status === "aktiv";
  return {
    ref: { kind: "partner", id },
    title: row.company,
    subtitle: [row.trade, row.region].filter(Boolean).join(" · ") || undefined,
    badges: [
      { label: labelOf(PARTNER_STATUSES, row.status), tone: row.status === "aktiv" ? "ok" : row.status === "abgelehnt" ? "crit" : "neutral" },
      ...(row.isMasterPartner ? [{ label: "Parkettleger-Meisterbetrieb", tone: "oak" as const }] : []),
    ],
    banners: row.isMasterPartner
      ? [
          unlocks
            ? { tone: "ok", text: "Aktiver Meisterpartner: Leistungen mit Meisterpflicht sind auf der Website sichtbar." }
            : { tone: "info", text: "Sobald dieser Meisterbetrieb aktiv ist, erscheinen die Leistungen mit Meisterpflicht auf der Website." },
        ]
      : [],
    sections: [
      {
        title: "Kontakt",
        rows: compact([
          { label: "Ansprechpartner", value: row.contactName ?? "" },
          { label: "E-Mail", value: row.email ?? "" },
          { label: "Telefon", value: row.phone ?? "" },
          { label: "Gewerk", value: row.trade ?? "" },
          { label: "Region", value: row.region ?? "" },
          { label: "Notiz", value: row.notes ?? "" },
        ]),
      },
    ],
    links: leads.map((lead) => ({ ref: { kind: "lead" as const, id: lead.id }, label: labelOf(LEAD_KINDS, lead.kind), meta: formatDateKey(berlinDateKey(lead.createdAt)) })),
    events: [],
    context: { title: row.company },
  };
}

export async function buildRecordDetail(ref: RecordRef): Promise<RecordDetail | null> {
  switch (ref.kind) {
    case "event":
      return eventDetail(ref.id);
    case "customer":
      return customerDetail(ref.id);
    case "project":
      return projectDetail(ref.id);
    case "lead":
      return leadDetail(ref.id);
    case "tool":
      return toolDetail(ref.id);
    case "officeHour":
      return officeHourDetail(ref.id);
    case "subscription":
      return subscriptionDetail(ref.id);
    case "floorPass":
      return floorPassDetail(ref.id);
    case "partner":
      return partnerDetail(ref.id);
  }
}

