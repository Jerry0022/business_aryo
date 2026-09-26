import { z } from "zod";

/** Limits shared by the chat UI and the API route. */
export const CHAT_LIMITS = {
  /** Characters per message the visitor can type. */
  maxInputChars: 1000,
  /** Messages of history sent to the model (older ones are dropped by the client). */
  maxHistory: 8,
  /** Characters per stored message (assistant answers included). */
  maxMessageChars: 4000,
} as const;

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(CHAT_LIMITS.maxMessageChars),
});

export const chatRequestSchema = z.object({
  messages: z
    .array(chatMessageSchema)
    .min(1)
    .max(CHAT_LIMITS.maxHistory)
    .refine((messages) => messages.at(-1)?.role === "user", "The last message must come from the user.")
    .refine(
      (messages) => (messages.at(-1)?.content.length ?? 0) <= CHAT_LIMITS.maxInputChars,
      "The question is too long.",
    ),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

/** Error codes the API returns as `{ error, retryAfter? }`; the UI maps them to German messages. */
export type ChatErrorCode = "not_configured" | "bad_request" | "forbidden" | "rate_limited" | "busy" | "upstream";

/** Questions per visitor and hour; mirrored in the UI hint. */
export const QUESTIONS_PER_HOUR = 10;
