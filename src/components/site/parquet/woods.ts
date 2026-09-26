/** Wood tones for generated parquet. `fills` are indexed by tone bucket (see TONE_BUCKETS). */
export interface WoodTone {
  label: string;
  note: string;
  fills: readonly [string, string, string, string, string, string];
  seam: string;
  grainDark: string;
  grainLight: string;
  knot: string;
  /** Representative colours for UI swatches (light → dark). */
  swatch: readonly [string, string];
}

export const WOODS = {
  "eiche-natur": {
    label: "Eiche natur",
    note: "warm, hell, zeitlos",
    fills: ["#c99a62", "#d6aa73", "#bd8b54", "#ddb683", "#b37f49", "#cfa06a"],
    seam: "#6b4526",
    grainDark: "#7a4a22",
    grainLight: "#f6dcb0",
    knot: "#5e3a1e",
    swatch: ["#ddb683", "#b37f49"],
  },
  "eiche-geraeuchert": {
    label: "Eiche geräuchert",
    note: "tief, ruhig, edel",
    fills: ["#7d5a3c", "#8b6647", "#6f4f34", "#977352", "#644530", "#826040"],
    seam: "#33220f",
    grainDark: "#3b2716",
    grainLight: "#b8926a",
    knot: "#2b1b0f",
    swatch: ["#977352", "#644530"],
  },
  nussbaum: {
    label: "Nussbaum",
    note: "dunkel, lebhaft, elegant",
    fills: ["#5f3f2b", "#6e4a33", "#553624", "#7a553c", "#4b2f20", "#664431"],
    seam: "#24160d",
    grainDark: "#2a190f",
    grainLight: "#a27b5c",
    knot: "#20130b",
    swatch: ["#7a553c", "#4b2f20"],
  },
  "esche-hell": {
    label: "Esche hell",
    note: "licht, frisch, skandinavisch",
    fills: ["#e6d6b8", "#ecdfc5", "#dfcca9", "#f2e8d3", "#d7c29e", "#e9d9bc"],
    seam: "#a68d68",
    grainDark: "#a0845b",
    grainLight: "#fffaf0",
    knot: "#94764e",
    swatch: ["#f2e8d3", "#d7c29e"],
  },
} as const satisfies Record<string, WoodTone>;

export type WoodId = keyof typeof WOODS;

export const WOOD_IDS = Object.keys(WOODS) as WoodId[];
