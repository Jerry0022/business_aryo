import { formatDateKey, isoWeekday, parseDateKey, WEEKDAY_SHORT, type DateKey } from "@/lib/business/calendar";

// Small German formatting helpers for the Werkbank UI (pure, shared by server and client).

const hoursFormat = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });
const numberFormat = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

/** 14.5 → "14,5" */
export function formatHours(hours: number): string {
  return hoursFormat.format(Math.round(hours * 100) / 100);
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * Parses a euro amount typed in German or English notation into cents.
 * "" → null (not set), "38,50" / "38.50" / "1.234,5" / "89" → cents, anything else → undefined.
 */
export function parseEuroInput(raw: string): number | null | undefined {
  const text = raw.replace(/€/g, "").replace(/\s/g, "");
  if (text === "") return null;
  let normalized = text;
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(text)) normalized = text.replace(/\./g, "").replace(",", ".");
  else if (/^\d+(,\d{1,2})?$/.test(text)) normalized = text.replace(",", ".");
  else if (!/^\d+(\.\d{1,2})?$/.test(text)) return undefined;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0 || value > 10_000_000) return undefined;
  return Math.round(value * 100);
}

/** 3850 → "38,50", null → "" (for input fields). */
export function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });
}

/** "Mo, 05.10." */
export function formatDayShort(key: DateKey): string {
  return `${WEEKDAY_SHORT[isoWeekday(key) - 1]}, ${formatDateKey(key, false)}`;
}

/** "05.10.–09.10.2026" or "28.12.2026–03.01.2027" */
export function formatDateRange(start: DateKey, end: DateKey): string {
  if (start === end) return formatDateKey(start);
  const sameYear = parseDateKey(start).year === parseDateKey(end).year;
  return `${formatDateKey(start, !sameYear)}–${formatDateKey(end)}`;
}

/** 0 → "heute", 1 → "morgen", 5 → "in 5 Tagen", -2 → "vor 2 Tagen" */
export function relativeDays(days: number): string {
  if (days === 0) return "heute";
  if (days === 1) return "morgen";
  if (days === -1) return "gestern";
  return days > 0 ? `in ${days} Tagen` : `vor ${-days} Tagen`;
}



/** Small stable string hash (djb2), e.g. to remount a form with fresh state after the server data changed. */
export function stableHash(value: unknown): string {
  const text = JSON.stringify(value) ?? "";
  let result = 5381;
  for (let index = 0; index < text.length; index += 1) result = (result * 33) ^ text.charCodeAt(index);
  return (result >>> 0).toString(36);
}
