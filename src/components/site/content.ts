import { defaultServices } from "@/lib/business/services";
import type { PatternId } from "./parquet/geometry";
import type { WoodTone } from "./parquet/woods";

// Static copy of the public site. Brand, tone and business rules: docs/konzept/markenkonzept.md.
// Everything that changes with the business (prices, contingents, dates) comes from the data layer
// in src/lib/business and is passed in as props, never written down here.

export interface NavItem {
  label: string;
  /** "#section" on the landing page, or an absolute path. */
  href: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Machen lassen", href: "#wege" },
  { label: "Selbst machen", href: "#wege" },
  { label: "Für Profis", href: "#profis" },
  { label: "Ratgeber", href: "/ratgeber" },
  { label: "Sprechstunde", href: "#sprechstunde" },
];

/** Resolves a nav href for the current page: anchors need the "/" prefix outside the landing page. */
export function resolveHref(href: string, onHome: boolean): string {
  if (!href.startsWith("#")) return href;
  return onHome ? href : `/${href}`;
}

/**
 * Services the business offers itself (used for structured data). Work that needs the Meister
 * partner is left out on purpose, it is never claimed as the owner's own trade.
 */
export const SERVICES: readonly { id: string; title: string; text: string }[] = defaultServices()
  .filter((item) => !item.requiresMasterPartner)
  .map((item) => ({ id: item.id, title: item.title, text: item.description }));

// ---- Werte (concept chapter 3) -------------------------------------------------------------------

export const VALUES = [
  {
    name: "Sorgfalt bis zur letzten Fuge",
    means: "Übergänge, Sockelleisten und Schwellen entscheiden, ob ein Boden gut aussieht.",
    not: "Perfektionismus, der den Termin sprengt.",
  },
  {
    name: "Ehrlich beraten",
    means: "Ich empfehle, was passt, nicht was am meisten kostet. Auch mal: „Brauchst du nicht.“",
    not: "Billigangebote um jeden Preis.",
  },
  {
    name: "Aus Liebe zum Naturmaterial",
    means: "Ich verstehe das Material und kann es dir erklären. Auf jeden Boden bin ich stolz.",
    not: "Romantik ohne Fachwissen.",
  },
  {
    name: "Bodenständig",
    means: "Nahbar, direkt, pragmatisch. Egal ob Studentenbude oder Villa.",
    not: "Hemdsärmelig.",
  },
] as const;

// ---- Die drei Wege (concept chapter 6) ---------------------------------------------------------

export const WAYS = [
  {
    eyebrow: "Vollleistung",
    title: "Machen lassen",
    text: "Ich plane, liefere und verlege. Du hast einen Ansprechpartner von der ersten Frage bis zur letzten Sockelleiste.",
    items: ["Planung und Aufmaß", "Material", "Verlegung", "Boden-Pass"],
    link: { label: "Boden-Check starten", href: "#boden-check" },
  },
  {
    eyebrow: "Mit Einweisung",
    title: "Selbst machen",
    text: "Du verlegst. Ich zeig dir, wie: das richtige Material, Profi-Werkzeug zum Leihen und eine Einweisung bei dir vor Ort.",
    items: ["Material", "Profi-Werkzeug leihen", "Einweisung vor Ort", "Rückendeckung"],
    link: { label: "Was du bekommst", href: "#leistungen" },
  },
  {
    eyebrow: "Für Betriebe",
    title: "Für Profis",
    text: "Für Handwerksbetriebe, Bauträger und Hausverwaltungen. Du bewirbst dich, wir schauen, ob es passt. Ich werbe keine Kunden ab.",
    items: ["Material für Betriebe", "Werkzeug", "Planungshilfe", "Rundum-sorglos-Pflege"],
    link: { label: "Als Partner bewerben", href: "#profis" },
  },
] as const;

// ---- 3D-Boden-Explorer -------------------------------------------------------------------------

export type MaterialId = "parkett" | "laminat" | "vinyl";

export interface MaterialInfo {
  id: MaterialId;
  label: string;
  short: string;
  /** Honest one-liner, including the downsides. */
  note: string;
}

