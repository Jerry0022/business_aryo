import type { Settings } from "./settings";

// Calendar logic for the Werkbank: Berlin wall-clock time, NRW holidays, the alternating work
// rhythm (Block-Woche / Halbtags-Woche), weekly capacity and the vacation account.
// Calendar dates are handled as "YYYY-MM-DD" keys; instants are UTC Date objects.

export const TIME_ZONE = "Europe/Berlin";

export type DateKey = string;

// ---- Event types -------------------------------------------------------------------------------

export const EVENT_TYPES = [
  { key: "verlegung", label: "Verlegung", countsAsWork: true },
  { key: "erstberatung", label: "Erstberatung", countsAsWork: true },
  { key: "einweisung", label: "Einweisung", countsAsWork: true },
  { key: "sprechstunde", label: "Sprechstunde", countsAsWork: true },
  { key: "werkzeug", label: "Werkzeug", countsAsWork: true },
  { key: "material", label: "Material-Lieferung", countsAsWork: true },
  { key: "pflege", label: "Pflege / Abo", countsAsWork: true },
  { key: "partner", label: "Partner", countsAsWork: true },
  { key: "buero", label: "Büro", countsAsWork: true },
  { key: "urlaub", label: "Urlaub", countsAsWork: false },
] as const;

export type EventTypeKey = (typeof EVENT_TYPES)[number]["key"];

export function isEventType(value: string): value is EventTypeKey {
  return EVENT_TYPES.some((type) => type.key === value);
}

export function eventTypeLabel(key: string): string {
  return EVENT_TYPES.find((type) => type.key === key)?.label ?? key;
}

export const EVENT_STATUSES = [
  { key: "geplant", label: "Geplant" },
  { key: "erledigt", label: "Erledigt" },
  { key: "abgesagt", label: "Abgesagt" },
] as const;

// ---- Date keys (pure calendar arithmetic) ------------------------------------------------------

export function parseDateKey(key: DateKey): { year: number; month: number; day: number } {
  const [year = 1970, month = 1, day = 1] = key.split("-").map(Number);
  return { year, month, day };
}

