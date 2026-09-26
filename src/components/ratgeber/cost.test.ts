import { describe, expect, it } from "vitest";
import { evaluateFloor, formatEuro, parseGermanNumber } from "./cost";

describe("parseGermanNumber", () => {
  it.each([
    ["", null],
    ["90", 90],
    ["12,5", 12.5],
    ["1,50 €", 1.5],
    ["1.250", 1250],
    ["1.250,50", 1250.5],
    ["12.5", 12.5],
    [" 40 ", 40],
  ])("parses %j", (raw, expected) => {
    expect(parseGermanNumber(raw)).toEqual({ ok: true, value: expected });
  });

  it.each(["abc", "12,5,1", "1.25,5", "-5", "12 Euro"])("rejects %j", (raw) => {
    expect(parseGermanNumber(raw).ok).toBe(false);
  });
});

describe("evaluateFloor", () => {
  it("divides the price by the lifetime and adds care", () => {
    const result = evaluateFloor({ name: "Eiche geölt", price: "90", lifetime: "30", care: "1,5" }, "Boden A");
    expect(result.label).toBe("Eiche geölt");
    expect(result.cost).toEqual({ purchasePerYear: 3, carePerYear: 1.5, totalPerYear: 4.5 });
    expect(formatEuro(result.cost!.totalPerYear)).toMatch(/^4,50\s€$/);
  });

  it("treats care as optional and falls back to the default label", () => {
    const result = evaluateFloor({ name: " ", price: "45", lifetime: "15", care: "" }, "Boden B");
    expect(result.label).toBe("Boden B");
    expect(result.cost?.totalPerYear).toBe(3);
  });

  it("stays empty until price and lifetime are entered", () => {
    expect(evaluateFloor({ name: "", price: "", lifetime: "", care: "" }, "Boden C")).toMatchObject({ cost: null, empty: true });
    expect(evaluateFloor({ name: "", price: "90", lifetime: "", care: "" }, "Boden C")).toMatchObject({ cost: null, empty: false });
  });

  it("reports invalid values per field", () => {
    const result = evaluateFloor({ name: "", price: "0", lifetime: "abc", care: "" }, "Boden A");
    expect(result.cost).toBeNull();
    expect(result.errors.price).toBeDefined();
    expect(result.errors.lifetime).toBeDefined();
    expect(evaluateFloor({ name: "", price: "90", lifetime: "150", care: "" }, "A").errors.lifetime).toBeDefined();
  });
});
