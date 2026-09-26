import { ipAddress } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { chatRequestSchema, type ChatErrorCode } from "@/features/berater/limits";
import { checkRateLimit, visitorId } from "@/features/berater/rate-limit";
import { chatCompletionTextStream } from "@/features/berater/sse";
import { buildSystemPrompt } from "@/features/berater/system-prompt";
import { estimateTokens, getLlmConfig, streamChat } from "@/features/berater/llm";

export const maxDuration = 60;

function fail(error: ChatErrorCode, status: number, retryAfter?: number) {
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (retryAfter) headers["Retry-After"] = String(retryAfter);
  return Response.json(retryAfter ? { error, retryAfter } : { error }, { status, headers });
}

/** Seconds from a provider's Retry-After header (seconds or HTTP date), if any. */
function upstreamRetryAfter(response: Response): number {
  const value = response.headers.get("retry-after");
  if (!value) return 60;
  const seconds = Number(value);
  const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(value) - Date.now();
  return Number.isFinite(ms) && ms > 0 ? Math.ceil(ms / 1000) : 60;
}

/** Only accept calls from our own pages (browsers always send Origin on cross-site POSTs). */
function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  } catch {
    return false;
  }
}

function clientIp(request: NextRequest): string {
  return (
    ipAddress(request) ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** Mini-Aryo: floor-advice chat, answered by Groq or Grok (xAI) and streamed back as plain text. */
export async function POST(request: NextRequest) {
  const config = getLlmConfig();
  if (!config) return fail("not_configured", 503);
  if (!isSameOrigin(request)) return fail("forbidden", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("bad_request", 400);
  }
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) return fail("bad_request", 400);

  const system = buildSystemPrompt();
  const { messages } = parsed.data;
  const visitor = visitorId(clientIp(request));
  let remaining: number;
  try {
    const limit = await checkRateLimit(visitor, {
      quota: config.provider.quota,
      tokens: estimateTokens(system, messages),
    });
    if (!limit.ok) return fail(limit.scope === "global" ? "busy" : "rate_limited", 429, limit.retryAfterSeconds);
    remaining = limit.remaining;
  } catch (error) {
    // Without a working limiter the endpoint stays closed: every call costs money.
    console.error("[berater] rate limit check failed", error);
    return fail("upstream", 503);
  }

  let upstream: Response;
  try {
    upstream = await streamChat(config, {
      system,
      messages,
      safetyId: visitor,
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(55_000)]),
    });
  } catch (error) {
    console.error(`[berater] ${config.provider.id} request failed`, error);
    return fail("upstream", 502);
  }
  if (!upstream.ok || !upstream.body) {
    console.error(`[berater] ${config.provider.id} responded`, upstream.status, await upstream.text().catch(() => ""));
    if (upstream.status === 429) return fail("busy", 429, upstreamRetryAfter(upstream));
    return fail("upstream", 502);
  }

  return new Response(upstream.body.pipeThrough(chatCompletionTextStream()), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
      "X-Chat-Remaining": String(remaining),
    },
  });
}
