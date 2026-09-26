import "server-only";
import { count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import {
  addDays,
  berlinDateKey,
  berlinMinutes,
  bridgeDays,
  daysBetween,
  eventDateKeys,
  formatDateKey,
  holidayMap,
  isoWeek,
  mondayOf,
  nextVacation,
  parseDateKey,
  todayKey,
  toDateKey,
  vacationStats,
  weekLoadHours,
  weekType,
  type DateKey,
} from "@/lib/business/calendar";
import { foundingContingent, projectContingent, subscriptionSlotsUsed } from "@/lib/business/contingent";
import { getServiceCatalog, getSettings, hasActiveMasterPartner } from "@/lib/business/data";
import { defaultOfficeHours, mergeOfficeHours } from "@/lib/business/office-hours";
import { HOURS_PER_SUBSCRIPTION_YEAR } from "@/lib/business/subscriptions";
import { requireAdmin } from "@/lib/session";
import { isoWeekMondays, viewRange, type CalendarView } from "./calendar-view";
import { OPEN_LEAD_STATUSES } from "./constants";
import { buildEntries, virtualOfficeHours } from "./entries";
import { hasConflict, workingDays, type ContextEvent } from "./event-rules";
import { describeLeadPayload } from "./lead-payload";
import {
  allCustomers,
  allFloorPasses,
  allLeads,
  allOfficeHours,
  allPartners,
  allProjects,
  allRegistrations,
  allSubscriptions,
  allTools,
  eventsBetween,
  officeHoursAsContext,
  officeHoursBetween,
  projectSlots,
  toContextEvent,
  vacationEvents,
} from "./repo";
import type { CalEvent } from "./types";

// Page loaders of the Werkbank. Each one checks the admin session itself: layouts do not protect
// data loaders that might be reused elsewhere.

export interface VacationSpan {
  id: string;
  title: string;
  start: DateKey;
  end: DateKey;
  status: string;
  days: number;
}

function toVacationSpan(event: CalEvent): VacationSpan {
  const keys = eventDateKeys(event);
  const start = keys[0] ?? berlinDateKey(event.startsAt);
  const end = keys[keys.length - 1] ?? start;
  return { id: event.id, title: event.title, start, end, status: event.status, days: workingDays(start, end) };
}

async function registrationCounts(): Promise<Map<string, number>> {
  const rows = await getDb()
    .select({ officeHourId: schema.officeHourRegistration.officeHourId, total: count() })
    .from(schema.officeHourRegistration)
    .groupBy(schema.officeHourRegistration.officeHourId);
  return new Map(rows.map((row) => [row.officeHourId, Number(row.total)]));
}

/** Entries, context and loads for a date range (shared by calendar and overview). */
async function rangeData(start: DateKey, end: DateKey, now: Date) {
  const settings = await getSettings();
  const [events, officeHours, vacations, registrations] = await Promise.all([
    eventsBetween(start, end),
    officeHoursBetween(start, end),
    vacationEvents(),
    registrationCounts(),
  ]);
  const linked = new Set(events.map((event) => event.officeHourId).filter((id): id is string => Boolean(id)));
  const contextById = new Map<string, ContextEvent>();
  for (const event of [...events, ...vacations]) contextById.set(event.id, toContextEvent(event));
  for (const pseudo of officeHoursAsContext(officeHours, linked)) contextById.set(pseudo.id, pseudo);
  const context = [...contextById.values()];
  const entries = buildEntries({
    events,
    officeHours,
    registrations,
    virtual: virtualOfficeHours(now, start, end, officeHours, settings.officeHours),
    context,
    rhythm: settings.rhythm,
  });
  const weekLoads: Record<DateKey, number> = {};
  for (let monday = mondayOf(start); monday <= end; monday = addDays(monday, 7)) {
    weekLoads[monday] = weekLoadHours(context, monday);
  }
  return { settings, events, officeHours, vacations, entries, context, weekLoads, registrations };
}

// ---- Calendar ------------------------------------------------------------------------------------

export async function getCalendarData(view: CalendarView, date: DateKey, now: Date = new Date()) {
  await requireAdmin();
  const today = todayKey(now);
  const range = viewRange(view, date);
  const { settings, entries, vacations, weekLoads } = await rangeData(range.start, range.end, now);
  const year = parseDateKey(date).year;
  const years = [...new Set([parseDateKey(range.start).year, year, parseDateKey(range.end).year])];
  const spans = vacations.filter((event) => event.status !== "abgesagt").map(toVacationSpan);
  const account = vacationStats(vacations, year, settings.vacationDaysPerYear, today);
  const next = nextVacation(vacations, today);
  const nextSpan = next ? spans.find((span) => span.start === next.start) ?? null : null;
  const bridgeYears = [...new Set([parseDateKey(today).year, year, year + 1])];
  const bridges = bridgeYears
    .flatMap((y) => bridgeDays(y))
    .filter((day) => day.date >= today)
    .map((day) => ({ ...day, planned: spans.some((span) => day.date >= span.start && day.date <= span.end) }));
  return {
    view,
    date,
    today,
    nowMinutes: berlinMinutes(now),
    range,
    entries,
    holidays: [...holidayMap(years).entries()],
    vacations: spans,
    weekLoads,
    rhythm: settings.rhythm,
    vacationDaysPerYear: settings.vacationDaysPerYear,
    account,
    accountSpans: spans.filter((span) => parseDateKey(span.start).year === year || parseDateKey(span.end).year === year),
    nextVacation: next && nextSpan ? { ...nextSpan, inDays: next.inDays } : null,
    bridges,
  };
}

export type CalendarData = Awaited<ReturnType<typeof getCalendarData>>;

// ---- Overview ------------------------------------------------------------------------------------

export async function getOverviewData(now: Date = new Date()) {
  await requireAdmin();
  const today = todayKey(now);
  const settings = await getSettings();
  const slotYear = settings.contingent.slotYear;
  const agendaEnd = addDays(today, 7);
  const thisMonday = mondayOf(today);
  const nextMonday = addDays(thisMonday, 7);
  const yearMondays = isoWeekMondays(slotYear);
  const yearStart = yearMondays[0] ?? toDateKey(slotYear, 1, 1);
  const yearEnd = addDays(yearMondays[yearMondays.length - 1] ?? toDateKey(slotYear, 12, 24), 6);

  const [agenda, horizon, year, slots, consultations, leads, subscriptions, passes, storedHours, registrations, services, master] =
    await Promise.all([
      rangeData(today, agendaEnd, now),
      rangeData(thisMonday, addDays(today, 90), now),
      rangeData(yearStart, yearEnd, now),
      projectSlots(),
      getDb()
        .select({ type: schema.calendarEvent.type, startsAt: schema.calendarEvent.startsAt, status: schema.calendarEvent.status })
        .from(schema.calendarEvent)
        .where(eq(schema.calendarEvent.type, "erstberatung")),
      allLeads(),
      allSubscriptions(),
      allFloorPasses(),
      allOfficeHours(),
      allRegistrations(),
      getServiceCatalog(),
      hasActiveMasterPartner(),
    ]);

  const projects = projectContingent(slots, slotYear, settings.contingent.projectSlotsPerYear);
  const monthTitles = projects.months.map((month) =>
    slots
      .filter((slot) => slot.slotYear === slotYear && slot.slotMonth === month.month && slot.status !== "storniert")
      .map((slot) => slot.title),
  );
  const founding = foundingContingent(consultations, settings.contingent.foundingConsultations, settings.contingent.foundingDeadline, today);
  const foundingDone = consultations.filter(
    (event) => event.status !== "abgesagt" && berlinDateKey(event.startsAt) < today && berlinDateKey(event.startsAt) <= founding.deadline,
  ).length;

  const target = settings.rhythm.weeklyHoursTarget;
  const weeks = [thisMonday, nextMonday].map((monday) => ({
    monday,
    hours: horizon.weekLoads[monday] ?? 0,
    type: weekType(monday, settings.rhythm),
  }));

  const vacations = horizon.vacations;
  const next = nextVacation(vacations, today);
  const nextEvent = next ? vacations.find((event) => eventDateKeys(event)[0] === next.start) : undefined;
  const account = vacationStats(vacations, parseDateKey(today).year, settings.vacationDaysPerYear, today);

  const openLeads = leads.filter((lead) => OPEN_LEAD_STATUSES.has(lead.status));
  const leadsByKind: Record<string, number> = {};
  for (const lead of openLeads) leadsByKind[lead.kind] = (leadsByKind[lead.kind] ?? 0) + 1;

  const regByHour = new Map<string, typeof registrations>();
  for (const registration of registrations) {
    const list = regByHour.get(registration.officeHourId) ?? [];
    list.push(registration);
    regByHour.set(registration.officeHourId, list);
  }
  const upcomingHours = storedHours.filter((row) => row.startsAt.getTime() + row.durationMinutes * 60_000 > now.getTime());
  const nextHour = mergeOfficeHours(upcomingHours, now, settings, 1)[0] ?? null;
  const nextHourRegs = nextHour?.id ? regByHour.get(nextHour.id) ?? [] : [];

  const usedSlots = subscriptionSlotsUsed(subscriptions);

  // Attention list
  const attention: { tone: "crit" | "warn" | "info"; text: string; ref?: { kind: string; id: string }; href?: string; action?: string; care?: string }[] = [];
  for (const lead of leads.filter((item) => item.status === "neu").slice(0, 6)) {
    attention.push({
      tone: lead.kind === "notfall" ? "crit" : "warn",
      text: `Neue Anfrage (${lead.kind === "boden-check" ? "Boden-Check" : lead.kind === "projekt" ? "Projekt" : lead.kind === "partner" ? "Partner" : lead.kind === "notfall" ? "Notfall" : "Abo"}): ${lead.name}, eingegangen am ${formatDateKey(berlinDateKey(lead.createdAt))}`,
      ref: { kind: "lead", id: lead.id },
      action: "Öffnen",
    });
  }
  const futureConflicts = horizon.entries.filter(
    (entry) => entry.conflict && entry.source !== "virtualOfficeHour" && berlinDateKey(entry.startsAt) >= today,
  );
  for (const entry of futureConflicts.slice(0, 6)) {
    attention.push({
      tone: "crit",
      text: `Konflikt: „${entry.title}“ am ${formatDateKey(berlinDateKey(entry.startsAt))}. ${(entry.conflictReasons ?? []).join(" ")}`.trim(),
      ref: entry.source === "event" && entry.id ? { kind: "event", id: entry.id } : entry.id ? { kind: "officeHour", id: entry.id } : undefined,
      action: "Ansehen",
    });
  }
  for (const [monday, hours] of Object.entries(horizon.weekLoads)) {
    if (monday < thisMonday || hours <= target) continue;
    attention.push({
      tone: "warn",
      text: `Woche ab ${formatDateKey(monday)}: ${hours.toLocaleString("de-DE")} h geplant, ${(hours - target).toLocaleString("de-DE")} h über dem Wochenziel.`,
      href: `/studio/werkbank/kalender?ansicht=woche&datum=${monday}`,
      action: "Woche",
    });
  }
  const careLimit = addDays(today, 30);
  for (const pass of passes.filter((item) => item.nextCareAt && item.nextCareAt <= careLimit)) {
    const days = daysBetween(today, pass.nextCareAt!);
    attention.push({
      tone: days < 0 ? "crit" : "warn",
      text: `Boden-Pass „${pass.title}“: Pflege ${days < 0 ? `seit ${-days} Tagen überfällig` : days === 0 ? "heute fällig" : `fällig in ${days} Tagen`}.`,
      ref: { kind: "floorPass", id: pass.id },
      action: "Pass",
      care: pass.id,
    });
  }
  for (const row of upcomingHours) {
    const unconfirmed = (regByHour.get(row.id) ?? []).filter((registration) => !registration.confirmedAt).length;
    if (unconfirmed > 0) {
      attention.push({
        tone: "info",
        text: `Sprechstunde am ${formatDateKey(berlinDateKey(row.startsAt))}: ${unconfirmed} ${unconfirmed === 1 ? "Anmeldung ist" : "Anmeldungen sind"} noch unbestätigt.`,
        ref: { kind: "officeHour", id: row.id },
        action: "Ansehen",
      });
    }
  }
  if (services.every((item) => item.priceCents === null)) {
    attention.push({
      tone: "info",
      text: "Noch keine Preise gesetzt: Die Website zeigt alle Leistungen ohne Preiszeile.",
      href: "/studio/werkbank/preise",
      action: "Preise",
    });
  }
  if (!master) {
    const hidden = services.filter((item) => item.requiresMasterPartner && item.visible).length;
    attention.push({
      tone: "info",
      text: `Noch kein aktiver Meisterpartner: ${hidden} ${hidden === 1 ? "Leistung mit Meisterpflicht ist" : "Leistungen mit Meisterpflicht sind"} auf der Website ausgeblendet.`,
      href: "/studio/werkbank/einstellungen#partner",
      action: "Partner",
    });
  }
  if (!settings.analytics.posthogUrl) {
    attention.push({
      tone: "info",
      text: "PostHog ist nicht verbunden: Die Trichter-Zahlen fehlen noch.",
      href: "/studio/werkbank/einstellungen#posthog",
      action: "Verbinden",
    });
  }

  // Year strip of the contingent year
  const yearHolidays = holidayMap([slotYear - 1, slotYear, slotYear + 1]);
  const yearSpans = year.vacations.filter((event) => event.status !== "abgesagt").map(toVacationSpan);
  const yearStrip = yearMondays.map((monday) => {
    const days = Array.from({ length: 7 }, (_, offset) => addDays(monday, offset));
    const workdays = days.slice(0, 5);
    return {
      monday,
      week: isoWeek(monday).week,
      type: weekType(monday, settings.rhythm),
      hours: year.weekLoads[monday] ?? 0,
      vacationDays: workdays.filter((key) => yearSpans.some((span) => key >= span.start && key <= span.end)).length,
      holidays: workdays.map((key) => yearHolidays.get(key)).filter((name): name is string => Boolean(name)),
      laying: year.events.some((event) => event.type === "verlegung" && event.status !== "abgesagt" && days.includes(berlinDateKey(event.startsAt))),
      month: parseDateKey(addDays(monday, 3)).month,
    };
  });

  return {
    today,
    now,
    settings,
    projects,
    monthTitles,
    founding: { ...founding, done: foundingDone, scheduled: founding.used - foundingDone },
    weeks,
    target,
    nextVacation: next ? { ...next, title: nextEvent?.title ?? "Urlaub", days: workingDays(next.start, next.end) } : null,
    vacationLeft: account.left,
    vacationYear: account.year,
    leads: { open: openLeads.length, fresh: leads.filter((lead) => lead.status === "neu").length, byKind: leadsByKind },
    nextHour: nextHour
      ? {
          ...nextHour,
          registrations: nextHourRegs.length,
          confirmed: nextHourRegs.filter((registration) => registration.confirmedAt).length,
        }
      : null,
    subscriptions: {
      used: usedSlots,
      total: settings.contingent.subscriptionSlots,
      hours: usedSlots * HOURS_PER_SUBSCRIPTION_YEAR,
      maxHours: settings.contingent.subscriptionSlots * HOURS_PER_SUBSCRIPTION_YEAR,
    },
    agenda: {
      entries: agenda.entries,
      holidays: [...holidayMap([parseDateKey(today).year, parseDateKey(agendaEnd).year]).entries()].filter(
        ([key]) => key >= today && key <= agendaEnd,
      ),
      vacations: agenda.vacations.filter((event) => event.status !== "abgesagt").map(toVacationSpan),
    },
    attention,
    yearStrip,
  };
}

export type OverviewData = Awaited<ReturnType<typeof getOverviewData>>;

// ---- Nav -----------------------------------------------------------------------------------------

export async function getNavCounts() {
  await requireAdmin();
  try {
    const [row] = await getDb().select({ total: count() }).from(schema.lead).where(eq(schema.lead.status, "neu"));
    return { newLeads: Number(row?.total ?? 0) };
  } catch {
    return { newLeads: 0 };
  }
}

// ---- Anfragen ------------------------------------------------------------------------------------

export async function getLeadsData() {
  await requireAdmin();
  const [leads, customers] = await Promise.all([allLeads(), allCustomers()]);
  const names = new Map(customers.map((customer) => [customer.id, customer.name]));
  return leads.map((lead) => {
    const view = describeLeadPayload(lead.kind, lead.payload);
    const summary = view.sections
      .flatMap((section) => section.rows)
      .filter((row) => row.value !== "—")
      .slice(0, 3)
      .map((row) => row.value)
      .join(" · ");
    return {
      id: lead.id,
      kind: lead.kind,
      status: lead.status,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      postalCode: lead.postalCode,
      message: lead.message,
      createdAt: lead.createdAt,
      customerId: lead.customerId,
      customerName: lead.customerId ? names.get(lead.customerId) ?? null : null,
      summary,
    };
  });
}

export type LeadListItem = Awaited<ReturnType<typeof getLeadsData>>[number];

// ---- Projekte ------------------------------------------------------------------------------------

export async function getProjectsData(now: Date = new Date()) {
  await requireAdmin();
  const today = todayKey(now);
  const settings = await getSettings();
  const [projects, customers, passes, events] = await Promise.all([
    allProjects(),
    allCustomers(),
    allFloorPasses(),
    getDb().select({ id: schema.calendarEvent.id, projectId: schema.calendarEvent.projectId, startsAt: schema.calendarEvent.startsAt, title: schema.calendarEvent.title, status: schema.calendarEvent.status }).from(schema.calendarEvent),
  ]);
  const names = new Map(customers.map((customer) => [customer.id, customer.name]));
  const contingentYears = [...new Set([settings.contingent.slotYear, ...projects.map((project) => project.slotYear).filter((y): y is number => y !== null)])].sort();
  return {
    today,
    slotYear: settings.contingent.slotYear,
    total: settings.contingent.projectSlotsPerYear,
    contingents: contingentYears.map((y) => projectContingent(projects, y, settings.contingent.projectSlotsPerYear)),
    projects: projects.map((project) => {
      const projectEvents = events.filter((event) => event.projectId === project.id && event.status !== "abgesagt");
      const upcoming = projectEvents.filter((event) => berlinDateKey(event.startsAt) >= today).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];
      return {
        ...project,
        customerName: project.customerId ? names.get(project.customerId) ?? null : null,
        eventCount: projectEvents.length,
        nextEvent: upcoming ? { id: upcoming.id, title: upcoming.title, startsAt: upcoming.startsAt } : null,
        floorPassId: passes.find((pass) => pass.projectId === project.id)?.id ?? null,
      };
    }),
  };
}

