"use client";

import { useId, useMemo, useState } from "react";
import { useHydrated } from "@/lib/use-hydrated";
import { evaluateFloor, formatEuro, type FloorField, type FloorInput, type FloorResult } from "./cost";

// "Kosten pro Jahr statt pro m²" (concept chapter 12). Inputs start empty on purpose: the owner
// does not publish prices yet, so the placeholders are neutral examples, identical in every column.

const FLOORS = [
  { key: "a", label: "Boden A", namePlaceholder: "z. B. Laminat", optional: false },
  { key: "b", label: "Boden B", namePlaceholder: "z. B. Eiche geölt", optional: false },
  { key: "c", label: "Boden C", namePlaceholder: "z. B. Vinyl", optional: true },
] as const;

const EMPTY: FloorInput = { name: "", price: "", lifetime: "", care: "" };

const FIELDS: readonly {
  key: FloorField;
  label: string;
  unit: string;
  placeholder: string;
  optional: boolean;
}[] = [
  { key: "price", label: "Preis pro m² inkl. Verlegung", unit: "€", placeholder: "z. B. 90", optional: false },
  { key: "lifetime", label: "Lebensdauer", unit: "Jahre", placeholder: "z. B. 25", optional: false },
  { key: "care", label: "Pflege pro m² und Jahr", unit: "€", placeholder: "z. B. 1,50", optional: true },
];

type Blurred = Record<string, boolean>;

