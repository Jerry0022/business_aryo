import { berlinDateKey, type TimedEvent } from "./calendar";
import { planByKey } from "./subscriptions";

// Honest scarcity (concept 7.3): every public counter is derived from real records, never typed in.

export const PROJECT_STATUSES = [
  { key: "anfrage", label: "Anfrage" },
  { key: "beratung", label: "Beratung" },
  { key: "angebot", label: "Angebot" },
  { key: "gebucht", label: "Gebucht" },
  { key: "laufend", label: "Laufend" },
  { key: "abgeschlossen", label: "Abgeschlossen" },
  { key: "storniert", label: "Storniert" },
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]["key"];

/** Statuses that occupy a Projektplatz. */
export const SLOT_BOOKED_STATUSES: ReadonlySet<string> = new Set(["gebucht", "laufend", "abgeschlossen"]);
/** An offer with a slot assigned reserves it (shown, but not counted as taken). */
export const SLOT_RESERVED_STATUSES: ReadonlySet<string> = new Set(["angebot"]);

export interface SlotProject {
  status: string;
  slotYear: number | null;
  slotMonth: number | null;
}

export type MonthState = "gebucht" | "reserviert" | "frei";

export interface ProjectContingent {
  year: number;
  total: number;
  booked: number;
  reserved: number;
  free: number;
  months: { month: number; state: MonthState; booked: number }[];
}

export function projectContingent(projects: readonly SlotProject[], year: number, total: number): ProjectContingent {
  const months = Array.from({ length: 12 }, (_, index) => ({ month: index + 1, state: "frei" as MonthState, booked: 0 }));
  let booked = 0;
  let reserved = 0;
  for (const project of projects) {
    if (project.slotYear !== year) continue;
    const month = project.slotMonth && project.slotMonth >= 1 && project.slotMonth <= 12 ? months[project.slotMonth - 1] : null;
    if (SLOT_BOOKED_STATUSES.has(project.status)) {
      booked += 1;
      if (month) {
        month.booked += 1;
        month.state = "gebucht";
      }
    } else if (SLOT_RESERVED_STATUSES.has(project.status)) {
      reserved += 1;
      if (month && month.state === "frei") month.state = "reserviert";
    }
  }
  return { year, total, booked, reserved, free: Math.max(0, total - booked), months };
}

export interface FoundingContingent {
  total: number;
  used: number;
  free: number;
  deadline: string;
  open: boolean;
}

/** Gründungskontingent: Erstberatungen scheduled up to the deadline. */
export function foundingContingent(
  events: readonly (Pick<TimedEvent, "type" | "startsAt"> & { status?: string })[],
  total: number,
  deadline: string,
  today: string,
): FoundingContingent {
  const used = events.filter(
    (event) => event.type === "erstberatung" && event.status !== "abgesagt" && berlinDateKey(event.startsAt) <= deadline,
  ).length;
  const free = Math.max(0, total - used);
  return { total, used, free, deadline, open: today <= deadline && free > 0 };
}

/** Active subscriptions that need on-site time (Boden-Pass Plus, Rundum-sorglos). */
export function subscriptionSlotsUsed(subscriptions: readonly { plan: string; status: string }[]): number {
  return subscriptions.filter((item) => item.status === "aktiv" && planByKey(item.plan)?.usesSlot).length;
}