// ---- Kunden & Boden-Pässe ------------------------------------------------------------------------

export async function getCustomersData(now: Date = new Date()) {
  await requireAdmin();
  const today = todayKey(now);
  const [customers, projects, passes, subscriptions, events] = await Promise.all([
    allCustomers(),
    allProjects(),
    allFloorPasses(),
    allSubscriptions(),
    getDb()
      .select({
        id: schema.calendarEvent.id,
        type: schema.calendarEvent.type,
        customerId: schema.calendarEvent.customerId,
        floorPassId: schema.calendarEvent.floorPassId,
        startsAt: schema.calendarEvent.startsAt,
        status: schema.calendarEvent.status,
      })
      .from(schema.calendarEvent),
  ]);
  const names = new Map(customers.map((customer) => [customer.id, customer.name]));
  const projectTitles = new Map(projects.map((project) => [project.id, project.title]));
  return {
    today,
    customers: customers.map((customer) => ({
      ...customer,
      projects: projects.filter((project) => project.customerId === customer.id).length,
      passes: passes.filter((pass) => pass.customerId === customer.id).length,
      subscriptions: subscriptions.filter((item) => item.customerId === customer.id && item.status === "aktiv").length,
      upcoming: events.filter((event) => event.customerId === customer.id && event.status !== "abgesagt" && berlinDateKey(event.startsAt) >= today).length,
    })),
    passes: passes.map((pass) => {
      const planned = events
        .filter((event) => event.floorPassId === pass.id && event.type === "pflege" && event.status !== "abgesagt" && berlinDateKey(event.startsAt) >= today)
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];
      return {
        ...pass,
        customerName: pass.customerId ? names.get(pass.customerId) ?? null : null,
        projectTitle: pass.projectId ? projectTitles.get(pass.projectId) ?? null : null,
        subscriptionId:
          subscriptions.find((item) => item.customerId && item.customerId === pass.customerId && item.status === "aktiv" && item.plan === "boden-pass-plus")?.id ?? null,
        plannedCare: planned ? { id: planned.id, startsAt: planned.startsAt } : null,
      };
    }),
  };
}

