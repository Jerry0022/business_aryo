/**
 * Turns an OpenAI-compatible chat-completions SSE stream (as sent by the xAI API with
 * `stream: true`) into plain UTF-8 text containing only the visible answer deltas.
 * Reasoning deltas, keep-alive comments and the final `[DONE]` marker are dropped.
 */
export function chatCompletionTextStream(): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const handleLine = (line: string, controller: TransformStreamDefaultController<Uint8Array>) => {
    if (!line.startsWith("data:")) return;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") return;
    let chunk: unknown;
    try {
      chunk = JSON.parse(data);
    } catch {
      return;
    }
    const text = deltaContent(chunk);
    if (text) controller.enqueue(encoder.encode(text));
  };

  return new TransformStream({
    transform(bytes, controller) {
      buffer += decoder.decode(bytes, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) handleLine(line, controller);
    },
    flush(controller) {
      buffer += decoder.decode();
      if (buffer) handleLine(buffer, controller);
    },
  });
}

function deltaContent(chunk: unknown): string | null {
  if (typeof chunk !== "object" || chunk === null || !("choices" in chunk)) return null;
  const { choices } = chunk as { choices?: Array<{ delta?: { content?: unknown } }> };
  const content = choices?.[0]?.delta?.content;
  return typeof content === "string" && content.length > 0 ? content : null;
}
