/** Minimal, safe formatting for chat answers: paragraphs, "- " / "1. " lists and **bold**. */

export type Block = { type: "p"; text: string } | { type: "ul" | "ol"; items: string[] };
export type Span = { text: string; bold: boolean };

const BULLET = /^\s*[-*•]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;

export function parseBlocks(input: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length) blocks.push({ type: "p", text: paragraph.join("\n") });
    paragraph = [];
  };

  for (const raw of input.replace(/\r\n?/g, "\n").split("\n")) {
    // Headings are not wanted in the chat; show them as bold lines.
    const line = raw.replace(/^\s*#{1,6}\s+(.*)$/, "**$1**");
    const type = BULLET.test(line) ? "ul" : NUMBERED.test(line) ? "ol" : null;
    if (type) {
      flush();
      const item = line.replace(type === "ul" ? BULLET : NUMBERED, "");
      const last = blocks.at(-1);
      if (last && last.type === type) last.items.push(item);
      else blocks.push({ type, items: [item] });
    } else if (line.trim() === "") {
      flush();
    } else {
      paragraph.push(line.trim());
    }
  }
  flush();
  return blocks;
}

export function parseSpans(text: string): Span[] {
  return text
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4
        ? { text: part.slice(2, -2), bold: true }
        : { text: part, bold: false },
    );
}

/** 90 → "1:30", 3725 → "1:02:05". */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = String(s % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}
