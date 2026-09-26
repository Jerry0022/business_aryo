import { z } from "zod";

// Boden-Check: 7 steps to a first recommendation (concept chapter 12). The result ("Bodenprofil")
// is honest on purpose: laminate and vinyl are recommended where they fit better than wood.

export interface FloorCheckStep {
  key: "raum" | "leben" | "stil" | "klima" | "bestand" | "wer" | "zeitplan";
  label: string;
  question: string;
  hint: string;
  options: readonly string[];
  /** Colour swatches shown next to the style options. */
  swatches?: readonly string[];
  multiple: boolean;
}

export const FLOOR_CHECK_STEPS: readonly FloorCheckStep[] = [
  {
    key: "raum",
    label: "Raum",
    question: "Welche Räume bekommen einen neuen Boden?",
    hint: "Mehrfachauswahl möglich. Die Fläche schätzen wir später gemeinsam.",
    options: ["Wohnzimmer", "Schlafzimmer", "Küche", "Flur", "Kinderzimmer", "Bad", "Arbeitszimmer"],
    multiple: true,
  },
  {
    key: "leben",
    label: "Leben",
    question: "Wer lebt auf dem Boden?",
    hint: "Ehrlich sein lohnt sich: Krallen, Bauklötze und Bürostühle verändern die Empfehlung.",
    options: ["Kinder", "Hund", "Katze", "Allergiker", "Bürostuhl", "Viel Besuch", "Nur Erwachsene"],
    multiple: true,
  },
  {
    key: "stil",
    label: "Stil",
    question: "Wie soll sich der Raum anfühlen?",
    hint: "Wähl, was dir spontan gefällt. Holzarten und Farbtöne suchen wir später aus.",
    options: ["Hell und nordisch", "Warm und natürlich", "Dunkel und edel", "Landhaus", "Klassisch mit Muster"],
    swatches: ["#E8D5B5", "#C99A5E", "#5A3E2B", "#B08A5B", "#A8743F"],
    multiple: true,
  },
  {
    key: "klima",
    label: "Klima",
    question: "Was muss der Boden aushalten?",
    hint: "Fußbodenheizung, Sonne und Feuchtigkeit entscheiden mit über Holzart und Aufbau.",
    options: ["Fußbodenheizung", "Viel Sonne", "Feuchte Räume", "Trittschall (Mehrfamilienhaus)", "Nichts Besonderes"],
    multiple: true,
  },
  {
    key: "bestand",
    label: "Bestand",
    question: "Was liegt heute drin?",
    hint: "Der Untergrund entscheidet, wie viel Vorarbeit nötig ist.",
    options: ["Teppich", "Fliesen", "Altes Parkett", "Laminat oder Vinyl", "Dielen", "Neuer Estrich", "Weiß ich nicht"],
    multiple: true,
  },
  {
    key: "wer",
    label: "Wer macht's",
    question: "Wie viel willst du selbst machen?",
    hint: "Alles ist möglich, vom Werkzeugverleih bis zur Vollleistung.",
    options: ["Machen lassen", "Selbst verlegen mit Einweisung", "Ganz selbst: Material und Werkzeug", "Ich bin Profi"],
    multiple: false,
  },
  {
    key: "zeitplan",
    label: "Zeitplan",
    question: "Wann soll es losgehen?",
    hint: "Mit deiner Postleitzahl sehe ich, ob du im Einzugsgebiet liegst.",
    options: ["So bald wie möglich", "In den nächsten 3 Monaten", "Später", "Erst mal informieren"],
    multiple: false,
  },
];

export type FloorCheckAnswers = Partial<Record<FloorCheckStep["key"], string[]>>;

const stepKeys = FLOOR_CHECK_STEPS.map((step) => step.key) as [FloorCheckStep["key"], ...FloorCheckStep["key"][]];

