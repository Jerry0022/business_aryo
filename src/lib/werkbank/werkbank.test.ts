import { describe, expect, it } from "vitest";
import { berlinToUtc, type DateKey } from "@/lib/business/calendar";
import { DEFAULT_SETTINGS } from "@/lib/business/settings";
import { blockRhythmText, filterEntries, groupByDay, halfDayRhythmText, offsetToSlot, spanDays } from "./calendar-model";
import { isoWeekMondays, monthGrid, parseCalendarParams, shiftDate, viewRange, viewTitle } from "./calendar-view";
import { buildEntries, virtualOfficeHours } from "./entries";
import {
  conflictReasons,
  eventWarnings,
  instantsToTimes,
  layoutDayEvents,
  needsConfirmation,
  timesToInstants,
  workingDays,
  type ContextEvent,
} from "./event-rules";
import { centsToInput, formatDateRange, formatHours, parseEuroInput, relativeDays, stableHash } from "./format";
import { describeLeadPayload } from "./lead-payload";
import { eventInputSchema, projectInputSchema } from "./schemas";
import type { CalEntry, CalEvent } from "./types";

const rhythm = DEFAULT_SETTINGS.rhythm; // first Block-Woche: Monday 2026-09-28 (Di+Mi 07:30–16:00, Fr Büro)

function timed(id: string, type: string, date: DateKey, start: string, end: string, extra: Partial<ContextEvent> = {}): ContextEvent {
  return { id, type, title: id, startsAt: berlinToUtc(date, start), endsAt: berlinToUtc(date, end), allDay: false, status: "geplant", ...extra };
}

function allDay(id: string, type: string, from: DateKey, to: DateKey, title = id): ContextEvent {
  const { startsAt, endsAt } = timesToInstants({ date: from, endDate: to, start: "00:00", end: "00:00", allDay: true });
  return { id, type, title, startsAt, endsAt, allDay: true, status: "geplant" };
}

const draft = (date: DateKey, start: string, end: string, type = "erstberatung") => ({ type, date, endDate: date, start, end, allDay: false });

describe("event times", () => {
  it("round-trips timed entries in Berlin time across DST", () => {
    const summer = timesToInstants({ date: "2026-10-06", endDate: "2026-10-06", start: "08:00", end: "10:30", allDay: false });
    expect(summer.startsAt.toISOString()).toBe("2026-10-06T06:00:00.000Z");
    const winter = timesToInstants({ date: "2026-12-01", endDate: "2026-12-01", start: "08:00", end: "10:30", allDay: false });
    expect(winter.startsAt.toISOString()).toBe("2026-12-01T07:00:00.000Z");
    expect(instantsToTimes({ ...winter, allDay: false })).toMatchObject({ date: "2026-12-01", start: "08:00", end: "10:30", allDay: false });
  });

  it("stores all-day entries with an exclusive end at the next midnight", () => {
    const range = timesToInstants({ date: "2026-10-24", endDate: "2026-10-26", start: "00:00", end: "00:00", allDay: true });
    expect(range.startsAt.toISOString()).toBe("2026-10-23T22:00:00.000Z");
    expect(range.endsAt.toISOString()).toBe("2026-10-26T23:00:00.000Z");
    expect(instantsToTimes({ ...range, allDay: true })).toMatchObject({ date: "2026-10-24", endDate: "2026-10-26", allDay: true });
  });

  it("counts working days without weekends and NRW holidays", () => {
    expect(workingDays("2026-12-21", "2027-01-01")).toBe(8);
    expect(workingDays("2026-10-05", "2026-10-09")).toBe(5);
  });
});

