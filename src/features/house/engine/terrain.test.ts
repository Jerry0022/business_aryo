import { describe, expect, it } from "vitest";
import { generateCity, PLATEAU_Y, terrainHeight, VALLEY_Y } from "./terrain";

describe("terrain", () => {
  it("is flat on the plateau around the house", () => {
    for (const [x, z] of [
      [0, 0],
      [-20, -12],
      [20, 15],
      [-3, -14],
    ] as const) {
      expect(terrainHeight(x, z)).toBeCloseTo(PLATEAU_Y, 1);
    }
  });

  it("drops steeply into the valley in front of the house", () => {
    expect(terrainHeight(0, -40)).toBeLessThan(-40);
    expect(terrainHeight(0, -600)).toBeLessThan(VALLEY_Y + 20);
  });

  it("rises behind the house", () => {
    expect(terrainHeight(0, 400)).toBeGreaterThan(60);
  });

  it("generates a deterministic city in the valley", () => {
    const a = generateCity(1);
    const b = generateCity(1);
    expect(a.buildings.length).toBeGreaterThan(300);
    expect(a.buildings[10]).toEqual(b.buildings[10]);
    expect(a.streetLights.length).toBeGreaterThan(500);
  });
});
