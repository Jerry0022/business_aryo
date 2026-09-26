import { roomFloorY } from "../data/rooms";
import {
  isWalkableOpening,
  openingTop,
  PLATEAU,
  POOL,
  ROOF_SLAB,
  ROOF_Y,
  roofSurfaces,
  STAIR,
  STAIR_HOUSE,
  STAIR_RISE,
  WALLS,
} from "../data/plan";
import type { Box3Like, Rect, Room, Surface, Wall } from "../data/types";
import { getModel } from "../models/catalog";

export const PLAYER = {
  radius: 0.28,
  height: 1.75,
  eyeHeight: 1.62,
  /** Highest ledge the walker steps onto without jumping (stairs rise 0.17 m). */
  stepUp: 0.38,
  walkSpeed: 2.2,
  runSpeed: 4.6,
  gravity: 18,
} as const;

export interface CollisionWorld {
  obstacles: Box3Like[];
  surfaces: Surface[];
  bounds: Rect;
}

export interface PlayerState {
  x: number;
  /** Feet height. */
  y: number;
  z: number;
  vy: number;
  grounded: boolean;
}

const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box3Like => ({
  min: [Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)],
  max: [Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)],
});

/** Splits a wall into solid pieces along its length (walkable openings become gaps, lintels stay solid). */
export function wallObstacles(wall: Wall, baseY = 0): Box3Like[] {
  const horizontal = wall.a[1] === wall.b[1];
  const start = horizontal ? Math.min(wall.a[0], wall.b[0]) : Math.min(wall.a[1], wall.b[1]);
  const length = horizontal ? Math.abs(wall.b[0] - wall.a[0]) : Math.abs(wall.b[1] - wall.a[1]);
  const half = wall.thickness / 2;
  const fixed = horizontal ? wall.a[1] : wall.a[0];
  const make = (from: number, to: number, y0: number, y1: number) =>
    horizontal
      ? box(start + from, baseY + y0, fixed - half, start + to, baseY + y1, fixed + half)
      : box(fixed - half, baseY + y0, start + from, fixed + half, baseY + y1, start + to);

  const gaps = wall.openings.filter((opening) => isWalkableOpening(opening.kind)).sort((a, b) => a.from - b.from);
  const result: Box3Like[] = [];
  let cursor = 0;
  for (const gap of gaps) {
    if (gap.from > cursor) result.push(make(cursor, gap.from, 0, wall.height));
    result.push(make(gap.from, gap.to, openingTop(gap.kind, gap.top), wall.height));
    cursor = gap.to;
  }
  if (cursor < length) result.push(make(cursor, length, 0, wall.height));
  return result;
}

/** Axis-aligned bounds of a rotated footprint. */
export function footprintRect(x: number, z: number, width: number, depth: number, rotationDeg: number): Rect {
  const angle = (rotationDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(angle));
  const sin = Math.abs(Math.sin(angle));
  const halfX = (width * cos + depth * sin) / 2;
  const halfZ = (width * sin + depth * cos) / 2;
  return { x0: x - halfX, z0: z - halfZ, x1: x + halfX, z1: z + halfZ };
}

export function buildCollisionWorld(rooms: Room[]): CollisionWorld {
  const obstacles: Box3Like[] = [];
  const surfaces: Surface[] = [];

  for (const wall of WALLS) obstacles.push(...wallObstacles(wall));

  // Stairs: every step is a surface plus a solid block below it.
  for (let i = 0; i < STAIR.steps; i++) {
    const x0 = STAIR.startX + i * STAIR.tread;
    const x1 = x0 + STAIR.tread;
    const top = (i + 1) * STAIR_RISE;
    surfaces.push({ x0, z0: STAIR.z0, x1, z1: STAIR.z1, y: top });
    obstacles.push(box(x0, 0, STAIR.z0, x1, top - 0.01, STAIR.z1));
  }
  // Glass balustrade on the open side of the flight.
  obstacles.push(box(STAIR.startX + 3 * STAIR.tread, 0.5, STAIR.z0 - 0.05, STAIR.startX + STAIR.steps * STAIR.tread, ROOF_Y + 1, STAIR.z0));

  // Roof terrace: walkable slab, railings on all edges, glass stair pavilion.
  surfaces.push(...roofSurfaces());
  const railTop = ROOF_Y + 1.1;
  const s = ROOF_SLAB;
  obstacles.push(
    box(s.x0, ROOF_Y, s.z0, s.x1, railTop, s.z0 + 0.1),
    box(s.x0, ROOF_Y, s.z1 - 0.1, s.x1, railTop, s.z1),
    box(s.x0, ROOF_Y, s.z0, s.x0 + 0.1, railTop, s.z1),
    box(s.x1 - 0.1, ROOF_Y, s.z0, s.x1, railTop, s.z1),
  );
  const house = STAIR_HOUSE.rect;
  const houseTop = ROOF_Y + STAIR_HOUSE.height;
  obstacles.push(
    box(house.x0, ROOF_Y, house.z0 - 0.03, STAIR_HOUSE.doorX0, houseTop, house.z0 + 0.03),
    box(STAIR_HOUSE.doorX1, ROOF_Y, house.z0 - 0.03, house.x1, houseTop, house.z0 + 0.03),
    box(house.x0 - 0.03, ROOF_Y, house.z0, house.x0 + 0.03, houseTop, house.z1),
    box(house.x1 - 0.03, ROOF_Y, house.z0, house.x1 + 0.03, houseTop, house.z1),
  );

  // Plateau ground (house floor, decks, lawn) and the pool as a barrier.
  surfaces.push({ ...PLATEAU, y: 0 });
  obstacles.push(box(POOL.x0, -2, POOL.z0, POOL.x1, 1.2, POOL.z1));

  // Solid furniture.
  for (const room of rooms) {
    const floorY = roomFloorY(room);
    for (const item of room.items) {
      const model = getModel(item.type);
      if (!model.solid) continue;
      const rect = footprintRect(item.at[0], item.at[1], model.footprint[0], model.footprint[1], item.rot ?? 0);
      const y0 = floorY + (item.at[2] ?? 0);
      obstacles.push(box(rect.x0, y0, rect.z0, rect.x1, y0 + model.height, rect.z1));
    }
  }

  return { obstacles, surfaces, bounds: PLATEAU };
}

