import { describe, expect, it } from "vitest";
import { posthogDashboardUrl } from "./posthog-dashboard";

describe("posthogDashboardUrl", () => {
  it("defaults to the EU cloud app", () => {
    expect(posthogDashboardUrl(undefined, undefined)).toBe("https://eu.posthog.com");
  });

  it("maps the ingest host to the app host", () => {
    expect(posthogDashboardUrl("https://us.i.posthog.com/", undefined)).toBe("https://us.posthog.com");
  });

  it("opens the project's web analytics when the project id is known", () => {
    expect(posthogDashboardUrl("https://eu.i.posthog.com", " 12345 ")).toBe(
      "https://eu.posthog.com/project/12345/web",
    );
    expect(posthogDashboardUrl("https://eu.i.posthog.com", "abc")).toBe("https://eu.posthog.com");
  });

  it("keeps a self-hosted instance as is", () => {
    expect(posthogDashboardUrl("https://analytics.example.com", "7")).toBe(
      "https://analytics.example.com/project/7/web",
    );
  });
});
