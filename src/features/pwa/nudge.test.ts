import { describe, expect, it } from "vitest";
import { isNudgeDue, NUDGE_INTERVAL_MS } from "./nudge";

describe("isNudgeDue", () => {
  const now = Date.UTC(2026, 8, 26);

  it("is due on the first visit or with an unreadable timestamp", () => {
    expect(isNudgeDue(null, now)).toBe(true);
    expect(isNudgeDue(Number.NaN, now)).toBe(true);
  });

  it("waits two weeks after the last hint", () => {
    expect(isNudgeDue(now - NUDGE_INTERVAL_MS + 60_000, now)).toBe(false);
    expect(isNudgeDue(now - NUDGE_INTERVAL_MS, now)).toBe(true);
    expect(NUDGE_INTERVAL_MS).toBe(14 * 24 * 60 * 60 * 1000);
  });

  it("ignores timestamps from the future", () => {
    expect(isNudgeDue(now + 1000, now)).toBe(true);
  });
});
