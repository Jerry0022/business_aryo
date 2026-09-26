// Abo-Modell (concept chapter 9). Private customers get Boden-Pass Plus only together with a project;
// the main subscription business is commercial ("Rundum-sorglos").

export const SUBSCRIPTION_PLANS = [
  {
    key: "boden-pass-plus",
    serviceId: "abo-boden-pass-plus",
    name: "Boden-Pass Plus",
    audience: "Privat, zusammen mit deinem Projekt",
    pitch: "Wie die Heizungswartung, nur für deinen Boden.",
    private: true,
    status: "aktiv",
    /** Counts against the Abo-Plätze contingent (on-site visits). */
    usesSlot: true,
    features: [
      "Nachölen nach Plan, als halbtägiger Termin",
      "Ausbesserungen pro Jahr inklusive (kleine Dellen und Kratzer)",
      "Pflegeset passend zu deiner Oberfläche",
      "Vorrang im Notfall",
      "Erinnerungen über deinen Boden-Pass",
    ],
  },
  {
    key: "rundum-sorglos",
    serviceId: "abo-rundum-sorglos",
    name: "Rundum-sorglos",
    audience: "Hausverwaltungen, Vermieter, Büros, Praxen, Gastronomie, Läden, Ferienwohnungen",
    pitch: "Du kümmerst dich um dein Geschäft, ich mich um den Boden.",
    private: false,
    status: "aktiv",
    usesSlot: true,
    features: [
      "Pflege nach Plan, auch außerhalb deiner Öffnungszeiten",
      "Kontingent für Ausbesserungen",
      "Feste Reaktionszeit",
      "Zustandsprotokoll mit Fotos bei Mieterwechsel",
      "Reserve-Material aus derselben Charge",
      "Eine planbare Rate pro m² und Monat",
    ],
  },
  {
    key: "rueckendeckung",
    serviceId: "abo-rueckendeckung",
    name: "Rückendeckung",
    audience: "Selbermacher, solange ihr Projekt läuft",
    pitch: "Du verlegst. Ich zeig dir, wie.",
    private: true,
    status: "aktiv",
    usesSlot: false,
    features: [
      "Chat- und Video-Hilfe während deines Projekts",
      "Foto-Check des Untergrunds vor dem Verlegen",
      "Rabatt auf den Werkzeugverleih",
      "Monatlich kündbar",
    ],
  },
  {
    key: "werkstatt",
    serviceId: null,
    name: "Werkstatt-Mitgliedschaft",
    audience: "Handwerksbetriebe",
    pitch: "Werkzeug, Planung und Projekte für Partnerbetriebe.",
    private: false,
    status: "geplant",
    usesSlot: false,
    features: ["Werkzeug-Flatrate", "Planungshilfe", "Einweisung für Mitarbeiter", "Projektvermittlung"],
  },
] as const;

export type SubscriptionPlanKey = (typeof SUBSCRIPTION_PLANS)[number]["key"];

export function isSubscriptionPlanKey(value: string): value is SubscriptionPlanKey {
  return SUBSCRIPTION_PLANS.some((plan) => plan.key === value);
}

export function planByKey(key: string) {
  return SUBSCRIPTION_PLANS.find((plan) => plan.key === key);
}

/** Private subscriptions may run at most 24 months initially (§ 309 Nr. 9 BGB), then monthly. */
export const MAX_PRIVATE_MIN_TERM_MONTHS = 24;

export const SUBSCRIPTION_STATUSES = [
  { key: "aktiv", label: "Aktiv" },
  { key: "pausiert", label: "Pausiert" },
  { key: "gekuendigt", label: "Gekündigt" },
] as const;

/** Rough yearly on-site effort per slot-using subscription (oiling every 2 years + repairs + travel). */
export const HOURS_PER_SUBSCRIPTION_YEAR = 4.5;
