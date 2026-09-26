import { describe, expect, it } from "vitest";
import { chatCompletionTextStream } from "./sse";

async function run(parts: Array<string | Uint8Array>): Promise<string> {
  const encoder = new TextEncoder();
  const source = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const part of parts) controller.enqueue(typeof part === "string" ? encoder.encode(part) : part);
      controller.close();
    },
  });
  return new Response(source.pipeThrough(chatCompletionTextStream())).text();
}

const chunk = (delta: object) => `data: ${JSON.stringify({ choices: [{ index: 0, delta }] })}\n\n`;

describe("chatCompletionTextStream", () => {
  it("keeps only visible content deltas", async () => {
    const text = await run([
      chunk({ role: "assistant", reasoning_content: "Überlege…" }),
      chunk({ content: "Geöltes " }),
      ": keep-alive\n\n",
      chunk({ content: "Parkett" }),
      chunk({}),
      "data: [DONE]\n\n",
    ]);
    expect(text).toBe("Geöltes Parkett");
  });

  it("reassembles events and multi-byte characters split across chunks", async () => {
    const bytes = new TextEncoder().encode(chunk({ content: "Fußbodenheizung – geht" }));
    // Cut right after the first byte of the two-byte "ß", i.e. inside a character and inside the JSON.
    const cut = bytes.indexOf(0xc3) + 1;
    expect(await run([bytes.slice(0, cut), bytes.slice(cut)])).toBe("Fußbodenheizung – geht");
  });

  it("handles a final event without trailing newline and ignores malformed lines", async () => {
    const text = await run([
      "data: {not json}\n",
      `data: ${JSON.stringify({ choices: [{ delta: { content: "Ende" } }] })}`,
    ]);
    expect(text).toBe("Ende");
  });
});