/** Highest walkable surface under (x, z) that can be reached from `feetY` (null if none). */
export function groundHeightAt(world: CollisionWorld, x: number, z: number, feetY: number): number | null {
  let best: number | null = null;
  for (const surface of world.surfaces) {
    if (x < surface.x0 || x > surface.x1 || z < surface.z0 || z > surface.z1) continue;
    if (surface.y > feetY + PLAYER.stepUp) continue;
    if (best === null || surface.y > best) best = surface.y;
  }
  return best;
}

function resolveHorizontal(world: CollisionWorld, state: PlayerState) {
  const bodyBottom = state.y + PLAYER.stepUp;
  const bodyTop = state.y + PLAYER.height;
  for (let iteration = 0; iteration < 3; iteration++) {
    let moved = false;
    for (const obstacle of world.obstacles) {
      if (obstacle.max[1] <= bodyBottom || obstacle.min[1] >= bodyTop) continue;
      const closestX = Math.max(obstacle.min[0], Math.min(state.x, obstacle.max[0]));
      const closestZ = Math.max(obstacle.min[2], Math.min(state.z, obstacle.max[2]));
      const dx = state.x - closestX;
      const dz = state.z - closestZ;
      const distanceSq = dx * dx + dz * dz;
      if (distanceSq >= PLAYER.radius * PLAYER.radius) continue;
      if (distanceSq > 1e-10) {
        const distance = Math.sqrt(distanceSq);
        const push = PLAYER.radius - distance;
        state.x += (dx / distance) * push;
        state.z += (dz / distance) * push;
      } else {
        // Center is inside the box: leave through the nearest face.
        const exits = [
          { d: state.x - obstacle.min[0] + PLAYER.radius, axis: "x", sign: -1 },
          { d: obstacle.max[0] - state.x + PLAYER.radius, axis: "x", sign: 1 },
          { d: state.z - obstacle.min[2] + PLAYER.radius, axis: "z", sign: -1 },
          { d: obstacle.max[2] - state.z + PLAYER.radius, axis: "z", sign: 1 },
        ].sort((a, b) => a.d - b.d);
        const exit = exits[0]!;
        if (exit.axis === "x") state.x += exit.sign * exit.d;
        else state.z += exit.sign * exit.d;
      }
      moved = true;
    }
    if (!moved) break;
  }
  const { bounds } = world;
  state.x = Math.min(bounds.x1 - PLAYER.radius, Math.max(bounds.x0 + PLAYER.radius, state.x));
  state.z = Math.min(bounds.z1 - PLAYER.radius, Math.max(bounds.z0 + PLAYER.radius, state.z));
}

/**
 * Moves the walker by (dx, dz) with collisions, stair stepping and gravity.
 * Pure function: returns the next state.
 */
export function movePlayer(world: CollisionWorld, previous: PlayerState, dx: number, dz: number, dt: number): PlayerState {
  const state: PlayerState = { ...previous };
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (PLAYER.radius * 0.5)));
  for (let i = 0; i < steps; i++) {
    state.x += dx / steps;
    state.z += dz / steps;
    resolveHorizontal(world, state);
    const ground = groundHeightAt(world, state.x, state.z, state.y);
    // Stick to stairs while walking down, step up onto ledges.
    if (ground !== null && state.grounded && Math.abs(state.y - ground) <= PLAYER.stepUp) state.y = ground;
  }

  const ground = groundHeightAt(world, state.x, state.z, state.y);
  if (ground === null) {
    state.grounded = false;
    return state;
  }
  if (state.y > ground + 1e-3) {
    state.vy -= PLAYER.gravity * dt;
    state.y += state.vy * dt;
    if (state.y <= ground) {
      state.y = ground;
      state.vy = 0;
      state.grounded = true;
    } else {
      state.grounded = false;
    }
  } else {
    state.y = ground;
    state.vy = 0;
    state.grounded = true;
  }
  return state;
}
