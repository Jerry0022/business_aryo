import { FLOOR_CHECK_STEPS, recommendFloors, type FloorCheckAnswers, type FloorRecommendation } from "@/lib/business/floor-check";
import { planByKey } from "@/lib/business/subscriptions";
import { formatNumber } from "./format";

// Turns the JSON payload of a website request into readable sections for the Werkbank.
// The payload comes from the public forms (src/lib/business/public-actions.ts) and is treated
// defensively: unknown or malformed values are shown as plain text instead of breaking the view.

export interface PayloadRow {
  label: string;
  value: string;
}

export interface PayloadSection {
  title: string;
  rows: PayloadRow[];
}

export interface LeadPayloadView {
  sections: PayloadSection[];
  recommendations: FloorRecommendation[];
  /** Useful prefills for follow-up records. */
  areaM2: number | null;
  company: string | null;
  isMasterBusiness: boolean;
  floorWish: string | null;
}

type Plain = Record<string, unknown>;

function isPlain(value: unknown): value is Plain {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "boolean") return value ? "ja" : "nein";
  if (typeof value === "number") return formatNumber(value);
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(", ");
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function area(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function rows(entries: [string, unknown][]): PayloadRow[] {
  return entries.map(([label, value]) => ({ label, value: text(value) })).filter((row) => row.value !== "");
}

const KNOWN_KEYS: Record<string, string[]> = {
  "boden-check": ["answers", "areaM2", "recommendations"],
  projekt: ["role", "areaM2", "floorWish", "timeframe"],
  partner: ["company", "trade", "region", "isMasterBusiness", "needs"],
  notfall: ["damage"],
  abo: ["plan", "company", "areaM2"],
};

export function describeLeadPayload(kind: string, payload: unknown): LeadPayloadView {
  const data = isPlain(payload) ? payload : {};
  const view: LeadPayloadView = {
    sections: [],
    recommendations: [],
    areaM2: area(data.areaM2),
    company: typeof data.company === "string" && data.company.trim() ? data.company.trim() : null,
    isMasterBusiness: data.isMasterBusiness === true,
    floorWish: typeof data.floorWish === "string" && data.floorWish.trim() ? data.floorWish.trim() : null,
  };
  const areaText = view.areaM2 !== null ? `${formatNumber(view.areaM2)} m²` : "";

  switch (kind) {
    case "boden-check": {
      const answers: FloorCheckAnswers = isPlain(data.answers) ? (data.answers as FloorCheckAnswers) : {};
      view.sections.push({
        title: "Antworten im Boden-Check",
        rows: FLOOR_CHECK_STEPS.map((step, index) => ({
          label: `${index + 1} · ${step.label}`,
          value: Array.isArray(answers[step.key]) && answers[step.key]!.length > 0 ? answers[step.key]!.join(", ") : "—",
        })),
      });
      if (areaText) view.sections.push({ title: "Fläche", rows: [{ label: "Geschätzte Fläche", value: areaText }] });
      const stored = Array.isArray(data.recommendations) ? data.recommendations.filter((item): item is string => typeof item === "string") : [];
      const computed = recommendFloors(answers);
      view.recommendations =
        stored.length > 0
          ? stored.map(
              (name) =>
                computed.find((item) => item.name === name) ?? { name, why: "", care: "", viaMasterPartner: false },
            )
          : computed;
      break;
    }
    case "projekt":
      view.sections.push({
        title: "Projekt",
        rows: rows([
          ["Rolle", data.role],
          ["Fläche", areaText],
          ["Bodenwunsch", data.floorWish],
          ["Zeitrahmen", data.timeframe],
        ]),
      });
      break;
    case "partner":
      view.sections.push({
        title: "Betrieb",
        rows: rows([
          ["Betrieb", data.company],
          ["Gewerk", data.trade],
          ["Region", data.region],
          ["Parkettleger-Meisterbetrieb", data.isMasterBusiness === true ? "ja" : data.isMasterBusiness === false ? "nein" : ""],
          ["Gewünschte Hilfe", Array.isArray(data.needs) && data.needs.length > 0 ? data.needs : "keine Angabe"],
        ]),
      });
      break;
    case "notfall":
      view.sections.push({ title: "Schaden", rows: rows([["Art des Schadens", data.damage]]) });
      break;
    case "abo": {
      const plan = typeof data.plan === "string" ? planByKey(data.plan)?.name ?? data.plan : "";
      view.sections.push({
        title: "Abo",
        rows: rows([
          ["Abo", plan],
          ["Firma", data.company],
          ["Fläche", areaText],
        ]),
      });
      break;
    }
  }

  const known = new Set(KNOWN_KEYS[kind] ?? []);
  const extra = rows(Object.entries(data).filter(([key]) => !known.has(key)));
  if (extra.length > 0) view.sections.push({ title: "Weitere Angaben", rows: extra });
  return view;
}
