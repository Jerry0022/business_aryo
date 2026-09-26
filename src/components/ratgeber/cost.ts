// Pure logic of the Kosten-pro-Jahr-Rechner: parse German number input, validate, compute the
// cost per m² and year = price per m² (incl. laying) / lifetime in years + care per m² and year.

export type ParsedNumber = { ok: true; value: number | null } | { ok: false; error: string };

const NOT_A_NUMBER = "Bitte eine Zahl eingeben, zum Beispiel 90 oder 12,50.";

/**
 * Parses a number typed the German way. Accepts "90", "12,5", "1.250", "1.250,50", "12.5",
 * spaces and a trailing "€". Empty input is valid and yields `null`.
 */
export function parseGermanNumber(raw: string): ParsedNumber {
  const text = raw.replace(/[\s €]/g, "");
  if (text === "") return { ok: true, value: null };
  let normalized: string;
  if (text.includes(",")) {
    // Comma is the decimal separator; dots can only be thousands separators.
    if (!/^\d{1,3}(\.\d{3})*(,\d+)?$|^\d+(,\d+)?$/.test(text)) return { ok: false, error: NOT_A_NUMBER };
    normalized = text.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    normalized = text.replace(/\./g, "");
  } else if (/^\d+(\.\d+)?$/.test(text)) {
    normalized = text;
  } else {
    return { ok: false, error: NOT_A_NUMBER };
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? { ok: true, value } : { ok: false, error: NOT_A_NUMBER };
}

export interface FloorInput {
  name: string;
  price: string;
  lifetime: string;
  care: string;
}

export type FloorField = "price" | "lifetime" | "care";

export interface FloorResult {
  /** Display label: the typed name or the fallback ("Boden A"). */
  label: string;
  errors: Partial<Record<FloorField, string>>;
  /** Present when price and lifetime are valid. */
  cost: { purchasePerYear: number; carePerYear: number; totalPerYear: number } | null;
  /** true when nothing numeric was entered yet. */
  empty: boolean;
}

export const MAX_LIFETIME_YEARS = 100;

export function evaluateFloor(input: FloorInput, fallbackLabel: string): FloorResult {
  const errors: FloorResult["errors"] = {};
  const price = parseGermanNumber(input.price);
  const lifetime = parseGermanNumber(input.lifetime);
  const care = parseGermanNumber(input.care);

  if (!price.ok) errors.price = price.error;
  else if (price.value !== null && price.value <= 0) errors.price = "Der Preis muss größer als 0 sein.";

  if (!lifetime.ok) errors.lifetime = lifetime.error;
  else if (lifetime.value !== null && lifetime.value <= 0) errors.lifetime = "Die Lebensdauer muss größer als 0 sein.";
  else if (lifetime.value !== null && lifetime.value > MAX_LIFETIME_YEARS)
    errors.lifetime = `Mehr als ${MAX_LIFETIME_YEARS} Jahre? Das verspricht dir hoffentlich niemand.`;

  if (!care.ok) errors.care = care.error;
  else if (care.value !== null && care.value < 0) errors.care = "Pflegekosten können nicht negativ sein.";

  const label = input.name.trim() || fallbackLabel;
  const empty = [price, lifetime, care].every((field) => field.ok && field.value === null);
  const priceValue = price.ok ? price.value : null;
  const lifetimeValue = lifetime.ok ? lifetime.value : null;

  if (errors.price || errors.lifetime || errors.care || priceValue === null || lifetimeValue === null) {
    return { label, errors, cost: null, empty };
  }
  const purchasePerYear = priceValue / lifetimeValue;
  const carePerYear = care.ok && care.value !== null ? care.value : 0;
  return { label, errors, cost: { purchasePerYear, carePerYear, totalPerYear: purchasePerYear + carePerYear }, empty };
}

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export function formatEuro(value: number): string {
  return euro.format(value);
}
