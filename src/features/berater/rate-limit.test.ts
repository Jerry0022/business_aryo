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

const MINUTE = 60_000;

describe("berater rate limit", () => {
  it("hashes visitors without exposing the IP", () => {
    const id = visitorId("203.0.113.7");
    expect(id).toMatch(/^[0-9a-f]{32}$/);
    expect(id).not.toContain("203");
    expect(visitorId("203.0.113.7")).toBe(id);
    expect(visitorId("203.0.113.8")).not.toBe(id);
  });

  it("allows 10 questions per hour and reports the time until the window resets", async () => {
    const start = Date.UTC(2026, 0, 1, 12);
    for (let i = 0; i < 10; i++) {
      expect(await checkRateLimit("visitor-a", { now: start + i * MINUTE })).toEqual({ ok: true, remaining: 9 - i });
    }
    // 11th question 20 minutes after the first one: 40 minutes left.
    expect(await checkRateLimit("visitor-a", { now: start + 20 * MINUTE })).toEqual({
      ok: false,
      scope: "visitor",
      retryAfterSeconds: 40 * 60,
    });
    expect(await checkRateLimit("visitor-b", { now: start + 20 * MINUTE })).toMatchObject({ ok: true });
    expect(await checkRateLimit("visitor-a", { now: start + 60 * MINUTE + 1 })).toEqual({ ok: true, remaining: 9 });
  });

  it("caps all visitors together per UTC day", async () => {
    process.env.BERATER_DAILY_LIMIT = "3";
    const noon = Date.UTC(2026, 1, 1, 12);
    for (const visitor of ["c", "d", "e"])
      expect(await checkRateLimit(visitor, { now: noon })).toMatchObject({ ok: true });
    expect(await checkRateLimit("f", { now: noon })).toEqual({
      ok: false,
      scope: "global",
      retryAfterSeconds: 12 * 60 * 60,
    });
    expect(await checkRateLimit("f", { now: noon + 24 * 60 * MINUTE })).toMatchObject({ ok: true });
  });

  it("keeps all visitors below 80 % of the provider quota (requests and tokens, per minute and day)", async () => {
    process.env.BERATER_DAILY_LIMIT = "1000";
    const quota = { rpm: 5, rpd: 10, tpm: 10_000, tpd: 1_000_000 };
    const t0 = Date.UTC(2026, 2, 1, 10);
    // 80 % of 5 requests per minute = 4.
    for (const visitor of ["q1", "q2", "q3", "q4"]) {
      expect(await checkRateLimit(visitor, { now: t0, quota, tokens: 100 })).toMatchObject({ ok: true });
    }
    expect(await checkRateLimit("q5", { now: t0 + 15_000, quota, tokens: 100 })).toEqual({
      ok: false,
      scope: "global",
      retryAfterSeconds: 45,
    });
    // Next minute: tokens decide — 80 % of 10k = 8k, so a 5k request fits once, not twice.
    const t1 = t0 + 61_000;
    expect(await checkRateLimit("q6", { now: t1, quota, tokens: 5000 })).toMatchObject({ ok: true });
    expect(await checkRateLimit("q7", { now: t1 + 1000, quota, tokens: 5000 })).toMatchObject({
      ok: false,
      scope: "global",
    });
    // Daily requests: 80 % of 10 = 8. Only requests that passed the minute checks count (q1–q4, q6),
    // so three more in later minutes fit and the next one hits the day cap until midnight UTC.
    let blocked: unknown = null;
    for (let i = 2; i < 12 && !blocked; i++) {
      const result = await checkRateLimit(`d${i}`, { now: t0 + i * 61_000, quota, tokens: 10 });
      if (!result.ok) blocked = result;
    }
    expect(blocked).toEqual({ ok: false, scope: "global", retryAfterSeconds: expect.any(Number) });
    expect((blocked as { retryAfterSeconds: number }).retryAfterSeconds).toBeGreaterThan(13 * 60 * 60);
  });
});
