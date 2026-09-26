import { berlinDateKey, type DateKey } from "@/lib/business/calendar";
import { defaultOfficeHours } from "@/lib/business/office-hours";
import type { Settings } from "@/lib/business/settings";
import { conflictReasons, type ContextEvent } from "./event-rules";
import type { CalEntry, CalEvent } from "./types";

// Merges the three sources of calendar entries: stored events, stored office hours (the public
// registration creates them without a calendar event) and the default monthly sessions from the
// settings, which appear read-only until a session is stored for that day.

export interface OfficeHourLike {
  id: string;
  startsAt: Date;
  durationMinutes: number;
  topic: string;
  status: string;
}

/** Default sessions between `start` and `end` (Berlin dates) that have no stored session that day. */
export function virtualOfficeHours(
  now: Date,
  start: DateKey,
  end: DateKey,
  stored: readonly Pick<OfficeHourLike, "startsAt">[],
  schedule: Settings["officeHours"],
): { startsAt: Date; durationMinutes: number; topic: string }[] {
  const nowKey = berlinDateKey(now);
  if (end < nowKey) return [];
  const [endYear = 0, endMonth = 0] = end.split("-").map(Number);
  const months = (endYear - now.getUTCFullYear()) * 12 + (endMonth - (now.getUTCMonth() + 1)) + 2;
  const storedDays = new Set(stored.map((row) => berlinDateKey(row.startsAt)));
  return defaultOfficeHours(now, Math.min(36, Math.max(1, months)), schedule).filter((slot) => {
    const key = berlinDateKey(slot.startsAt);
    return key >= start && key <= end && !storedDays.has(key);
  });
}

export function buildEntries(input: {
  events: readonly CalEvent[];
  officeHours: readonly OfficeHourLike[];
  registrations?: ReadonlyMap<string, number>;
  virtual: readonly { startsAt: Date; durationMinutes: number; topic: string }[];
  context: readonly ContextEvent[];
  rhythm: Settings["rhythm"];
}): CalEntry[] {
  const linked = new Set(input.events.map((event) => event.officeHourId).filter((id): id is string => Boolean(id)));
  const entries: CalEntry[] = input.events.map((event) => {
    const reasons = conflictReasons(event, input.context, input.rhythm);
    return {
      key: `event:${event.id}`,
      source: "event",
      id: event.id,
      type: event.type,
      title: event.title,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      allDay: event.allDay,
      status: event.status,
      location: event.location,
      conflict: reasons.length > 0,
      conflictReasons: reasons,
      registrations: event.officeHourId ? input.registrations?.get(event.officeHourId) : undefined,
    };
  });
  for (const row of input.officeHours) {
    if (linked.has(row.id)) continue;
    const pseudo: ContextEvent = {
      id: `oh:${row.id}`,
      type: "sprechstunde",
      title: row.topic,
      startsAt: row.startsAt,
      endsAt: new Date(row.startsAt.getTime() + row.durationMinutes * 60_000),
      allDay: false,
      status: row.status === "abgesagt" ? "abgesagt" : "geplant",
    };
    const reasons = conflictReasons(pseudo, input.context, input.rhythm);
    entries.push({
      key: `officeHour:${row.id}`,
      source: "officeHour",
      id: row.id,
      type: "sprechstunde",
      title: `Sprechstunde: ${row.topic}`,
      startsAt: pseudo.startsAt,
      endsAt: pseudo.endsAt,
      allDay: false,
      status: pseudo.status,
      location: "Online (Werkbank-Kamera)",
      conflict: reasons.length > 0,
      conflictReasons: reasons,
      registrations: input.registrations?.get(row.id) ?? 0,
    });
  }
  for (const slot of input.virtual) {
    entries.push({
      key: `virtual:${slot.startsAt.toISOString()}`,
      source: "virtualOfficeHour",
      id: null,
      type: "sprechstunde",
      title: `Sprechstunde: ${slot.topic}`,
      startsAt: slot.startsAt,
      endsAt: new Date(slot.startsAt.getTime() + slot.durationMinutes * 60_000),
      allDay: false,
      status: "vorschlag",
      location: "Online (Werkbank-Kamera)",
      conflict: false,
    });
  }
  return entries.sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.startsAt.getTime() - b.startsAt.getTime());
}
