import { describe, expect, it } from "vitest";
import { ROOF_Y, STAIR, STAIR_END_X } from "../data/plan";
import { ROOMS } from "../data/rooms";
import { buildCollisionWorld, footprintRect, groundHeightAt, movePlayer, PLAYER, type PlayerState } from "./collision";

const world = buildCollisionWorld(ROOMS);
const DT = 1 / 60;

function walk(start: Omit<PlayerState, "vy" | "grounded">, dirX: number, dirZ: number, seconds: number, speed = 2): PlayerState {
  let state: PlayerState = { ...start, vy: 0, grounded: true };
  const length = Math.hypot(dirX, dirZ);
  for (let t = 0; t < seconds; t += DT) {
    state = movePlayer(world, state, (dirX / length) * speed * DT, (dirZ / length) * speed * DT, DT);
  }
  return state;
}

describe("collision world", () => {
  it("stands on the ground floor inside the house", () => {
    expect(groundHeightAt(world, -5, -3, 0)).toBe(0);
  });

  it("blocks the exterior wall", () => {
    const end = walk({ x: -8, y: 0, z: 0.5 }, -1, 0, 3);
    expect(end.x).toBeGreaterThan(-10 + 0.15 + PLAYER.radius - 0.01);
  });

  it("blocks fixed glazing but lets the walker through the open slider", () => {
    const blocked = walk({ x: -8.2, y: 0, z: -5 }, 0, -1, 3);
    expect(blocked.z).toBeGreaterThan(-6);
    const through = walk({ x: -5.1, y: 0, z: -5 }, 0, -1, 2);
    expect(through.z).toBeLessThan(-7);
  });

  it("walks through interior passages", () => {
    const end = walk({ x: -2.6, y: 0, z: 0 }, 0, 1, 2);
    expect(end.z).toBeGreaterThan(2.5);
  });

  it("climbs the stairs up to the roof terrace", () => {
    const start = { x: STAIR.startX - 0.6, y: 0, z: (STAIR.z0 + STAIR.z1) / 2 };
    const top = walk(start, 1, 0, 5);
    expect(top.x).toBeGreaterThan(STAIR_END_X);
    expect(top.y).toBeCloseTo(ROOF_Y, 5);
    // …and can walk out onto the terrace through the pavilion door.
    const out = walk({ x: 2.5, y: top.y, z: 5.3 }, 0, -1, 3);
    expect(out.z).toBeLessThan(3);
    expect(out.y).toBeCloseTo(ROOF_Y, 5);
  });

  it("keeps the walker on the roof behind the railing", () => {
    const end = walk({ x: 0, y: ROOF_Y, z: 0 }, 0, -1, 6);
    expect(end.y).toBeCloseTo(ROOF_Y, 5);
    expect(end.z).toBeGreaterThan(-7.6);
  });

  it("cannot walk into the pool", () => {
    const end = walk({ x: 5, y: 0, z: -9 }, 0, -1, 3);
    expect(end.z).toBeGreaterThan(-10.6 + PLAYER.radius - 0.01);
  });

  it("computes rotated footprints", () => {
    const rect = footprintRect(0, 0, 2, 1, 90);
    expect(rect.x0).toBeCloseTo(-0.5);
    expect(rect.x1).toBeCloseTo(0.5);
    expect(rect.z0).toBeCloseTo(-1);
    expect(rect.z1).toBeCloseTo(1);
  });
});
