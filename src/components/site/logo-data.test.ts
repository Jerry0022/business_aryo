import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOGO_PLANKS } from "./logo-data";

describe("logo", () => {
  it("favicon uses the same planks as the logo component", () => {
    const icon = readFileSync(new URL("../../app/icon.svg", import.meta.url), "utf8");
    const polygons = [...icon.matchAll(/points="([^"]+)" fill="([^"]+)"/g)].map((m) => [m[1], m[2]]);
    expect(polygons).toEqual(LOGO_PLANKS.map(([points, fill]) => [points, fill]));
  });

  it("contains only axis-aligned boards (no herringbone)", () => {
    for (const [points] of LOGO_PLANKS) {
      const corners = points.split(" ").map((p) => p.split(",").map(Number));
      const xs = new Set(corners.map(([x]) => x));
      const ys = new Set(corners.map(([, y]) => y));
      expect(xs.size).toBe(2);
      expect(ys.size).toBe(2);
    }
  });
});
