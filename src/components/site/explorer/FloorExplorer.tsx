"use client";

import dynamic from "next/dynamic";
import { Component, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { MATERIALS, PATTERNS, type MaterialId } from "../content";
import { usePrefersReducedMotion, useNearViewport, useWebGLSupport } from "../hooks";
import { buildParquet, type ParquetGeometry, type PatternId } from "../parquet/geometry";
import { ParquetSvg } from "../parquet/ParquetSvg";
import { WOOD_IDS, WOODS, type WoodId } from "../parquet/woods";
import { container, eyebrow, SectionHeader } from "../ui";

// Boden-Explorer: material, pattern and wood tone on a 3D sample board. The 3D part is loaded only
// when the section comes close to the viewport; until then (and without WebGL) a flat SVG preview
// of the same pattern is shown.

const FloorSample3D = dynamic(() => import("./FloorSample3D"), { ssr: false, loading: () => null });

const PATTERN_IDS = PATTERNS.map((pattern) => pattern.id);
const MATERIAL_IDS = MATERIALS.map((material) => material.id);
const PREVIEW = { width: 780, height: 520 } as const;

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

/** Keeps the flat preview if WebGL fails at runtime (context loss, driver issues). */
class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const radioBase =
  "group flex items-center gap-3 rounded-lg border transition-colors hover:border-nuss/60 aria-checked:border-kupfer aria-checked:bg-creme aria-checked:shadow-[0_10px_24px_-18px_rgb(35_25_19/0.6)]";

export function FloorExplorer({ hasMasterPartner }: { hasMasterPartner: boolean }) {
  const [material, setMaterial] = useState<MaterialId>("parkett");
  const [patternId, setPatternId] = useState<PatternId>("landhausdiele");
  const [woodId, setWoodId] = useState<WoodId>("eiche-natur");
  const [yaw, setYaw] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const loadNow = useNearViewport(previewRef, "400px", true);
  const onScreen = useNearViewport(previewRef, "0px");
  const webgl = useWebGLSupport();
  const reducedMotion = usePrefersReducedMotion();
  const show3D = loadNow && webgl === true && !failed;

  const materialInfo = MATERIALS.find((item) => item.id === material) ?? MATERIALS[0]!;
  const pattern = PATTERNS.find((item) => item.id === patternId) ?? PATTERNS[0]!;
  const wood = WOODS[woodId];
  const isParkett = material === "parkett";
  const shownPattern: PatternId = isParkett ? pattern.id : "landhausdiele";
  const patternLabel = isParkett ? pattern.label : `${materialInfo.label}-Diele`;
  const previewName = `Vorschau: ${patternLabel} in ${wood.label}`;

  const geometry = useMemo(
    () =>
      buildParquet(shownPattern, {
        ...PREVIEW,
        unit: isParkett ? pattern.unit : material === "vinyl" ? 17 : 20,
        seed: 7,
      }),
    [shownPattern, isParkett, pattern.unit, material],
  );
  const thumbnails = useMemo(() => {
    const map = new Map<PatternId, ParquetGeometry>();
    for (const item of PATTERNS) {
      map.set(item.id, buildParquet(item.id, { width: 96, height: 96, unit: 6.5, seed: 3, detail: false }));
    }
    return map;
  }, []);

  const materialKeys = useRadioKeys(MATERIAL_IDS, material, setMaterial);
  const patternKeys = useRadioKeys(PATTERN_IDS, patternId, setPatternId);
  const woodKeys = useRadioKeys(WOOD_IDS, woodId, setWoodId);

  const rotate = (delta: number) => {
    setInteracted(true);
    setYaw((value) => value + delta);
  };

  const gluedNote = pattern.glued
    ? hasMasterPartner
      ? "Klassisch wird dieses Muster verklebt. Das übernimmt mein Parkettleger-Meisterpartner, Planung und Material kommen von mir."
      : "Klassisch wird dieses Muster verklebt. Das übernimmt ein Parkettleger-Meisterbetrieb, Planung und Material bekommst du von mir."
    : "Gibt es auch als Fertigparkett zum schwimmenden Verlegen.";

  return (
    <section id="muster" aria-labelledby="muster-title" className="scroll-mt-16 border-t border-fuge py-20 sm:py-24 xl:scroll-mt-20">
      <div className={container}>
        <SectionHeader id="muster" label="3D-Boden-Explorer" title="Böden zum Anfassen">
          <p>Material, Muster und Holzton: dreh die Probe, bis du weißt, was dir gefällt. Und was nicht.</p>
        </SectionHeader>

        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:gap-y-6">
          <div className="min-w-0 lg:col-span-7 lg:col-start-6 lg:row-start-1">
            <figure className="flex flex-col gap-4">
              <div
                ref={previewRef}
                role="img"
                aria-label={previewName}
                className="drawing-grid relative aspect-[4/3] overflow-hidden rounded-2xl border border-fuge bg-creme"
              >
                <div
                  className={`absolute inset-[12%] transition-opacity duration-500 ${ready && show3D ? "opacity-0" : "opacity-100"}`}
                  aria-hidden="true"
                >
                  <div className="explorer-flat size-full shadow-[0_30px_40px_-24px_rgb(35_25_19/0.55)]">
                    <ParquetSvg key={`${shownPattern}-${material}`} geometry={geometry} wood={woodId} className="block size-full" />
                  </div>
                </div>
                {show3D ? (
                  <SceneBoundary onError={() => setFailed(true)}>
                    <FloorSample3D
                      pattern={shownPattern}
                      wood={woodId}
                      material={material}
                      yaw={yaw}
                      active={onScreen}
                      reducedMotion={reducedMotion}
                      sway={!interacted}
                      onReady={() => setReady(true)}
                      onInteract={() => setInteracted(true)}
                    />
                  </SceneBoundary>
                ) : null}
                <span className={`${eyebrow} pointer-events-none absolute left-3 top-3 text-[0.625rem] text-nuss-muted`} aria-hidden="true">
                  Muster · {materialInfo.label}
                </span>
                <span className={`${eyebrow} pointer-events-none absolute bottom-3 right-3 text-[0.625rem] text-nuss-muted`} aria-hidden="true">
                  {show3D && ready ? "Ziehen zum Drehen" : "Vorschau"}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <figcaption className="min-w-0" aria-live="polite">
                  <p className="font-display text-xl font-semibold leading-tight sm:text-2xl">
                    {patternLabel} <span className="font-normal text-nuss-muted">in {wood.label}</span>
                  </p>
                </figcaption>
                {show3D ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => rotate(-Math.PI / 6)}
                      className="inline-flex size-11 items-center justify-center rounded-lg border border-fuge-dark bg-creme text-nuss hover:border-nuss"
                      aria-label="Probe nach links drehen"
                    >
                      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => rotate(Math.PI / 6)}
                      className="inline-flex size-11 items-center justify-center rounded-lg border border-fuge-dark bg-creme text-nuss hover:border-nuss"
                      aria-label="Probe nach rechts drehen"
                    >
                      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                ) : null}
              </div>
            </figure>
          </div>

          <div className="flex min-w-0 flex-col gap-8 lg:col-span-5 lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <div>
              <p id="muster-material-label" className={`${eyebrow} text-nuss-muted`}>
                Material
              </p>
              <div role="radiogroup" aria-labelledby="muster-material-label" className="mt-3 grid grid-cols-3 gap-2">
                {MATERIALS.map((item) => {
                  const checked = item.id === material;
                  return (
                    <button
                      key={item.id}
                      ref={materialKeys.register(item.id)}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      tabIndex={checked ? 0 : -1}
                      onClick={() => setMaterial(item.id)}
                      onKeyDown={materialKeys.onKeyDown}
                      className={`${radioBase} flex-col items-start gap-0.5 border-fuge-dark/50 bg-creme/50 px-3 py-2.5 text-left`}
                    >
                      <span className="font-semibold text-nuss">{item.label}</span>
                      <span className="text-xs text-nuss-muted">{item.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {isParkett ? (
              <div>
                <p id="muster-pattern-label" className={`${eyebrow} text-nuss-muted`}>
                  Verlegemuster
                </p>
                <div role="radiogroup" aria-labelledby="muster-pattern-label" className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-1">
                  {PATTERNS.map((item) => {
                    const checked = item.id === patternId;
                    const thumb = thumbnails.get(item.id);
                    return (
                      <button
                        key={item.id}
                        ref={patternKeys.register(item.id)}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        tabIndex={checked ? 0 : -1}
                        onClick={() => setPatternId(item.id)}
                        onKeyDown={patternKeys.onKeyDown}
                        className={`${radioBase} w-full border-transparent p-2 text-left sm:pr-4`}
                      >
                        <span className="relative size-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-nuss/15 sm:size-12">
                          {thumb ? <ParquetSvg geometry={thumb} wood={woodId} className="absolute inset-0 size-full" /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[0.9375rem] font-semibold leading-tight text-nuss sm:text-base">{item.label}</span>
                          <span className="mt-0.5 hidden text-sm text-nuss-muted sm:block">{item.short}</span>
                        </span>
                        <span
                          className="hidden size-5 shrink-0 items-center justify-center rounded-full border border-fuge-dark group-aria-checked:border-kupfer sm:flex"
                          aria-hidden="true"
                        >
                          <span className="size-2.5 rounded-full bg-kupfer opacity-0 group-aria-checked:opacity-100" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-fuge-dark/60 p-4 text-pretty leading-relaxed text-nuss-soft">
                {material === "laminat" ? "Laminat" : "Vinyl"} liegt fast immer als Diele im Verband. Das Holzbild ist
                gedruckt, deshalb wählst du unten den Dekor.
              </p>
            )}

            <div>
              <p id="muster-wood-label" className={`${eyebrow} text-nuss-muted`}>
                Holzton
              </p>
              <div role="radiogroup" aria-labelledby="muster-wood-label" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
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
                      className={`${radioBase} flex-col justify-center gap-2 border-transparent px-2 py-3 text-center`}
                    >
                      <span
                        className="h-8 w-12 rounded-lg ring-1 ring-nuss/15"
                        style={{
                          background: `repeating-linear-gradient(100deg, ${tone.fills[0]} 0 5px, ${tone.fills[2]} 5px 7px, ${tone.fills[3]} 7px 11px, ${tone.fills[4]} 11px 12px)`,
                        }}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-semibold leading-tight text-nuss">{tone.label}</span>
                      <span className="sr-only">– {tone.note}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-sm leading-relaxed text-nuss-muted">
              Die Probe ist eine Illustration. Holzart, Sortierung und Oberfläche schauen wir uns bei der Erstberatung an
              echten Mustern an.
            </p>
          </div>

          <div className="grid min-w-0 gap-3 border-t border-dashed border-fuge-dark/60 pt-4 text-pretty leading-relaxed text-nuss-soft sm:grid-cols-2 lg:col-span-7 lg:col-start-6 lg:row-start-2 lg:self-start">
            <p>{materialInfo.note}</p>
            <p>{isParkett ? `${pattern.description} ${gluedNote}` : "Laminat und Vinyl gibt es fast nur als Diele. Hier siehst du die übliche Diele."}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