describe("event warnings", () => {
  it("flags vacation, holidays and overlaps as critical", () => {
    const events = [allDay("urlaub-1", "urlaub", "2026-12-21", "2027-01-01", "Betriebsurlaub"), timed("pflege", "pflege", "2026-12-22", "09:00", "10:30")];
    const warnings = eventWarnings(draft("2026-12-22", "10:00", "11:00"), { events, rhythm });
    const codes = warnings.map((warning) => warning.code);
    expect(codes).toContain("vacation");
    expect(codes).toContain("overlap");
    expect(needsConfirmation(warnings)).toBe(true);
    expect(eventWarnings(draft("2026-10-03", "10:00", "11:00"), { events: [], rhythm }).map((warning) => warning.code)).toContain("holiday");
  });

  it("ignores cancelled events and the event itself", () => {
    const events = [timed("a", "buero", "2026-10-06", "09:00", "10:00", { status: "abgesagt" }), timed("self", "buero", "2026-10-06", "09:00", "10:00")];
    const warnings = eventWarnings({ ...draft("2026-10-06", "09:00", "10:00", "buero"), id: "self" }, { events, rhythm });
    expect(needsConfirmation(warnings)).toBe(false);
  });

  it("reports the weekly load and warns above the target", () => {
    const events = [timed("tue", "verlegung", "2026-09-29", "07:30", "16:00"), timed("wed", "verlegung", "2026-09-30", "07:30", "16:00")];
    const ok = eventWarnings(draft("2026-10-02", "08:00", "10:00", "buero"), { events, rhythm });
    expect(ok.find((warning) => warning.code === "week-load")?.message).toContain("KW 40: danach 18 von 20 h");
    const over = eventWarnings(draft("2026-10-02", "08:00", "12:30", "buero"), { events, rhythm });
    const warning = over.find((item) => item.code === "over-target");
    expect(warning?.level).toBe("warn");
    expect(warning?.message).toContain("+0,5 h");
    expect(needsConfirmation(over)).toBe(false);
  });

  it("hints when an entry lies outside the work window or before the rhythm starts", () => {
    const outside = eventWarnings(draft("2026-09-29", "17:00", "18:00"), { events: [], rhythm });
    expect(outside.find((warning) => warning.code === "outside-window")?.level).toBe("info");
    const inside = eventWarnings(draft("2026-09-29", "08:00", "10:00"), { events: [], rhythm });
    expect(inside.some((warning) => warning.code === "outside-window")).toBe(false);
    const early = eventWarnings(draft("2026-09-22", "08:00", "10:00"), { events: [], rhythm });
    expect(early.some((warning) => warning.code === "vorlauf")).toBe(true);
    const evening = eventWarnings(draft("2026-10-08", "19:00", "19:45", "sprechstunde"), { events: [], rhythm });
    expect(evening.some((warning) => warning.code === "outside-window")).toBe(false);
  });

  it("summarises vacation entries and lists work planned inside them", () => {
    const events = [timed("job", "verlegung", "2026-12-22", "07:30", "16:00")];
    const warnings = eventWarnings({ type: "urlaub", date: "2026-12-21", endDate: "2027-01-01", start: "08:00", end: "12:00", allDay: true }, { events, rhythm });
    expect(warnings[0]?.message).toContain("8 Urlaubstage");
    expect(warnings.find((warning) => warning.code === "events-in-vacation")?.level).toBe("warn");
  });

  it("rejects an end before the start", () => {
    const warnings = eventWarnings(draft("2026-10-06", "10:00", "09:00"), { events: [], rhythm });
    expect(warnings[0]?.code).toBe("invalid-time");
    expect(needsConfirmation(warnings)).toBe(false);
  });

  it("explains conflicts of stored entries", () => {
    const events = [allDay("urlaub", "urlaub", "2026-12-21", "2027-01-01", "Betriebsurlaub"), timed("pflege", "pflege", "2026-12-22", "09:00", "10:30")];
    expect(conflictReasons(events[1]!, events, rhythm)[0]).toContain("Betriebsurlaub");
    expect(conflictReasons(events[0]!, events, rhythm)).toEqual([]);
  });
});

