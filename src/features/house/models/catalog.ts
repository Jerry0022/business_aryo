import { box, cyl, lathe, type Part, slot, sphere, torus } from "./builder";
import type { MaterialKey, MaterialSlot } from "./materials";
import { createFoliageGeometry, createPalmCrownGeometry, createPalmTrunkGeometry } from "./vegetation";

// Every model is generated from primitives. Local frame: origin on the floor at the footprint
// center, +y up, the model's front faces -z. Dimensions are meters.

export interface ModelDefinition {
  /** Footprint [width (x), depth (z)] used for collisions and layout checks. */
  footprint: [number, number];
  height: number;
  /** Blocks the walker in first-person mode. */
  solid: boolean;
  castShadow?: boolean;
  slots?: Partial<Record<MaterialSlot, MaterialKey>>;
  parts: () => Part[];
}

const DEFAULT_SLOTS: Record<MaterialSlot, MaterialKey> = {
  fabric: "fabricLinen",
  wood: "oak",
  metal: "frame",
  accent: "fabricTerracotta",
  stone: "travertine",
  cushion: "fabricCream",
};

const HALF_PI = Math.PI / 2;

// ---- reusable sub-assemblies ------------------------------------------------------------

function legs4(w: number, d: number, h: number, r: number, mat: Part["mat"], inset = 0.06): Part[] {
  const x = w / 2 - inset;
  const z = d / 2 - inset;
  return [
    [x, z],
    [-x, z],
    [x, -z],
    [-x, -z],
  ].map(([lx, lz]) => cyl(r, h, [lx!, h / 2, lz!], mat, { segments: 10 }));
}

function books(x0: number, y: number, z: number, width: number, seed: number): Part[] {
  const colors: MaterialKey[] = ["bookRed", "bookBlue", "bookSand", "fabricCharcoal", "fabricCream"];
  const parts: Part[] = [];
  let x = x0;
  let i = seed;
  while (x < x0 + width - 0.04) {
    const w = 0.025 + ((i * 37) % 5) * 0.006;
    const h = 0.2 + ((i * 53) % 7) * 0.012;
    parts.push(box([w, h, 0.18], [x + w / 2, y + h / 2, z], colors[i % colors.length]!));
    x += w + 0.002;
    i++;
    if (i % 9 === 0) x += 0.12;
  }
  return parts;
}

function potWithSoil(radius: number, height: number, mat: MaterialKey = "planter"): Part[] {
  return [
    cyl(radius, height, [0, height / 2, 0], mat, { radiusTop: radius * 1.08, segments: 20 }),
    cyl(radius * 0.98, 0.02, [0, height - 0.03, 0], "soil", { segments: 20 }),
  ];
}

// ---- catalog ------------------------------------------------------------------------------

