import { describe, expect, it } from "vitest";
import { parseBlocks, parseSpans } from "./format";

describe("chat formatting", () => {
  it("splits paragraphs and lists", () => {
    expect(parseBlocks("Kurz gesagt:\nja.\n\n- Öl\n- Lack\n\n1. Schleifen\n2) Ölen\nFertig.")).toEqual([
      { type: "p", text: "Kurz gesagt:\nja." },
      { type: "ul", items: ["Öl", "Lack"] },
      { type: "ol", items: ["Schleifen", "Ölen"] },
      { type: "p", text: "Fertig." },
    ]);
  });

  it("turns headings into bold lines", () => {
    expect(parseBlocks("### Pflege")).toEqual([{ type: "p", text: "**Pflege**" }]);
  });

  it("marks bold spans and keeps everything else as text", () => {
    expect(parseSpans("Am besten **Hartwachsöl** <b>nehmen</b>")).toEqual([
      { text: "Am besten ", bold: false },
      { text: "Hartwachsöl", bold: true },
      { text: " <b>nehmen</b>", bold: false },
    ]);
  });
});
