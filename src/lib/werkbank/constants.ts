// Enum-like values of the Werkbank records. The database stores plain text; these lists are the
// allowed keys plus their German labels. Shared by server actions (validation) and the UI.

export const LEAD_KINDS = [
  { key: "boden-check", label: "Boden-Check" },
  { key: "projekt", label: "Projekt-Bewerbung" },
  { key: "partner", label: "Partner-Bewerbung" },
  { key: "notfall", label: "Notfall" },
  { key: "abo", label: "Abo-Anfrage" },
] as const;

export const LEAD_STATUSES = [
  { key: "neu", label: "Neu" },
  { key: "in-arbeit", label: "In Arbeit" },
  { key: "erledigt", label: "Erledigt" },
  { key: "abgelehnt", label: "Abgelehnt" },
] as const;

/** Statuses that still need work. */
export const OPEN_LEAD_STATUSES: ReadonlySet<string> = new Set(["neu", "in-arbeit"]);

export const CUSTOMER_KINDS = [
  { key: "privat", label: "Privat" },
  { key: "gewerbe", label: "Gewerbe" },
  { key: "partner", label: "Partner" },
] as const;

export const TOOL_STATUSES = [
  { key: "verfuegbar", label: "Verfügbar" },
  { key: "wartung", label: "In Wartung" },
  { key: "defekt", label: "Defekt" },
  { key: "ausgemustert", label: "Ausgemustert" },
] as const;

export const OFFICE_HOUR_STATUSES = [
  { key: "geplant", label: "Geplant" },
  { key: "durchgefuehrt", label: "Durchgeführt" },
  { key: "abgesagt", label: "Abgesagt" },
] as const;

export const PARTNER_STATUSES = [
  { key: "bewerbung", label: "Bewerbung" },
  { key: "aktiv", label: "Aktiv" },
  { key: "pausiert", label: "Pausiert" },
  { key: "abgelehnt", label: "Abgelehnt" },
] as const;

type Option = { readonly key: string; readonly label: string };

export function labelOf(options: readonly Option[], key: string | null | undefined): string {
  if (!key) return "";
  return options.find((option) => option.key === key)?.label ?? key;
}

export function keysOf<T extends readonly { readonly key: string }[]>(options: T): [T[number]["key"], ...T[number]["key"][]] {
  return options.map((option) => option.key) as [T[number]["key"], ...T[number]["key"][]];
}

export const WERKBANK_PATH = "/studio/werkbank";