export const MATERIALS: readonly MaterialInfo[] = [
  {
    id: "parkett",
    label: "Parkett",
    short: "Echtholz",
    note: "Echtholz, fußwarm und je nach Aufbau mehrfach abschleifbar. Holz arbeitet mit dem Raumklima, das gehört dazu.",
  },
  {
    id: "laminat",
    label: "Laminat",
    short: "Holzoptik",
    note: "Kein Naturmaterial: ein Foto von Holz auf einer Trägerplatte. Robust, günstig und schnell verlegt. Abschleifen geht nicht.",
  },
  {
    id: "vinyl",
    label: "Vinyl",
    short: "Wasserfest",
    note: "Vinyl ist kein Naturmaterial, aber im Bad oft die bessere Wahl: wasserfest, leise und pflegeleicht.",
  },
];

export interface PatternInfo {
  id: PatternId;
  label: string;
  short: string;
  description: string;
  /** Plank width used for the flat preview. */
  unit: number;
  /** Glued patterns need a Parkettleger-Meisterbetrieb. */
  glued: boolean;
}

export const PATTERNS: readonly PatternInfo[] = [
  {
    id: "schiffsboden",
    label: "Schiffsboden",
    short: "Wilder Verband",
    description: "Lange, schmale Stäbe in versetzten Reihen. Unaufgeregt und gut, um einen Raum optisch zu strecken.",
    unit: 18,
    glued: false,
  },
  {
    id: "landhausdiele",
    label: "Landhausdiele",
    short: "Großzügig",
    description: "Breite, lange Dielen mit ruhigem Fugenbild und sichtbarer Maserung. Gibt es auch als Fertigparkett zum Klicken.",
    unit: 18,
    glued: false,
  },
];

// ---- Vorher/Nachher ----------------------------------------------------------------------------

/** Grey laminate for the before/after comparison ("vorher"). Not a wood, so not part of WOODS. */
export const GREY_LAMINATE: WoodTone = {
  label: "Graues Laminat",
  note: "kühl, glatt, gleichförmig",
  fills: ["#a4a19c", "#aaa7a2", "#9f9c97", "#a7a49f", "#a19e99", "#a9a6a1"],
  seam: "#6f6c68",
  grainDark: "#7d7a75",
  grainLight: "#c4c1bc",
  knot: "#8a8782",
  swatch: ["#aaa7a2", "#9f9c97"],
};

// ---- Formulare ---------------------------------------------------------------------------------

/** Must match the enum in submitPartnerApplication (src/lib/business/public-actions.ts). */
export const PARTNER_NEEDS = [
  "Material",
  "Werkzeug",
  "Planung",
  "Unterstützung auf der Baustelle",
  "Meister-Arbeiten übernehmen",
] as const;

/** Must match the enum in submitProjectApplication. */
export const PROJECT_ROLES = ["Privat", "Bauherr", "Architektur", "Hausverwaltung", "Gewerbe"] as const;

/** Must match the enum in submitEmergencyRequest. */
export const DAMAGE_TYPES = ["Wasserschaden", "Kratzer oder Dellen", "Stumpfe Stellen", "Etwas anderes"] as const;

// ---- Ratgeber ----------------------------------------------------------------------------------

export const GUIDE_TEASERS = [
  {
    href: "/ratgeber/hund-kinder-rotwein",
    pillar: "Was kann passieren?",
    title: "Was passiert, wenn dein Hund jeden Tag drüber rennt?",
    text: "Krallen, Wassernapf, Toben: welche Oberflächen das wegstecken und welche nicht.",
  },
  {
    href: "/ratgeber/fussbodenheizung-und-holz",
    pillar: "Welcher Boden wofür?",
    title: "Fußbodenheizung und Holz: Geht das?",
    text: "Ja, mit dem richtigen Aufbau. Worauf du bei Holzart, Stärke und Verlegung achten musst.",
  },
  {
    href: "/ratgeber/kosten-pro-jahr",
    pillar: "Wert und Geld",
    title: "Kosten pro Jahr statt pro Quadratmeter",
    text: "Ein Boden, der doppelt so lange hält, darf mehr kosten. So rechnest du ehrlich.",
  },
] as const;
