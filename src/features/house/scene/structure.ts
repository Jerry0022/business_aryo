import {
  CLIFF_EDGE_Z,
  FOOTPRINT,
  openingTop,
  POOL,
  POOL_WATER_Y,
  ROOF_SLAB,
  ROOF_SLAB_BOTTOM,
  ROOF_SLAB_TOP,
  ROOF_Y,
  STAIR,
  STAIR_HOLE,
  STAIR_HOUSE,
  STAIR_RISE,
  WALLS,
} from "../data/plan";
import { ROOMS } from "../data/rooms";
import type { FloorKind, Rect, Wall } from "../data/types";
import { box, type Part } from "../models/builder";
import type { MaterialKey } from "../models/materials";

const FLOOR_MATERIAL: Record<FloorKind, MaterialKey> = {
  herringbone: "floorHerringbone",
  planks: "floorPlanks",
  stone: "floorStone",
  deck: "floorDeck",
};

/** Box spanning a rectangle between two heights. */
function slab(rect: Rect, y0: number, y1: number, mat: MaterialKey): Part {
  return box(
    [rect.x1 - rect.x0, y1 - y0, rect.z1 - rect.z0],
    [(rect.x0 + rect.x1) / 2, (y0 + y1) / 2, (rect.z0 + rect.z1) / 2],
    mat,
  );
}

/** Rectangle minus an inner hole, as up to four rectangles. */
function ringRects(outer: Rect, hole: Rect): Rect[] {
  return [
    { x0: outer.x0, z0: outer.z0, x1: outer.x1, z1: hole.z0 },
    { x0: outer.x0, z0: hole.z1, x1: outer.x1, z1: outer.z1 },
    { x0: outer.x0, z0: hole.z0, x1: hole.x0, z1: hole.z1 },
    { x0: hole.x1, z0: hole.z0, x1: outer.x1, z1: hole.z1 },
  ].filter((rect) => rect.x1 - rect.x0 > 0.001 && rect.z1 - rect.z0 > 0.001);
}

const CLAD_WALLS = new Set(["left"]);

/** A piece of a wall between `from` and `to` (along the wall), from y0 to y1. */
function wallPiece(wall: Wall, from: number, to: number, y0: number, y1: number, mat: MaterialKey, thickness = wall.thickness, offset = 0): Part {
  const horizontal = wall.a[1] === wall.b[1];
  const start = horizontal ? Math.min(wall.a[0], wall.b[0]) : Math.min(wall.a[1], wall.b[1]);
  const fixed = (horizontal ? wall.a[1] : wall.a[0]) + offset;
  const length = to - from;
  const center = start + (from + to) / 2;
  return horizontal
    ? box([length, y1 - y0, thickness], [center, (y0 + y1) / 2, fixed], mat)
    : box([thickness, y1 - y0, length], [fixed, (y0 + y1) / 2, center], mat);
}

