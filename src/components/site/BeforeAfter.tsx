"use client";

import { useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { GREY_LAMINATE } from "./content";
import { buildParquet, type ParquetGeometry, type PatternId } from "./parquet/geometry";
import { ParquetSvg } from "./parquet/ParquetSvg";
import type { WoodId, WoodTone } from "./parquet/woods";
import { container, SectionHeader } from "./ui";

// Vorher/Nachher: the same room twice, stacked. The "before" room is clipped at the slider position.
// Everything is drawn on a 1120 × 600 stage that keeps its aspect ratio and is cropped at the sides
// on narrow screens; the floor is a CSS 3D plane (perspective in container units, so it scales).

type Floor =
  | { kind: "carpet"; label: string }
  | { kind: "laminate"; label: string }
  | { kind: "wood"; label: string; pattern: PatternId; wood: WoodId; unit: number; detail: boolean };

interface Scene {
  id: string;
  title: string;
  intro: string;
  before: Floor;
  after: Floor;
}

const SCENES: readonly Scene[] = [
  {
    id: "teppich",
    title: "Teppich → Eiche Schiffsboden, geölt",
    intro: "Links der alte Teppich, rechts Eiche als Schiffsboden, geölt.",
    before: { kind: "carpet", label: "Teppich" },
    after: { kind: "wood", label: "Eiche Schiffsboden, geölt", pattern: "schiffsboden", wood: "eiche-natur", unit: 10, detail: false },
  },
  {
    id: "laminat",
    title: "Graues Laminat → Eiche Landhausdiele, natur",
    intro: "Links graues Laminat, rechts Eiche als Landhausdiele, natur geölt.",
    before: { kind: "laminate", label: "Graues Laminat" },
    after: { kind: "wood", label: "Eiche Landhausdiele, natur", pattern: "landhausdiele", wood: "eiche-natur", unit: 10, detail: true },
  },
];

/** Floor artwork size (viewBox); drawn at twice this size on the plane. */
const ART = { width: 1050, height: 400 } as const;

export function BeforeAfter() {
  const [sceneId, setSceneId] = useState(SCENES[0]!.id);
  const [pos, setPos] = useState(50);
  const scene = SCENES.find((item) => item.id === sceneId) ?? SCENES[0]!;

  return (
    <section id="vergleich" aria-labelledby="vergleich-title" className="scroll-mt-16 border-t border-fuge py-20 sm:py-24 xl:scroll-mt-20">
      <div className={container}>
        <SectionHeader
          id="vergleich"
          label="Vorher / Nachher"
          title="Gleiche Wohnung. Anderer Boden."
          aside={
            <div role="group" aria-label="Szene wählen" className="flex flex-wrap gap-2 lg:max-w-md lg:justify-end">
              {SCENES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={item.id === scene.id}
                  onClick={() => setSceneId(item.id)}
                  className={`min-h-11 rounded-lg border px-3.5 py-2 text-left text-sm font-medium transition-colors ${
                    item.id === scene.id
                      ? "border-kupfer bg-kupfer text-creme"
                      : "border-fuge-dark bg-creme text-nuss hover:border-nuss"
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          }
        >
          <p>{scene.intro} Der Raum wirkt heller und ruhiger, obwohl sich sonst nichts ändert.</p>
        </SectionHeader>

        <Comparison scene={scene} pos={pos} onChange={setPos} />

        <p className="mt-3.5 font-mono text-xs uppercase tracking-[0.08em] text-nuss-muted">
          Illustration. Hier zeige ich bald echte Projekte aus NRW.
        </p>
      </div>
    </section>
  );
}

function Comparison({ scene, pos, onChange }: { scene: Scene; pos: number; onChange: (value: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; touch: boolean; moved: boolean } | null>(null);

  const setFromClientX = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const value = Math.round(((clientX - rect.left) / rect.width) * 100);
    onChange(Math.max(0, Math.min(100, value)));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const touch = event.pointerType === "touch";
    drag.current = { id: event.pointerId, touch, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    // Touch waits for a horizontal move (or a tap) so vertical scrolling does not jump the slider.
    if (!touch) setFromClientX(event.clientX);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.id !== event.pointerId) return;
    drag.current.moved = true;
    setFromClientX(event.clientX);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    if (current.touch && !current.moved) setFromClientX(event.clientX);
    drag.current = null;
  };

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        drag.current = null;
      }}
      className="group relative mt-10 [container-type:size] aspect-[4/3] w-full cursor-ew-resize touch-pan-y select-none overflow-hidden rounded-lg bg-[#ebe0cf] ring-1 ring-fuge sm:aspect-video lg:aspect-[28/15]"
    >
      <Room floor={scene.after} variant="after" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Room floor={scene.before} variant="before" />
      </div>
      <Furniture />

      <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-milch shadow-[0_0_0_1px_rgb(0_0_0/0.14)]" style={{ left: `${pos}%` }} aria-hidden="true" />
      <div
        className="pointer-events-none absolute top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-kupfer text-creme shadow-[0_4px_14px_rgb(0_0_0/0.3),0_0_0_3px_#fff] group-has-[input:focus-visible]:outline group-has-[input:focus-visible]:outline-[3px] group-has-[input:focus-visible]:outline-offset-[5px] group-has-[input:focus-visible]:outline-kupfer sm:size-[52px]"
        style={{ left: `${pos}%` }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" />
        </svg>
      </div>

      <div className="pointer-events-none absolute left-2.5 top-2.5 max-w-[46%] bg-nuss/80 px-2.5 py-1.5 font-mono text-[0.6875rem] leading-snug tracking-[0.04em] text-white sm:left-4 sm:top-4 sm:px-3 sm:py-2 sm:text-xs">
        <span className="block text-fuge">VORHER</span>
        <span className="block">{scene.before.label}</span>
      </div>
      <div className="pointer-events-none absolute right-2.5 top-2.5 max-w-[46%] bg-nuss/80 px-2.5 py-1.5 text-right font-mono text-[0.6875rem] leading-snug tracking-[0.04em] text-white sm:right-4 sm:top-4 sm:px-3 sm:py-2 sm:text-xs">
        <span className="block text-fuge">NACHHER</span>
        <span className="block">{scene.after.label}</span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={pos}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Vorher und Nachher vergleichen"
        aria-valuetext={`${pos} % vorher, ${100 - pos} % nachher`}
        className="sr-only"
      />
    </div>
  );
}

/** 1120 × 600 stage, full height of the comparison box, centred and cropped at the sides. */
function Stage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`absolute left-1/2 top-0 h-full aspect-[1120/600] -translate-x-1/2 ${className}`}>{children}</div>;
}

function Room({ floor, variant }: { floor: Floor; variant: "before" | "after" }) {
  const before = variant === "before";
  return (
    <Stage>
      {!before ? <Wall /> : null}
      <div className="absolute inset-x-0 bottom-0 h-[45%] overflow-hidden" style={{ background: before ? "#958c7f" : "#b98a52" }}>
        <div
          className="absolute bottom-0 left-1/2 origin-bottom"
          style={{
            width: `${(ART.width * 2 * 100) / 1120}%`,
            height: `${(ART.height * 2 * 100) / 270}%`,
            marginLeft: `${-(ART.width * 100) / 1120}%`,
            transform: "perspective(116.667cqh) rotateX(50deg)",
          }}
        >
          <FloorArt floor={floor} />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background: before
              ? "linear-gradient(180deg, rgb(40 32 24 / 0.36) 0%, rgb(40 32 24 / 0.1) 45%, rgb(40 32 24 / 0.04) 100%)"
              : "linear-gradient(180deg, rgb(50 30 12 / 0.34) 0%, rgb(50 30 12 / 0.08) 42%, rgb(50 30 12 / 0) 70%)",
          }}
        />
      </div>
      <div
        className="absolute inset-x-0 top-[53.67%] h-[2%]"
        style={{ background: before ? "#6b5543" : "#f8f1e4", boxShadow: before ? undefined : "0 1px 0 rgb(0 0 0 / 0.08)" }}
      />
      {before ? <div className="absolute inset-0 bg-[rgb(62_52_40/0.1)]" /> : null}
    </Stage>
  );
}

function FloorArt({ floor }: { floor: Floor }) {
  const geometry = useMemo<ParquetGeometry | null>(() => {
    if (floor.kind === "wood") {
      return buildParquet(floor.pattern, { ...ART, unit: floor.unit, seed: 5, detail: floor.detail });
    }
    if (floor.kind === "laminate") {
      return buildParquet("landhausdiele", { ...ART, unit: 9, seed: 9, detail: false });
    }
    return null;
  }, [floor]);

  if (floor.kind === "wood" && geometry) {
    return <ParquetSvg geometry={geometry} wood={floor.wood} className="absolute inset-0 size-full" />;
  }
  if (floor.kind === "laminate" && geometry) {
    return <TonedFloor geometry={geometry} tone={GREY_LAMINATE} />;
  }
  return <Carpet />;
}

/** Plank floor in a colour that is not one of the wood tones (grey laminate). */
function TonedFloor({ geometry: g, tone }: { geometry: ParquetGeometry; tone: WoodTone }) {
  return (
    <svg viewBox={`0 0 ${g.width} ${g.height}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden="true" focusable="false">
      <rect width={g.width} height={g.height} fill={tone.seam} />
      <g transform={g.transform}>
        {g.planks.map((d, index) => (
          <path key={index} d={d} fill={tone.fills[index % tone.fills.length]} stroke={tone.seam} strokeWidth={g.seamWidth * 1.4} />
        ))}
      </g>
    </svg>
  );
}

function Carpet() {
  return (
    <svg viewBox={`0 0 ${ART.width} ${ART.height}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden="true" focusable="false">
      <defs>
        <filter id="ba-fibre" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.24  0 0 0 0 0.21  0 0 0 0 0.18  0.9 0 0 0 -0.3" />
        </filter>
        <filter id="ba-wear" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="11" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.30  0 0 0 0 0.26  0 0 0 0 0.22  0.8 0 0 0 -0.32" />
        </filter>
        <pattern id="ba-carpet" width="120" height="120" patternUnits="userSpaceOnUse">
          <rect width="120" height="120" filter="url(#ba-fibre)" />
        </pattern>
        <pattern id="ba-carpet-wear" width="400" height="400" patternUnits="userSpaceOnUse">
          <rect width="400" height="400" filter="url(#ba-wear)" />
        </pattern>
      </defs>
      <rect width={ART.width} height={ART.height} fill="#958c7f" />
      <rect width={ART.width} height={ART.height} fill="url(#ba-carpet-wear)" />
      <rect width={ART.width} height={ART.height} fill="url(#ba-carpet)" />
    </svg>
  );
}

function Wall() {
  return (
    <svg viewBox="0 0 1120 600" className="absolute inset-0 size-full" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ba-wall" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#e3d8c6" />
          <stop offset="0.4" stopColor="#ede3d3" />
          <stop offset="0.66" stopColor="#f5ede0" />
          <stop offset="0.76" stopColor="#f8f1e5" />
          <stop offset="1" stopColor="#e8ddcc" />
        </linearGradient>
        <linearGradient id="ba-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#c9dce6" />
          <stop offset="0.62" stopColor="#e3eef2" />
          <stop offset="1" stopColor="#eef2ec" />
        </linearGradient>
      </defs>
      <rect width="1120" height="340" fill="url(#ba-wall)" />
      {/* Picture */}
      <rect x="250" y="84" width="180" height="120" fill="#2f2a25" />
      <rect x="258" y="92" width="164" height="104" fill="#d8d0c2" />
      <ellipse cx="315" cy="143" rx="35" ry="25" fill="#b7a58a" />
      <rect x="328" y="136" width="70" height="40" fill="#8e9a85" />
      {/* Window */}
      <rect x="640" y="46" width="250" height="250" fill="#f8f1e4" />
      <rect x="650" y="56" width="230" height="230" fill="url(#ba-sky)" />
      <rect x="760" y="56" width="10" height="230" fill="#f8f1e4" />
      <rect x="650" y="164" width="230" height="8" fill="#f8f1e4" />
    </svg>
  );
}

function Furniture() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <Stage>
        <svg viewBox="0 0 1120 600" className="absolute inset-0 size-full" focusable="false">
          <defs>
            <linearGradient id="ba-light" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="rgb(255 250 236)" stopOpacity="0.34" />
              <stop offset="1" stopColor="rgb(255 250 236)" stopOpacity="0.08" />
            </linearGradient>
            <radialGradient id="ba-shadow">
              <stop offset="0" stopColor="rgb(30 22 14)" stopOpacity="0.34" />
              <stop offset="1" stopColor="rgb(30 22 14)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="ba-lamp">
              <stop offset="0" stopColor="rgb(255 226 170)" stopOpacity="0.5" />
              <stop offset="1" stopColor="rgb(255 226 170)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="ba-vignette" cx="0.6" cy="0.4" r="0.75">
              <stop offset="0.55" stopColor="rgb(20 14 8)" stopOpacity="0" />
              <stop offset="1" stopColor="rgb(20 14 8)" stopOpacity="0.16" />
            </radialGradient>
          </defs>
          {/* Daylight on the floor */}
          <polygon points="645,330 885,330 1050,600 500,600" fill="url(#ba-light)" />
          {/* Sofa */}
          <ellipse cx="398" cy="405" rx="240" ry="13" fill="url(#ba-shadow)" />
          <rect x="190" y="396" width="10" height="14" fill="#2a2521" />
          <rect x="588" y="396" width="10" height="14" fill="#2a2521" />
          <rect x="190" y="258" width="410" height="100" rx="20" fill="#56655c" />
          <rect x="216" y="272" width="170" height="74" rx="14" fill="#62726a" />
          <rect x="404" y="272" width="170" height="74" rx="14" fill="#62726a" />
          <rect x="180" y="334" width="430" height="64" rx="10" fill="#4b5951" />
          <rect x="164" y="300" width="48" height="100" rx="16" fill="#445149" />
          <rect x="578" y="300" width="48" height="100" rx="16" fill="#445149" />
          {/* Floor lamp */}
          <circle cx="672" cy="150" r="60" fill="url(#ba-lamp)" />
          <polygon points="650,118 694,118 704,162 640,162" fill="#ede3d1" />
          <rect x="670" y="162" width="4" height="240" fill="#2a2521" />
          <ellipse cx="672" cy="402" rx="20" ry="4" fill="#2a2521" />
          {/* Plant */}
          <ellipse cx="842" cy="521" rx="52" ry="9" fill="url(#ba-shadow)" />
          <ellipse cx="818" cy="391" rx="30" ry="55" fill="#4e6b4a" transform="rotate(-24 818 391)" />
          <ellipse cx="889" cy="388" rx="29" ry="58" fill="#5b7a55" transform="rotate(22 889 388)" />
          <ellipse cx="852" cy="374" rx="30" ry="62" fill="#43603f" />
          <path d="M817 432h70v70q0 16-16 16h-38q-16 0-16-16z" fill="#cfc8bc" />
          <rect width="1120" height="600" fill="url(#ba-vignette)" />
        </svg>
      </Stage>
    </div>
  );
}
