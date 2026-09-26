import { ipAddress } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { chatRequestSchema, type ChatErrorCode } from "@/features/berater/limits";
import { checkRateLimit, visitorId } from "@/features/berater/rate-limit";
import { chatCompletionTextStream } from "@/features/berater/sse";
import { buildSystemPrompt } from "@/features/berater/system-prompt";
import { getXaiConfig, streamGrok } from "@/features/berater/xai";

export const maxDuration = 60;

function fail(error: ChatErrorCode, status: number) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
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

/** Mini-Aryo: floor-advice chat, answered by Grok (xAI) and streamed back as plain text. */
export async function POST(request: NextRequest) {
  const config = getXaiConfig();
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

  const visitor = visitorId(clientIp(request));
  try {
    const limit = await checkRateLimit(visitor);
    if (!limit.ok) return fail(limit.scope === "global" ? "busy" : "rate_limited", 429);
  } catch (error) {
    // Without a working limiter the endpoint stays closed: every call costs money.
    console.error("[berater] rate limit check failed", error);
    return fail("upstream", 503);
  }

  let upstream: Response;
  try {
    upstream = await streamGrok(config, {
      system: buildSystemPrompt(),
      messages: parsed.data.messages,
      safetyId: visitor,
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(55_000)]),
    });
  } catch (error) {
    console.error("[berater] xAI request failed", error);
    return fail("upstream", 502);
  }
  if (!upstream.ok || !upstream.body) {
    console.error("[berater] xAI responded", upstream.status, await upstream.text().catch(() => ""));
    return fail(upstream.status === 429 ? "busy" : "upstream", 502);
  }

  return new Response(upstream.body.pipeThrough(chatCompletionTextStream()), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