// ---- Sprechstunde --------------------------------------------------------------------------------

export async function getOfficeHourData(now: Date = new Date()) {
  await requireAdmin();
  const today = todayKey(now);
  const settings = await getSettings();
  const [sessions, registrations, leads, slots, consultations] = await Promise.all([
    allOfficeHours(),
    allRegistrations(),
    getDb().select({ email: schema.lead.email, kind: schema.lead.kind }).from(schema.lead).where(eq(schema.lead.kind, "boden-check")),
    projectSlots(),
    getDb()
      .select({ type: schema.calendarEvent.type, startsAt: schema.calendarEvent.startsAt, status: schema.calendarEvent.status })
      .from(schema.calendarEvent)
      .where(eq(schema.calendarEvent.type, "erstberatung")),
  ]);
  const checkEmails = new Set(leads.map((lead) => lead.email.toLowerCase()));
  const founding = foundingContingent(consultations, settings.contingent.foundingConsultations, settings.contingent.foundingDeadline, today);
  const projects = projectContingent(slots, settings.contingent.slotYear, settings.contingent.projectSlotsPerYear);
  const storedDays = new Set(sessions.map((row) => berlinDateKey(row.startsAt)));
  const suggestions = defaultOfficeHours(now, 6, settings.officeHours).filter((slot) => !storedDays.has(berlinDateKey(slot.startsAt)));
  const withRegs = sessions.map((row) => ({
    ...row,
    registrations: registrations
      .filter((registration) => registration.officeHourId === row.id)
      .map((registration) => ({ ...registration, floorCheckDone: checkEmails.has(registration.email.toLowerCase()) })),
  }));
  return {
    today,
    now,
    settings: { voucher: settings.voucher, serviceArea: settings.serviceArea, officeHours: settings.officeHours, vatPercent: settings.pricing.vatPercent },
    fullSettings: settings,
    contingentFree: founding.open ? founding.free : projects.free,
    contingentLabel: founding.open ? `Gründungskontingent: noch ${founding.free} frei` : `Projektplätze ${projects.year}: noch ${projects.free} frei`,
    sessions: withRegs,
    suggestions,
    funnel: {
      registered: registrations.length,
      attended: registrations.filter((registration) => registration.attended || registration.watchedRecording).length,
      issued: registrations.filter((registration) => registration.voucherIssuedAt).length,
      redeemed: registrations.filter((registration) => registration.voucherRedeemedAt).length,
    },
  };
}

