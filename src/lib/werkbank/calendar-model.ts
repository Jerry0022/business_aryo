import {
  addDays,
  eventDateKeys,
  EVENT_TYPES,
  timeToMinutes,
  workWindows,
  type DateKey,
  type WorkWindow,
} from "@/lib/business/calendar";
import type { Settings } from "@/lib/business/settings";
import type { CalEntry } from "./types";

// Client-side helpers of the calendar views: grouping entries per day, filtering, and the rhythm
// texts shown in the week header and the sidebar.

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export function groupByDay(entries: readonly CalEntry[]): Map<DateKey, CalEntry[]> {
  const map = new Map<DateKey, CalEntry[]>();
  for (const entry of entries) {
    for (const key of eventDateKeys(entry)) {
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
  }
  for (const list of map.values()) {
    list.sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.startsAt.getTime() - b.startsAt.getTime());
  }
  return map;
}

export function spanDays<T extends { start: DateKey; end: DateKey }>(spans: readonly T[]): Map<DateKey, T> {
  const map = new Map<DateKey, T>();
  for (const span of spans) {
    for (let key = span.start, guard = 0; key <= span.end && guard < 400; key = addDays(key, 1), guard += 1) map.set(key, span);
  }
  return map;
}

export function matchesQuery(entry: CalEntry, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const label = EVENT_TYPES.find((type) => type.key === entry.type)?.label ?? "";
  return [entry.title, entry.location ?? "", label].some((text) => text.toLowerCase().includes(needle));
}

export function filterEntries(entries: readonly CalEntry[], hidden: ReadonlySet<string>, query: string): CalEntry[] {
  return entries.filter((entry) => !hidden.has(entry.type) && matchesQuery(entry, query));
}

function dayList(days: readonly number[]): string {
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 0) return "";
  const isRange = sorted.length > 2 && sorted.every((day, index) => index === 0 || day === sorted[index - 1]! + 1);
  if (isRange) return `${WEEKDAYS[sorted[0]! - 1]}–${WEEKDAYS[sorted[sorted.length - 1]! - 1]}`;
  return sorted.map((day) => WEEKDAYS[day - 1]).join(" + ");
}

/** "Di + Mi 07:30–16:00 · Fr 08:00–12:00 Büro" */
export function blockRhythmText(rhythm: Settings["rhythm"]): string {
  const parts = [`${dayList(rhythm.blockDays)} ${rhythm.blockDayStart}–${rhythm.blockDayEnd}`];
  if (rhythm.blockOfficeDay) parts.push(`${WEEKDAYS[rhythm.blockOfficeDay - 1]} ${rhythm.halfDayStart}–${rhythm.halfDayEnd} Büro`);
  return parts.join(" · ");
}

/** "Mo–Fr 08:00–12:00" */
export function halfDayRhythmText(rhythm: Settings["rhythm"]): string {
  return `${dayList(rhythm.halfDayDays)} ${rhythm.halfDayStart}–${rhythm.halfDayEnd}`;
}

export const WINDOW_LABELS: Record<WorkWindow["kind"], string> = {
  verlegetag: "Verlegetag",
  halbtag: "Halbtag",
  buero: "Büro",
};

export function windowsByDay(anyDay: DateKey, rhythm: Settings["rhythm"], holidays: ReadonlyMap<DateKey, string>): Map<DateKey, WorkWindow> {
  return new Map(workWindows(anyDay, rhythm, holidays).map((window) => [window.date, window]));
}

/** Minutes → pixel offset inside the week grid. */
export function minutesToOffset(minutes: number, startHour: number, hourHeight: number): number {
  return ((minutes - startHour * 60) / 60) * hourHeight;
}

export function windowMinutes(window: Pick<WorkWindow, "start" | "end">) {
  return { start: timeToMinutes(window.start), end: timeToMinutes(window.end) };
}

/** Rounds a pixel offset in the week grid to the start of a 30-minute slot ("HH:MM"). */
export function offsetToSlot(offset: number, startHour: number, endHour: number, hourHeight: number): { start: string; end: string } {
  const raw = startHour * 60 + Math.floor((offset / hourHeight) * 2) * 30;
  const minutes = Math.max(startHour * 60, Math.min((endHour - 1) * 60, raw));
  const format = (value: number) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
  return { start: format(minutes), end: format(minutes + 60) };
}