export const CATALOG = {
  sofaL: {
    footprint: [3.2, 2.2],
    height: 0.85,
    solid: true,
    slots: { fabric: "fabricSand", accent: "fabricTerracotta" },
    parts: () => [
      box([3.1, 0.06, 0.9], [0, 0.03, 0.6], "blackWood"),
      box([0.9, 0.06, 1.1], [-1.1, 0.03, -0.45], "blackWood"),
      box([3.2, 0.3, 1.0], [0, 0.21, 0.6], slot("fabric"), { round: 0.05 }),
      box([1.0, 0.3, 1.2], [-1.1, 0.21, -0.5], slot("fabric"), { round: 0.05 }),
      box([0.98, 0.15, 1.9], [-1.1, 0.43, -0.12], slot("fabric"), { round: 0.07 }),
      box([0.99, 0.15, 0.76], [-0.1, 0.43, 0.46], slot("fabric"), { round: 0.07 }),
      box([0.99, 0.15, 0.76], [0.9, 0.43, 0.46], slot("fabric"), { round: 0.07 }),
      box([0.2, 0.62, 1.0], [1.5, 0.31, 0.6], slot("fabric"), { round: 0.06 }),
      box([1.0, 0.46, 0.22], [-1.1, 0.64, 0.97], slot("fabric"), { round: 0.08, rot: [-0.12, 0, 0] }),
      box([1.0, 0.46, 0.22], [-0.1, 0.64, 0.97], slot("fabric"), { round: 0.08, rot: [-0.12, 0, 0] }),
      box([1.0, 0.46, 0.22], [0.9, 0.64, 0.97], slot("fabric"), { round: 0.08, rot: [-0.12, 0, 0] }),
      box([0.42, 0.4, 0.14], [-0.55, 0.66, 0.8], slot("accent"), { round: 0.06, rot: [-0.25, 0.3, 0.1] }),
      box([0.42, 0.4, 0.14], [1.1, 0.66, 0.8], slot("accent"), { round: 0.06, rot: [-0.25, -0.3, -0.1] }),
    ],
  },
  sofa: {
    footprint: [2.4, 1.0],
    height: 0.82,
    solid: true,
    slots: { fabric: "fabricLinen", accent: "fabricSage" },
    parts: () => [
      box([2.3, 0.05, 0.85], [0, 0.025, 0], "blackWood"),
      box([2.4, 0.3, 1.0], [0, 0.2, 0], slot("fabric"), { round: 0.05 }),
      box([1.0, 0.15, 0.75], [-0.5, 0.42, -0.08], slot("fabric"), { round: 0.07 }),
      box([1.0, 0.15, 0.75], [0.5, 0.42, -0.08], slot("fabric"), { round: 0.07 }),
      box([2.4, 0.45, 0.22], [0, 0.6, 0.39], slot("fabric"), { round: 0.08 }),
      box([0.2, 0.55, 1.0], [-1.1, 0.3, 0], slot("fabric"), { round: 0.06 }),
      box([0.2, 0.55, 1.0], [1.1, 0.3, 0], slot("fabric"), { round: 0.06 }),
      box([0.4, 0.38, 0.13], [-0.7, 0.62, 0.22], slot("accent"), { round: 0.06, rot: [-0.25, 0.2, 0] }),
    ],
  },
  armchair: {
    footprint: [0.85, 0.85],
    height: 0.8,
    solid: true,
    slots: { fabric: "leatherCognac", wood: "walnut" },
    parts: () => [
      ...legs4(0.75, 0.75, 0.18, 0.02, slot("wood")),
      box([0.8, 0.14, 0.78], [0, 0.25, 0], slot("wood"), { round: 0.03 }),
      box([0.68, 0.14, 0.62], [0, 0.39, -0.05], slot("fabric"), { round: 0.06 }),
      box([0.72, 0.46, 0.16], [0, 0.6, 0.3], slot("fabric"), { round: 0.07, rot: [-0.2, 0, 0] }),
      box([0.08, 0.26, 0.7], [-0.38, 0.45, 0], slot("wood"), { round: 0.03 }),
      box([0.08, 0.26, 0.7], [0.38, 0.45, 0], slot("wood"), { round: 0.03 }),
    ],
  },
  loungeChair: {
    footprint: [0.85, 0.95],
    height: 0.85,
    solid: true,
    slots: { fabric: "leatherBlack", wood: "walnut" },
    parts: () => [
      cyl(0.03, 0.22, [0, 0.11, 0.05], "frame", { segments: 10 }),
      box([0.6, 0.02, 0.05], [0, 0.02, 0.05], "frame", { rot: [0, 0.5, 0] }),
      box([0.6, 0.02, 0.05], [0, 0.02, 0.05], "frame", { rot: [0, -0.5, 0] }),
      box([0.78, 0.08, 0.7], [0, 0.3, -0.05], slot("wood"), { round: 0.03, rot: [0.1, 0, 0] }),
      box([0.7, 0.1, 0.62], [0, 0.37, -0.06], slot("fabric"), { round: 0.05, rot: [0.1, 0, 0] }),
      box([0.78, 0.6, 0.08], [0, 0.62, 0.32], slot("wood"), { round: 0.03, rot: [-0.35, 0, 0] }),
      box([0.7, 0.54, 0.1], [0, 0.63, 0.27], slot("fabric"), { round: 0.05, rot: [-0.35, 0, 0] }),
    ],
  },
  pouf: {
    footprint: [0.55, 0.55],
    height: 0.42,
    solid: false,
    slots: { fabric: "fabricTerracotta" },
    parts: () => [cyl(0.27, 0.4, [0, 0.2, 0], slot("fabric"), { radiusTop: 0.25 }), torus(0.24, 0.03, [0, 0.4, 0], slot("fabric"), { rot: [HALF_PI, 0, 0] })],
  },
  coffeeTable: {
    footprint: [1.3, 0.75],
    height: 0.36,
    solid: false,
    slots: { stone: "travertine" },
    parts: () => [
      box([1.3, 0.08, 0.75], [0, 0.32, 0], slot("stone"), { round: 0.02 }),
      box([0.9, 0.28, 0.42], [0, 0.14, 0], slot("stone"), { round: 0.01 }),
      cyl(0.07, 0.2, [0.35, 0.46, 0.1], "ceramic", { radiusTop: 0.04 }),
      box([0.28, 0.03, 0.2], [-0.3, 0.375, -0.05], "bookSand"),
      box([0.24, 0.03, 0.18], [-0.3, 0.405, -0.05], "bookBlue", { rot: [0, 0.2, 0] }),
    ],
  },
  sideTable: {
    footprint: [0.45, 0.45],
    height: 0.52,
    solid: false,
    slots: { wood: "walnut", metal: "brass" },
    parts: () => [
      cyl(0.22, 0.03, [0, 0.52, 0], slot("wood")),
      cyl(0.025, 0.5, [0, 0.26, 0], slot("metal"), { segments: 10 }),
      cyl(0.16, 0.02, [0, 0.01, 0], slot("metal")),
    ],
  },
  rugLarge: {
    footprint: [3.4, 2.5],
    height: 0.015,
    solid: false,
    castShadow: false,
    slots: { fabric: "rugWool" },
    parts: () => [box([3.4, 0.014, 2.5], [0, 0.021, 0], slot("fabric"), { round: 0.005 })],
  },
  rugMedium: {
    footprint: [2.4, 1.7],
    height: 0.015,
    solid: false,
    castShadow: false,
    slots: { fabric: "rugWool" },
    parts: () => [box([2.4, 0.014, 1.7], [0, 0.021, 0], slot("fabric"), { round: 0.005 })],
  },
  runner: {
    footprint: [3.2, 0.9],
    height: 0.015,
    solid: false,
    castShadow: false,
    slots: { fabric: "rugDark" },
    parts: () => [box([3.2, 0.014, 0.9], [0, 0.021, 0], slot("fabric"), { round: 0.005 })],
  },
  fireplace: {
    footprint: [2.6, 0.5],
    height: 1.1,
    solid: true,
    parts: () => [
      box([2.6, 1.1, 0.5], [0, 0.55, 0], "concreteDark"),
      box([1.7, 0.32, 0.3], [0, 0.42, -0.12], "blackLacquer"),
      box([1.6, 0.12, 0.18], [0, 0.34, -0.12], "fire"),
      box([1.7, 0.32, 0.01], [0, 0.42, -0.27], "glass"),
      box([2.7, 0.06, 0.56], [0, 1.13, 0], "travertine"),
    ],
  },
  tvWall: {
    footprint: [1.65, 0.06],
    height: 0.95,
    solid: false,
    parts: () => [box([1.65, 0.95, 0.04], [0, 0.475, 0], "screen"), box([1.67, 0.97, 0.03], [0, 0.475, 0.02], "blackLacquer")],
  },
  floorLamp: {
    footprint: [0.4, 0.4],
    height: 2.1,
    solid: false,
    slots: { metal: "brass" },
    parts: () => [
      cyl(0.18, 0.05, [0, 0.025, 0], "marbleDark"),
      cyl(0.015, 1.5, [0, 0.8, 0], slot("metal"), { segments: 8 }),
      torus(0.6, 0.015, [0, 1.55, -0.6], slot("metal"), { rot: [0, HALF_PI, 0], arc: Math.PI / 2 }),
      lathe(
        [
          [0.01, 0],
          [0.2, 0.02],
          [0.22, 0.14],
          [0.2, 0.16],
        ],
        [0, 1.95, -0.62],
        "lampShade",
        { rot: [Math.PI, 0, 0] },
      ),
      sphere(0.06, [0, 1.93, -0.62], "lampGlow"),
    ],
  },
  tableLamp: {
    footprint: [0.3, 0.3],
    height: 0.55,
    solid: false,
    parts: () => [
      lathe(
        [
          [0, 0],
          [0.1, 0.01],
          [0.12, 0.12],
          [0.05, 0.28],
          [0.02, 0.3],
        ],
        [0, 0, 0],
        "ceramic",
      ),
      cyl(0.16, 0.2, [0, 0.4, 0], "lampShade", { radiusTop: 0.13 }),
      sphere(0.04, [0, 0.36, 0], "lampGlow"),
    ],
  },
  pendantLamp: {
    footprint: [0.5, 0.5],
    height: 0.1,
    solid: false,
    castShadow: false,
    slots: { metal: "brass" },
    parts: () => [
      cyl(0.006, 1.0, [0, 2.5, 0], "frame", { segments: 6 }),
      lathe(
        [
          [0.02, 0.2],
          [0.08, 0.19],
          [0.2, 0.08],
          [0.26, 0],
        ],
        [0, 1.8, 0],
        slot("metal"),
      ),
      sphere(0.07, [0, 1.84, 0], "lampGlow"),
      cyl(0.06, 0.02, [0, 2.99, 0], slot("metal")),
    ],
  },
  linearPendant: {
    footprint: [1.8, 0.1],
    height: 0.1,
    solid: false,
    castShadow: false,
    parts: () => [
      cyl(0.004, 1.2, [-0.7, 2.4, 0], "frame", { segments: 6 }),
      cyl(0.004, 1.2, [0.7, 2.4, 0], "frame", { segments: 6 }),
      box([1.8, 0.05, 0.07], [0, 1.78, 0], "frame"),
      box([1.74, 0.012, 0.05], [0, 1.752, 0], "lampGlow"),
    ],
  },
  sideboard: {
    footprint: [2.2, 0.48],
    height: 0.75,
    solid: true,
    slots: { wood: "walnut" },
    parts: () => [
      ...legs4(2.1, 0.4, 0.14, 0.02, "frame"),
      box([2.2, 0.6, 0.48], [0, 0.44, 0], slot("wood"), { round: 0.01 }),
      box([0.005, 0.5, 0.01], [-0.55, 0.44, -0.24], "blackLacquer"),
      box([0.005, 0.5, 0.01], [0, 0.44, -0.24], "blackLacquer"),
      box([0.005, 0.5, 0.01], [0.55, 0.44, -0.24], "blackLacquer"),
      lathe(
        [
          [0, 0],
          [0.08, 0.02],
          [0.1, 0.18],
          [0.04, 0.34],
          [0.05, 0.38],
        ],
        [-0.7, 0.74, 0],
        "terracotta",
      ),
      sphere(0.09, [0.6, 0.83, 0.02], "ceramic", { scale: [1, 1, 1] }),
    ],
  },
  plantLarge: {
    footprint: [0.7, 0.7],
    height: 2.0,
    solid: true,
    parts: () => [
      ...potWithSoil(0.28, 0.5, "terracotta"),
      cyl(0.03, 1.2, [0, 1.0, 0], "bark", { radiusTop: 0.02 }),
      { kind: "geometry", geometry: createFoliageGeometry(4, 0.45), at: [0.05, 1.55, 0], mat: "leaf" },
      { kind: "geometry", geometry: createFoliageGeometry(5, 0.35), at: [-0.2, 1.25, 0.1], mat: "leafDark" },
      { kind: "geometry", geometry: createFoliageGeometry(6, 0.3), at: [0.2, 1.85, -0.1], mat: "leaf" },
    ],
  },
  plantOlive: {
    footprint: [0.6, 0.6],
    height: 1.7,
    solid: true,
    parts: () => [
      ...potWithSoil(0.26, 0.45),
      cyl(0.04, 0.9, [0, 0.9, 0], "bark", { radiusTop: 0.03, rot: [0, 0, 0.1] }),
      { kind: "geometry", geometry: createFoliageGeometry(8, 0.42), at: [-0.05, 1.45, 0], mat: "fabricSage" },
      { kind: "geometry", geometry: createFoliageGeometry(9, 0.3), at: [0.2, 1.3, 0.1], mat: "fabricSage" },
    ],
  },
  artwork: {
    footprint: [1.2, 0.05],
    height: 0.9,
    solid: false,
    castShadow: false,
    slots: { accent: "fabricTerracotta" },
    parts: () => [
      box([1.2, 0.9, 0.04], [0, 0.45, 0.02], "blackWood"),
      box([1.1, 0.8, 0.01], [0, 0.45, -0.005], "fabricCream"),
      sphere(0.26, [-0.12, 0.5, -0.01], slot("accent"), { scale: [1, 1, 0.02] }),
      box([0.5, 0.06, 0.01], [0.2, 0.3, -0.012], "fabricNavy"),
    ],
  },
  kitchenRun: {
    footprint: [3.6, 0.65],
    height: 0.92,
    solid: true,
    slots: { wood: "greigeLacquer", stone: "marble" },
    parts: () => [
      box([3.6, 0.1, 0.55], [0, 0.05, 0.03], "blackLacquer"),
      box([3.6, 0.78, 0.62], [0, 0.49, 0], slot("wood")),
      box([3.62, 0.04, 0.66], [0, 0.9, 0], slot("stone")),
      box([0.6, 0.02, 0.4], [-0.6, 0.915, 0], "steel"),
      box([0.5, 0.15, 0.36], [-0.6, 0.84, 0], "steel"),
      cyl(0.015, 0.3, [-0.6, 1.07, 0.22], "chrome", { segments: 8 }),
      torus(0.1, 0.012, [-0.6, 1.2, 0.12], "chrome", { rot: [0, HALF_PI, 0], arc: Math.PI }),
      box([0.8, 0.01, 0.52], [0.8, 0.925, 0], "blackLacquer"),
      ...[-1.2, -0.6, 0, 0.6, 1.2].map((x) => box([0.004, 0.72, 0.005], [x, 0.49, -0.312], "blackLacquer")),
    ],
  },
  kitchenTall: {
    footprint: [1.3, 0.65],
    height: 2.5,
    solid: true,
    slots: { wood: "greigeLacquer" },
    parts: () => [
      box([1.3, 2.5, 0.64], [0, 1.25, 0], slot("wood")),
      box([0.56, 0.56, 0.02], [0.3, 1.2, -0.325], "blackLacquer"),
      box([0.52, 0.1, 0.02], [0.3, 1.56, -0.326], "screen"),
      box([0.004, 2.4, 0.005], [0, 1.25, -0.322], "blackLacquer"),
      box([0.02, 0.9, 0.03], [-0.06, 1.2, -0.34], "steel"),
    ],
  },
  kitchenIsland: {
    footprint: [2.6, 1.0],
    height: 0.94,
    solid: true,
    slots: { stone: "marble", wood: "walnut" },
    parts: () => [
      box([2.3, 0.86, 0.9], [0.1, 0.43, 0], slot("wood")),
      box([2.6, 0.05, 1.0], [0, 0.915, 0], slot("stone")),
      box([0.05, 0.9, 1.0], [-1.275, 0.45, 0], slot("stone")),
      box([0.05, 0.9, 1.0], [1.275, 0.45, 0], slot("stone")),
      box([0.34, 0.24, 0.34], [0.6, 1.06, 0.2], "ceramic", { round: 0.1 }),
      sphere(0.06, [0.52, 1.0, -0.2], "fabricTerracotta"),
      sphere(0.055, [0.66, 1.0, -0.26], "fabricSage"),
    ],
  },
  barStool: {
    footprint: [0.45, 0.45],
    height: 0.75,
    solid: false,
    slots: { fabric: "leatherCognac" },
    parts: () => [
      cyl(0.2, 0.08, [0, 0.72, 0], slot("fabric"), { radiusTop: 0.19 }),
      cyl(0.025, 0.66, [0, 0.36, 0], "frame", { segments: 10 }),
      torus(0.14, 0.012, [0, 0.28, 0], "frame", { rot: [HALF_PI, 0, 0] }),
      cyl(0.19, 0.02, [0, 0.01, 0], "frame"),
    ],
  },
  diningTable: {
    footprint: [2.6, 1.05],
    height: 0.76,
    solid: true,
    slots: { wood: "oak" },
    parts: () => [
      box([2.6, 0.05, 1.05], [0, 0.735, 0], slot("wood"), { round: 0.012 }),
      box([0.08, 0.71, 0.8], [-1.0, 0.355, 0], slot("wood")),
      box([0.08, 0.71, 0.8], [1.0, 0.355, 0], slot("wood")),
      box([2.0, 0.06, 0.06], [0, 0.25, 0], slot("wood")),
      lathe(
        [
          [0, 0],
          [0.12, 0.01],
          [0.16, 0.08],
          [0.1, 0.16],
        ],
        [0.3, 0.76, 0],
        "ceramic",
      ),
    ],
  },
  diningChair: {
    footprint: [0.5, 0.52],
    height: 0.82,
    solid: false,
    slots: { fabric: "fabricCream", wood: "oak" },
    parts: () => [
      ...legs4(0.44, 0.44, 0.45, 0.018, slot("wood"), 0.04),
      box([0.48, 0.06, 0.48], [0, 0.47, 0], slot("fabric"), { round: 0.025 }),
      box([0.46, 0.34, 0.05], [0, 0.72, 0.23], slot("fabric"), { round: 0.025, rot: [-0.08, 0, 0] }),
    ],
  },
  bed: {
    footprint: [2.0, 2.25],
    height: 1.2,
    solid: true,
    slots: { fabric: "fabricSand", cushion: "fabricCream", accent: "fabricSage" },
    parts: () => [
      box([1.95, 0.08, 2.1], [0, 0.04, -0.05], "blackWood"),
      box([2.0, 0.3, 2.15], [0, 0.23, -0.05], slot("fabric"), { round: 0.04 }),
      box([1.85, 0.22, 2.0], [0, 0.48, -0.08], "fabricCream", { round: 0.06 }),
      box([1.9, 0.08, 1.35], [0, 0.61, -0.38], slot("cushion"), { round: 0.04 }),
      box([1.92, 0.05, 0.55], [0, 0.63, -0.85], slot("accent"), { round: 0.02 }),
      box([0.75, 0.16, 0.42], [-0.45, 0.66, 0.68], "fabricCream", { round: 0.07, rot: [-0.3, 0, 0] }),
      box([0.75, 0.16, 0.42], [0.45, 0.66, 0.68], "fabricCream", { round: 0.07, rot: [-0.3, 0, 0] }),
      box([2.2, 1.2, 0.12], [0, 0.6, 1.06], slot("fabric"), { round: 0.05 }),
    ],
  },
  nightstand: {
    footprint: [0.5, 0.4],
    height: 0.48,
    solid: false,
    slots: { wood: "walnut" },
    parts: () => [
      box([0.5, 0.36, 0.4], [0, 0.3, 0], slot("wood"), { round: 0.01 }),
      box([0.3, 0.012, 0.01], [0, 0.34, -0.2], "brass"),
      ...legs4(0.44, 0.34, 0.12, 0.012, "brass", 0.03),
    ],
  },
  wardrobe: {
    footprint: [2.8, 0.62],
    height: 2.55,
    solid: true,
    slots: { wood: "greigeLacquer" },
    parts: () => [
      box([2.8, 2.5, 0.6], [0, 1.25, 0], slot("wood")),
      ...[-0.7, 0, 0.7].map((x) => box([0.004, 2.4, 0.005], [x, 1.25, -0.302], "blackLacquer")),
      ...[-1.05, -0.35, 0.35, 1.05].map((x) => box([0.02, 0.5, 0.03], [x + (x < 0 ? 0.3 : -0.3), 1.2, -0.32], "brass")),
    ],
  },
  bench: {
    footprint: [1.5, 0.42],
    height: 0.46,
    solid: false,
    slots: { wood: "oak", fabric: "fabricCharcoal" },
    parts: () => [
      box([1.5, 0.05, 0.42], [0, 0.4, 0], slot("wood")),
      box([1.44, 0.06, 0.38], [0, 0.455, 0], slot("fabric"), { round: 0.02 }),
      box([0.05, 0.38, 0.38], [-0.68, 0.19, 0], slot("wood")),
      box([0.05, 0.38, 0.38], [0.68, 0.19, 0], slot("wood")),
    ],
  },
  dresser: {
    footprint: [1.4, 0.5],
    height: 0.82,
    solid: true,
    slots: { wood: "oak" },
    parts: () => [
      box([1.4, 0.72, 0.5], [0, 0.46, 0], slot("wood")),
      ...legs4(1.3, 0.42, 0.1, 0.015, "frame", 0.04),
      ...[0.3, 0.52, 0.74].map((y) => box([1.36, 0.004, 0.005], [0, y, -0.25], "blackLacquer")),
      lathe(
        [
          [0, 0],
          [0.06, 0.01],
          [0.08, 0.22],
          [0.03, 0.3],
        ],
        [0.4, 0.82, 0],
        "ceramic",
      ),
    ],
  },
  bathtub: {
    footprint: [1.75, 0.82],
    height: 0.6,
    solid: true,
    parts: () => [
      lathe(
        [
          [0, 0],
          [0.38, 0.0],
          [0.43, 0.3],
          [0.45, 0.58],
          [0.42, 0.6],
          [0.38, 0.12],
          [0, 0.12],
        ],
        [0, 0, 0],
        "ceramic",
        { segments: 40, scale: [1.92, 1, 0.9] },
      ),
      cyl(0.02, 0.9, [0.95, 0.45, 0.2], "chrome", { segments: 8 }),
      torus(0.12, 0.015, [0.83, 0.9, 0.2], "chrome", { rot: [HALF_PI, 0, HALF_PI], arc: Math.PI / 2 }),
    ],
  },
  walkInShower: {
    footprint: [1.4, 1.1],
    height: 2.1,
    solid: false,
    parts: () => [
      box([1.4, 0.03, 1.1], [0, 0.015, 0], "floorStone"),
      box([0.01, 2.0, 1.1], [-0.7, 1.03, 0], "glass"),
      box([0.02, 0.02, 1.1], [-0.7, 2.03, 0], "frame"),
      cyl(0.015, 1.1, [0.5, 1.6, 0.52], "frame", { segments: 8 }),
      cyl(0.13, 0.02, [0.5, 2.15, 0.3], "frame", { rot: [0, 0, 0] }),
      box([0.02, 0.02, 0.25], [0.5, 2.15, 0.42], "frame"),
    ],
  },
  vanity: {
    footprint: [1.8, 0.52],
    height: 0.9,
    solid: true,
    slots: { wood: "walnut", stone: "marble" },
    parts: () => [
      box([1.8, 0.45, 0.5], [0, 0.6, 0], slot("wood")),
      box([1.82, 0.04, 0.52], [0, 0.845, 0], slot("stone")),
      ...[-0.45, 0.45].flatMap((x) => [
        lathe(
          [
            [0, 0],
            [0.18, 0.01],
            [0.2, 0.12],
          ],
          [x, 0.865, -0.02],
          "ceramic",
        ),
        cyl(0.012, 0.28, [x, 1.0, 0.2], "frame", { segments: 8 }),
        box([0.02, 0.02, 0.14], [x, 1.13, 0.14], "frame"),
      ]),
    ],
  },
  mirrorRound: {
    footprint: [0.8, 0.04],
    height: 0.8,
    solid: false,
    castShadow: false,
    parts: () => [cyl(0.4, 0.02, [0, 0.4, 0], "mirror", { rot: [HALF_PI, 0, 0], segments: 40 }), torus(0.4, 0.012, [0, 0.4, 0], "brass")],
  },
  toilet: {
    footprint: [0.4, 0.55],
    height: 0.42,
    solid: false,
    parts: () => [
      box([0.38, 0.32, 0.52], [0, 0.26, -0.02], "ceramic", { round: 0.12 }),
      box([0.36, 0.03, 0.48], [0, 0.435, -0.03], "ceramic", { round: 0.012 }),
      box([0.2, 0.14, 0.02], [0, 1.0, 0.26], "steel"),
    ],
  },
  towelLadder: {
    footprint: [0.5, 0.1],
    height: 1.7,
    solid: false,
    slots: { wood: "teak", fabric: "fabricCream" },
    parts: () => [
      box([0.04, 1.75, 0.03], [-0.22, 0.85, 0.05], slot("wood"), { rot: [-0.12, 0, 0] }),
      box([0.04, 1.75, 0.03], [0.22, 0.85, 0.05], slot("wood"), { rot: [-0.12, 0, 0] }),
      ...[0.4, 0.8, 1.2].map((y) => box([0.44, 0.025, 0.025], [0, y, 0.05 - y * 0.12 + 0.1], slot("wood"))),
      box([0.36, 0.5, 0.03], [0, 0.95, 0.0], slot("fabric"), { round: 0.01 }),
    ],
  },
  desk: {
    footprint: [1.8, 0.8],
    height: 0.75,
    solid: true,
    slots: { wood: "oak" },
    parts: () => [
      box([1.8, 0.035, 0.8], [0, 0.735, 0], slot("wood"), { round: 0.01 }),
      box([0.04, 0.72, 0.7], [-0.85, 0.36, 0], "frame"),
      box([0.04, 0.72, 0.7], [0.85, 0.36, 0], "frame"),
      box([1.66, 0.04, 0.03], [0, 0.65, 0.3], "frame"),
    ],
  },
  officeChair: {
    footprint: [0.65, 0.65],
    height: 1.05,
    solid: false,
    slots: { fabric: "fabricCharcoal" },
    parts: () => [
      ...[0, 1, 2, 3, 4].map((i) => {
        const angle = (i * Math.PI * 2) / 5;
        return box([0.05, 0.03, 0.34], [Math.sin(angle) * 0.17, 0.06, Math.cos(angle) * 0.17], "frame", { rot: [0, angle, 0] });
      }),
      cyl(0.03, 0.35, [0, 0.25, 0], "chrome", { segments: 10 }),
      box([0.52, 0.08, 0.5], [0, 0.46, 0], slot("fabric"), { round: 0.035 }),
      box([0.5, 0.55, 0.06], [0, 0.82, 0.26], slot("fabric"), { round: 0.03, rot: [-0.1, 0, 0] }),
    ],
  },
  monitor: {
    footprint: [0.7, 0.22],
    height: 0.5,
    solid: false,
    parts: () => [
      box([0.7, 0.4, 0.025], [0, 0.34, 0], "screen"),
      box([0.72, 0.42, 0.02], [0, 0.34, 0.02], "blackLacquer"),
      cyl(0.02, 0.16, [0, 0.08, 0.06], "steel", { segments: 8 }),
      box([0.24, 0.01, 0.18], [0, 0.005, 0.05], "steel"),
      box([0.44, 0.015, 0.14], [0, 0.008, -0.2], "fabricCream", { round: 0.005 }),
    ],
  },
  deskLamp: {
    footprint: [0.2, 0.2],
    height: 0.45,
    solid: false,
    parts: () => [
      cyl(0.08, 0.02, [0, 0.01, 0], "frame"),
      cyl(0.01, 0.4, [0, 0.2, 0], "frame", { segments: 6, rot: [0.2, 0, 0] }),
      cyl(0.05, 0.1, [0, 0.4, -0.08], "frame", { radiusTop: 0.02, rot: [0.9, 0, 0] }),
      sphere(0.025, [0, 0.37, -0.11], "lampGlow"),
    ],
  },
  bookshelf: {
    footprint: [2.0, 0.38],
    height: 2.2,
    solid: true,
    slots: { wood: "walnut" },
    parts: () => [
      box([0.03, 2.2, 0.36], [-1.0, 1.1, 0], slot("wood")),
      box([0.03, 2.2, 0.36], [1.0, 1.1, 0], slot("wood")),
      box([0.03, 2.2, 0.36], [0, 1.1, 0], slot("wood")),
      ...[0.02, 0.55, 1.1, 1.65, 2.18].map((y) => box([2.03, 0.03, 0.36], [0, y, 0], slot("wood"))),
      ...books(-0.97, 0.035, 0, 0.9, 1),
      ...books(0.05, 0.565, 0, 0.8, 7),
      ...books(-0.97, 1.115, 0, 0.6, 13),
      ...books(0.3, 1.665, 0, 0.6, 21),
      sphere(0.09, [0.55, 0.13, 0], "terracotta"),
      lathe(
        [
          [0, 0],
          [0.07, 0.01],
          [0.08, 0.2],
          [0.03, 0.26],
        ],
        [-0.3, 1.665, 0],
        "ceramic",
      ),
    ],
  },
  consoleTable: {
    footprint: [1.4, 0.36],
    height: 0.8,
    solid: false,
    slots: { wood: "walnut" },
    parts: () => [
      box([1.4, 0.04, 0.36], [0, 0.78, 0], slot("wood")),
      box([0.04, 0.76, 0.3], [-0.66, 0.38, 0], "frame"),
      box([0.04, 0.76, 0.3], [0.66, 0.38, 0], "frame"),
      lathe(
        [
          [0, 0],
          [0.09, 0.01],
          [0.1, 0.25],
          [0.04, 0.42],
          [0.05, 0.46],
        ],
        [-0.4, 0.8, 0],
        "fabricTerracotta",
      ),
      sphere(0.12, [0.35, 0.86, 0], "marbleDark", { scale: [1, 0.5, 1] }),
    ],
  },
  coatRack: {
    footprint: [0.45, 0.45],
    height: 1.8,
    solid: false,
    parts: () => [
      cyl(0.18, 0.03, [0, 0.015, 0], "frame"),
      cyl(0.015, 1.78, [0, 0.9, 0], "frame", { segments: 8 }),
      ...[0, 1, 2, 3].map((i) => cyl(0.012, 0.18, [Math.sin((i * Math.PI) / 2) * 0.07, 1.7, Math.cos((i * Math.PI) / 2) * 0.07], "brass", { rot: [Math.cos((i * Math.PI) / 2) * 0.8, 0, -Math.sin((i * Math.PI) / 2) * 0.8], segments: 6 })),
      box([0.4, 0.7, 0.2], [0.12, 1.25, 0.05], "fabricSand", { round: 0.08, rot: [0, 0.4, 0.1] }),
    ],
  },
  sculpture: {
    footprint: [0.5, 0.5],
    height: 1.6,
    solid: true,
    parts: () => [
      box([0.45, 0.9, 0.45], [0, 0.45, 0], "plaster"),
      torus(0.22, 0.07, [0, 1.2, 0], "brass", { rot: [0, 0.6, 0] }),
      sphere(0.09, [0.05, 1.02, 0], "marbleDark"),
    ],
  },
  // ---- outdoor ------------------------------------------------------------------------
  grill: {
    footprint: [1.7, 0.7],
    height: 1.3,
    solid: true,
    parts: () => [
      box([1.0, 0.82, 0.62], [0, 0.45, 0], "steel", { round: 0.02 }),
      ...[-0.25, 0.25].map((x) => box([0.4, 0.004, 0.01], [x, 0.55, -0.312], "frame")),
      box([1.0, 0.1, 0.64], [0, 0.91, 0], "steel", { round: 0.01 }),
      { kind: "cyl", radius: 0.3, height: 0.98, at: [0, 0.96, 0.02], mat: "steel", rot: [0, 0, HALF_PI], segments: 28 } as Part,
      box([0.8, 0.02, 0.02], [0, 1.1, -0.34], "chrome"),
      box([0.02, 0.02, 0.08], [-0.38, 1.1, -0.3], "chrome"),
      box([0.02, 0.02, 0.08], [0.38, 1.1, -0.3], "chrome"),
      ...[-0.3, -0.1, 0.1, 0.3].map((x) => cyl(0.025, 0.03, [x, 0.8, -0.33], "blackLacquer", { rot: [HALF_PI, 0, 0], segments: 12 })),
      box([0.36, 0.04, 0.5], [-0.7, 0.9, 0], "steel"),
      box([0.36, 0.04, 0.5], [0.7, 0.9, 0], "steel"),
      box([0.8, 0.03, 0.4], [0, 0.86, 0], "fire"),
      ...[-0.4, 0.4].flatMap((x) => [cyl(0.06, 0.05, [x, 0.06, 0.25], "rubber", { rot: [0, 0, HALF_PI], segments: 14 })]),
    ],
  },
  outdoorKitchen: {
    footprint: [2.4, 0.7],
    height: 0.95,
    solid: true,
    parts: () => [
      box([2.4, 0.88, 0.68], [0, 0.44, 0], "concreteDark"),
      box([2.42, 0.06, 0.7], [0, 0.91, 0], "travertine"),
      box([0.5, 0.02, 0.38], [-0.6, 0.945, 0], "steel"),
      cyl(0.015, 0.32, [-0.6, 1.1, 0.24], "frame", { segments: 8 }),
      box([0.02, 0.02, 0.16], [-0.6, 1.25, 0.16], "frame"),
      ...[0.35, 0.95].map((x) => box([0.5, 0.7, 0.01], [x, 0.44, -0.345], "teak")),
      cyl(0.12, 0.3, [0.5, 1.09, 0.1], "terracotta", { radiusTop: 0.14 }),
      { kind: "geometry", geometry: createFoliageGeometry(12, 0.16, 1), at: [0.5, 1.33, 0.1], mat: "leaf" } as Part,
    ],
  },
  palm: {
    footprint: [1.3, 1.3],
    height: 5.2,
    solid: true,
    parts: () => {
      const trunk = createPalmTrunkGeometry(3, 4.1, 0.14);
      return [
        box([1.3, 0.85, 1.3], [0, 0.425, 0], "planter", { round: 0.03 }),
        box([1.2, 0.02, 1.2], [0, 0.85, 0], "gravel"),
        { kind: "geometry", geometry: trunk.geometry, at: [0, 0.8, 0], mat: "palmTrunk" },
        { kind: "geometry", geometry: createPalmCrownGeometry(3), at: [trunk.top.x, 0.8 + trunk.top.y, trunk.top.z], mat: "palmFrond" },
        sphere(0.2, [trunk.top.x, 0.8 + trunk.top.y - 0.05, trunk.top.z], "palmTrunk", { scale: [1, 1.4, 1] }),
      ];
    },
  },
  palmTall: {
    footprint: [0.8, 0.8],
    height: 7.8,
    solid: true,
    parts: () => {
      const trunk = createPalmTrunkGeometry(11, 6.8, 0.2);
      return [
        cyl(0.4, 0.04, [0, 0.02, 0], "gravel", { segments: 16 }),
        { kind: "geometry", geometry: trunk.geometry, at: [0, 0, 0], mat: "palmTrunk" },
        { kind: "geometry", geometry: createPalmCrownGeometry(11, 13, 1.25), at: [trunk.top.x, trunk.top.y, trunk.top.z], mat: "palmFrond" },
        sphere(0.26, [trunk.top.x, trunk.top.y - 0.08, trunk.top.z], "palmTrunk", { scale: [1, 1.4, 1] }),
      ];
    },
  },
  oliveTree: {
    footprint: [1.2, 1.2],
    height: 3.6,
    solid: true,
    parts: () => [
      cyl(0.6, 0.04, [0, 0.02, 0], "gravel", { segments: 18 }),
      cyl(0.14, 1.4, [0, 0.7, 0], "bark", { radiusTop: 0.1, rot: [0.08, 0, 0.1] }),
      cyl(0.08, 1.0, [0.25, 1.6, 0.05], "bark", { radiusTop: 0.05, rot: [0, 0, -0.5] }),
      cyl(0.08, 1.0, [-0.2, 1.6, -0.05], "bark", { radiusTop: 0.05, rot: [0.2, 0, 0.45] }),
      { kind: "geometry", geometry: createFoliageGeometry(21, 1.0), at: [0, 2.6, 0], mat: "fabricSage" },
      { kind: "geometry", geometry: createFoliageGeometry(22, 0.7), at: [0.6, 2.2, 0.2], mat: "fabricSage" },
      { kind: "geometry", geometry: createFoliageGeometry(23, 0.65), at: [-0.55, 2.3, -0.2], mat: "leafDark" },
    ],
  },
  cypress: {
    footprint: [0.8, 0.8],
    height: 6,
    solid: true,
    parts: () => [
      cyl(0.08, 0.6, [0, 0.3, 0], "bark"),
      { kind: "geometry", geometry: createFoliageGeometry(31, 1, 2), at: [0, 3.2, 0], mat: "leafDark", scale: [0.55, 3.4, 0.55] } as Part,
    ],
  },
  outdoorSofa: {
    footprint: [3.0, 2.2],
    height: 0.75,
    solid: true,
    slots: { wood: "teak", fabric: "fabricOutdoor", accent: "fabricNavy" },
    parts: () => [
      box([3.0, 0.3, 0.9], [0, 0.15, 0.65], slot("wood"), { round: 0.02 }),
      box([0.9, 0.3, 1.3], [-1.05, 0.15, -0.45], slot("wood"), { round: 0.02 }),
      box([2.96, 0.14, 0.86], [0, 0.37, 0.65], slot("fabric"), { round: 0.06 }),
      box([0.86, 0.14, 1.3], [-1.05, 0.37, -0.45], slot("fabric"), { round: 0.06 }),
      box([3.0, 0.4, 0.18], [0, 0.6, 1.02], slot("fabric"), { round: 0.07 }),
      box([0.18, 0.4, 2.1], [-1.41, 0.6, 0.05], slot("fabric"), { round: 0.07 }),
      box([0.45, 0.4, 0.14], [0.2, 0.62, 0.85], slot("accent"), { round: 0.06, rot: [-0.25, 0.15, 0] }),
      box([0.45, 0.4, 0.14], [-1.15, 0.62, 0.8], slot("accent"), { round: 0.06, rot: [-0.25, -0.5, 0] }),
    ],
  },
  outdoorCoffeeTable: {
    footprint: [1.0, 1.0],
    height: 0.35,
    solid: false,
    parts: () => [box([1.0, 0.35, 1.0], [0, 0.175, 0], "concrete", { round: 0.03 }), cyl(0.12, 0.18, [0.2, 0.44, 0.1], "terracotta")],
  },
  firePit: {
    footprint: [1.2, 1.2],
    height: 0.45,
    solid: true,
    parts: () => [
      lathe(
        [
          [0, 0],
          [0.6, 0],
          [0.6, 0.4],
          [0.45, 0.4],
          [0.45, 0.25],
          [0, 0.25],
        ],
        [0, 0, 0],
        "concreteDark",
        { segments: 36 },
      ),
      cyl(0.44, 0.04, [0, 0.27, 0], "gravel", { segments: 28 }),
      ...[0, 1, 2].map((i) => cyl(0.04, 0.5, [0, 0.33, 0], "bark", { rot: [HALF_PI, (i * Math.PI) / 3, 0], segments: 8 })),
      sphere(0.2, [0, 0.33, 0], "fire", { scale: [1, 0.6, 1] }),
    ],
  },
  sunLounger: {
    footprint: [0.75, 2.0],
    height: 0.8,
    solid: true,
    slots: { wood: "teak", fabric: "fabricOutdoor" },
    parts: () => [
      box([0.7, 0.08, 1.35], [0, 0.3, 0.3], slot("wood")),
      ...legs4(0.64, 1.3, 0.26, 0.025, slot("wood")).map((part) => ({ ...part, at: [part.at[0], part.at[1], part.at[2] + 0.3] as [number, number, number] })),
      box([0.66, 0.08, 1.3], [0, 0.38, 0.3], slot("fabric"), { round: 0.03 }),
      box([0.7, 0.08, 0.75], [0, 0.55, -0.62], slot("wood"), { rot: [-0.55, 0, 0] }),
      box([0.66, 0.08, 0.72], [0, 0.61, -0.6], slot("fabric"), { round: 0.03, rot: [-0.55, 0, 0] }),
      box([0.4, 0.12, 0.25], [0, 0.78, -0.82], "fabricNavy", { round: 0.05, rot: [-0.55, 0, 0] }),
    ],
  },
  parasol: {
    footprint: [0.6, 0.6],
    height: 2.6,
    solid: false,
    parts: () => [
      box([0.5, 0.08, 0.5], [0, 0.04, 0], "concreteDark"),
      cyl(0.025, 2.5, [0, 1.3, 0], "teak", { segments: 8 }),
      lathe(
        [
          [0.02, 0.45],
          [0.8, 0.22],
          [1.4, 0],
          [1.42, -0.04],
        ],
        [0, 2.1, 0],
        "fabricOutdoor",
        { segments: 12 },
      ),
    ],
  },
  outdoorDiningTable: {
    footprint: [2.2, 1.0],
    height: 0.76,
    solid: true,
    parts: () => [box([2.2, 0.05, 1.0], [0, 0.735, 0], "teak"), box([0.3, 0.71, 0.7], [-0.8, 0.355, 0], "concrete"), box([0.3, 0.71, 0.7], [0.8, 0.355, 0], "concrete")],
  },
  outdoorChair: {
    footprint: [0.55, 0.55],
    height: 0.8,
    solid: false,
    slots: { wood: "teak", fabric: "fabricOutdoor" },
    parts: () => [
      ...legs4(0.5, 0.5, 0.44, 0.02, slot("wood"), 0.03),
      box([0.54, 0.05, 0.52], [0, 0.46, 0], slot("wood")),
      box([0.5, 0.06, 0.48], [0, 0.51, -0.01], slot("fabric"), { round: 0.02 }),
      box([0.52, 0.3, 0.04], [0, 0.72, 0.24], slot("wood"), { rot: [-0.12, 0, 0] }),
    ],
  },
  pergola: {
    footprint: [4.0, 3.2],
    height: 2.7,
    solid: false,
    castShadow: true,
    parts: () => [
      ...[
        [-1.95, -1.55],
        [1.95, -1.55],
        [-1.95, 1.55],
        [1.95, 1.55],
      ].map(([x, z]) => box([0.1, 2.6, 0.1], [x!, 1.3, z!], "frame")),
      box([4.0, 0.12, 0.1], [0, 2.62, -1.55], "frame"),
      box([4.0, 0.12, 0.1], [0, 2.62, 1.55], "frame"),
      box([0.1, 0.12, 3.2], [-1.95, 2.62, 0], "frame"),
      box([0.1, 0.12, 3.2], [1.95, 2.62, 0], "frame"),
      ...Array.from({ length: 14 }, (_, i) => box([0.05, 0.1, 3.1], [-1.75 + i * 0.27, 2.72, 0], "teak")),
      ...Array.from({ length: 9 }, (_, i) => sphere(0.035, [-1.8 + i * 0.45, 2.35 - Math.sin((i / 8) * Math.PI) * 0.2, 0], "lampGlow")),
    ],
  },
  planterBox: {
    footprint: [2.2, 0.5],
    height: 1.0,
    solid: true,
    parts: () => [
      box([2.2, 0.55, 0.5], [0, 0.275, 0], "planter"),
      box([2.1, 0.02, 0.42], [0, 0.54, 0], "soil"),
      ...Array.from({ length: 11 }, (_, i) =>
        cyl(0.07, 0.5 + (i % 3) * 0.12, [-0.95 + i * 0.19, 0.8 + (i % 3) * 0.06, (i % 2) * 0.1 - 0.05], i % 2 ? "leaf" : "fabricSage", {
          radiusTop: 0.005,
          segments: 6,
        }),
      ),
    ],
  },
  outdoorShower: {
    footprint: [0.9, 0.9],
    height: 2.3,
    solid: false,
    parts: () => [
      box([0.9, 0.04, 0.9], [0, 0.02, 0], "teak"),
      box([0.08, 2.3, 0.08], [0, 1.15, 0.38], "steel"),
      box([0.3, 0.02, 0.3], [0, 2.25, 0.22], "steel"),
      cyl(0.03, 0.08, [0.07, 1.1, 0.33], "chrome", { rot: [HALF_PI, 0, 0], segments: 10 }),
    ],
  },
} satisfies Record<string, ModelDefinition>;

export type ItemType = keyof typeof CATALOG;

export function getModel(type: ItemType): ModelDefinition {
  return CATALOG[type];
}

export function resolveSlots(type: ItemType, overrides?: Partial<Record<MaterialSlot, MaterialKey>>): Record<MaterialSlot, MaterialKey> {
  return { ...DEFAULT_SLOTS, ...getModel(type).slots, ...overrides };
}
