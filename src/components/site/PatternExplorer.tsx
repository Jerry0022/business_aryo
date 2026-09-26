"use client";

import { Check } from "lucide-react";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { PATTERNS } from "./content";
import { buildParquet, type ParquetGeometry, type PatternId } from "./parquet/geometry";
import { ParquetSvg } from "./parquet/ParquetSvg";
import { WOOD_IDS, WOODS, type WoodId } from "./parquet/woods";

const PREVIEW_SIZE = { width: 780, height: 540 };
const PATTERN_IDS = PATTERNS.map((p) => p.id);

/** Roving-tabindex keyboard handling for an ARIA radio group (arrows, Home, End). */
function useRadioKeys<T extends string>(ids: readonly T[], value: T, onChange: (id: T) => void) {
  const refs = useRef(new Map<T, HTMLButtonElement>());

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = ids.indexOf(value);
    let next: number | null = null;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = (index + 1) % ids.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = (index - 1 + ids.length) % ids.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = ids.length - 1;
        break;
    }
    if (next === null) return;
    event.preventDefault();
    const id = ids[next];
    if (id === undefined) return;
    onChange(id);
    refs.current.get(id)?.focus();
  };

  const register = (id: T) => (element: HTMLButtonElement | null) => {
    if (element) refs.current.set(id, element);
    else refs.current.delete(id);
  };

  return { onKeyDown, register };
}

export function PatternExplorer() {
  const [patternId, setPatternId] = useState<PatternId>("fischgraet");
  const [woodId, setWoodId] = useState<WoodId>("eiche-natur");
  const pattern = PATTERNS.find((p) => p.id === patternId) ?? PATTERNS[0]!;
  const wood = WOODS[woodId];

  const geometry = useMemo(
    () => buildParquet(pattern.id, { ...PREVIEW_SIZE, unit: pattern.unit, seed: 7 }),
    [pattern.id, pattern.unit],
  );
  const thumbnails = useMemo(() => {
    const map = new Map<PatternId, ParquetGeometry>();
    for (const p of PATTERNS) {
      map.set(p.id, buildParquet(p.id, { width: 96, height: 96, unit: 6.5, seed: 3, detail: false }));
    }
    return map;
  }, []);

  const patternKeys = useRadioKeys(PATTERN_IDS, patternId, setPatternId);
  const woodKeys = useRadioKeys(WOOD_IDS, woodId, setWoodId);

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="lg:col-span-7 lg:col-start-6 lg:row-start-1 lg:pt-9">
        <figure>
          <div className="explorer-preview relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-walnut shadow-[0_40px_80px_-40px_rgb(86_53_33/0.6)] ring-1 ring-ink/10 sm:aspect-[3/2]">
            <ParquetSvg
              key={pattern.id}
              geometry={geometry}
              wood={woodId}
              title={`Vorschau: ${pattern.label} in ${wood.label}`}
              className="absolute inset-0 size-full"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgb(255_244_224/0.28)_0%,rgb(255_244_224/0)_42%),radial-gradient(120%_90%_at_50%_120%,rgb(23_19_15/0.35),transparent_60%)]"
              aria-hidden="true"
            />
            <div className="absolute bottom-4 left-4 flex items-center gap-2.5 rounded-full bg-paper/90 py-1.5 pl-1.5 pr-4 text-sm text-ink shadow-lg backdrop-blur-md sm:bottom-5 sm:left-5">
              <span
                className="size-6 rounded-full ring-1 ring-ink/10"
                style={{ background: `linear-gradient(135deg, ${wood.swatch[0]}, ${wood.swatch[1]})` }}
                aria-hidden="true"
              />
              <span className="font-semibold">{pattern.label}</span>
              <span className="hidden text-ink-muted sm:inline">· {wood.label}</span>
            </div>
          </div>
          <figcaption className="mt-6 min-h-[5.5rem]" aria-live="polite">
            <p className="font-display text-2xl font-medium tracking-[-0.015em] text-ink">
              {pattern.label} <span className="text-ink-muted">in {wood.label}</span>
            </p>
            <p className="mt-2 max-w-xl text-pretty leading-relaxed text-ink-muted">{pattern.description}</p>
          </figcaption>
        </figure>
      </div>

      <div className="lg:col-span-5 lg:col-start-1 lg:row-start-1">
        <p id="muster-pattern-label" className="text-xs font-semibold uppercase tracking-[0.22em] text-oak-deep">
          Verlegemuster
        </p>
        <div role="radiogroup" aria-labelledby="muster-pattern-label" className="mt-4 grid gap-2">
          {PATTERNS.map((p) => {
            const checked = p.id === patternId;
            const thumb = thumbnails.get(p.id);
            return (
              <button
                key={p.id}
                ref={patternKeys.register(p.id)}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked ? 0 : -1}
                onClick={() => setPatternId(p.id)}
                onKeyDown={patternKeys.onKeyDown}
                className="group flex w-full items-center gap-4 rounded-2xl border border-transparent p-2.5 pr-4 text-left transition duration-300 hover:bg-paper/60 aria-checked:border-ink/10 aria-checked:bg-paper aria-checked:shadow-[0_12px_32px_-20px_rgb(86_53_33/0.55)]"
              >
                <span className="relative size-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-ink/10">
                  {thumb && <ParquetSvg geometry={thumb} wood={woodId} className="absolute inset-0 size-full" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-medium leading-tight text-ink">{p.label}</span>
                  <span className="mt-0.5 block text-sm text-ink-muted">{p.short}</span>
                </span>
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-full border border-ink/20 text-paper transition group-aria-checked:border-ink group-aria-checked:bg-ink"
                  aria-hidden="true"
                >
                  <Check className="size-3.5 opacity-0 transition group-aria-checked:opacity-100" strokeWidth={3} />
                </span>
              </button>
            );
          })}
        </div>

        <p id="muster-wood-label" className="mt-10 text-xs font-semibold uppercase tracking-[0.22em] text-oak-deep">
          Holzton
        </p>
        <div
          role="radiogroup"
          aria-labelledby="muster-wood-label"
          className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {WOOD_IDS.map((id) => {
            const tone = WOODS[id];
            const checked = id === woodId;
            return (
              <button
                key={id}
                ref={woodKeys.register(id)}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked ? 0 : -1}
                onClick={() => setWoodId(id)}
                onKeyDown={woodKeys.onKeyDown}
                className="group flex flex-col items-center gap-2.5 rounded-2xl border border-transparent px-2 py-3.5 text-center transition duration-300 hover:bg-paper/60 aria-checked:border-ink/10 aria-checked:bg-paper aria-checked:shadow-[0_12px_32px_-20px_rgb(86_53_33/0.55)]"
              >
                <span
                  className="size-11 rounded-full shadow-inner ring-2 ring-transparent ring-offset-2 ring-offset-sand transition group-aria-checked:ring-ink group-aria-checked:ring-offset-paper"
                  style={{
                    background: `repeating-linear-gradient(100deg, ${tone.fills[0]} 0 5px, ${tone.fills[2]} 5px 7px, ${tone.fills[3]} 7px 11px, ${tone.fills[4]} 11px 12px)`,
                  }}
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold leading-tight text-ink">{tone.label}</span>
                <span className="sr-only">– {tone.note}</span>
              </button>
            );
          })}
        </div>

        <p className="mt-8 text-sm leading-relaxed text-ink-muted">
          Die Vorschau ist eine vereinfachte Illustration. Holzart, Sortierung und Oberfläche besprechen wir gemeinsam
          vor Ort.
        </p>
      </div>
    </div>
  );
}