export type OfficeHourData = Awaited<ReturnType<typeof getOfficeHourData>>;

// ---- Werkzeug ------------------------------------------------------------------------------------

export const TOOL_TIMELINE_WEEKS = 12;

export async function getToolsData(now: Date = new Date()) {
  await requireAdmin();
  const today = todayKey(now);
  const start = mondayOf(today);
  const end = addDays(start, TOOL_TIMELINE_WEEKS * 7 - 1);
  const settings = await getSettings();
  const [tools, events, vacations, customers] = await Promise.all([
    allTools(),
    eventsBetween(addDays(start, -60), end),
    vacationEvents(),
    allCustomers(),
  ]);
  const names = new Map(customers.map((customer) => [customer.id, customer.name]));
  const context = [...events, ...vacations].map(toContextEvent);
  const toolEvents = events.filter((event) => event.type === "werkzeug" && event.toolId && event.status !== "abgesagt");
  return {
    today,
    start,
    end,
    holidays: [...holidayMap([parseDateKey(start).year, parseDateKey(end).year]).entries()].filter(([key]) => key >= start && key <= end),
    vacations: vacations.filter((event) => event.status !== "abgesagt").map(toVacationSpan).filter((span) => span.end >= start && span.start <= end),
    tools: tools.map((tool) => {
      const own = toolEvents.filter((event) => event.toolId === tool.id);
      const rentals = own
        .filter((event) => event.allDay)
        .map((event) => {
          const keys = eventDateKeys(event);
          return {
            id: event.id,
            title: event.title,
            start: keys[0] ?? today,
            end: keys[keys.length - 1] ?? today,
            customerName: event.customerId ? names.get(event.customerId) ?? null : null,
          };
        });
      const handovers = own
        .filter((event) => !event.allDay)
        .map((event) => ({
          id: event.id,
          title: event.title,
          date: berlinDateKey(event.startsAt),
          startsAt: event.startsAt,
          conflict: hasConflict(event, context, settings.rhythm),
        }));
      const current = rentals.find((rental) => rental.start <= today && rental.end >= today) ?? null;
      const nextRental = rentals.filter((rental) => rental.start > today).sort((a, b) => a.start.localeCompare(b.start))[0] ?? null;
      return { ...tool, rentals, handovers, current, nextRental };
    }),
  };
}