/** Validates answers against the known options; unknown options are dropped. */
export const floorCheckAnswersSchema = z
  .partialRecord(z.enum(stepKeys), z.array(z.string().max(80)).max(12))
  .transform((answers) => {
    const clean: FloorCheckAnswers = {};
    for (const step of FLOOR_CHECK_STEPS) {
      const picked = (answers[step.key] ?? []).filter((option) => step.options.includes(option));
      if (picked.length > 0) clean[step.key] = step.multiple ? picked : picked.slice(0, 1);
    }
    return clean;
  });

export interface FloorRecommendation {
  name: string;
  why: string;
  care: string;
  /** Needs the Meister partner (glued solid parquet / patterns). */
  viaMasterPartner: boolean;
}

const FILLERS: readonly FloorRecommendation[] = [
  {
    name: "Eiche Landhausdiele, natur geölt",
    why: "Der Allrounder: warm, robust und mehrfach abschleifbar.",
    care: "Pflege: alle 2 Jahre nachölen.",
    viaMasterPartner: false,
  },
  {
    name: "Laminat in Holzoptik",
    why: "Günstig und schnell verlegt, gut für Mietwohnungen. Kein Naturmaterial, das sag ich dir ehrlich.",
    care: "Pflege: nebelfeucht wischen.",
    viaMasterPartner: false,
  },
  {
    name: "Esche hell, lackiert",
    why: "Hell und ruhig. Lack schützt vor Flecken, lässt sich aber schlechter punktuell ausbessern.",
    care: "Pflege: nebelfeucht wischen.",
    viaMasterPartner: false,
  },
];

/** Three recommendations, most specific first. */
export function recommendFloors(answers: FloorCheckAnswers): FloorRecommendation[] {
  const all = Object.values(answers).flat();
  const has = (option: string) => all.includes(option);
  const list: FloorRecommendation[] = [];

  if (has("Bad") || has("Feuchte Räume")) {
    list.push({
      name: "Vinyl mit Klicksystem",
      why: "Wasserfest und robust. Für Bad und Küche oft die ehrlichere Wahl als Holz.",
      care: "Pflege: feucht wischen, fertig.",
      viaMasterPartner: false,
    });
  }
  if (has("Hund") || has("Katze") || has("Kinder")) {
    list.push({
      name: "Eiche Landhausdiele, gebürstet und geölt",
      why: "Gebürstete Oberflächen verzeihen Kratzer. Geölte Stellen lassen sich punktuell ausbessern.",
      care: "Pflege: alle 2 Jahre nachölen.",
      viaMasterPartner: false,
    });
  }
  if (has("Klassisch mit Muster")) {
    list.push({
      name: "Fischgrät-Parkett",
      why: "Zeitlos und wertsteigernd. Ich plane und liefere, verlegt wird von meinem Meisterpartner.",
      care: "Pflege: je nach Oberfläche.",
      viaMasterPartner: true,
    });
  }
  if (has("Fußbodenheizung")) {
    list.push({
      name: "Mehrschicht-Parkett für Fußbodenheizung",
      why: "Leitet Wärme gut und arbeitet weniger als Massivholz.",
      care: "Pflege: Luftfeuchte zwischen 40 und 60 % halten.",
      viaMasterPartner: false,
    });
  }
  if (has("Dunkel und edel") && list.length < 3) {
    list.push({
      name: "Eiche geräuchert, geölt",
      why: "Tiefer, warmer Ton ohne Tropenholz. Staub und helle Krümel sieht man darauf allerdings schneller.",
      care: "Pflege: alle 2 Jahre nachölen.",
      viaMasterPartner: false,
    });
  }
  for (const filler of FILLERS) {
    if (list.length >= 3) break;
    if (!list.some((item) => item.name === filler.name)) list.push(filler);
  }
  return list.slice(0, 3);
}

export const RECOMMENDATION_TAGS = ["Passt am besten", "Gute Alternative", "Auch möglich"] as const;
