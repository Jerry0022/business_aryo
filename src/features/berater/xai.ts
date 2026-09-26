import "server-only";
import type { ChatMessage } from "./limits";

const DEFAULT_BASE_URL = "https://api.x.ai/v1";
const DEFAULT_MODEL = "grok-4.3";

/** Returns the xAI configuration, or null when no API key is set (assistant disabled). */
export function getXaiConfig() {
  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    model: process.env.XAI_MODEL?.trim() || DEFAULT_MODEL,
    baseUrl: (process.env.XAI_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, ""),
  };
}

export type XaiConfig = NonNullable<ReturnType<typeof getXaiConfig>>;

interface GrokRequest {
  system: string;
  messages: ChatMessage[];
  /** Stable, anonymous id of the visitor (hashed IP) for xAI's abuse detection. */
  safetyId: string;
  signal: AbortSignal;
}

/** Starts a streaming chat completion (OpenAI-compatible SSE). */
export function streamGrok(config: XaiConfig, { system, messages, safetyId, signal }: GrokRequest) {
  return fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "system", content: system }, ...messages],
      stream: true,
      temperature: 0.4,
      reasoning_effort: "low",
      max_completion_tokens: 900,
      prompt_cache_key: "mini-aryo-v1",
      safety_identifier: safetyId,
    }),
    signal,
  });
}
