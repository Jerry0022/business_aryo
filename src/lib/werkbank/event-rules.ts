import {
  addDays,
  berlinDateKey,
  berlinMinutes,
  berlinTime,
  berlinToUtc,
  eventDateKeys,
  EVENT_TYPES,
  holidayMap,
  isWeekend,
  isoWeek,
  mondayOf,
  parseDateKey,
  timeToMinutes,
  weekLoadHours,
  weekType,
  WEEK_TYPE_LABELS,
  WEEKDAY_LONG,
  isoWeekday,
  workWindows,
  type DateKey,
  type TimedEvent,
} from "@/lib/business/calendar";
import type { Settings } from "@/lib/business/settings";
import { formatDateRange, formatDayShort, formatHours, plural } from "./format";
import type { Warning } from "./types";

// Rules for calendar entries: converting form values (Berlin wall-clock) to instants and back,
// the live warnings shown while planning (vacation, holiday, overlap, weekly target, work window)
// and the side-by-side layout of overlapping entries in the week view.

type Rhythm = Settings["rhythm"];

/** Suggested start/end per event type (quick add). */
export const DEFAULT_TIMES: Record<string, [string, string]> = {
  verlegung: ["07:30", "16:00"],
  erstberatung: ["08:30", "10:30"],
  einweisung: ["08:00", "11:00"],
  sprechstunde: ["19:00", "19:45"],
  werkzeug: ["11:00", "11:30"],
  material: ["08:00", "08:30"],
  pflege: ["09:00", "10:30"],
  partner: ["09:00", "10:00"],
  buero: ["08:00", "12:00"],
  urlaub: ["08:00", "12:00"],
};

export function defaultTimes(type: string): [string, string] {
  return DEFAULT_TIMES[type] ?? ["09:00", "10:00"];
}

export interface EventTimes {
  /** Start date (Berlin). */
  date: DateKey;
  /** Last day for all-day entries (inclusive); equals `date` for timed entries. */
  endDate: DateKey;
  start: string;
  end: string;
  allDay: boolean;
}

/** Form values → stored instants. All-day entries end exclusive at the following midnight. */
export function timesToInstants(times: EventTimes): { startsAt: Date; endsAt: Date } {
  if (times.allDay) {
    const last = times.endDate >= times.date ? times.endDate : times.date;
    return { startsAt: berlinToUtc(times.date, "00:00"), endsAt: berlinToUtc(addDays(last, 1), "00:00") };
  }
  return { startsAt: berlinToUtc(times.date, times.start), endsAt: berlinToUtc(times.date, times.end) };
}

/** Stored instants → form values. */
export function instantsToTimes(event: { startsAt: Date; endsAt: Date; allDay: boolean }): EventTimes {
  const date = berlinDateKey(event.startsAt);
  if (event.allDay) {
    const keys = eventDateKeys(event);
    return { date, endDate: keys[keys.length - 1] ?? date, start: "08:00", end: "12:00", allDay: true };
  }
  return { date, endDate: date, start: berlinTime(event.startsAt), end: berlinTime(event.endsAt), allDay: false };
}

export interface ContextEvent extends TimedEvent {
  id: string;
  title: string;
  status: string;
}

export interface WarningDraft extends EventTimes {
  id?: string | null;
  type: string;
  status?: string;
}

function isActive(event: { status?: string }) {
  return event.status !== "abgesagt";
}

/** The vacation entry covering a date, if any. */
export function vacationOn(events: readonly ContextEvent[], key: DateKey, ignoreId?: string | null): ContextEvent | undefined {
  return events.find(
    (event) => event.type === "urlaub" && isActive(event) && event.id !== ignoreId && eventDateKeys(event).includes(key),
  );
}

function windowText(date: DateKey, rhythm: Rhythm): string {
  const windows = workWindows(date, rhythm).filter((window) => window.date === date);
  return windows.map((window) => `${window.start}–${window.end}`).join(", ");
}

/** Counts working days (Mon–Fri, no NRW holiday) in an inclusive date range. */
export function workingDays(start: DateKey, end: DateKey): number {
  const years = new Set<number>();
  for (let key = start; key <= end; key = addDays(key, 1)) years.add(parseDateKey(key).year);
  const holidays = holidayMap([...years]);
  let days = 0;
  for (let key = start; key <= end && days < 400; key = addDays(key, 1)) {
    if (!isWeekend(key) && !holidays.has(key)) days += 1;
  }
  return days;
}

