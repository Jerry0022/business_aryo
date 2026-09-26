import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "@/lib/business/settings";
import { SUBSCRIPTION_PLANS } from "@/lib/business/subscriptions";
import { countLabel, formatDateKey, officeHourLabel, planFeatures, planTermLine } from "./format";

const plan = (key: string) => {
  const found = SUBSCRIPTION_PLANS.find((item) => item.key === key);
  if (!found) throw new Error(key);
  return {
    key: found.key,
    features: [...found.features],
    private: found.private,
    minTermMonths: DEFAULT_SETTINGS.subscriptions.minTermMonths[found.key] ?? null,
  };
};

describe("public site formatting", () => {
  it("shows office hours in Berlin time", () => {
    // 8 October 2026, 19:00 in Berlin (CEST, UTC+2).
    const label = officeHourLabel("2026-10-08T17:00:00.000Z");
    expect(label.dayMonth).toBe("08.10.");
    expect(label.weekday).toBe("Donnerstag");
    expect(label.time).toBe("19:00");
    expect(label.compact).toBe("Do 08.10., 19 Uhr");
    // Winter time (CET, UTC+1).
    expect(officeHourLabel("2026-12-10T18:00:00.000Z").time).toBe("19:00");
  });

  it("formats date keys and counts", () => {
    expect(formatDateKey("2026-12-31")).toBe("31.12.2026");
    expect(countLabel(1, "Projektplatz", "Projektplätze")).toBe("1 Projektplatz");
    expect(countLabel(5, "Projektplatz", "Projektplätze")).toBe("5 Projektplätze");
  });

  it("describes contract terms honestly", () => {
    expect(planTermLine({ minTermMonths: 24, private: true })).toBe("Mindestlaufzeit 24 Monate, danach monatlich kündbar");
    expect(planTermLine({ minTermMonths: 1, private: true })).toBe("Monatlich kündbar");
    expect(planTermLine({ minTermMonths: 12, private: false })).toBe("Laufzeit 12 Monate");
    expect(planTermLine({ minTermMonths: null, private: true })).toBeNull();
  });

  it("builds the Boden-Pass Plus features from the settings", () => {
    const features = planFeatures(plan("boden-pass-plus"), DEFAULT_SETTINGS.subscriptions);
    expect(features[0]).toBe("Nachölen alle 2 Jahre, als halbtägiger Termin");
    expect(features[1]).toBe("Bis zu 3 Ausbesserungen pro Jahr inklusive (kleine Dellen und Kratzer)");
    expect(features).toContain("Vorrang im Notfall");

    const withSize = planFeatures(plan("boden-pass-plus"), {
      ...DEFAULT_SETTINGS.subscriptions,
      repairsPerYear: 0,
      oilingIntervalYears: 1,
      repairMaxSize: "bis 1 cm²",
    });
    expect(withSize[0]).toBe("Nachölen jedes Jahr, als halbtägiger Termin");
    expect(withSize.some((feature) => feature.startsWith("Bis zu"))).toBe(false);
  });

  it("does not repeat the term as a feature", () => {
    const features = planFeatures(plan("rueckendeckung"), DEFAULT_SETTINGS.subscriptions);
    expect(features).not.toContain("Monatlich kündbar");
  });
});
