import type { PublicPlan } from "@/lib/business/data";
import type { Settings } from "@/lib/business/settings";

// Pure display helpers for the public site. Every date is shown in Berlin time, independent of the
// server or browser time zone, so server and client render the same text.

const TIME_ZONE = "Europe/Berlin";

const dayMonthFormat = new Intl.DateTimeFormat("de-DE", { timeZone: TIME_ZONE, day: "2-digit", month: "2-digit" });
const weekdayFormat = new Intl.DateTimeFormat("de-DE", { timeZone: TIME_ZONE, weekday: "long" });
const weekdayShortFormat = new Intl.DateTimeFormat("de-DE", { timeZone: TIME_ZONE, weekday: "short" });
const timeFormat = new Intl.DateTimeFormat("de-DE", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });
const longDateFormat = new Intl.DateTimeFormat("de-DE", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

export interface OfficeHourLabel {
  /** "08.10." */
  dayMonth: string;
  /** "Donnerstag" */
  weekday: string;
  /** "Do" */
  weekdayShort: string;
  /** "19:00" */
  time: string;
  /** "Do 08.10., 19 Uhr" */
  compact: string;
  /** "Donnerstag, 8. Oktober, 19:00 Uhr" */
  long: string;
}

export function officeHourLabel(iso: string): OfficeHourLabel {
  const date = new Date(iso);
  const dayMonth = `${dayMonthFormat.format(date)}.`.replace("..", ".");
  const weekday = weekdayFormat.format(date);
  const weekdayShort = weekdayShortFormat.format(date).replace(".", "");
  const time = timeFormat.format(date);
  const [hours, minutes] = time.split(":");
  const shortTime = minutes === "00" ? `${Number(hours)} Uhr` : `${time} Uhr`;
  return {
    dayMonth,
    weekday,
    weekdayShort,
    time,
    compact: `${weekdayShort} ${dayMonth}, ${shortTime}`,
    long: `${longDateFormat.format(date)}, ${time} Uhr`,
  };
}

/** "2026-12-31" → "31.12.2026" */
export function formatDateKey(key: string): string {
  const [year, month, day] = key.split("-");
  return `${day}.${month}.${year}`;
}

export const MONTHS = [
  { short: "JAN", long: "Januar" },
  { short: "FEB", long: "Februar" },
  { short: "MÄR", long: "März" },
  { short: "APR", long: "April" },
  { short: "MAI", long: "Mai" },
  { short: "JUN", long: "Juni" },
  { short: "JUL", long: "Juli" },
  { short: "AUG", long: "August" },
  { short: "SEP", long: "September" },
  { short: "OKT", long: "Oktober" },
  { short: "NOV", long: "November" },
  { short: "DEZ", long: "Dezember" },
] as const;

/** Contract term shown on a plan card, or null when no term is configured. */
export function planTermLine(plan: Pick<PublicPlan, "minTermMonths" | "private">): string | null {
  const months = plan.minTermMonths;
  if (months === null) return null;
  if (plan.private) {
    return months <= 1 ? "Monatlich kündbar" : `Mindestlaufzeit ${months} Monate, danach monatlich kündbar`;
  }
  return months <= 0 ? null : `Laufzeit ${months} Monate`;
}

/**
 * Feature list of a plan. Boden-Pass Plus gets its oiling interval and repair allowance from the
 * settings, so the website always says what the Werkbank has configured.
 */
export function planFeatures(
  plan: Pick<PublicPlan, "key" | "features" | "minTermMonths" | "private">,
  subscriptions: Settings["subscriptions"],
): string[] {
  const term = planTermLine(plan)?.toLowerCase();
  const features = plan.features.filter((feature) => feature.toLowerCase() !== term);
  if (plan.key !== "boden-pass-plus") return features;

  const { oilingIntervalYears, repairsPerYear, repairMaxSize } = subscriptions;
  const oiling =
    oilingIntervalYears <= 1
      ? "Nachölen jedes Jahr, als halbtägiger Termin"
      : `Nachölen alle ${oilingIntervalYears} Jahre, als halbtägiger Termin`;
  const size = repairMaxSize.trim();
  const repairs =
    repairsPerYear > 0
      ? `Bis zu ${repairsPerYear} ${repairsPerYear === 1 ? "Ausbesserung" : "Ausbesserungen"} pro Jahr inklusive (kleine Dellen und Kratzer${size ? `, ${size}` : ""})`
      : null;
  const rest = features.filter((feature) => !/^(Nachölen|Ausbesserungen)/.test(feature));
  return [oiling, ...(repairs ? [repairs] : []), ...rest];
}

/** "Noch 1 Projektplatz frei" / "Noch 5 Projektplätze frei" */
export function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
