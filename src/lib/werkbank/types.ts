// Data shapes exchanged between the Werkbank server code (queries, actions) and its client UI.

export type RecordKind =
  | "event"
  | "customer"
  | "project"
  | "lead"
  | "tool"
  | "officeHour"
  | "subscription"
  | "floorPass"
  | "partner";

export interface RecordRef {
  kind: RecordKind;
  id: string;
}

export const RECORD_KIND_LABELS: Record<RecordKind, string> = {
  event: "Termin",
  customer: "Kunde",
  project: "Projekt",
  lead: "Anfrage",
  tool: "Werkzeug",
  officeHour: "Sprechstunde",
  subscription: "Abo",
  floorPass: "Boden-Pass",
  partner: "Partner",
};

export interface ChecklistItem {
  text: string;
  done: boolean;
}

export interface CalEvent {
  id: string;
  type: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  allDay: boolean;
  location: string | null;
  notes: string | null;
  status: string;
  checklist: ChecklistItem[];
  customerId: string | null;
  projectId: string | null;
  toolId: string | null;
  officeHourId: string | null;
  subscriptionId: string | null;
  leadId: string | null;
  floorPassId: string | null;
}

/** One entry in the calendar: a stored event, a stored office hour or a suggested default session. */
export interface CalEntry {
  key: string;
  source: "event" | "officeHour" | "virtualOfficeHour";
  /** Record id (event or office hour); null for virtual entries. */
  id: string | null;
  type: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  allDay: boolean;
  status: string;
  location: string | null;
  /** Critical warning (vacation, holiday or overlap). */
  conflict: boolean;
  conflictReasons?: string[];
  /** Registrations of an office hour. */
  registrations?: number;
}

export interface SelectOption {
  id: string;
  label: string;
  meta?: string;
  customerId?: string | null;
  projectId?: string | null;
}

export type WarningLevel = "crit" | "warn" | "info" | "ok";

export interface Warning {
  level: WarningLevel;
  code: string;
  message: string;
}

export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string>; warnings?: Warning[]; needsConfirm?: boolean };

// ---- Drawer record details ------------------------------------------------------------------------

export type Tone = "neutral" | "oak" | "ok" | "warn" | "crit" | "info";

export interface DetailRow {
  label: string;
  value: string;
  mono?: boolean;
}

export interface DetailSection {
  title: string;
  rows: DetailRow[];
}

export interface LinkItem {
  ref: RecordRef;
  label: string;
  meta?: string;
}

export interface EventLine {
  id: string;
  type: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  allDay: boolean;
  status: string;
}

export interface RegistrationLine {
  id: string;
  firstName: string;
  email: string;
  confirmed: boolean;
  attended: boolean;
  watchedRecording: boolean;
  voucherCode: string | null;
  voucherRedeemed: boolean;
}

export interface RecordContext {
  customerId?: string | null;
  projectId?: string | null;
  subscriptionId?: string | null;
  floorPassId?: string | null;
  toolId?: string | null;
  officeHourId?: string | null;
  leadId?: string | null;
  date?: string | null;
  title?: string | null;
  location?: string | null;
  notes?: string | null;
  areaM2?: number | null;
  floorType?: string | null;
}

export interface RecordDetail {
  ref: RecordRef;
  title: string;
  subtitle?: string;
  badges: { label: string; tone: Tone }[];
  banners: { tone: "crit" | "warn" | "info" | "ok"; text: string }[];
  sections: DetailSection[];
  /** Bullet list below the sections (plan features, recommendations …). */
  bullets?: { title: string; items: string[] };
  links: LinkItem[];
  events: EventLine[];
  /** Event records: the stored event, for editing, status and checklist. */
  event?: CalEvent;
  /** Lead records. */
  lead?: { kind: string; status: string; customerId: string | null; partnerId: string | null };
  registrations?: RegistrationLine[];
  /** Values used by follow-up actions ("Termin planen", "Projekt anlegen" …). */
  context: RecordContext;
  /** Link to the week in the calendar. */
  calendarHref?: string;
}
