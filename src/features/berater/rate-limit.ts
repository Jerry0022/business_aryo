import "server-only";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { rateLimit } from "@/db/schema";
import { QUESTIONS_PER_HOUR } from "./limits";
import type { Quota } from "./llm";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Questions per visitor and hour (fixed window starting with the first question). */
export const VISITOR_LIMIT = { windowMs: HOUR, max: QUESTIONS_PER_HOUR } as const;

/** Upper bound for all visitors together per UTC day — caps the API bill. Override with BERATER_DAILY_LIMIT. */
function globalDailyLimit(): number {
  const value = Number(process.env.BERATER_DAILY_LIMIT);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 500;
}

/** Share of the provider quota all visitors together may use. Override with BERATER_QUOTA_SHARE (0–1). */
function quotaShare(): number {
  const value = Number(process.env.BERATER_QUOTA_SHARE);
  return Number.isFinite(value) && value > 0 && value <= 1 ? value : 0.8;
}

/** Anonymous, stable visitor id: salted hash of the IP, so no raw IPs are stored. */
export function visitorId(ip: string): string {
  const salt = process.env.BETTER_AUTH_SECRET ?? "mini-aryo";
  return createHash("sha256").update(`${salt}:berater:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Counts one hit in a fixed window and returns the new count plus the window start. Shares
 * Better Auth's `rate_limit` table (keys are prefixed with "berater:"), so limits hold across
 * serverless instances.
 */
async function hit(
  key: string,
  windowMs: number,
  now: number,
  amount = 1,
): Promise<{ count: number; windowStart: number }> {
  const expired = sql`${rateLimit.lastRequest} <= ${now - windowMs}`;
  const [row] = await getDb()
    .insert(rateLimit)
    .values({ id: crypto.randomUUID(), key, count: amount, lastRequest: now })
    .onConflictDoUpdate({
      target: rateLimit.key,
      set: {
        count: sql`case when ${expired} then ${amount} else ${rateLimit.count} + ${amount} end`,
        lastRequest: sql`case when ${expired} then ${now} else ${rateLimit.lastRequest} end`,
      },
    })
    .returning({ count: rateLimit.count, windowStart: rateLimit.lastRequest });
  return { count: row?.count ?? 1, windowStart: Number(row?.windowStart ?? now) };
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; scope: "visitor" | "global"; retryAfterSeconds: number };

interface CheckOptions {
  now?: number;
  /** Provider quota shared by all visitors (null: no provider quota, e.g. paid xAI). */
  quota?: Quota | null;
  /** Estimated tokens of this request, counted against the token quota. */
  tokens?: number;
}

const secondsUntil = (end: number, now: number) => Math.max(1, Math.ceil((end - now) / 1000));

/**
 * 1. Per visitor: QUESTIONS_PER_HOUR in a fixed window from the first question.
 * 2. All visitors: BERATER_DAILY_LIMIT questions per UTC day.
 * 3. All visitors: a share (default 80 %) of the provider quota — requests and estimated tokens,
 *    per minute and per UTC day — so the API key never runs into the provider's own limits.
 */
export async function checkRateLimit(
  visitor: string,
  { now = Date.now(), quota = null, tokens = 0 }: CheckOptions = {},
): Promise<RateLimitResult> {
  const own = await hit(`berater:1h:${visitor}`, VISITOR_LIMIT.windowMs, now);
  if (own.count > VISITOR_LIMIT.max) {
    return {
      ok: false,
      scope: "visitor",
      retryAfterSeconds: secondsUntil(own.windowStart + VISITOR_LIMIT.windowMs, now),
    };
  }

  const day = new Date(now).toISOString().slice(0, 10);
  const dayEnd = Date.parse(`${day}T00:00:00Z`) + DAY;
  const share = quotaShare();

  // Minute counters use one rolling fixed window per key; day counters one key per UTC day.
  type Check = { key: string; amount: number; max: number; per: "minute" | "day" };
  const checks: Check[] = [{ key: `berater:day:${day}`, amount: 1, max: globalDailyLimit(), per: "day" }];
  if (quota) {
    checks.push(
      { key: "berater:q:rpm", amount: 1, max: Math.floor(quota.rpm * share), per: "minute" },
      { key: "berater:q:tpm", amount: tokens, max: Math.floor(quota.tpm * share), per: "minute" },
      { key: `berater:q:rpd:${day}`, amount: 1, max: Math.floor(quota.rpd * share), per: "day" },
      { key: `berater:q:tpd:${day}`, amount: tokens, max: Math.floor(quota.tpd * share), per: "day" },
    );
  }
  for (const check of checks) {
    if (check.amount <= 0) continue;
    const windowMs = check.per === "minute" ? MINUTE : 2 * DAY;
    const { count, windowStart } = await hit(check.key, windowMs, now, check.amount);
    if (count > check.max) {
      const end = check.per === "minute" ? windowStart + MINUTE : dayEnd;
      return { ok: false, scope: "global", retryAfterSeconds: secondsUntil(end, now) };
    }
  }
  return { ok: true, remaining: VISITOR_LIMIT.max - own.count };
}
