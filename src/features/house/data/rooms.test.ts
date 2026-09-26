import { describe, expect, it } from "vitest";
import { CATALOG } from "../models/catalog";
import { footprintRect } from "../engine/collision";
import { MAX_ITEMS_PER_ROOM, ROOMS } from "./rooms";

describe("rooms", () => {
  it.each(ROOMS.map((room) => [room.name, room] as const))("%s has at most 20 items", (_name, room) => {
    expect(room.items.length).toBeGreaterThan(0);
    expect(room.items.length).toBeLessThanOrEqual(MAX_ITEMS_PER_ROOM);
  });

  it("uses unique room and item ids", () => {
    const roomIds = ROOMS.map((room) => room.id);
    expect(new Set(roomIds).size).toBe(roomIds.length);
    const itemIds = ROOMS.flatMap((room) => room.items.map((item) => item.id));
    expect(new Set(itemIds).size).toBe(itemIds.length);
  });

  it("only references models from the catalog", () => {
    for (const item of ROOMS.flatMap((room) => room.items)) {
      expect(CATALOG).toHaveProperty(item.type);
    }
  });

  it("keeps every item inside its room", () => {
    const tolerance = 0.25;
    for (const room of ROOMS) {
      for (const item of room.items) {
        const model = CATALOG[item.type];
        const rect = footprintRect(item.at[0], item.at[1], model.footprint[0], model.footprint[1], item.rot ?? 0);
        const inside =
          rect.x0 >= room.bounds.x0 - tolerance &&
          rect.x1 <= room.bounds.x1 + tolerance &&
          rect.z0 >= room.bounds.z0 - tolerance &&
          rect.z1 <= room.bounds.z1 + tolerance;
        expect(inside, `${item.id} lies outside ${room.id}`).toBe(true);
      }
    }
  });

  it("spawns the walker inside the room", () => {
    for (const room of ROOMS) {
      const [x, z] = room.spawn;
      expect(x).toBeGreaterThanOrEqual(room.bounds.x0);
      expect(x).toBeLessThanOrEqual(room.bounds.x1);
      expect(z).toBeGreaterThanOrEqual(room.bounds.z0);
      expect(z).toBeLessThanOrEqual(room.bounds.z1);
    }
  });
});
