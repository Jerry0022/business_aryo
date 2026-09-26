import type { Pillar, PillarKey } from "./types";

/** The six Ratgeber pillars from the concept (chapter 12), in their fixed order. */
export const PILLARS: readonly Pillar[] = [
  {
    key: "was-kann-passieren",
    number: 1,
    label: "Was kann passieren?",
    lead: "Hund, Kinder, Rotwein, Bürostuhl, Wasser, Sonne: was ein Boden wegsteckt und was nicht.",
  },
  {
    key: "welcher-boden-wofuer",
    number: 2,
    label: "Welcher Boden wofür?",
    lead: "Raum für Raum und nach Lebenslage. Manchmal ist Holz die Antwort, manchmal nicht.",
  },
  {
    key: "raumklima",
    number: 3,
    label: "Boden und Raumklima",
    lead: "Nur was sich belegen lässt. Keine Gesundheitsversprechen.",
  },
  {
    key: "wert-und-geld",
    number: 4,
    label: "Wert und Geld",
    lead: "Lebensdauer, Abschleifen, Werterhalt: was ein Boden wirklich kostet.",
  },
  {
    key: "selbst-machen",
    number: 5,
    label: "Selbst machen",
    lead: "Anleitungen, Werkzeug und die Fehler, die ich am häufigsten sehe.",
  },
  {
    key: "werkstatt",
    number: 6,
    label: "Aus der Werkstatt",
    lead: "Holzarten, Oberflächen und Details, direkt von der Werkbank.",
  },
];

export function pillarByKey(key: PillarKey): Pillar {
  const pillar = PILLARS.find((item) => item.key === key);
  if (!pillar) throw new Error(`Unknown Ratgeber pillar: ${key}`);
  return pillar;
}
