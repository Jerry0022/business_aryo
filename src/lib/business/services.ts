// Service catalog ("Preise & Leistungen"). The catalog in code is the default; the Werkbank stores
// overrides per id in the `service` table. Rule from the concept: a service is always listed, its
// price line only appears once a price is configured and visible.

export const SERVICE_GROUPS = [
  { key: "machen-lassen", label: "Machen lassen", lead: "Ich plane, liefere und verlege." },
  { key: "selbst-machen", label: "Selbst machen", lead: "Du verlegst, ich sorge dafür, dass es klappt." },
  { key: "profis", label: "Für Profis", lead: "Für Handwerksbetriebe, Bauträger, Hausverwaltungen und Gewerbe." },
  { key: "retten", label: "Retten und auffrischen", lead: "Wasserschaden, Kratzer, stumpfe Stellen." },
  { key: "abos", label: "Abos", lead: "Damit dein Boden bleibt wie am ersten Tag." },
] as const;

export type ServiceGroupKey = (typeof SERVICE_GROUPS)[number]["key"];

export const PRICE_TYPES = [
  { key: "fest", label: "Festpreis" },
  { key: "ab", label: "ab" },
  { key: "m2", label: "pro m²" },
  { key: "lfm", label: "pro lfm" },
  { key: "stunde", label: "pro Stunde" },
  { key: "tag", label: "pro Tag" },
  { key: "monat", label: "pro Monat" },
  { key: "m2-monat", label: "pro m² und Monat" },
  { key: "jahr", label: "pro Jahr" },
] as const;

export type PriceType = (typeof PRICE_TYPES)[number]["key"];

export interface ServiceItem {
  id: string;
  groupKey: ServiceGroupKey;
  title: string;
  description: string;
  priceType: PriceType;
  /** Net price in cents; null = not configured (never shown publicly). */
  priceCents: number | null;
  visible: boolean;
  /** Parkettleger work (Meisterpflicht): only offered while an active Meister partner exists. */
  requiresMasterPartner: boolean;
  sortOrder: number;
}

type CatalogEntry = Omit<ServiceItem, "priceCents" | "visible" | "sortOrder">;

const CATALOG: readonly CatalogEntry[] = [
  {
    id: "verlegung",
    groupKey: "machen-lassen",
    title: "Verlegung: Laminat, Vinyl, Fertigparkett",
    description: "Planung, Material, Verlegung und Boden-Pass aus einer Hand. Diese Böden verlege ich selbst.",
    priceType: "m2",
    requiresMasterPartner: false,
  },
  {
    id: "erstberatung",
    groupKey: "machen-lassen",
    title: "Erstberatung vor Ort",
    description:
      "Aufmaß, Feuchtemessung des Untergrunds, Muster zum Anfassen und eine ehrliche Empfehlung. Wird bei Auftrag angerechnet.",
    priceType: "fest",
    requiresMasterPartner: false,
  },
  {
    id: "untergrund",
    groupKey: "machen-lassen",
    title: "Untergrund vorbereiten",
    description: "Alten Belag entfernen, ausgleichen, grundieren. Damit der neue Boden jahrzehntelang ruhig liegt.",
    priceType: "m2",
    requiresMasterPartner: false,
  },
  {
    id: "leisten",
    groupKey: "machen-lassen",
    title: "Sockelleisten und Übergänge",
    description: "Passende Leisten, saubere Profile zu Fliesen und Türen, Übergänge ohne Stolperkante.",
    priceType: "lfm",
    requiresMasterPartner: false,
  },
  {
    id: "massivparkett",
    groupKey: "machen-lassen",
    title: "Massiv- und Stabparkett, Fischgrät verklebt",
    description: "Geplant und geliefert von mir, verlegt von meinem Parkettleger-Meisterpartner.",
    priceType: "m2",
    requiresMasterPartner: true,
  },
  {
    id: "material",
    groupKey: "selbst-machen",
    title: "Material zum Selbstverlegen",
    description: "Parkett, Laminat, Vinyl und Zubehör, passend zu deinem Bodenprofil ausgesucht.",
    priceType: "ab",
    requiresMasterPartner: false,
  },
  {
    id: "werkzeugverleih",
    groupKey: "selbst-machen",
    title: "Profi-Werkzeug leihen",
    description: "Unterschnittsäge, Zugeisen-Set, Kappsäge, Feuchtemessgerät und mehr, mit kurzer Erklärung.",
    priceType: "tag",
    requiresMasterPartner: false,
  },
  {
    id: "einweisung",
    groupKey: "selbst-machen",
    title: "Einweisung vor Ort",
    description: "Ich zeige dir bei dir zuhause, wie es geht, und prüfe mit dir den Untergrund.",
    priceType: "fest",
    requiresMasterPartner: false,
  },
  {
    id: "material-betriebe",
    groupKey: "profis",
    title: "Material für Betriebe",
    description: "Parkett, Laminat, Vinyl und Zubehör für Handwerksbetriebe, geplant und geliefert.",
    priceType: "ab",
    requiresMasterPartner: false,
  },
  {
    id: "planungshilfe",
    groupKey: "profis",
    title: "Planungshilfe",
    description: "Aufmaß, Materialauswahl, Mengen und Ablauf für dein Projekt.",
    priceType: "stunde",
    requiresMasterPartner: false,
  },
  {
    id: "baustelle",
    groupKey: "profis",
    title: "Unterstützung auf der Baustelle",
    description: "Ich verlege mit, wenn dir Kapazität oder Erfahrung mit Holzböden fehlt. Ich werbe keine Kunden ab.",
    priceType: "tag",
    requiresMasterPartner: false,
  },
  {
    id: "ausbessern",
    groupKey: "retten",
    title: "Ausbessern",
    description: "Kratzer, Dellen und einzelne Stellen. Geölte Böden lassen sich auch partiell ausbessern.",
    priceType: "ab",
    requiresMasterPartner: false,
  },
  {
    id: "pflege",
    groupKey: "retten",
    title: "Pflege und Nachölen",
    description: "Gründlich reinigen und nachölen, damit der Boden lange schön bleibt.",
    priceType: "m2",
    requiresMasterPartner: false,
  },
  {
    id: "notfall",
    groupKey: "retten",
    title: "Notfall-Einschätzung",
    description: "Wasserschaden oder großer Schaden: Fotos schicken, eine ehrliche Einschätzung bekommen.",
    priceType: "fest",
    requiresMasterPartner: false,
  },
  {
    id: "schleifen",
    groupKey: "retten",
    title: "Parkett schleifen und versiegeln",
    description: "Über meinen Parkettleger-Meisterpartner, mit Planung und Material von mir.",
    priceType: "m2",
    requiresMasterPartner: true,
  },
  {
    id: "abo-boden-pass-plus",
    groupKey: "abos",
    title: "Boden-Pass Plus",
    description: "Wie die Heizungswartung, nur für deinen Boden: Nachölen nach Plan, Ausbesserungen inklusive.",
    priceType: "monat",
    requiresMasterPartner: false,
  },
  {
    id: "abo-rundum-sorglos",
    groupKey: "abos",
    title: "Rundum-sorglos (Gewerbe)",
    description: "Pflege nach Plan, feste Reaktionszeit, Zustandsprotokoll bei Mieterwechsel, eine planbare Rate.",
    priceType: "m2-monat",
    requiresMasterPartner: false,
  },
  {
    id: "abo-rueckendeckung",
    groupKey: "abos",
    title: "Rückendeckung",
    description: "Für Selbermacher, solange dein Projekt läuft: Chat- und Video-Hilfe, Foto-Check des Untergrunds.",
    priceType: "monat",
    requiresMasterPartner: false,
  },
];