export type ToolsData = Awaited<ReturnType<typeof getToolsData>>;

// ---- Abos ----------------------------------------------------------------------------------------

export async function getSubscriptionsData() {
  await requireAdmin();
  const settings = await getSettings();
  const [subscriptions, customers, services] = await Promise.all([allSubscriptions(), allCustomers(), getServiceCatalog()]);
  const names = new Map(customers.map((customer) => [customer.id, { name: customer.name, kind: customer.kind }]));
  return {
    settings: {
      subscriptionSlots: settings.contingent.subscriptionSlots,
      minTermMonths: settings.subscriptions.minTermMonths,
      vatPercent: settings.pricing.vatPercent,
      discountPercent: settings.pricing.subscriptionDiscountPercent,
      repairsPerYear: settings.subscriptions.repairsPerYear,
      repairMaxSize: settings.subscriptions.repairMaxSize,
      oilingIntervalYears: settings.subscriptions.oilingIntervalYears,
    },
    used: subscriptionSlotsUsed(subscriptions),
    services: services.filter((item) => item.groupKey === "abos"),
    subscriptions: subscriptions.map((item) => ({
      ...item,
      customerName: item.customerId ? names.get(item.customerId)?.name ?? null : null,
      customerKind: item.customerId ? names.get(item.customerId)?.kind ?? null : null,
    })),
  };
}

