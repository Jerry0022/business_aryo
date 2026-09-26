import { z } from "zod";

// Business settings edited in the Werkbank ("Einstellungen", "Preise & Leistungen").
// Stored as one JSON document; missing keys are completed from DEFAULT_SETTINGS so new settings
// can be added without a migration.

const time = z.string().regex(/^\d{2}:\d{2}$/, "Uhrzeit im Format HH:MM");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum im Format JJJJ-MM-TT");
/** ISO weekday: 1 = Monday … 7 = Sunday. */
const weekday = z.number().int().min(1).max(7);
const cents = z.number().int().min(0).nullable();

export const settingsSchema = z.object({
  contingent: z.object({
    /** Projektplätze per year the owner lays himself (public promise: one per month). */
    projectSlotsPerYear: z.number().int().min(0).max(60),
    /** Year the public project counter refers to. */
    slotYear: z.number().int().min(2025).max(2100),
    /** Gründungskontingent: Erstberatungen before the deadline. */
    foundingConsultations: z.number().int().min(0).max(100),
    foundingDeadline: isoDate,
    partnerSlots: z.number().int().min(0).max(100),
    subscriptionSlots: z.number().int().min(0).max(500),
  }),
  rhythm: z.object({
    weeklyHoursTarget: z.number().min(1).max(60),
    /** Monday of the first Block-Woche; weeks alternate Block / Halbtags from here. */
    firstBlockWeekMonday: isoDate,
    blockDays: z.array(weekday).max(7),
    blockDayStart: time,
    blockDayEnd: time,
    blockOfficeDay: weekday.nullable(),
    halfDayDays: z.array(weekday).max(7),
    halfDayStart: time,
    halfDayEnd: time,
  }),
  vacationDaysPerYear: z.number().int().min(0).max(60),
  serviceArea: z.object({
    label: z.string().min(1).max(80),
    radiusKm: z.number().int().min(0).max(1000),
  }),
  officeHours: z.object({
    /** Default schedule: the n-th given weekday of each month. */
    weekday: weekday,
    nthWeek: z.number().int().min(1).max(4),
    time: time,
    durationMinutes: z.number().int().min(15).max(180),
  }),
  voucher: z.object({
    valueCents: cents,
    validDays: z.number().int().min(1).max(90),
    minAreaM2: z.number().int().min(0).max(1000),
    conditions: z.object({
      liveOrRecording: z.boolean(),
      floorCheckAndPhotos: z.boolean(),
      inServiceArea: z.boolean(),
      minArea: z.boolean(),
      withinDeadline: z.boolean(),
    }),
  }),
  pricing: z.object({
    vatPercent: z.number().min(0).max(30),
    /** Discount on the laying price when Boden-Pass Plus is signed together with the project. */
    subscriptionDiscountPercent: z.number().min(0).max(50).nullable(),
  }),
  subscriptions: z.object({
    repairsPerYear: z.number().int().min(0).max(20),
    /** Size limit per repair, e.g. "bis 1 cm²". Empty = not defined yet. */
    repairMaxSize: z.string().max(40),
    oilingIntervalYears: z.number().int().min(1).max(10),
    /** Minimum term per plan in months (private customers: at most 24, then monthly cancellable). */
    minTermMonths: z.record(z.string(), z.number().int().min(0).max(60)),
  }),
  analytics: z.object({
    /** Link target of "Analytics · PostHog" in the studio. Empty = not connected. */
    posthogUrl: z.union([z.literal(""), z.url()]),
  }),
});

export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  contingent: {
    projectSlotsPerYear: 12,
    slotYear: 2027,
    foundingConsultations: 12,
    foundingDeadline: "2026-12-31",
    partnerSlots: 10,
    subscriptionSlots: 20,
  },
  rhythm: {
    weeklyHoursTarget: 20,
    firstBlockWeekMonday: "2026-09-28",
    blockDays: [2, 3],
    blockDayStart: "07:30",
    blockDayEnd: "16:00",
    blockOfficeDay: 5,
    halfDayDays: [1, 2, 3, 4, 5],
    halfDayStart: "08:00",
    halfDayEnd: "12:00",
  },
  vacationDaysPerYear: 30,
  serviceArea: { label: "NRW und angrenzend", radiusKm: 120 },
  officeHours: { weekday: 4, nthWeek: 2, time: "19:00", durationMinutes: 45 },
  voucher: {
    valueCents: null,
    validDays: 14,
    minAreaM2: 25,
    conditions: {
      liveOrRecording: true,
      floorCheckAndPhotos: true,
      inServiceArea: true,
      minArea: true,
      withinDeadline: true,
    },
  },
  pricing: { vatPercent: 19, subscriptionDiscountPercent: null },
  subscriptions: {
    repairsPerYear: 3,
    repairMaxSize: "",
    oilingIntervalYears: 2,
    minTermMonths: { "boden-pass-plus": 24, "rundum-sorglos": 12, rueckendeckung: 1, werkstatt: 12 },
  },
  analytics: { posthogUrl: "" },
};

type Plain = Record<string, unknown>;

function isPlainObject(value: unknown): value is Plain {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Deep-merges `patch` into `base`; arrays and primitives in `patch` replace the base value. */
export function deepMerge<T>(base: T, patch: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(patch)) return (patch === undefined ? base : patch) as T;
  const out: Plain = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    out[key] = key in base ? deepMerge((base as Plain)[key], value) : value;
  }
  return out as T;
}

/**
 * Completes a stored settings document with defaults. Invalid stored values fall back to the
 * defaults section by section, so one broken value never takes the whole site down.
 */
export function resolveSettings(stored: unknown): Settings {
  const merged = deepMerge(DEFAULT_SETTINGS, isPlainObject(stored) ? stored : {});
  const parsed = settingsSchema.safeParse(merged);
  if (parsed.success) return parsed.data;
  const repaired: Plain = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const section = settingsSchema.shape[key].safeParse((merged as Plain)[key]);
    if (section.success) repaired[key] = section.data;
  }
  return repaired as Settings;
}
