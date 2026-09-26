import { describe, expect, it } from "vitest";
import { formatHour, normalizeHour, skyStateAt, sunDirectionAt } from "./sun";

describe("sun", () => {
  it("is above the horizon at noon and below at midnight", () => {
    expect(sunDirectionAt(13)[1]).toBeGreaterThan(0.7);
    expect(sunDirectionAt(0)[1]).toBeLessThan(0);
  });

  it("returns normalized directions", () => {
    for (const hour of [0, 6, 9.5, 13, 18, 22]) {
      const [x, y, z] = sunDirectionAt(hour);
      expect(Math.hypot(x, y, z)).toBeCloseTo(1, 5);
    }
  });

  it("rises in the east and sets in the west", () => {
    expect(sunDirectionAt(7)[0]).toBeGreaterThan(0.5);
    expect(sunDirectionAt(19.5)[0]).toBeLessThan(-0.5);
  });

  it("switches between day and night lighting", () => {
    expect(skyStateAt(13).day).toBe(1);
    expect(skyStateAt(13).night).toBe(0);
    expect(skyStateAt(23).night).toBe(1);
    expect(skyStateAt(20).golden).toBeGreaterThan(0);
  });

  it("formats and normalizes hours", () => {
    expect(formatHour(13.5)).toBe("13:30");
    expect(formatHour(24.25)).toBe("00:15");
    expect(normalizeHour(-1)).toBe(23);
  });
});
