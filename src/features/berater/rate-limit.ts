import "server-only";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { rateLimit } from "@/db/schema";

const MINUTE = 60_000;

/** Per visitor: questions per 10 minutes and per day. */
const VISITOR_LIMITS = [
  { name: "10m", windowMs: 10 * MINUTE, max: 15 },
  { name: "1d", windowMs: 24 * 60 * MINUTE, max: 60 },
] as const;

/** Upper bound for all visitors together per day — caps the API bill. Override with BERATER_DAILY_LIMIT. */
function globalDailyLimit(): number {
  const value = Number(process.env.BERATER_DAILY_LIMIT);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 500;
}

/** Anonymous, stable visitor id: salted hash of the IP, so no raw IPs are stored. */
export function visitorId(ip: string): string {
  const salt = process.env.BETTER_AUTH_SECRET ?? "mini-aryo";
  return createHash("sha256").update(`${salt}:berater:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Counts one hit in a fixed window and returns the new count. Shares Better Auth's `rate_limit`
 * table (keys are prefixed with "berater:"), so limits hold across serverless instances.
 */
async function hit(key: string, windowMs: number, now: number): Promise<number> {
  const expired = sql`${rateLimit.lastRequest} <= ${now - windowMs}`;
  const [row] = await getDb()
    .insert(rateLimit)
    .values({ id: crypto.randomUUID(), key, count: 1, lastRequest: now })
    .onConflictDoUpdate({
      target: rateLimit.key,
      set: {
        count: sql`case when ${expired} then 1 else ${rateLimit.count} + 1 end`,
        lastRequest: sql`case when ${expired} then ${now} else ${rateLimit.lastRequest} end`,
      },
    })
    .returning({ count: rateLimit.count });
  return row?.count ?? 1;
}

export type RateLimitResult = { ok: true } | { ok: false; scope: "visitor" | "global" };

export async function checkRateLimit(visitor: string, now = Date.now()): Promise<RateLimitResult> {
  for (const limit of VISITOR_LIMITS) {
    const count = await hit(`berater:${limit.name}:${visitor}`, limit.windowMs, now);
    if (count > limit.max) return { ok: false, scope: "visitor" };
  }
  const day = new Date(now).toISOString().slice(0, 10);
  const total = await hit(`berater:day:${day}`, 48 * 60 * MINUTE, now);
  if (total > globalDailyLimit()) return { ok: false, scope: "global" };
  return { ok: true };
}