describe("week layout", () => {
  it("puts overlapping entries side by side and keeps separate clusters full width", () => {
    const layout = layoutDayEvents([
      { key: "a", start: 480, end: 630 },
      { key: "b", start: 570, end: 600 },
      { key: "c", start: 700, end: 760 },
    ]);
    expect(layout.get("a")).toEqual({ column: 0, columns: 2 });
    expect(layout.get("b")).toEqual({ column: 1, columns: 2 });
    expect(layout.get("c")).toEqual({ column: 0, columns: 1 });
  });

  it("maps a click position to a 30-minute slot", () => {
    expect(offsetToSlot(44 * 3 + 30, 6, 21, 44)).toEqual({ start: "09:30", end: "10:30" });
    expect(offsetToSlot(-10, 6, 21, 44)).toEqual({ start: "06:00", end: "07:00" });
  });
});

describe("calendar navigation", () => {
  it("parses view and date from the URL with safe defaults", () => {
    expect(parseCalendarParams({}, "2026-09-26")).toEqual({ view: "monat", date: "2026-09-26" });
    expect(parseCalendarParams({ ansicht: "woche", datum: "2027-02-30" }, "2026-09-26")).toEqual({ view: "woche", date: "2026-09-26" });
    expect(parseCalendarParams({ ansicht: ["jahr"], datum: "2027-05-07" }, "2026-09-26")).toEqual({ view: "jahr", date: "2027-05-07" });
  });

  it("computes ranges, titles and steps per view", () => {
    expect(viewRange("monat", "2026-10-15")).toEqual({ start: "2026-09-28", end: "2026-11-01" });
    expect(viewRange("woche", "2026-10-15")).toEqual({ start: "2026-10-12", end: "2026-10-18" });
    expect(viewRange("jahr", "2027-06-01")).toEqual({ start: "2027-01-01", end: "2027-12-31" });
    expect(viewRange("agenda", "2026-10-01").end).toBe("2026-11-04");
    expect(shiftDate("monat", "2027-01-31", 1)).toBe("2027-02-28");
    expect(shiftDate("woche", "2026-10-15", -1)).toBe("2026-10-08");
    expect(shiftDate("jahr", "2028-02-29", 1)).toBe("2029-02-28");
    expect(viewTitle("woche", "2026-12-09")).toBe("KW 50 · 07.12.–13.12.2026");
    expect(viewTitle("monat", "2026-10-01")).toBe("Oktober 2026");
  });

  it("builds month grids and ISO week lists", () => {
    expect(monthGrid(2026, 10)).toHaveLength(5);
    expect(monthGrid(2026, 11)).toHaveLength(6);
    expect(isoWeekMondays(2026)).toHaveLength(53);
    expect(isoWeekMondays(2027)[0]).toBe("2027-01-04");
    expect(isoWeekMondays(2027)).toHaveLength(52);
  });
});

function entry(partial: Partial<CalEntry> & Pick<CalEntry, "key" | "type" | "startsAt" | "endsAt">): CalEntry {
  return { source: "event", id: partial.key, title: partial.key, allDay: false, status: "geplant", location: null, conflict: false, ...partial };
}

