import {
  addDays,
  daysInMonth,
  formatDateKey,
  isoWeek,
  mondayOf,
  MONTH_NAMES,
  parseDateKey,
  toDateKey,
  type DateKey,
} from "@/lib/business/calendar";
import { WERKBANK_PATH } from "./constants";

// Navigation model of the Werkbank calendar: the view and the focused date live in the URL
// (?ansicht=woche&datum=2026-10-05) so every view can be linked and reloaded.

export const CALENDAR_VIEWS = [
  { key: "jahr", label: "Jahr" },
  { key: "monat", label: "Monat" },
  { key: "woche", label: "Woche" },
  { key: "agenda", label: "Agenda" },
] as const;

export type CalendarView = (typeof CALENDAR_VIEWS)[number]["key"];

export const AGENDA_DAYS = 35;

export function isCalendarView(value: unknown): value is CalendarView {
  return typeof value === "string" && CALENDAR_VIEWS.some((view) => view.key === value);
}

export function isDateKey(value: unknown): value is DateKey {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const { year, month, day } = parseDateKey(value);
  return year >= 2000 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseCalendarParams(
  params: Record<string, string | string[] | undefined>,
  today: DateKey,
): { view: CalendarView; date: DateKey } {
  const view = first(params.ansicht);
  const date = first(params.datum);
  return { view: isCalendarView(view) ? view : "monat", date: isDateKey(date) ? date : today };
}

/** Inclusive date range a view shows. */
export function viewRange(view: CalendarView, date: DateKey): { start: DateKey; end: DateKey } {
  const { year, month } = parseDateKey(date);
  switch (view) {
    case "jahr":
      return { start: toDateKey(year, 1, 1), end: toDateKey(year, 12, 31) };
    case "monat": {
      const start = mondayOf(toDateKey(year, month, 1));
      const end = addDays(mondayOf(toDateKey(year, month, daysInMonth(year, month))), 6);
      return { start, end };
    }
    case "woche": {
      const start = mondayOf(date);
      return { start, end: addDays(start, 6) };
    }
    case "agenda":
      return { start: date, end: addDays(date, AGENDA_DAYS - 1) };
  }
}

export function shiftDate(view: CalendarView, date: DateKey, direction: 1 | -1): DateKey {
  const { year, month, day } = parseDateKey(date);
  switch (view) {
    case "jahr":
      return toDateKey(year + direction, month, Math.min(day, daysInMonth(year + direction, month)));
    case "monat": {
      const index = year * 12 + (month - 1) + direction;
      const nextYear = Math.floor(index / 12);
      const nextMonth = (index % 12) + 1;
      return toDateKey(nextYear, nextMonth, Math.min(day, daysInMonth(nextYear, nextMonth)));
    }
    case "woche":
      return addDays(date, 7 * direction);
    case "agenda":
      return addDays(date, AGENDA_DAYS * direction);
  }
}

export function viewTitle(view: CalendarView, date: DateKey): string {
  const { year, month } = parseDateKey(date);
  switch (view) {
    case "jahr":
      return String(year);
    case "monat":
      return `${MONTH_NAMES[month - 1]} ${year}`;
    case "woche": {
      const start = mondayOf(date);
      const end = addDays(start, 6);
      return `KW ${isoWeek(start).week} · ${formatDateKey(start, false)}–${formatDateKey(end)}`;
    }
    case "agenda": {
      const end = addDays(date, AGENDA_DAYS - 1);
      return `${formatDateKey(date, false)}–${formatDateKey(end)}`;
    }
  }
}

/** Weeks (Monday first) covering a month. */
export function monthGrid(year: number, month: number): DateKey[][] {
  const weeks: DateKey[][] = [];
  const last = toDateKey(year, month, daysInMonth(year, month));
  for (let monday = mondayOf(toDateKey(year, month, 1)); monday <= last; monday = addDays(monday, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, offset) => addDays(monday, offset)));
  }
  return weeks;
}

/** Mondays of all ISO weeks that belong to `year` (52 or 53). */
export function isoWeekMondays(year: number): DateKey[] {
  const mondays: DateKey[] = [];
  let monday = mondayOf(toDateKey(year, 1, 4));
  while (isoWeek(monday).year === year) {
    mondays.push(monday);
    monday = addDays(monday, 7);
  }
  return mondays;
}

export function calendarHref(view: CalendarView, date: DateKey, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams({ ansicht: view, datum: date, ...extra });
  return `${WERKBANK_PATH}/kalender?${params.toString()}`;
}