// ---- Preise --------------------------------------------------------------------------------------

export async function getPricesData() {
  await requireAdmin();
  const [settings, services, master] = await Promise.all([getSettings(), getServiceCatalog(), hasActiveMasterPartner()]);
  return { settings, services, hasMasterPartner: master };
}

// ---- Einstellungen -------------------------------------------------------------------------------

export async function getSettingsData(now: Date = new Date()) {
  await requireAdmin();
  const today = todayKey(now);
  const settings = await getSettings();
  const [partners, slots, consultations, subscriptions, vacations] = await Promise.all([
    allPartners(),
    projectSlots(),
    getDb()
      .select({ type: schema.calendarEvent.type, startsAt: schema.calendarEvent.startsAt, status: schema.calendarEvent.status })
      .from(schema.calendarEvent)
      .where(eq(schema.calendarEvent.type, "erstberatung")),
    allSubscriptions(),
    vacationEvents(),
  ]);
  const year = parseDateKey(today).year;
  return {
    today,
    settings,
    partners,
    stats: {
      projects: projectContingent(slots, settings.contingent.slotYear, settings.contingent.projectSlotsPerYear),
      founding: foundingContingent(consultations, settings.contingent.foundingConsultations, settings.contingent.foundingDeadline, today),
      subscriptionsUsed: subscriptionSlotsUsed(subscriptions),
      activePartners: partners.filter((partner) => partner.status === "aktiv").length,
      vacation: [vacationStats(vacations, year, settings.vacationDaysPerYear, today), vacationStats(vacations, year + 1, settings.vacationDaysPerYear, today)],
    },
  };
}
