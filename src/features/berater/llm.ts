import "server-only";
import type { ChatMessage } from "./limits";

type ProviderId = "groq" | "xai";

/** Provider quota for the whole API key: requests and tokens per minute and per day. */
export interface Quota {
  rpm: number;
  rpd: number;
  tpm: number;
  tpd: number;
}

interface Provider {
  id: ProviderId;
  /** Shown in the Datenschutzerklärung. */
  company: string;
  keyEnv: string;
  modelEnv: string;
  defaultModel: string;
  baseUrl: string;
  /** Limits of the account plan; all visitors together stay below a share of them (see rate-limit.ts). */
  quota: Quota | null;
  /** Provider-specific request fields on top of the OpenAI-compatible basics. */
  extraBody: (model: string, safetyId: string) => Record<string, unknown>;
}

const PROVIDERS: readonly Provider[] = [
  {
    // Groq (groq.com) — fast open-weight models, free developer plan. Preferred when configured.
    id: "groq",
    company: "Groq, Inc. (USA)",
    keyEnv: "GROQ_API_KEY",
    modelEnv: "GROQ_MODEL",
    defaultModel: "openai/gpt-oss-120b",
    baseUrl: "https://api.groq.com/openai/v1",
    // Free developer plan for openai/gpt-oss-120b (console.groq.com/docs/rate-limits).
    quota: { rpm: 30, rpd: 1000, tpm: 8000, tpd: 200_000 },
    extraBody: (model) =>
      model.startsWith("openai/gpt-oss") ? { reasoning_effort: "low", include_reasoning: false } : {},
  },
  {
    // Grok by xAI (x.ai) — paid API credits.
    id: "xai",
    company: "xAI (USA)",
    keyEnv: "XAI_API_KEY",
    modelEnv: "XAI_MODEL",
    defaultModel: "grok-4.3",
    baseUrl: "https://api.x.ai/v1",
    // Paid per token; BERATER_DAILY_LIMIT caps the bill instead.
    quota: null,
    extraBody: (_model, safetyId) => ({
      temperature: 0.4,
      reasoning_effort: "low",
      prompt_cache_key: "mini-aryo-v1",
      safety_identifier: safetyId,
    }),
  },
];

/** The first provider with an API key (Groq before xAI), or null when the assistant is disabled. */
export function getLlmConfig(env: Record<string, string | undefined> = process.env) {
  for (const provider of PROVIDERS) {
    const apiKey = env[provider.keyEnv]?.trim();
    if (apiKey) return { provider, apiKey, model: env[provider.modelEnv]?.trim() || provider.defaultModel };
  }
  return null;
}

export type LlmConfig = NonNullable<ReturnType<typeof getLlmConfig>>;

interface ChatRequest {
  system: string;
  messages: ChatMessage[];
  /** Stable, anonymous id of the visitor (hashed IP) for the provider's abuse detection. */
  safetyId: string;
  signal: AbortSignal;
}

/** Output tokens budgeted per answer (reasoning + visible text) for quota accounting. */
const OUTPUT_TOKEN_ESTIMATE = 600;

/** Conservative token estimate of a request (≈ 3 characters per token for German text). */
export function estimateTokens(system: string, messages: ChatMessage[]): number {
  const chars = messages.reduce((sum, message) => sum + message.content.length, system.length);
  return Math.ceil(chars / 3) + OUTPUT_TOKEN_ESTIMATE;
}

/** Starts a streaming chat completion (OpenAI-compatible SSE). */
export function streamChat(
  { provider, apiKey, model }: LlmConfig,
  { system, messages, safetyId, signal }: ChatRequest,
) {
  return fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, ...messages],
      stream: true,
      max_completion_tokens: 1200,
      ...provider.extraBody(model, safetyId),
    }),
    signal,
  });
}