describe("calendar model", () => {
  it("groups multi-day entries on every day they touch", () => {
    const vacation = allDay("urlaub", "urlaub", "2026-12-24", "2026-12-26");
    const byDay = groupByDay([entry({ key: "v", type: "urlaub", startsAt: vacation.startsAt, endsAt: vacation.endsAt, allDay: true })]);
    expect([...byDay.keys()]).toEqual(["2026-12-24", "2026-12-25", "2026-12-26"]);
    expect(spanDays([{ start: "2026-12-30", end: "2027-01-02" }]).size).toBe(4);
  });

  it("filters by type and search text", () => {
    const list = [
      entry({ key: "a", type: "verlegung", title: "Wagner Eiche", startsAt: new Date(0), endsAt: new Date(1) }),
      entry({ key: "b", type: "buero", title: "Angebote", location: "Werkstatt", startsAt: new Date(0), endsAt: new Date(1) }),
    ];
    expect(filterEntries(list, new Set(["verlegung"]), "").map((item) => item.key)).toEqual(["b"]);
    expect(filterEntries(list, new Set(), "werkstatt").map((item) => item.key)).toEqual(["b"]);
    expect(filterEntries(list, new Set(), "verlegung").map((item) => item.key)).toEqual(["a"]);
  });

  it("describes the rhythm", () => {
    expect(blockRhythmText(rhythm)).toBe("Di + Mi 07:30–16:00 · Fr 08:00–12:00 Büro");
    expect(halfDayRhythmText(rhythm)).toBe("Mo–Fr 08:00–12:00");
  });
});

describe("calendar entries", () => {
  const now = new Date("2026-09-26T10:00:00Z");

  it("suggests default office hours only on days without a stored session", () => {
    const all = virtualOfficeHours(now, "2026-10-01", "2026-12-31", [], DEFAULT_SETTINGS.officeHours);
    expect(all.map((slot) => slot.startsAt.toISOString())).toEqual(["2026-10-08T17:00:00.000Z", "2026-11-12T18:00:00.000Z", "2026-12-10T18:00:00.000Z"]);
    const stored = [{ startsAt: new Date("2026-11-12T17:30:00Z") }];
    expect(virtualOfficeHours(now, "2026-10-01", "2026-12-31", stored, DEFAULT_SETTINGS.officeHours)).toHaveLength(2);
    expect(virtualOfficeHours(now, "2026-01-01", "2026-03-31", [], DEFAULT_SETTINGS.officeHours)).toEqual([]);
  });

  it("merges events, stored office hours and suggestions without duplicates", () => {
    const base: CalEvent = {
      id: "e1",
      type: "sprechstunde",
      title: "Sprechstunde",
      startsAt: new Date("2026-10-08T17:00:00Z"),
      endsAt: new Date("2026-10-08T17:45:00Z"),
      allDay: false,
      location: null,
      notes: null,
      status: "geplant",
      checklist: [],
      customerId: null,
      projectId: null,
      toolId: null,
      officeHourId: "oh1",
      subscriptionId: null,
      leadId: null,
      floorPassId: null,
    };
    const entries = buildEntries({
      events: [base],
      officeHours: [
        { id: "oh1", startsAt: base.startsAt, durationMinutes: 45, topic: "Thema", status: "geplant" },
        { id: "oh2", startsAt: new Date("2026-11-12T18:00:00Z"), durationMinutes: 45, topic: "Anderes", status: "geplant" },
      ],
      virtual: [{ startsAt: new Date("2026-12-10T18:00:00Z"), durationMinutes: 45, topic: "Planung" }],
      context: [],
      rhythm,
    });
    expect(entries.map((item) => item.source)).toEqual(["event", "officeHour", "virtualOfficeHour"]);
    expect(entries[2]?.id).toBeNull();
  });
});

