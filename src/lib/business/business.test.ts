import { describe, expect, it } from "vitest";
import {
  addDays,
  berlinDateKey,
  berlinTime,
  berlinToUtc,
  bridgeDays,
  easterSunday,
  eventHours,
  isoWeek,
  mondayOf,
  nextVacation,
  nrwHolidays,
  vacationStats,
  weekLoadHours,
  weekType,
  workWindows,
  holidayMap,
} from "./calendar";
import { foundingContingent, projectContingent, subscriptionSlotsUsed } from "./contingent";
import { FLOOR_CHECK_STEPS, floorCheckAnswersSchema, recommendFloors } from "./floor-check";
import { defaultOfficeHours, generateVoucherCode, mergeOfficeHours, nthWeekdayOfMonth, voucherChecks, voucherConditionTexts } from "./office-hours";
import {
  defaultServices,
  formatPriceLine,
  isServiceShown,
  mergeServices,
  publicPriceLine,
  subscriptionDiscountLine,
} from "./services";
import { DEFAULT_SETTINGS, resolveSettings } from "./settings";

const rhythm = DEFAULT_SETTINGS.rhythm;

describe("calendar", () => {
  it("computes Easter and the NRW holidays", () => {
    expect(easterSunday(2026)).toBe("2026-04-05");
    expect(easterSunday(2027)).toBe("2027-03-28");
    const names = Object.fromEntries(nrwHolidays(2027).map((holiday) => [holiday.name, holiday.date]));
    expect(names).toMatchObject({
      Karfreitag: "2027-03-26",
      Ostermontag: "2027-03-29",
      "Christi Himmelfahrt": "2027-05-06",
      Pfingstmontag: "2027-05-17",
      Fronleichnam: "2027-05-27",
    });
    expect(nrwHolidays(2027)).toHaveLength(11);
  });

  it("suggests bridge days after Thursday holidays", () => {
    const dates = bridgeDays(2027).map((day) => day.date);
    expect(dates).toContain("2027-05-07");
    expect(dates).toContain("2027-05-28");
  });

  it("handles ISO weeks and Mondays", () => {
    expect(mondayOf("2026-10-01")).toBe("2026-09-28");
    expect(isoWeek("2026-09-28")).toEqual({ year: 2026, week: 40 });
    expect(isoWeek("2027-01-01")).toEqual({ year: 2026, week: 53 });
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("converts Berlin wall-clock time across daylight saving", () => {
    expect(berlinToUtc("2026-10-08", "19:00").toISOString()).toBe("2026-10-08T17:00:00.000Z");
    expect(berlinToUtc("2026-11-12", "19:00").toISOString()).toBe("2026-11-12T18:00:00.000Z");
    const instant = new Date("2026-12-31T23:30:00.000Z");
    expect(berlinDateKey(instant)).toBe("2027-01-01");
    expect(berlinTime(instant)).toBe("00:30");
  });

  it("alternates block and half-day weeks from the first block week", () => {
    expect(weekType("2026-09-21", rhythm)).toBe("vorlauf");
    expect(weekType("2026-09-30", rhythm)).toBe("block");
    expect(weekType("2026-10-07", rhythm)).toBe("halbtag");
    expect(weekType("2026-10-12", rhythm)).toBe("block");
  });

  it("builds work windows and skips holidays", () => {
    const block = workWindows("2026-09-28", rhythm);
    expect(block.map((window) => [window.date, window.kind])).toEqual([
      ["2026-09-29", "verlegetag"],
      ["2026-09-30", "verlegetag"],
      ["2026-10-02", "buero"],
    ]);
    const half = workWindows("2026-10-05", rhythm, holidayMap([2026]));
    expect(half).toHaveLength(5);
    const withHoliday = workWindows("2026-12-21", { ...rhythm, firstBlockWeekMonday: "2026-12-14" }, holidayMap([2026]));
    expect(withHoliday.map((window) => window.date)).not.toContain("2026-12-25");
  });

  it("counts working hours with the statutory break", () => {
    const day = { type: "verlegung", startsAt: berlinToUtc("2026-09-29", "07:30"), endsAt: berlinToUtc("2026-09-29", "16:00"), allDay: false };
    expect(eventHours(day)).toBe(8);
    expect(eventHours({ ...day, type: "urlaub" })).toBe(0);
    expect(eventHours({ ...day, status: "abgesagt" })).toBe(0);
    const office = { type: "buero", startsAt: berlinToUtc("2026-10-02", "08:00"), endsAt: berlinToUtc("2026-10-02", "12:00"), allDay: false };
    expect(weekLoadHours([day, { ...day, startsAt: berlinToUtc("2026-09-30", "07:30"), endsAt: berlinToUtc("2026-09-30", "16:00") }, office], "2026-10-01")).toBe(20);
  });

  it("keeps the vacation account", () => {
    const christmas = {
      type: "urlaub",
      startsAt: berlinToUtc("2026-12-21", "00:00"),
      endsAt: berlinToUtc("2027-01-02", "00:00"),
      allDay: true,
    };
    const stats = vacationStats([christmas], 2026, 30, "2026-09-26");
    // 21.–31.12.: Mon–Thu 21–24, Mon–Thu 28–31 (25./26. are holidays) = 8 working days.
    expect(stats).toEqual({ year: 2026, allowance: 30, taken: 0, planned: 8, left: 22 });
    expect(nextVacation([christmas], "2026-09-26")).toEqual({ start: "2026-12-21", end: "2027-01-01", inDays: 86 });
  });
});

describe("contingent", () => {
  it("derives the public project counter from real projects", () => {
    const contingent = projectContingent(
      [
        { status: "gebucht", slotYear: 2027, slotMonth: 1 },
        { status: "laufend", slotYear: 2027, slotMonth: 2 },
        { status: "angebot", slotYear: 2027, slotMonth: 3 },
        { status: "anfrage", slotYear: 2027, slotMonth: 4 },
        { status: "gebucht", slotYear: 2026, slotMonth: 12 },
      ],
      2027,
      12,
    );
    expect(contingent).toMatchObject({ booked: 2, reserved: 1, free: 10 });
    expect(contingent.months.slice(0, 4).map((month) => month.state)).toEqual(["gebucht", "gebucht", "reserviert", "frei"]);
  });

  it("counts founding consultations until the deadline", () => {
    const events = [
      { type: "erstberatung", startsAt: new Date("2026-10-05T08:00:00Z"), status: "geplant" },
      { type: "erstberatung", startsAt: new Date("2026-10-06T08:00:00Z"), status: "abgesagt" },
      { type: "erstberatung", startsAt: new Date("2027-01-06T08:00:00Z"), status: "geplant" },
      { type: "einweisung", startsAt: new Date("2026-10-07T08:00:00Z"), status: "geplant" },
    ];
    expect(foundingContingent(events, 12, "2026-12-31", "2026-09-26")).toEqual({
      total: 12,
      used: 1,
      free: 11,
      deadline: "2026-12-31",
      open: true,
    });
    expect(foundingContingent(events, 12, "2026-12-31", "2027-01-02").open).toBe(false);
  });

  it("counts only on-site subscriptions against the slots", () => {
    expect(
      subscriptionSlotsUsed([
        { plan: "boden-pass-plus", status: "aktiv" },
        { plan: "rundum-sorglos", status: "aktiv" },
        { plan: "rueckendeckung", status: "aktiv" },
        { plan: "boden-pass-plus", status: "gekuendigt" },
      ]),
    ).toBe(2);
  });
});

describe("services and prices", () => {
  const options = { vatPercent: 19, gross: true };

  it("never shows a price that is not configured", () => {
    const [first] = defaultServices();
    expect(first).toBeDefined();
    expect(publicPriceLine(first!, options)).toBeNull();
    expect(formatPriceLine(4900, "m2", options)).toBe("58,31 € pro m²");
    expect(formatPriceLine(4900, "ab", { vatPercent: 19, gross: false })).toBe("ab 49,00 €");
  });

  it("hides Meister services until a Meister partner is active", () => {
    const sanding = defaultServices().find((item) => item.id === "schleifen")!;
    expect(isServiceShown(sanding, false)).toBe(false);
    expect(isServiceShown(sanding, true)).toBe(true);
    expect(isServiceShown({ ...sanding, requiresMasterPartner: false, visible: false }, true)).toBe(false);
  });

  it("shows the subscription discount only with price and discount", () => {
    const laying = { ...defaultServices().find((item) => item.id === "verlegung")!, priceCents: 3000 };
    expect(subscriptionDiscountLine(laying, null, options)).toBeNull();
    expect(subscriptionDiscountLine({ ...laying, priceCents: null }, 10, options)).toBeNull();
    expect(subscriptionDiscountLine(laying, 10, options)).toBe("32,13 € pro m²");
  });

  it("merges stored overrides and custom services", () => {
    const merged = mergeServices([
      { id: "verlegung", priceCents: 2500 },
      { id: "eigene-leistung", groupKey: "retten", title: "Treppenkante", description: "x", priceType: "fest", visible: true, requiresMasterPartner: false, sortOrder: 999, priceCents: null },
      { id: "kaputt", groupKey: "unbekannt" as never, title: "x" },
    ]);
    expect(merged.find((item) => item.id === "verlegung")?.priceCents).toBe(2500);
    expect(merged.some((item) => item.id === "eigene-leistung")).toBe(true);
    expect(merged.some((item) => item.id === "kaputt")).toBe(false);
  });
});

describe("settings", () => {
  it("completes stored settings with defaults and repairs invalid sections", () => {
    const resolved = resolveSettings({ contingent: { projectSlotsPerYear: 10 }, rhythm: { weeklyHoursTarget: "viel" } });
    expect(resolved.contingent.projectSlotsPerYear).toBe(10);
    expect(resolved.contingent.slotYear).toBe(2027);
    expect(resolved.rhythm).toEqual(DEFAULT_SETTINGS.rhythm);
    expect(resolveSettings(null)).toEqual(DEFAULT_SETTINGS);
  });
});

describe("floor check", () => {
  it("drops unknown answers and recommends honestly", () => {
    const answers = floorCheckAnswersSchema.parse({ raum: ["Bad", "Garage"], leben: ["Hund"], wer: ["Machen lassen", "Ich bin Profi"] });
    expect(answers).toEqual({ raum: ["Bad"], leben: ["Hund"], wer: ["Machen lassen"] });
    const names = recommendFloors(answers).map((item) => item.name);
    expect(names).toHaveLength(3);
    expect(names[0]).toBe("Vinyl mit Klicksystem");
    expect(names[1]).toContain("gebürstet");
  });

  it("never recommends herringbone or Tafelparkett (Meisterpflicht)", () => {
    const [first] = recommendFloors({ stil: ["Klassisch und zeitlos"] });
    expect(first).toMatchObject({ name: "Eiche Schiffsboden, geölt", viaMasterPartner: false });
    const everything = Object.fromEntries(FLOOR_CHECK_STEPS.map((step) => [step.key, [...step.options]]));
    const texts = [
      ...FLOOR_CHECK_STEPS.flatMap((step) => [step.question, step.hint, ...step.options]),
      ...recommendFloors(everything).flatMap((item) => [item.name, item.why]),
    ];
    for (const text of texts) expect(text).not.toMatch(/fischgr|chevron|tafelparkett|würfelparkett/i);
  });
});

describe("office hours and vouchers", () => {
  it("schedules the second Thursday at 19:00 Berlin time", () => {
    expect(nthWeekdayOfMonth(2026, 10, 4, 2)).toBe("2026-10-08");
    const slots = defaultOfficeHours(new Date("2026-09-26T10:00:00Z"), 4, DEFAULT_SETTINGS.officeHours);
    expect(slots.map((slot) => slot.startsAt.toISOString())).toEqual([
      "2026-10-08T17:00:00.000Z",
      "2026-11-12T18:00:00.000Z",
      "2026-12-10T18:00:00.000Z",
      "2027-01-14T18:00:00.000Z",
    ]);
    expect(slots[0]?.topic).toBe("Parkett, Vinyl oder Laminat? Was zu deinem Leben passt.");
  });

  it("prefers stored sessions over default slots on the same day", () => {
    const now = new Date("2026-09-26T10:00:00Z");
    const merged = mergeOfficeHours(
      [{ id: "abc", startsAt: new Date("2026-10-08T17:30:00Z"), durationMinutes: 45, topic: "Eigenes Thema" }],
      now,
      DEFAULT_SETTINGS,
    );
    expect(merged[0]).toMatchObject({ id: "abc", topic: "Eigenes Thema" });
    expect(merged.filter((slot) => slot.startsAt.startsWith("2026-10-08"))).toHaveLength(1);
  });

  it("lists only enabled voucher conditions and checks them", () => {
    const settings = { ...DEFAULT_SETTINGS, voucher: { ...DEFAULT_SETTINGS.voucher, conditions: { ...DEFAULT_SETTINGS.voucher.conditions, minArea: false } } };
    expect(voucherConditionTexts(settings)).toHaveLength(4);
    const result = voucherChecks(
      { attended: false, watchedRecording: true, floorCheckDone: true, photosReceived: true, inServiceArea: true, areaM2: null, specialFloor: false, contingentFree: 3 },
      settings,
    );
    expect(result.eligible).toBe(true);
    expect(voucherChecks({ attended: false, watchedRecording: false, floorCheckDone: true, photosReceived: true, inServiceArea: null, areaM2: 10, specialFloor: false, contingentFree: 0 }, DEFAULT_SETTINGS).eligible).toBe(false);
  });

  it("generates readable voucher codes", () => {
    expect(generateVoucherCode()).toMatch(/^MP-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });
});
