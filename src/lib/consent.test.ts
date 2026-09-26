import { describe, expect, it } from "vitest";
import { CONSENT_COOKIE, CONSENT_VERSION, parseConsent, serializeConsent } from "./consent";

describe("cookie consent", () => {
  it("round-trips both choices", () => {
    for (const choice of ["granted", "denied"] as const) {
      const cookie = serializeConsent(choice, true).split(";")[0] ?? "";
      expect(parseConsent(`theme=dark; ${cookie}; other=1`)).toBe(choice);
    }
  });

  it("treats a missing, malformed or outdated cookie as no decision", () => {
    expect(parseConsent("")).toBe("unknown");
    expect(parseConsent("ph_abc_posthog=%7B%7D")).toBe("unknown");
    expect(parseConsent(`${CONSENT_COOKIE}=${CONSENT_VERSION}.maybe`)).toBe("unknown");
    expect(parseConsent(`${CONSENT_COOKIE}=${CONSENT_VERSION - 1}.granted`)).toBe("unknown");
  });

  it("writes a site-wide cookie that expires after 12 months", () => {
    const cookie = serializeConsent("granted", false);
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain(`Max-Age=${60 * 60 * 24 * 365}`);
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).not.toContain("Secure");
    expect(serializeConsent("granted", true)).toContain("Secure");
  });
});
