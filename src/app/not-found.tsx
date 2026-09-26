import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DimensionLine } from "@/components/ratgeber/DimensionLine";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export const metadata: Metadata = {
  title: "Seite nicht gefunden",
  robots: { index: false },
};

// A plank floor in plan view with exactly one plank missing: the page that "isn't there".
const WIDTH = 440;
const ROW = 28;
const PLANK = 200;
const OFFSETS = [0, 110, 50, 160, 20, 130, 70, 180, 40, 150];
const GAP_ROW = 4;
const TONES = ["#e6cba0", "#ecd7b3", "#dfc193"];

const planks = OFFSETS.flatMap((offset, row) => {
  const items: { x: number; y: number; w: number; tone: string; gap: boolean }[] = [];
  for (let x = -offset, i = 0; x < WIDTH; x += PLANK, i += 1) {
    items.push({ x, y: row * ROW, w: PLANK, tone: TONES[(row + i) % TONES.length] ?? TONES[0]!, gap: false });
  }
  return items;
});
const gap = planks.find((plank) => plank.y === GAP_ROW * ROW && plank.x <= 200 && plank.x + plank.w > 200)!;
gap.gap = true;
const HEIGHT = OFFSETS.length * ROW;

function MissingPlank() {
  const dimY = gap.y - 12;
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Zeichnung: ein Dielenboden in der Draufsicht, in dem genau eine Diele fehlt"
      className="block h-auto w-full"
    >
      <defs>
        <pattern id="nf-estrich" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="#e8e0d2" />
          <path d="M0 0V8" stroke="#d3c2a6" strokeWidth="1" />
        </pattern>
        <clipPath id="nf-clip">
          <rect width={WIDTH} height={HEIGHT} />
        </clipPath>
      </defs>
      <g clipPath="url(#nf-clip)">
        {planks.map((plank) =>
          plank.gap ? (
            <rect key={`${plank.x}-${plank.y}`} x={plank.x} y={plank.y} width={plank.w} height={ROW} fill="url(#nf-estrich)" />
          ) : (
            <rect
              key={`${plank.x}-${plank.y}`}
              x={plank.x}
              y={plank.y}
              width={plank.w}
              height={ROW}
              fill={plank.tone}
              stroke="#b98a52"
              strokeWidth="0.6"
            />
          ),
        )}
        <rect
          x={gap.x + 1}
          y={gap.y + 1}
          width={gap.w - 2}
          height={ROW - 2}
          fill="none"
          stroke="#9a4418"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
      </g>
      <rect x={0.75} y={0.75} width={WIDTH - 1.5} height={HEIGHT - 1.5} fill="none" stroke="#231913" strokeWidth="1.5" />
      {/* dimension line over the gap */}
      <g stroke="#9a4418" fill="none">
        <path d={`M${gap.x} ${gap.y - 2}V${dimY - 6}M${gap.x + gap.w} ${gap.y - 2}V${dimY - 6}`} strokeWidth="0.8" strokeDasharray="3 2" />
        <path d={`M${gap.x} ${dimY}H${gap.x + gap.w}`} strokeWidth="1" />
        <path d={`M${gap.x - 4} ${dimY + 4}L${gap.x + 4} ${dimY - 4}M${gap.x + gap.w - 4} ${dimY + 4}L${gap.x + gap.w + 4} ${dimY - 4}`} strokeWidth="1.4" />
      </g>
      <rect x={gap.x + gap.w / 2 - 34} y={dimY - 8} width="68" height="16" fill="#f8f1e4" />
      <text
        x={gap.x + gap.w / 2}
        y={dimY + 4}
        textAnchor="middle"
        fontFamily="IBM Plex Mono, ui-monospace, monospace"
        fontSize="11"
        fill="#9a4418"
      >
        404 mm
      </text>
    </svg>
  );
}

export default function NotFound() {
  return (
    <>
      <SiteHeader variant="solid" />
      <main id="main" className="bg-leinen pb-20 pt-28 text-nuss sm:pb-28 sm:pt-32 lg:pt-36">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-kupfer sm:text-xs">Fehler 404</p>
            <DimensionLine className="mt-6 max-w-sm" />
            <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,4.75rem)] font-medium leading-[0.98] tracking-[-0.02em] text-balance">
              Hier fehlt ein Stück.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-nuss-soft">
              Die Seite, die du suchst, gibt es nicht (mehr), oder die Adresse hat sich verändert. Passiert. Auf der
              Startseite findest du alles über meine Arbeit, im Ratgeber die Antworten auf die häufigsten Fragen.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-kupfer px-5 py-3.5 font-semibold text-creme transition-colors hover:bg-kupfer-deep"
              >
                <ArrowLeft className="size-4" strokeWidth={1.6} aria-hidden="true" />
                Zur Startseite
              </Link>
              <Link
                href="/#kontakt"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-nuss px-5 py-3.5 font-medium text-nuss transition-colors hover:bg-creme"
              >
                Kontakt aufnehmen
              </Link>
              <Link
                href="/ratgeber"
                className="inline-flex items-center justify-center gap-2 px-2 py-3.5 font-medium text-kupfer underline decoration-kupfer/40 underline-offset-4 transition-colors hover:text-kupfer-deep"
              >
                Zum Ratgeber
                <ArrowRight className="size-4" strokeWidth={1.6} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <figure className="rounded-2xl border border-fuge bg-creme p-4 sm:p-5">
            <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.1em] text-nuss-muted">
              <span>Aufmaß · Fehlstelle</span>
              <span>M 1 : 10</span>
            </div>
            <div className="mt-3">
              <MissingPlank />
            </div>
            <dl className="mt-3 text-sm">
              {[
                ["Fehlstelle", "1 Diele"],
                ["Ursache", "Adresse falsch oder Seite umgezogen"],
                ["Maßnahme", "zurück zur Startseite"],
              ].map(([term, value]) => (
                <div key={term} className="flex items-baseline justify-between gap-4 border-t border-dashed border-fuge py-2">
                  <dt className="text-nuss-muted">{term}</dt>
                  <dd className="text-right font-mono text-[0.8125rem] text-nuss">{value}</dd>
                </div>
              ))}
            </dl>
          </figure>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