describe("lead payloads", () => {
  it("renders Boden-Check answers per step with recommendations", () => {
    const view = describeLeadPayload("boden-check", {
      answers: { raum: ["Bad"], leben: ["Hund"] },
      areaM2: 30,
      recommendations: ["Vinyl mit Klicksystem", "Unbekannter Boden"],
    });
    expect(view.sections[0]?.rows).toHaveLength(7);
    expect(view.sections[0]?.rows[0]).toEqual({ label: "1 · Raum", value: "Bad" });
    expect(view.sections[0]?.rows[2]?.value).toBe("—");
    expect(view.recommendations[0]?.why).toContain("Wasserfest");
    expect(view.recommendations[1]).toMatchObject({ name: "Unbekannter Boden", why: "" });
    expect(view.areaM2).toBe(30);
  });

  it("renders partner, project, emergency and subscription requests", () => {
    const partner = describeLeadPayload("partner", { company: "Parkett Hartmann", trade: "Parkettleger", isMasterBusiness: true, needs: ["Material"] });
    expect(partner.company).toBe("Parkett Hartmann");
    expect(partner.isMasterBusiness).toBe(true);
    expect(partner.sections[0]?.rows.find((row) => row.label === "Gewünschte Hilfe")?.value).toBe("Material");
    expect(describeLeadPayload("projekt", { role: "Bauherr", areaM2: 85.5 }).sections[0]?.rows).toEqual([
      { label: "Rolle", value: "Bauherr" },
      { label: "Fläche", value: "85,5 m²" },
    ]);
    expect(describeLeadPayload("notfall", { damage: "Wasserschaden" }).sections[0]?.rows[0]?.value).toBe("Wasserschaden");
    expect(describeLeadPayload("abo", { plan: "boden-pass-plus" }).sections[0]?.rows[0]?.value).toBe("Boden-Pass Plus");
  });

  it("survives malformed payloads", () => {
    expect(describeLeadPayload("projekt", null).sections[0]?.rows).toEqual([]);
    expect(describeLeadPayload("unbekannt", { foo: "bar" }).sections).toEqual([{ title: "Weitere Angaben", rows: [{ label: "foo", value: "bar" }] }]);
  });
});

describe("formatting", () => {
  it("parses euro amounts in German and English notation", () => {
    expect(parseEuroInput("")).toBeNull();
    expect(parseEuroInput("89")).toBe(8900);
    expect(parseEuroInput("38,50")).toBe(3850);
    expect(parseEuroInput("38.5")).toBe(3850);
    expect(parseEuroInput("1.234,56 €")).toBe(123456);
    expect(parseEuroInput("abc")).toBeUndefined();
    expect(parseEuroInput("-5")).toBeUndefined();
    expect(centsToInput(3850)).toBe("38,50");
    expect(centsToInput(null)).toBe("");
  });

  it("formats hours, ranges and relative days", () => {
    expect(formatHours(14.75)).toBe("14,75");
    expect(formatHours(20)).toBe("20");
    expect(formatDateRange("2026-12-21", "2027-01-01")).toBe("21.12.2026–01.01.2027");
    expect(formatDateRange("2027-08-02", "2027-08-13")).toBe("02.08.–13.08.2027");
    expect(relativeDays(0)).toBe("heute");
    expect(relativeDays(12)).toBe("in 12 Tagen");
    expect(relativeDays(-3)).toBe("vor 3 Tagen");
    expect(stableHash({ a: 1 })).toBe(stableHash({ a: 1 }));
    expect(stableHash({ a: 1 })).not.toBe(stableHash({ a: 2 }));
  });
});

describe("input schemas", () => {
  const event = {
    type: "buero",
    title: "Büro",
    date: "2026-10-02",
    endDate: "2026-10-02",
    start: "10:00",
    end: "09:00",
    allDay: false,
    status: "geplant",
  } as const;

  it("validates event times and normalises optional links", () => {
    const invalid = eventInputSchema.safeParse(event);
    expect(invalid.success).toBe(false);
    const valid = eventInputSchema.parse({ ...event, end: "12:00", customerId: "", location: "  " });
    expect(valid.customerId).toBeNull();
    expect(valid.location).toBeNull();
    expect(valid.confirmed).toBe(false);
    expect(eventInputSchema.safeParse({ ...event, type: "party" }).success).toBe(false);
  });

  it("requires a slot year for a slot month", () => {
    expect(projectInputSchema.safeParse({ title: "X", status: "gebucht", slotMonth: 3 }).success).toBe(false);
    expect(projectInputSchema.parse({ title: "X", status: "gebucht", slotYear: 2027, slotMonth: 3 })).toMatchObject({ slotYear: 2027, slotMonth: 3, customerId: null });
  });
});
