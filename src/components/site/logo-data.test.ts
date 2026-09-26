import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOGO_ACCENT, LOGO_DIMENSION_PATH, LOGO_PLANK_SIZE, LOGO_PLANKS } from "./logo-data";

describe("logo", () => {
  const icon = readFileSync(new URL("../../app/icon.svg", import.meta.url), "utf8");

  it("favicon uses the same planks and dimension line as the logo component", () => {
    const planks = [...icon.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="([^"]+)"/g)];
    expect(planks.map((m) => [Number(m[1]), Number(m[2]), m[5]])).toEqual(LOGO_PLANKS.map(([x, y, fill]) => [x, y, fill]));
    for (const m of planks) {
      expect([Number(m[3]), Number(m[4])]).toEqual([LOGO_PLANK_SIZE.width, LOGO_PLANK_SIZE.height]);
    }
    expect(icon).toContain(`d="${LOGO_DIMENSION_PATH}" stroke="${LOGO_ACCENT}"`);
  });

  it("contains only straight, axis-aligned boards (no herringbone)", () => {
    // Rectangles without a rotation can only be laid parallel: no herringbone, chevron or Tafelparkett.
    expect(icon).not.toMatch(/rotate|polygon|skew/);
    expect(LOGO_PLANK_SIZE.width).toBeGreaterThan(LOGO_PLANK_SIZE.height * 2);
  });
});
