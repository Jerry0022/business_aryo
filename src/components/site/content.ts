import { siteConfig } from "@/config/site";
import type { PatternId } from "./parquet/geometry";

export const NAV_ITEMS = [
  { id: "leistungen", label: "Leistungen" },
  { id: "muster", label: "Muster" },
  { id: "ablauf", label: "Ablauf" },
  { id: "ueber-mich", label: "Über mich" },
  { id: "kontakt", label: "Kontakt" },
] as const;

export type ServiceIcon = "herringbone" | "sanding" | "oil" | "repair" | "stairs" | "vinyl" | "skirting" | "advice";

export interface Service {
  id: string;
  title: string;
  text: string;
  icon: ServiceIcon;
}

export const SERVICES: readonly Service[] = [
  {
    id: "verlegen",
    title: "Parkett verlegen",
    text: "Vom klassischen Fischgrät bis zur breiten Landhausdiele: Ich bereite den Untergrund sorgfältig vor und verlege Ihren Boden mit exakten Fugen und sauberen Anschlüssen – verklebt oder schwimmend, passend zu Raum und Nutzung.",
    icon: "herringbone",
  },
  {
    id: "schleifen",
    title: "Schleifen & Versiegeln",
    text: "Kratzer, Flecken und Laufstraßen verschwinden. Staubarm geschliffen und versiegelt, sieht Ihr Boden wieder aus wie am ersten Tag.",
    icon: "sanding",
  },
  {
    id: "oelen",
    title: "Ölen & Pflegen",
    text: "Geölte Oberflächen wirken natürlich und lassen sich später partiell ausbessern. Dazu gibt es ehrliche Tipps für die Pflege im Alltag.",
    icon: "oil",
  },
  {
    id: "dielen",
    title: "Altbau-Dielen & Reparatur",
    text: "Alte Dielen mit Geschichte: Ich tausche beschädigte Stücke, schließe Fugen und bringe knarrende Böden wieder zur Ruhe.",
    icon: "repair",
  },
  {
    id: "treppen",
    title: "Treppen",
    text: "Holztreppen schleifen, ausbessern und neu versiegeln – mit sauberen Kanten und einer Oberfläche, die dem täglichen Auf und Ab standhält.",
    icon: "stairs",
  },
  {
    id: "design",
    title: "Design- & Vinylböden",
    text: "Pflegeleicht, robust und fußwarm – ideal für Küche, Flur oder die Renovierung zwischen zwei Mietern. Präzise auf ebenem Untergrund verlegt.",
    icon: "vinyl",
  },
  {
    id: "leisten",
    title: "Sockelleisten & Übergänge",
    text: "Der letzte Schliff entscheidet: passende Leisten, saubere Profile zu Fliesen und Türen, Übergänge ohne Stolperkanten.",
    icon: "skirting",
  },
  {
    id: "beratung",
    title: "Beratung & Bemusterung",
    text: "Welches Holz, welches Muster, welche Oberfläche? Ich berate Sie vor Ort – ehrlich, mit Blick auf Ihren Alltag und Ihr Budget.",
    icon: "advice",
  },
];

export interface PatternInfo {
  id: PatternId;
  label: string;
  short: string;
  description: string;
  /** Plank width used for the live preview. */
  unit: number;
}

export const PATTERNS: readonly PatternInfo[] = [
  {
    id: "fischgraet",
    label: "Fischgrät",
    short: "Der Klassiker",
    description:
      "Rechtwinklig versetzte Stäbe, die wie Gräten ineinandergreifen – lebendig, zeitlos und wie gemacht für Altbau und Wohnzimmer.",
    unit: 18,
  },
  {
    id: "chevron",
    label: "Französisches Fischgrät",
    short: "Chevron",
    description:
      "Schräg auf Gehrung geschnittene Stäbe treffen sich auf einer geraden Linie – grafisch, ruhig und besonders elegant.",
    unit: 17,
  },
  {
    id: "schiffsboden",
    label: "Schiffsboden",
    short: "Wilder Verband",
    description: "Lange, schmale Stäbe in versetzten Reihen – unaufgeregt und ideal, um Räume optisch zu strecken.",
    unit: 18,
  },
  {
    id: "landhausdiele",
    label: "Landhausdiele",
    short: "Großzügig",
    description:
      "Breite, lange Dielen mit ruhigem Fugenbild und sichtbarer Maserung – natürlich, wohnlich und großzügig.",
    unit: 18,
  },
  {
    id: "tafelparkett",
    label: "Würfel / Tafelparkett",
    short: "Mit Charakter",
    description:
      "Quadratische Felder, deren Richtung von Feld zu Feld wechselt – ein handwerkliches Muster mit viel Charakter.",
    unit: 18,
  },
];

const CRLF = "\r\n";

export function mailtoHref(subject: string, body: string): string {
  return `mailto:${siteConfig.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Pre-filled quote request used by the hero CTA. */
export const QUOTE_MAILTO = mailtoHref(
  "Angebotsanfrage Parkett",
  [
    "Hallo Herr Sabouri,",
    "",
    "ich interessiere mich für ein Angebot.",
    "",
    "Ort / PLZ:",
    "Fläche (ca. m²):",
    "Gewünschte Leistung:",
    "",
    "Kurz zum Vorhaben:",
    "",
    "",
    "Viele Grüße",
  ].join(CRLF),
);

export interface QuoteRequest {
  name: string;
  place: string;
  area: string;
  service: string;
  message: string;
}

export function quoteRequestHref({ name, place, area, service, message }: QuoteRequest): string {
  const subject = ["Angebotsanfrage", service || "Parkett", place].filter(Boolean).join(" – ");
  const lines = [
    "Hallo Herr Sabouri,",
    "",
    "ich interessiere mich für ein Angebot.",
    "",
    `Name: ${name || "–"}`,
    `Ort / PLZ: ${place || "–"}`,
    `Fläche: ${area ? `ca. ${area} m²` : "–"}`,
    `Leistung: ${service || "–"}`,
    "",
    message ? message : "",
    "",
    "Viele Grüße",
    name,
  ];
  return mailtoHref(subject, lines.join(CRLF).trim());
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
