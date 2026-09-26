import type { Rect, Surface, Wall } from "./types";

// World units are meters. The valley and the city lie towards -z ("front").
// The house footprint spans x ∈ [-10, 10], z ∈ [-6, 6]; interior floor is at y = 0.

export const WALL_HEIGHT = 3;
export const ROOF_SLAB_BOTTOM = WALL_HEIGHT;
export const ROOF_SLAB_TOP = 3.35;
/** Walking level on the roof terrace (top of the deck boards). */
export const ROOF_Y = 3.4;
export const EXTERIOR_WALL = 0.3;
export const INTERIOR_WALL = 0.14;

export const FOOTPRINT: Rect = { x0: -10, z0: -6, x1: 10, z1: 6 };

/** Roof slab including the cantilevered canopy over the front terrace. */
export const ROOF_SLAB: Rect = { x0: -10.6, z0: -7.6, x1: 10.6, z1: 6.3 };

/** Flat, walkable part of the mountain plateau around the house. */
export const PLATEAU: Rect = { x0: -24, z0: -14.4, x1: 24, z1: 18 };
/** Cliff edge in front of the plateau (glass railing line). */
export const CLIFF_EDGE_Z = -14.6;

export const POOL: Rect = { x0: 0.5, z0: -13.9, x1: 10.5, z1: -10.6 };
export const POOL_WATER_Y = -0.08;

export const STAIR = {
  steps: 20,
  /** x where the first step starts; the flight rises towards +x. */
  startX: -3.8,
  tread: 0.28,
  z0: 4.75,
  z1: 5.85,
} as const;

export const STAIR_END_X = STAIR.startX + STAIR.steps * STAIR.tread;
export const STAIR_RISE = ROOF_Y / STAIR.steps;

/** Opening in the roof slab above the flight of stairs. */
export const STAIR_HOLE: Rect = { x0: STAIR.startX, z0: STAIR.z0, x1: STAIR_END_X, z1: STAIR.z1 };

/** Glass pavilion on the roof that covers the stair opening. */
export const STAIR_HOUSE = {
  rect: { x0: -4.05, z0: 4.5, x1: 3.2, z1: 6.15 } as Rect,
  height: 2.45,
  /** Door gap on the front (-z) face. */
  doorX0: 1.95,
  doorX1: 3.05,
} as const;

const ext = EXTERIOR_WALL;
const int = INTERIOR_WALL;

export const WALLS: Wall[] = [
  {
    id: "front",
    a: [-10, -6],
    b: [10, -6],
    thickness: ext,
    height: WALL_HEIGHT,
    exterior: true,
    openings: [
      { from: 0.4, to: 3.6, kind: "glass" },
      { from: 3.8, to: 6.0, kind: "slider" },
      { from: 6.2, to: 8.8, kind: "glass" },
      { from: 9.2, to: 13.8, kind: "glass" },
      { from: 14.2, to: 16.8, kind: "glass" },
      { from: 17.0, to: 19.6, kind: "glass" },
    ],
  },
  {
    id: "back",
    a: [-10, 6],
    b: [10, 6],
    thickness: ext,
    height: WALL_HEIGHT,
    exterior: true,
    openings: [
      { from: 1, to: 4, kind: "window", bottom: 0.9, top: 2.4 },
      { from: 12.6, to: 13.8, kind: "door", top: 2.5 },
      { from: 14.1, to: 14.6, kind: "glass", top: 2.5 },
      { from: 16.6, to: 19.4, kind: "window", bottom: 1.7, top: 2.5 },
    ],
  },
  {
    id: "left",
    a: [-10, -6],
    b: [-10, 6],
    thickness: ext,
    height: WALL_HEIGHT,
    exterior: true,
    openings: [
      { from: 0.4, to: 1.9, kind: "glass" },
      { from: 5.0, to: 6.9, kind: "window", bottom: 0.45, top: 2.6 },
      { from: 8.3, to: 11.2, kind: "window", bottom: 0.8, top: 2.4 },
    ],
  },
  {
    id: "right",
    a: [10, -6],
    b: [10, 6],
    thickness: ext,
    height: WALL_HEIGHT,
    exterior: true,
    openings: [
      { from: 0.4, to: 3.8, kind: "glass" },
      { from: 9.0, to: 11.0, kind: "window", bottom: 1.7, top: 2.5 },
    ],
  },
  {
    id: "spine",
    a: [-10, 1.5],
    b: [10, 1.5],
    thickness: int,
    height: WALL_HEIGHT,
    exterior: false,
    openings: [
      { from: 6.6, to: 8.2, kind: "passage", top: 2.6 },
      { from: 10.2, to: 11.6, kind: "passage", top: 2.6 },
      { from: 14.4, to: 15.4, kind: "door" },
      { from: 19.0, to: 19.8, kind: "door" },
    ],
  },
  {
    id: "office-hall",
    a: [-5, 1.5],
    b: [-5, 6],
    thickness: int,
    height: WALL_HEIGHT,
    exterior: false,
    openings: [{ from: 0.7, to: 1.7, kind: "door" }],
  },
  { id: "hall-bath", a: [6, 1.5], b: [6, 6], thickness: int, height: WALL_HEIGHT, exterior: false, openings: [] },
  { id: "kitchen-bedroom", a: [4, -6], b: [4, 1.5], thickness: int, height: WALL_HEIGHT, exterior: false, openings: [] },
];

/** Default opening head heights by kind. */
export function openingTop(kind: Wall["openings"][number]["kind"], top?: number): number {
  if (top !== undefined) return top;
  if (kind === "glass" || kind === "slider") return 2.8;
  return 2.4;
}

export function isWalkableOpening(kind: Wall["openings"][number]["kind"]): boolean {
  return kind === "door" || kind === "passage" || kind === "slider";
}

/** Walkable roof areas: the slab minus the stair opening (split into four rectangles). */
export function roofSurfaces(): Surface[] {
  const s = ROOF_SLAB;
  const h = STAIR_HOLE;
  return [
    { x0: s.x0, z0: s.z0, x1: s.x1, z1: h.z0, y: ROOF_Y },
    { x0: s.x0, z0: h.z1, x1: s.x1, z1: s.z1, y: ROOF_Y },
    { x0: s.x0, z0: h.z0, x1: h.x0, z1: h.z1, y: ROOF_Y },
    { x0: h.x1, z0: h.z0, x1: s.x1, z1: h.z1, y: ROOF_Y },
  ];
}
