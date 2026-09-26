import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

process.env.DATABASE_URL = "pglite://memory";
process.env.BERATER_DAILY_LIMIT = "1000";

const { getDb } = await import("@/db");
const { checkRateLimit, visitorId } = await import("./rate-limit");

beforeAll(async () => {
  const migration = readFileSync(new URL("../../../drizzle/0000_init.sql", import.meta.url), "utf8");
  const client = (getDb() as unknown as { $client: { exec: (sql: string) => Promise<unknown> } }).$client;
  await client.exec(migration.replaceAll("--> statement-breakpoint", ""));
});

describe("berater rate limit", () => {
  it("hashes visitors without exposing the IP", () => {
    const id = visitorId("203.0.113.7");
    expect(id).toMatch(/^[0-9a-f]{32}$/);
    expect(id).not.toContain("203");
    expect(visitorId("203.0.113.7")).toBe(id);
    expect(visitorId("203.0.113.8")).not.toBe(id);
  });

  it("limits a single visitor per window and resets after it", async () => {
    const start = Date.UTC(2026, 0, 1, 12);
    for (let i = 0; i < 15; i++) expect(await checkRateLimit("visitor-a", start + i)).toEqual({ ok: true });
    expect(await checkRateLimit("visitor-a", start + 20)).toEqual({ ok: false, scope: "visitor" });
    expect(await checkRateLimit("visitor-a", start + 10 * 60_000 + 1)).toEqual({ ok: true });
  });

  it("caps all visitors together per day", async () => {
    process.env.BERATER_DAILY_LIMIT = "3";
    const day = Date.UTC(2026, 1, 1, 12);
    for (const visitor of ["b", "c", "d"]) expect(await checkRateLimit(visitor, day)).toEqual({ ok: true });
    expect(await checkRateLimit("e", day)).toEqual({ ok: false, scope: "global" });
    expect(await checkRateLimit("e", day + 24 * 60 * 60_000)).toEqual({ ok: true });
  });
});