export function toDateKey(year: number, month: number, day: number): DateKey {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function keyToUtcNoon(key: DateKey): Date {
  const { year, month, day } = parseDateKey(key);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function utcNoonToKey(date: Date): DateKey {
  return toDateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function addDays(key: DateKey, days: number): DateKey {
  const date = keyToUtcNoon(key);
  date.setUTCDate(date.getUTCDate() + days);
  return utcNoonToKey(date);
}

export function daysBetween(from: DateKey, to: DateKey): number {
  return Math.round((keyToUtcNoon(to).getTime() - keyToUtcNoon(from).getTime()) / 86_400_000);
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export function isoWeekday(key: DateKey): number {
  const day = keyToUtcNoon(key).getUTCDay();
  return day === 0 ? 7 : day;
}

export function mondayOf(key: DateKey): DateKey {
  return addDays(key, 1 - isoWeekday(key));
}

export function isoWeek(key: DateKey): { year: number; week: number } {
  const thursday = addDays(key, 4 - isoWeekday(key));
  const { year } = parseDateKey(thursday);
  const week = Math.floor(daysBetween(toDateKey(year, 1, 1), thursday) / 7) + 1;
  return { year, week };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isWeekend(key: DateKey): boolean {
  return isoWeekday(key) >= 6;
}

// ---- Berlin wall-clock time --------------------------------------------------------------------

const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function berlinParts(date: Date) {
  const parts = Object.fromEntries(partsFormatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

export function berlinDateKey(date: Date): DateKey {
  const { year, month, day } = berlinParts(date);
  return toDateKey(year, month, day);
}

export function berlinTime(date: Date): string {
  const { hour, minute } = berlinParts(date);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Minutes after midnight (Berlin) of an instant. */
export function berlinMinutes(date: Date): number {
  const { hour, minute } = berlinParts(date);
  return hour * 60 + minute;
}

function offsetMinutes(instant: number): number {
  const p = berlinParts(new Date(instant));
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return Math.round((wall - Math.floor(instant / 60_000) * 60_000) / 60_000);
}

/** Converts a Berlin wall-clock date and time ("HH:MM") into the UTC instant. */
export function berlinToUtc(key: DateKey, time: string): Date {
  const { year, month, day } = parseDateKey(key);
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const first = offsetMinutes(wall);
  let utc = wall - first * 60_000;
  const second = offsetMinutes(utc);
  if (second !== first) utc = wall - second * 60_000;
  return new Date(utc);
}

export function timeToMinutes(time: string): number {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  return hour * 60 + minute;
}

// ---- Holidays (NRW) ----------------------------------------------------------------------------

/** Easter Sunday (anonymous Gregorian algorithm). */
export function easterSunday(year: number): DateKey {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return toDateKey(year, month, day);
}

export interface Holiday {
  date: DateKey;
  name: string;
}

export function nrwHolidays(year: number): Holiday[] {
  const easter = easterSunday(year);
  return [
    { date: toDateKey(year, 1, 1), name: "Neujahr" },
    { date: addDays(easter, -2), name: "Karfreitag" },
    { date: addDays(easter, 1), name: "Ostermontag" },
    { date: toDateKey(year, 5, 1), name: "Tag der Arbeit" },
    { date: addDays(easter, 39), name: "Christi Himmelfahrt" },
    { date: addDays(easter, 50), name: "Pfingstmontag" },
    { date: addDays(easter, 60), name: "Fronleichnam" },
    { date: toDateKey(year, 10, 3), name: "Tag der Deutschen Einheit" },
    { date: toDateKey(year, 11, 1), name: "Allerheiligen" },
    { date: toDateKey(year, 12, 25), name: "1. Weihnachtstag" },
    { date: toDateKey(year, 12, 26), name: "2. Weihnachtstag" },
  ].sort((x, y) => x.date.localeCompare(y.date));
}

export function holidayMap(years: readonly number[]): Map<DateKey, string> {
  const map = new Map<DateKey, string>();
  for (const year of years) for (const holiday of nrwHolidays(year)) map.set(holiday.date, holiday.name);
  return map;
}

/** Working days that bridge a holiday to the weekend (Thursday holiday → Friday, Tuesday → Monday). */
export function bridgeDays(year: number): { date: DateKey; reason: string }[] {
  const holidays = holidayMap([year]);
  const result: { date: DateKey; reason: string }[] = [];
  for (const [date, name] of holidays) {
    const weekday = isoWeekday(date);
    const candidate = weekday === 4 ? addDays(date, 1) : weekday === 2 ? addDays(date, -1) : null;
    if (candidate && !holidays.has(candidate) && parseDateKey(candidate).year === year) {
      result.push({ date: candidate, reason: `Brückentag nach bzw. vor ${name}` });
    }
  }
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

// ---- Work rhythm -------------------------------------------------------------------------------

export type WeekType = "block" | "halbtag" | "vorlauf";

export const WEEK_TYPE_LABELS: Record<WeekType, string> = {
  block: "Block-Woche",
  halbtag: "Halbtags-Woche",
  vorlauf: "Vorlauf",
};

type Rhythm = Settings["rhythm"];

/** Alternates Block / Halbtags from `firstBlockWeekMonday`; earlier weeks are "Vorlauf". */
export function weekType(anyDayOfWeek: DateKey, rhythm: Rhythm): WeekType {
  const weeks = Math.floor(daysBetween(mondayOf(rhythm.firstBlockWeekMonday), mondayOf(anyDayOfWeek)) / 7);
  if (weeks < 0) return "vorlauf";
  return weeks % 2 === 0 ? "block" : "halbtag";
}

export interface WorkWindow {
  date: DateKey;
  start: string;
  end: string;
  kind: "verlegetag" | "halbtag" | "buero";
}

/** Planned work windows of the week containing `anyDayOfWeek`; holidays have no window. */
export function workWindows(anyDayOfWeek: DateKey, rhythm: Rhythm, holidays?: ReadonlyMap<DateKey, string>): WorkWindow[] {
  const monday = mondayOf(anyDayOfWeek);
  const type = weekType(monday, rhythm);
  if (type === "vorlauf") return [];
  const windows: WorkWindow[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDays(monday, offset);
    if (holidays?.has(date)) continue;
    const weekday = offset + 1;
    if (type === "block") {
      if (rhythm.blockDays.includes(weekday)) {
        windows.push({ date, start: rhythm.blockDayStart, end: rhythm.blockDayEnd, kind: "verlegetag" });
      } else if (rhythm.blockOfficeDay === weekday) {
        windows.push({ date, start: rhythm.halfDayStart, end: rhythm.halfDayEnd, kind: "buero" });
      }
    } else if (rhythm.halfDayDays.includes(weekday)) {
      windows.push({ date, start: rhythm.halfDayStart, end: rhythm.halfDayEnd, kind: "halbtag" });
    }
  }
  return windows;
}

export function windowHours(window: Pick<WorkWindow, "start" | "end">): number {
  return netHours((timeToMinutes(window.end) - timeToMinutes(window.start)) / 60);
}

/** Working time minus the statutory break (30 min above 6 h). */
export function netHours(grossHours: number): number {
  const hours = Math.max(0, grossHours);
  return hours > 6 ? hours - 0.5 : hours;
}

export interface TimedEvent {
  type: string;
  startsAt: Date;
  endsAt: Date;
  allDay: boolean;
  status?: string;
}

export function eventHours(event: TimedEvent): number {
  if (event.allDay || event.status === "abgesagt") return 0;
  if (!EVENT_TYPES.find((type) => type.key === event.type)?.countsAsWork) return 0;
  return netHours((event.endsAt.getTime() - event.startsAt.getTime()) / 3_600_000);
}

/** Booked working hours in the week containing `anyDayOfWeek` (by Berlin start date). */
export function weekLoadHours(events: readonly TimedEvent[], anyDayOfWeek: DateKey): number {
  const monday = mondayOf(anyDayOfWeek);
  const sunday = addDays(monday, 6);
  let total = 0;
  for (const event of events) {
    const key = berlinDateKey(event.startsAt);
    if (key >= monday && key <= sunday) total += eventHours(event);
  }
  return Math.round(total * 100) / 100;
}

/** All calendar days an event touches (Berlin dates, inclusive). All-day events end exclusive at midnight. */
export function eventDateKeys(event: Pick<TimedEvent, "startsAt" | "endsAt" | "allDay">): DateKey[] {
  const start = berlinDateKey(event.startsAt);
  let end = berlinDateKey(new Date(event.endsAt.getTime() - 1));
  if (end < start) end = start;
  const keys: DateKey[] = [];
  for (let key = start; key <= end && keys.length < 400; key = addDays(key, 1)) keys.push(key);
  return keys;
}

// ---- Vacation account --------------------------------------------------------------------------

export interface VacationStats {
  year: number;
  allowance: number;
  taken: number;
  planned: number;
  left: number;
}

/** Counts Mon–Fri working days (excluding NRW holidays) covered by vacation entries in `year`. */
export function vacationStats(
  events: readonly (Pick<TimedEvent, "type" | "startsAt" | "endsAt" | "allDay"> & { status?: string })[],
  year: number,
  allowance: number,
  today: DateKey,
): VacationStats {
  const holidays = holidayMap([year]);
  const days = new Set<DateKey>();
  for (const event of events) {
    if (event.type !== "urlaub" || event.status === "abgesagt") continue;
    for (const key of eventDateKeys(event)) {
      if (parseDateKey(key).year === year && !isWeekend(key) && !holidays.has(key)) days.add(key);
    }
  }
  let taken = 0;
  let planned = 0;
  for (const key of days) {
    if (key < today) taken += 1;
    else planned += 1;
  }
  return { year, allowance, taken, planned, left: allowance - taken - planned };
}

/** Next vacation start (Berlin date) on or after `today`, if any. */
export function nextVacation(
  events: readonly (Pick<TimedEvent, "type" | "startsAt" | "endsAt" | "allDay"> & { status?: string })[],
  today: DateKey,
): { start: DateKey; end: DateKey; inDays: number } | null {
  let best: { start: DateKey; end: DateKey } | null = null;
  for (const event of events) {
    if (event.type !== "urlaub" || event.status === "abgesagt") continue;
    const keys = eventDateKeys(event);
    const start = keys[0];
    const end = keys[keys.length - 1];
    if (!start || !end || end < today) continue;
    if (!best || start < best.start) best = { start, end };
  }
  if (!best) return null;
  return { ...best, inDays: Math.max(0, daysBetween(today, best.start)) };
}

// ---- Formatting (German) -----------------------------------------------------------------------

export const MONTH_NAMES = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
] as const;

export const MONTH_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"] as const;

export const WEEKDAY_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;

export const WEEKDAY_LONG = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"] as const;

/** "08.10.2026" */
export function formatDateKey(key: DateKey, withYear = true): string {
  const { year, month, day } = parseDateKey(key);
  const base = `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.`;
  return withYear ? `${base}${year}` : base;
}

/** "Do, 08.10.2026, 19:00" (Berlin). */
export function formatInstant(date: Date, options: { withYear?: boolean; withWeekday?: boolean } = {}): string {
  const key = berlinDateKey(date);
  const weekday = options.withWeekday === false ? "" : `${WEEKDAY_SHORT[isoWeekday(key) - 1]}, `;
  return `${weekday}${formatDateKey(key, options.withYear !== false)}, ${berlinTime(date)}`;
}

export function todayKey(now: Date = new Date()): DateKey {
  return berlinDateKey(now);
}