export function defaultServices(): ServiceItem[] {
  return CATALOG.map((entry, index) => ({ ...entry, priceCents: null, visible: true, sortOrder: index * 10 }));
}

export const DEFAULT_SERVICE_IDS = new Set(CATALOG.map((entry) => entry.id));

export function isPriceType(value: string): value is PriceType {
  return PRICE_TYPES.some((type) => type.key === value);
}

export function isServiceGroupKey(value: string): value is ServiceGroupKey {
  return SERVICE_GROUPS.some((group) => group.key === value);
}

/** Merges stored overrides into the default catalog. Stored rows win; unknown ids are custom services. */
export function mergeServices(overrides: readonly Partial<ServiceItem>[]): ServiceItem[] {
  const byId = new Map(defaultServices().map((item) => [item.id, item]));
  for (const row of overrides) {
    if (!row.id) continue;
    const base = byId.get(row.id);
    const merged = { ...(base ?? {}), ...stripUndefined(row) } as ServiceItem;
    if (!isServiceGroupKey(merged.groupKey) || !isPriceType(merged.priceType) || !merged.title) continue;
    byId.set(row.id, merged);
  }
  return [...byId.values()].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "de"));
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/** Whether a service appears on the website at all. */
export function isServiceShown(item: Pick<ServiceItem, "visible" | "requiresMasterPartner">, hasActiveMasterPartner: boolean) {
  return item.visible && (!item.requiresMasterPartner || hasActiveMasterPartner);
}

export function grossCents(netCents: number, vatPercent: number): number {
  return Math.round(netCents * (1 + vatPercent / 100));
}

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export function formatEuro(cents: number): string {
  return euro.format(cents / 100);
}

const UNIT_SUFFIX: Record<PriceType, string> = {
  fest: "",
  ab: "",
  m2: " pro m²",
  lfm: " pro lfm",
  stunde: " pro Stunde",
  tag: " pro Tag",
  monat: " pro Monat",
  "m2-monat": " pro m² und Monat",
  jahr: " pro Jahr",
};

export interface PriceDisplayOptions {
  vatPercent: number;
  /** true = consumer price incl. VAT (website), false = net (partner area). */
  gross: boolean;
}

/** Formats a price line, or returns null when no price is configured. */
export function formatPriceLine(
  priceCents: number | null,
  priceType: PriceType,
  { vatPercent, gross }: PriceDisplayOptions,
): string | null {
  if (priceCents === null || priceCents === undefined) return null;
  const amount = gross ? grossCents(priceCents, vatPercent) : priceCents;
  const prefix = priceType === "ab" ? "ab " : "";
  return `${prefix}${formatEuro(amount)}${UNIT_SUFFIX[priceType]}`;
}

/** Public price line: only for visible services with a configured price. */
export function publicPriceLine(item: ServiceItem, options: PriceDisplayOptions): string | null {
  if (!item.visible) return null;
  return formatPriceLine(item.priceCents, item.priceType, options);
}

/**
 * Laying price with Boden-Pass Plus signed together with the project. Shown only when both the
 * base price and the discount are configured.
 */
export function subscriptionDiscountLine(
  item: ServiceItem,
  discountPercent: number | null,
  options: PriceDisplayOptions,
): string | null {
  if (item.priceCents === null || !discountPercent || discountPercent <= 0 || !item.visible) return null;
  const discounted = Math.round(item.priceCents * (1 - discountPercent / 100));
  return formatPriceLine(discounted, item.priceType, options);
}