function wallParts(wall: Wall): { solid: Part[]; glass: Part[] } {
  const solid: Part[] = [];
  const glass: Part[] = [];
  const horizontal = wall.a[1] === wall.b[1];
  const length = horizontal ? Math.abs(wall.b[0] - wall.a[0]) : Math.abs(wall.b[1] - wall.a[1]);
  const mat: MaterialKey = wall.exterior ? "plasterExterior" : "plaster";
  // Exterior walls extend by half a thickness at both ends so corners close.
  const extend = wall.exterior ? wall.thickness / 2 : -wall.thickness / 2;
  const openings = [...wall.openings].sort((a, b) => a.from - b.from);
  let cursor = -extend;
  for (const opening of openings) {
    if (opening.from > cursor) solid.push(wallPiece(wall, cursor, opening.from, 0, wall.height, mat));
    const top = openingTop(opening.kind, opening.top);
    const bottom = opening.bottom ?? 0;
    if (top < wall.height) solid.push(wallPiece(wall, opening.from, opening.to, top, wall.height, mat));
    if (bottom > 0) solid.push(wallPiece(wall, opening.from, opening.to, 0, bottom, mat));
    const frame = 0.05;
    const inset = wall.thickness * 0.15;
    // Slim black frames around every opening.
    solid.push(wallPiece(wall, opening.from, opening.from + frame, bottom, top, "frame", wall.thickness * 0.7));
    solid.push(wallPiece(wall, opening.to - frame, opening.to, bottom, top, "frame", wall.thickness * 0.7));
    solid.push(wallPiece(wall, opening.from, opening.to, top - frame, top, "frame", wall.thickness * 0.7));
    if (opening.kind === "glass" || opening.kind === "window") {
      if (bottom > 0) solid.push(wallPiece(wall, opening.from, opening.to, bottom, bottom + 0.03, "travertine", wall.thickness + 0.06));
      glass.push(wallPiece(wall, opening.from + frame, opening.to - frame, bottom, top - frame, "glass", 0.024, inset));
      const span = opening.to - opening.from;
      if (span > 2.8) {
        const mid = opening.from + span / 2;
        solid.push(wallPiece(wall, mid - 0.025, mid + 0.025, bottom, top, "frame", 0.06, inset));
      }
    } else if (opening.kind === "slider") {
      // Open sliding door: the leaf is parked in front of the adjacent fixed pane.
      glass.push(wallPiece(wall, opening.from - 1.6, opening.from - 0.05, 0, top - frame, "glass", 0.024, wall.thickness / 2 + 0.05));
      solid.push(wallPiece(wall, opening.from - 1.62, opening.from - 1.57, 0, top - frame, "frame", 0.05, wall.thickness / 2 + 0.05));
    } else {
      solid.push(wallPiece(wall, opening.from, opening.to, 0, 0.012, "travertine"));
    }
    cursor = opening.to;
  }
  if (cursor < length + extend) solid.push(wallPiece(wall, cursor, length + extend, 0, wall.height, mat));

  if (CLAD_WALLS.has(wall.id)) {
    const side = wall.a[0] < 0 ? -1 : 1;
    const outward = side * (wall.thickness / 2 + 0.03);
    let start = -wall.thickness / 2;
    for (const opening of openings) {
      if (opening.from > start) solid.push(wallPiece(wall, start, opening.from, 0, wall.height, "cladding", 0.05, outward));
      const top = openingTop(opening.kind, opening.top);
      solid.push(wallPiece(wall, opening.from, opening.to, top, wall.height, "cladding", 0.05, outward));
      if ((opening.bottom ?? 0) > 0) solid.push(wallPiece(wall, opening.from, opening.to, 0, opening.bottom!, "cladding", 0.05, outward));
      start = opening.to;
    }
    solid.push(wallPiece(wall, start, length + wall.thickness / 2, 0, wall.height, "cladding", 0.05, outward));
  }
  return { solid, glass };
}

export interface StructureParts {
  /** Always visible (floors, walls, stairs, terraces, pool). */
  ground: Part[];
  groundGlass: Part[];
  /** Hidden in the cut-away view (roof slab, roof terrace, pavilion). */
  roof: Part[];
  roofGlass: Part[];
  water: Part[];
}

