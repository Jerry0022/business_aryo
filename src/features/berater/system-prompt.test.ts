import { describe, expect, it } from "vitest";
import { PATTERNS, SERVICES } from "@/components/site/content";
import { siteConfig } from "@/config/site";
import { defaultServices } from "@/lib/business/services";
import { buildSystemPrompt, EXCLUDED_WORK } from "./system-prompt";

// Work the business is not allowed to offer (Meisterpflicht) — must never be promised on the site.
const FORBIDDEN = /fischgr|chevron|tafelparkett|würfelparkett/i;

describe("excluded work", () => {
  it("is not offered anywhere in the services or pattern explorer", () => {
    for (const service of SERVICES) expect(`${service.title} ${service.text}`).not.toMatch(FORBIDDEN);
    // Including the work that only shows up once a Meister partner is active.
    for (const item of defaultServices()) expect(`${item.title} ${item.description}`).not.toMatch(FORBIDDEN);
    for (const pattern of PATTERNS) {
      expect(`${pattern.id} ${pattern.label} ${pattern.short} ${pattern.description}`).not.toMatch(FORBIDDEN);
    }
    expect(siteConfig.description).not.toMatch(FORBIDDEN);
  });
});

describe("Mini-Aryo system prompt", () => {
  const prompt = buildSystemPrompt();

  it("lists every service and the contact address", () => {
    for (const service of SERVICES) expect(prompt).toContain(service.title);
    expect(prompt).toContain("Möbelmontage");
    expect(prompt).toContain(siteConfig.email);
  });

  it("explicitly rules out the excluded work", () => {
    for (const item of EXCLUDED_WORK) expect(prompt).toContain(item);
    const offered = prompt.slice(prompt.indexOf("# Leistungen von Aryo"), prompt.indexOf("# Was Aryo NICHT"));
    expect(offered).not.toMatch(FORBIDDEN);
  });

  it("forbids prices and invented credentials and discloses the AI", () => {
    expect(prompt).toMatch(/Keine Preise/);
    expect(prompt).toMatch(/nicht „Meister“/);
    expect(prompt).toMatch(/KI-Assistent/);
  });
});