/**
 * Live warnings for a planned entry. `crit` warnings (vacation, holiday, overlap) need an explicit
 * confirmation before saving; `warn` and `info` are hints; `ok` confirms the weekly load.
 */
export function eventWarnings(
  draft: WarningDraft,
  context: { events: readonly ContextEvent[]; rhythm: Rhythm },
): Warning[] {
  const warnings: Warning[] = [];
  const others = context.events.filter((event) => event.id !== draft.id && isActive(event));
  if (!draft.date || !/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return warnings;
  const year = parseDateKey(draft.date).year;
  const holidays = holidayMap([year - 1, year, year + 1]);

  if (draft.type === "urlaub") {
    const end = draft.allDay && draft.endDate >= draft.date ? draft.endDate : draft.date;
    const days = workingDays(draft.date, end);
    warnings.push({
      level: "info",
      code: "vacation-days",
      message: `${plural(days, "Urlaubstag", "Urlaubstage")} (Mo–Fr ohne Feiertage) · ${formatDateRange(draft.date, end)}`,
    });
    const hits = others.filter(
      (event) =>
        event.type !== "urlaub" &&
        !event.allDay &&
        EVENT_TYPES.find((type) => type.key === event.type)?.countsAsWork &&
        eventDateKeys(event).some((key) => key >= draft.date && key <= end),
    );
    if (hits.length > 0) {
      warnings.push({
        level: "warn",
        code: "events-in-vacation",
        message: `${hits.length === 1 ? "1 Termin liegt" : `${hits.length} Termine liegen`} in diesem Zeitraum: ${hits
          .slice(0, 3)
          .map((event) => `${formatDayShort(berlinDateKey(event.startsAt))} ${event.title}`)
          .join(", ")}${hits.length > 3 ? " …" : ""}.`,
      });
    }
    return warnings;
  }

  if (draft.allDay) return warnings;

  const startMin = timeToMinutes(draft.start);
  const endMin = timeToMinutes(draft.end);
  if (!(endMin > startMin)) {
    warnings.push({ level: "crit", code: "invalid-time", message: "Das Ende muss nach dem Beginn liegen." });
    return warnings;
  }

  const vacation = vacationOn(others, draft.date);
  if (vacation) {
    const keys = eventDateKeys(vacation);
    warnings.push({
      level: "crit",
      code: "vacation",
      message: `Urlaub: ${formatDayShort(draft.date)} liegt in „${vacation.title}“ (${formatDateRange(keys[0] ?? draft.date, keys[keys.length - 1] ?? draft.date)}).`,
    });
  }
  const holiday = holidays.get(draft.date);
  if (holiday) {
    warnings.push({ level: "crit", code: "holiday", message: `Feiertag: ${formatDayShort(draft.date)} ist ${holiday} (NRW).` });
  }

  const { startsAt, endsAt } = timesToInstants(draft);
  const overlaps = others.filter(
    (event) =>
      !event.allDay &&
      event.type !== "urlaub" &&
      event.startsAt.getTime() < endsAt.getTime() &&
      event.endsAt.getTime() > startsAt.getTime(),
  );
  for (const event of overlaps.slice(0, 3)) {
    warnings.push({
      level: "crit",
      code: "overlap",
      message: `Überschneidung mit „${event.title}“ (${berlinTime(event.startsAt)}–${berlinTime(event.endsAt)}).`,
    });
  }

  const countsAsWork = EVENT_TYPES.find((type) => type.key === draft.type)?.countsAsWork ?? false;
  if (countsAsWork && draft.status !== "abgesagt") {
    const draftEvent: TimedEvent = { type: draft.type, startsAt, endsAt, allDay: false, status: draft.status };
    const hours = weekLoadHours([...others, draftEvent], draft.date);
    const target = context.rhythm.weeklyHoursTarget;
    const week = isoWeek(draft.date).week;
    if (hours > target) {
      warnings.push({
        level: "warn",
        code: "over-target",
        message: `KW ${week}: danach ${formatHours(hours)} h von ${formatHours(target)} h geplant (+${formatHours(hours - target)} h über dem Wochenziel).`,
      });
    } else {
      warnings.push({
        level: "ok",
        code: "week-load",
        message: `KW ${week}: danach ${formatHours(hours)} von ${formatHours(target)} h geplant.`,
      });
    }
  }

  if (countsAsWork && draft.type !== "sprechstunde" && !vacation && !holiday) {
    const type = weekType(draft.date, context.rhythm);
    if (type === "vorlauf") {
      warnings.push({
        level: "info",
        code: "vorlauf",
        message: `Vorlauf: Der Arbeitsrhythmus beginnt erst am ${formatDayShort(mondayOf(context.rhythm.firstBlockWeekMonday))}.`,
      });
    } else if (!isInWorkWindow(draft, context.rhythm)) {
      const text = windowText(draft.date, context.rhythm);
      warnings.push({
        level: "info",
        code: "outside-window",
        message: text
          ? `Außerhalb des Arbeitsfensters (${WEEK_TYPE_LABELS[type]}, ${WEEKDAY_LONG[isoWeekday(draft.date) - 1]} ${text}).`
          : `Kein Arbeitsfenster am ${WEEKDAY_LONG[isoWeekday(draft.date) - 1]} in der ${WEEK_TYPE_LABELS[type]}.`,
      });
    }
  }
  return warnings;
}

export function isInWorkWindow(times: Pick<EventTimes, "date" | "start" | "end">, rhythm: Rhythm): boolean {
  const start = timeToMinutes(times.start);
  const end = timeToMinutes(times.end);
  return workWindows(times.date, rhythm).some(
    (window) => window.date === times.date && start >= timeToMinutes(window.start) && end <= timeToMinutes(window.end),
  );
}

export function needsConfirmation(warnings: readonly Warning[]): boolean {
  return warnings.some((warning) => warning.level === "crit" && warning.code !== "invalid-time");
}

/** Critical conflicts of a stored entry (used to flag entries in the calendar and overview). */
export function conflictReasons(event: ContextEvent, events: readonly ContextEvent[], rhythm: Rhythm): string[] {
  if (event.allDay || event.type === "urlaub" || !isActive(event)) return [];
  const times = instantsToTimes(event);
  return eventWarnings({ ...times, id: event.id, type: event.type, status: event.status }, { events, rhythm })
    .filter((warning) => warning.level === "crit" && warning.code !== "invalid-time")
    .map((warning) => warning.message);
}

export function hasConflict(event: ContextEvent, events: readonly ContextEvent[], rhythm: Rhythm): boolean {
  return conflictReasons(event, events, rhythm).length > 0;
}

// ---- Week view layout ----------------------------------------------------------------------------

export interface LayoutInput {
  key: string;
  start: number;
  end: number;
}

export interface LayoutSlot {
  column: number;
  columns: number;
}

/** Assigns overlapping entries of one day to side-by-side columns. */
export function layoutDayEvents(items: readonly LayoutInput[]): Map<string, LayoutSlot> {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const result = new Map<string, LayoutSlot>();
  let cluster: { key: string; column: number }[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    const columns = Math.max(1, columnEnds.length);
    for (const item of cluster) result.set(item.key, { column: item.column, columns });
    cluster = [];
    columnEnds = [];
  };

  for (const item of sorted) {
    const end = Math.max(item.end, item.start + 15);
    if (item.start >= clusterEnd && cluster.length > 0) flush();
    let column = columnEnds.findIndex((columnEnd) => columnEnd <= item.start);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(end);
    } else {
      columnEnds[column] = end;
    }
    cluster.push({ key: item.key, column });
    clusterEnd = cluster.length === 1 ? end : Math.max(clusterEnd, end);
  }
  if (cluster.length > 0) flush();
  return result;
}

/** Minutes after midnight (Berlin) of an entry on a given day, clipped to that day. */
export function minutesOnDay(entry: { startsAt: Date; endsAt: Date }, key: DateKey): { start: number; end: number } {
  const startKey = berlinDateKey(entry.startsAt);
  const endKey = berlinDateKey(entry.endsAt);
  const start = startKey < key ? 0 : berlinMinutes(entry.startsAt);
  const end = endKey > key ? 24 * 60 : berlinMinutes(entry.endsAt);
  return { start, end: Math.max(end, start) };
}