export function buildStructureParts(): StructureParts {
  const ground: Part[] = [];
  const groundGlass: Part[] = [];
  const roof: Part[] = [];
  const roofGlass: Part[] = [];

  // Floors of the interior rooms.
  for (const room of ROOMS) {
    if (room.level !== "ground" || room.id === "garden") continue;
    ground.push(slab(room.bounds, -0.02, 0.012, FLOOR_MATERIAL[room.floor]));
  }

  // Exterior surfaces: timber deck under the canopy, stone around the pool, entrance path.
  const deck: Rect = { x0: -12, z0: -10.2, x1: 12, z1: FOOTPRINT.z0 - 0.15 };
  ground.push(slab(deck, -0.12, 0.01, "floorDeck"));
  const poolSurround: Rect = { x0: -14, z0: CLIFF_EDGE_Z + 0.2, x1: 14, z1: deck.z0 };
  for (const rect of ringRects(poolSurround, POOL)) ground.push(slab(rect, -0.12, 0.005, "paving"));
  ground.push(slab({ x0: 1.8, z0: FOOTPRINT.z1 + 0.15, x1: 4.6, z1: 17.5 }, -0.1, 0.005, "paving"));
  ground.push(slab({ x0: 4.6, z0: 9, x1: 13, z1: 17.5 }, -0.1, -0.005, "gravel"));
  ground.push(slab({ x0: FOOTPRINT.x0 - 0.15, z0: FOOTPRINT.z0 - 0.15, x1: FOOTPRINT.x1 + 0.15, z1: FOOTPRINT.z1 + 0.15 }, -0.4, -0.02, "concreteDark"));

  // Infinity pool: tiled basin, travertine coping; the valley-side edge is flush with the water.
  const depth = -1.45;
  ground.push(slab(POOL, depth - 0.1, depth, "poolTile"));
  ground.push(slab({ x0: POOL.x0 - 0.1, z0: POOL.z0, x1: POOL.x0, z1: POOL.z1 }, depth, 0.02, "poolTile"));
  ground.push(slab({ x0: POOL.x1, z0: POOL.z0, x1: POOL.x1 + 0.1, z1: POOL.z1 }, depth, 0.02, "poolTile"));
  ground.push(slab({ x0: POOL.x0, z0: POOL.z1, x1: POOL.x1, z1: POOL.z1 + 0.1 }, depth, 0.02, "poolTile"));
  ground.push(slab({ x0: POOL.x0, z0: POOL.z0 - 0.1, x1: POOL.x1, z1: POOL.z0 }, depth - 0.6, POOL_WATER_Y - 0.01, "poolTile"));
  ground.push(slab({ x0: POOL.x0 - 0.4, z0: POOL.z1 + 0.1, x1: POOL.x1 + 0.4, z1: POOL.z1 + 0.45 }, -0.05, 0.03, "travertine"));
  const water: Part[] = [slab({ x0: POOL.x0, z0: POOL.z0 - 0.1, x1: POOL.x1, z1: POOL.z1 }, POOL_WATER_Y - 0.02, POOL_WATER_Y, "water")];

  // Glass railing along the cliff edge (the pool's infinity edge stays open).
  const railZ = CLIFF_EDGE_Z + 0.25;
  for (const [x0, x1] of [
    [-24, POOL.x0 - 0.1],
    [POOL.x1 + 0.1, 24],
  ] as const) {
    ground.push(slab({ x0, z0: railZ - 0.12, x1, z1: railZ + 0.12 }, -0.2, 0.12, "concrete"));
    groundGlass.push(slab({ x0, z0: railZ - 0.012, x1, z1: railZ + 0.012 }, 0.12, 1.08, "glass"));
    ground.push(slab({ x0, z0: railZ - 0.03, x1, z1: railZ + 0.03 }, 1.08, 1.12, "steel"));
  }

  // Walls.
  for (const wall of WALLS) {
    const { solid, glass } = wallParts(wall);
    ground.push(...solid);
    groundGlass.push(...glass);
  }

  // Monolithic stair with solid oak treads.
  for (let i = 0; i < STAIR.steps; i++) {
    const x0 = STAIR.startX + i * STAIR.tread;
    const top = (i + 1) * STAIR_RISE;
    const rect: Rect = { x0, z0: STAIR.z0, x1: x0 + STAIR.tread, z1: STAIR.z1 };
    ground.push(slab(rect, 0, top - 0.045, "plaster"));
    ground.push(slab({ ...rect, x0: x0 - 0.015 }, top - 0.045, top, "oak"));
  }
  const run = STAIR.steps * STAIR.tread;
  const angle = Math.atan2(STAIR.steps * STAIR_RISE, run);
  const flight = Math.hypot(run, STAIR.steps * STAIR_RISE);
  const mid: [number, number] = [STAIR.startX + run / 2, (STAIR.steps * STAIR_RISE) / 2];
  groundGlass.push(box([flight, 0.95, 0.02], [mid[0], mid[1] + 0.55, STAIR.z0 - 0.03], "glass", { rot: [0, 0, angle] }));
  ground.push(box([flight, 0.04, 0.05], [mid[0], mid[1] + 1.03, STAIR.z0 - 0.03], "frame", { rot: [0, 0, angle] }));

  // Roof slab with stair opening; white fascia, warm timber soffit under the canopy.
  for (const rect of ringRects(ROOF_SLAB, STAIR_HOLE)) roof.push(slab(rect, ROOF_SLAB_BOTTOM, ROOF_SLAB_TOP, "plasterExterior"));
  const interior: Rect = { x0: FOOTPRINT.x0, z0: FOOTPRINT.z0, x1: FOOTPRINT.x1, z1: FOOTPRINT.z1 };
  for (const rect of ringRects(interior, STAIR_HOLE)) roof.push(slab(rect, ROOF_SLAB_BOTTOM - 0.012, ROOF_SLAB_BOTTOM, "ceiling"));
  roof.push(slab({ x0: ROOF_SLAB.x0, z0: ROOF_SLAB.z0, x1: ROOF_SLAB.x1, z1: FOOTPRINT.z0 - 0.15 }, ROOF_SLAB_BOTTOM - 0.04, ROOF_SLAB_BOTTOM, "soffit"));
  // Roof deck boards (inset from the parapet) and parapet coping.
  const deckRect: Rect = { x0: ROOF_SLAB.x0 + 0.25, z0: ROOF_SLAB.z0 + 0.25, x1: ROOF_SLAB.x1 - 0.25, z1: ROOF_SLAB.z1 - 0.25 };
  for (const rect of ringRects(deckRect, STAIR_HOLE)) roof.push(slab(rect, ROOF_SLAB_TOP, ROOF_Y, "floorDeck"));
  const parapet = 0.25;
  const railBase = ROOF_Y + 0.1;
  const s = ROOF_SLAB;
  const edges: Rect[] = [
    { x0: s.x0, z0: s.z0, x1: s.x1, z1: s.z0 + parapet },
    { x0: s.x0, z0: s.z1 - parapet, x1: s.x1, z1: s.z1 },
    { x0: s.x0, z0: s.z0 + parapet, x1: s.x0 + parapet, z1: s.z1 - parapet },
    { x0: s.x1 - parapet, z0: s.z0 + parapet, x1: s.x1, z1: s.z1 - parapet },
  ];
  for (const edge of edges) roof.push(slab(edge, ROOF_SLAB_TOP, railBase, "plasterExterior"));
  const railInset = 0.1;
  const railRects: Rect[] = [
    { x0: s.x0 + railInset, z0: s.z0 + railInset - 0.012, x1: s.x1 - railInset, z1: s.z0 + railInset + 0.012 },
    { x0: s.x0 + railInset, z0: s.z1 - railInset - 0.012, x1: s.x1 - railInset, z1: s.z1 - railInset + 0.012 },
    { x0: s.x0 + railInset - 0.012, z0: s.z0 + railInset, x1: s.x0 + railInset + 0.012, z1: s.z1 - railInset },
    { x0: s.x1 - railInset - 0.012, z0: s.z0 + railInset, x1: s.x1 - railInset + 0.012, z1: s.z1 - railInset },
  ];
  for (const rect of railRects) {
    roofGlass.push(slab(rect, railBase, ROOF_Y + 1.08, "glass"));
    roof.push(slab({ x0: rect.x0 - 0.02, z0: rect.z0 - 0.02, x1: rect.x1 + 0.02, z1: rect.z1 + 0.02 }, ROOF_Y + 1.08, ROOF_Y + 1.12, "frame"));
  }

  // Glass stair pavilion.
  const pavilion = STAIR_HOUSE.rect;
  const pavilionTop = ROOF_Y + STAIR_HOUSE.height;
  roof.push(slab({ x0: pavilion.x0 - 0.15, z0: pavilion.z0 - 0.15, x1: pavilion.x1 + 0.15, z1: pavilion.z1 + 0.02 }, pavilionTop, pavilionTop + 0.14, "plasterExterior"));
  const glassWalls: Rect[] = [
    { x0: pavilion.x0, z0: pavilion.z0 - 0.012, x1: STAIR_HOUSE.doorX0, z1: pavilion.z0 + 0.012 },
    { x0: STAIR_HOUSE.doorX1, z0: pavilion.z0 - 0.012, x1: pavilion.x1, z1: pavilion.z0 + 0.012 },
    { x0: pavilion.x0 - 0.012, z0: pavilion.z0, x1: pavilion.x0 + 0.012, z1: pavilion.z1 },
    { x0: pavilion.x1 - 0.012, z0: pavilion.z0, x1: pavilion.x1 + 0.012, z1: pavilion.z1 },
  ];
  for (const rect of glassWalls) roofGlass.push(slab(rect, ROOF_Y, pavilionTop, "glass"));
  roof.push(slab({ x0: pavilion.x0, z0: pavilion.z1 - 0.2, x1: pavilion.x1, z1: pavilion.z1 }, ROOF_Y, pavilionTop, "plasterExterior"));
  const posts: [number, number][] = [
    [pavilion.x0, pavilion.z0],
    [pavilion.x1, pavilion.z0],
    [STAIR_HOUSE.doorX0, pavilion.z0],
    [STAIR_HOUSE.doorX1, pavilion.z0],
    [-0.5, pavilion.z0],
  ];
  for (const [x, z] of posts) roof.push(slab({ x0: x - 0.03, z0: z - 0.03, x1: x + 0.03, z1: z + 0.03 }, ROOF_Y, pavilionTop, "frame"));

  return { ground, groundGlass, roof, roofGlass, water };
}