export function CostPerYearCalculator() {
  const hydrated = useHydrated();
  const id = useId();
  const [inputs, setInputs] = useState<FloorInput[]>(() => FLOORS.map(() => ({ ...EMPTY })));
  const [blurred, setBlurred] = useState<Blurred>({});

  const results = useMemo(
    () => inputs.map((input, index) => evaluateFloor(input, FLOORS[index]?.label ?? `Boden ${index + 1}`)),
    [inputs],
  );
  const complete = results
    .map((result, index) => ({ result, index }))
    .filter((entry): entry is { result: FloorResult & { cost: NonNullable<FloorResult["cost"]> }; index: number } =>
      Boolean(entry.result.cost),
    );
  const max = Math.max(0, ...complete.map((entry) => entry.result.cost.totalPerYear));
  const showCare = complete.some((entry) => entry.result.cost.carePerYear > 0);
  const anyInput = inputs.some((input) => Object.values(input).some((value) => value.trim() !== ""));

  const update = (index: number, field: keyof FloorInput, value: string) =>
    setInputs((current) => current.map((input, i) => (i === index ? { ...input, [field]: value } : input)));

  const reset = () => {
    setInputs(FLOORS.map(() => ({ ...EMPTY })));
    setBlurred({});
  };

  return (
    <section
      aria-labelledby={`${id}-title`}
      data-calculator=""
      data-ready={hydrated ? "true" : undefined}
      className="mt-8 border border-strich bg-blatt"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-strich px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-graphit-muted">
        <span>Rechner</span>
        <span aria-hidden="true">Preis ÷ Jahre + Pflege</span>
      </div>

      <div className="p-5 sm:p-6">
        <h3 id={`${id}-title`} className="font-semiwide text-xl font-bold text-graphit">
          Kosten pro m² und Jahr
        </h3>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-graphit-soft">
          Preis und Lebensdauer reichen, Pflege ist optional. Die grauen Beispielwerte in den Feldern sind nur
          Platzhalter, keine Preise von mir.
        </p>

        <form className="mt-6 grid gap-4 md:grid-cols-3" onSubmit={(event) => event.preventDefault()} noValidate>
          {FLOORS.map((floor, index) => {
            const input = inputs[index] ?? EMPTY;
            const result = results[index];
            return (
              <fieldset key={floor.key} className="min-w-0 border border-strich bg-white/60 p-4">
                <legend className="px-1.5 font-mono text-xs font-medium uppercase tracking-[0.1em] text-kreide">
                  {floor.label}
                  {floor.optional ? <span className="text-graphit-muted normal-case tracking-normal"> (optional)</span> : null}
                </legend>

                <div className="space-y-3.5">
                  <div>
                    <label htmlFor={`${id}-${floor.key}-name`} className="block text-sm text-graphit-soft">
                      Bezeichnung <span className="text-graphit-muted">(optional)</span>
                    </label>
                    <input
                      id={`${id}-${floor.key}-name`}
                      type="text"
                      autoComplete="off"
                      maxLength={40}
                      value={input.name}
                      placeholder={floor.namePlaceholder}
                      onChange={(event) => update(index, "name", event.target.value)}
                      className="mt-1.5 h-11 w-full rounded-[2px] border border-strich bg-white px-3 text-[0.95rem] text-graphit placeholder:text-strich-dark"
                    />
                  </div>

                  {FIELDS.map((field) => {
                    const fieldId = `${id}-${floor.key}-${field.key}`;
                    const errorKey = `${floor.key}-${field.key}`;
                    const error = blurred[errorKey] ? result?.errors[field.key] : undefined;
                    return (
                      <div key={field.key}>
                        <label htmlFor={fieldId} className="block text-sm text-graphit-soft">
                          {field.label}
                          <span className="sr-only"> in {field.unit}</span>
                          {field.optional ? <span className="text-graphit-muted"> (optional)</span> : null}
                        </label>
                        <div className="relative mt-1.5">
                          <input
                            id={fieldId}
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={input[field.key]}
                            placeholder={field.placeholder}
                            aria-invalid={error ? true : undefined}
                            aria-describedby={error ? `${fieldId}-error` : undefined}
                            onChange={(event) => update(index, field.key, event.target.value)}
                            onBlur={() => setBlurred((current) => ({ ...current, [errorKey]: true }))}
                            className={`h-11 w-full rounded-[2px] border bg-white pl-3 pr-16 font-mono text-[0.95rem] tabular-nums text-graphit placeholder:font-sans placeholder:text-strich-dark ${
                              error ? "border-[#b3261e]" : "border-strich"
                            }`}
                          />
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs text-graphit-muted"
                          >
                            {field.unit}
                          </span>
                        </div>
                        {error ? (
                          <p id={`${fieldId}-error`} className="mt-1.5 text-sm leading-snug text-[#b3261e]">
                            {error}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </form>

        <div className="mt-8 border-t border-dashed border-strich pt-6">
          <h4 className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-graphit-muted sm:text-xs">
            Ergebnis · Euro pro m² und Jahr
          </h4>

          {complete.length === 0 ? (
            <p className="mt-3 text-[0.95rem] leading-relaxed text-graphit-soft">
              Trag bei mindestens einem Boden Preis und Lebensdauer ein. Für einen Vergleich brauchst du zwei.
            </p>
          ) : (
            <>
              {showCare ? (
                <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-graphit-soft" aria-label="Legende">
                  <li className="flex items-center gap-2">
                    <span aria-hidden="true" className="inline-block size-3 rounded-[2px] bg-kreide" />
                    Anschaffung pro Jahr (Preis ÷ Lebensdauer)
                  </li>
                  <li className="flex items-center gap-2">
                    <span aria-hidden="true" className="inline-block size-3 rounded-[2px] bg-eiche" />
                    Pflege pro Jahr
                  </li>
                </ul>
              ) : null}

              <ul className="mt-5 space-y-5" data-results="">
                {complete.map(({ result, index }) => {
                  const { purchasePerYear, carePerYear, totalPerYear } = result.cost;
                  const purchaseWidth = max > 0 ? (purchasePerYear / max) * 100 : 0;
                  const careWidth = max > 0 ? (carePerYear / max) * 100 : 0;
                  return (
                    <li key={FLOORS[index]?.key ?? index} data-floor={FLOORS[index]?.key}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                        <span className="font-semibold text-graphit">{result.label}</span>
                        <span className="font-mono text-[0.95rem] text-graphit">
                          <span data-total="">{formatEuro(totalPerYear)}</span>
                          <span className="text-graphit-muted"> pro m² und Jahr</span>
                        </span>
                      </div>
                      <div aria-hidden="true" className="mt-2 flex h-5 w-full items-stretch border-l border-graphit">
                        <span className="block h-full bg-kreide" style={{ width: `${purchaseWidth}%` }} />
                        {carePerYear > 0 ? (
                          <span
                            className="block h-full rounded-r-[2px] border-l-2 border-blatt bg-eiche"
                            style={{ width: `${careWidth}%` }}
                          />
                        ) : null}
                      </div>
                      {carePerYear > 0 ? (
                        <p className="mt-1.5 font-mono text-xs text-graphit-muted">
                          {formatEuro(purchasePerYear)} Anschaffung + {formatEuro(carePerYear)} Pflege
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <p role="status" className="mt-5 text-[0.95rem] font-medium leading-relaxed text-graphit">
            {verdict(complete.map((entry) => entry.result))}
          </p>
        </div>

        <div className="mt-6 border-l-2 border-eiche bg-estrich/60 px-4 py-3.5 text-[0.95rem] leading-relaxed text-graphit-soft">
          <p>
            <strong className="font-semibold text-graphit">Ehrlich gesagt:</strong> Die Lebensdauer ist die wackligste
            Zahl in dieser Rechnung. Sie hängt davon ab, wie der Boden genutzt und gepflegt wird. Parkett lässt sich je
            nach Nutzschicht mehrmals abschleifen und hält dann länger, jeder Schliff kostet aber Geld. Laminat und Vinyl
            lassen sich nicht abschleifen. Das Ergebnis ist eine Rechenhilfe, kein Angebot.
          </p>
        </div>

        {anyInput ? (
          <button
            type="button"
            onClick={reset}
            className="mt-5 inline-flex items-center rounded-[2px] border border-strich-dark px-4 py-2.5 text-sm font-medium text-graphit transition-colors hover:border-graphit hover:bg-estrich"
          >
            Eingaben löschen
          </button>
        ) : null}
      </div>
    </section>
  );
}

/** One sentence that sums up the comparison (also announced to screen readers). */
function verdict(results: readonly FloorResult[]): string {
  const withCost = results.filter((result): result is FloorResult & { cost: NonNullable<FloorResult["cost"]> } =>
    Boolean(result.cost),
  );
  if (withCost.length === 0) return "";
  if (withCost.length === 1) {
    const [only] = withCost;
    return `${only!.label} kostet dich ${formatEuro(only!.cost.totalPerYear)} pro m² und Jahr. Trag einen zweiten Boden ein, um zu vergleichen.`;
  }
  const sorted = [...withCost].sort((a, b) => a.cost.totalPerYear - b.cost.totalPerYear);
  const cheapest = sorted[0]!;
  const priciest = sorted[sorted.length - 1]!;
  const difference = priciest.cost.totalPerYear - cheapest.cost.totalPerYear;
  if (difference < 0.005) return "Pro Jahr kosten deine Böden praktisch gleich viel. Dann entscheiden Gefühl, Pflege und Optik.";
  return `Pro Jahr am günstigsten: ${cheapest.label}, ${formatEuro(difference)} pro m² weniger als ${priciest.label}.`;
}
