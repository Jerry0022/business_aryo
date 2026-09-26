import { berlinToUtc, daysInMonth, isoWeekday, toDateKey } from "./calendar";
import type { Settings } from "./settings";

// Boden-Sprechstunde: free monthly live webinar with the "Werkbank-Kamera" (concept 7.1).

const TOPIC_PLAN: Record<number, string> = {
  1: "Parkett, Vinyl oder Laminat? Was zu deinem Leben passt.",
  2: "Fußbodenheizung und Holz",
  3: "Frühjahrsprojekte planen: Ablauf, Kosten, typische Fehler",
  4: "Selbst verlegen: was du wissen musst",
  5: "Altbaudielen retten oder neu verlegen?",
  6: "Kinder, Hund, Rotwein: Böden für echtes Leben",
  7: "Vermieten: robust und wertsteigernd",
  8: "Boden und Raumklima",
  9: "Landhausdiele, Schiffsboden und Co.: Verlegearten im Vergleich",
  10: "Pflege: So bleibt dein Boden 30 Jahre schön",
  11: "Boden vor dem Verkauf: Werterhalt, der sich zeigt",
  12: "Planung fürs neue Jahr",
};

/** Launch topics before the 2027 plan starts. */
const LAUNCH_TOPICS: Record<string, string> = {
  "2026-10": "Parkett, Vinyl oder Laminat? Was zu deinem Leben passt.",
  "2026-11": "Fußbodenheizung und Holz",
  "2026-12": "Planung fürs neue Jahr",
};

export function defaultOfficeHourTopic(year: number, month: number): string {
  return LAUNCH_TOPICS[`${year}-${String(month).padStart(2, "0")}`] ?? TOPIC_PLAN[month] ?? "Boden-Sprechstunde";
}

/** Date of the n-th given ISO weekday in a month. */
export function nthWeekdayOfMonth(year: number, month: number, weekday: number, nth: number): string {
  const first = toDateKey(year, month, 1);
  const offset = (weekday - isoWeekday(first) + 7) % 7;
  const day = Math.min(1 + offset + (nth - 1) * 7, daysInMonth(year, month));
  return toDateKey(year, month, day);
}

export interface OfficeHourSlot {
  startsAt: Date;
  durationMinutes: number;
  topic: string;
}

/** The next `count` default sessions from `now` on, following the settings schedule. */
export function defaultOfficeHours(now: Date, count: number, schedule: Settings["officeHours"]): OfficeHourSlot[] {
  const result: OfficeHourSlot[] = [];
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth() + 1;
  for (let guard = 0; result.length < count && guard < 36; guard += 1) {
    const date = nthWeekdayOfMonth(year, month, schedule.weekday, schedule.nthWeek);
    const startsAt = berlinToUtc(date, schedule.time);
    if (startsAt.getTime() + schedule.durationMinutes * 60_000 > now.getTime()) {
      result.push({ startsAt, durationMinutes: schedule.durationMinutes, topic: defaultOfficeHourTopic(year, month) });
    }
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return result;
}

/** Human-readable voucher conditions for the website, only the enabled ones. */
export function voucherConditionTexts(settings: Settings): string[] {
  const { conditions, validDays, minAreaM2 } = settings.voucher;
  const texts: string[] = [];
  if (conditions.liveOrRecording)
    texts.push("du live dabei warst oder die Aufzeichnung innerhalb von 72 Stunden ganz angesehen hast");
  if (conditions.floorCheckAndPhotos) texts.push("dein Boden-Check ausgefüllt ist und du 3 Fotos deines Raums schickst");
  if (conditions.inServiceArea) texts.push(`dein Projekt im Einzugsgebiet liegt (${settings.serviceArea.label})`);
  if (conditions.minArea) texts.push(`es um mindestens ${minAreaM2} m² oder einen besonderen Boden geht`);
  if (conditions.withinDeadline) texts.push(`du innerhalb von ${validDays} Tagen buchst, solange das Kontingent reicht`);
  return texts;
}

export interface VoucherCheckInput {
  attended: boolean;
  watchedRecording: boolean;
  floorCheckDone: boolean;
  photosReceived: boolean;
  inServiceArea: boolean | null;
  areaM2: number | null;
  specialFloor: boolean;
  contingentFree: number;
}

/** Checks the enabled voucher conditions; unknown facts (null) count as not met. */
export function voucherChecks(input: VoucherCheckInput, settings: Settings) {
  const { conditions, minAreaM2 } = settings.voucher;
  const checks: { key: string; label: string; ok: boolean }[] = [];
  if (conditions.liveOrRecording)
    checks.push({ key: "live", label: "Live dabei oder Aufzeichnung gesehen", ok: input.attended || input.watchedRecording });
  if (conditions.floorCheckAndPhotos)
    checks.push({ key: "check", label: "Boden-Check und 3 Fotos", ok: input.floorCheckDone && input.photosReceived });
  if (conditions.inServiceArea) checks.push({ key: "area", label: "Im Einzugsgebiet", ok: input.inServiceArea === true });
  if (conditions.minArea)
    checks.push({
      key: "size",
      label: `Mindestens ${minAreaM2} m² oder besonderer Boden`,
      ok: input.specialFloor || (input.areaM2 !== null && input.areaM2 >= minAreaM2),
    });
  if (conditions.withinDeadline) checks.push({ key: "slots", label: "Kontingent frei", ok: input.contingentFree > 0 });
  return { eligible: checks.every((check) => check.ok), checks };
}

const VOUCHER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateVoucherCode(random: (size: number) => Uint8Array = (size) => crypto.getRandomValues(new Uint8Array(size))): string {
  const bytes = random(8);
  const chars = Array.from(bytes, (byte) => VOUCHER_ALPHABET[byte % VOUCHER_ALPHABET.length]);
  return `MP-${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

export interface PublicOfficeHour {
  /** null for a default slot that is created on the first registration. */
  id: string | null;
  startsAt: string;
  durationMinutes: number;
  topic: string;
}

/** Stored sessions first; default monthly slots fill the gaps (a default on the same day is skipped). */
export function mergeOfficeHours(
  rows: readonly { id: string; startsAt: Date; durationMinutes: number; topic: string }[],
  now: Date,
  settings: Settings,
  count = 4,
): PublicOfficeHour[] {
  const stored = rows
    .filter((row) => row.startsAt.getTime() + row.durationMinutes * 60_000 > now.getTime())
    .map((row) => ({ id: row.id, startsAt: row.startsAt.toISOString(), durationMinutes: row.durationMinutes, topic: row.topic }));
  const storedDays = new Set(stored.map((row) => row.startsAt.slice(0, 10)));
  const defaults = defaultOfficeHours(now, count, settings.officeHours)
    .filter((slot) => !storedDays.has(slot.startsAt.toISOString().slice(0, 10)))
    .map((slot) => ({ id: null, startsAt: slot.startsAt.toISOString(), durationMinutes: slot.durationMinutes, topic: slot.topic }));
  return [...stored, ...defaults].sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, count);
}

