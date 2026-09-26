import type { ReactNode } from "react";
import type { PublicOfficeHour } from "@/lib/business/office-hours";
import { officeHourLabel } from "./format";
import { ArrowIcon, buttonPrimary, card, container, DimensionLine, eyebrow, LeaderRow } from "./ui";

export function Hero({ nextOfficeHour }: { nextOfficeHour: PublicOfficeHour | null }) {
  const next = nextOfficeHour ? officeHourLabel(nextOfficeHour.startsAt) : null;
  return (
    <section id="top" aria-labelledby="top-title" className="drawing-grid relative scroll-mt-24 pb-16 pt-28 sm:pb-20 xl:pt-36">
      <div className={`${container} grid items-start gap-12 lg:grid-cols-[3fr_2fr] lg:gap-14`}>
        <div className="flex min-w-0 flex-col">
          <p className={`${eyebrow} text-graphit-muted`}>Planung · Material · Werkzeug · Verlegung</p>
          <DimensionLine label="DU LÄUFST JEDEN TAG DARAUF." className="mt-10 w-full max-w-[36rem] sm:mt-11" />
          <h1
            id="top-title"
            className="mt-4 font-display text-[clamp(2.75rem,11.5vw,6.25rem)] font-extrabold leading-[0.94] tracking-[-0.02em] font-wide"
          >
            <span className="block">Da stehst</span> <span className="block">du drauf.</span>
          </h1>
          <p className="mt-7 max-w-[34rem] text-pretty text-lg leading-relaxed text-graphit-soft sm:text-xl">
            Ich plane, liefere und verlege Böden aus Naturmaterial, die zu deinem Raum, deinem Leben und deinem Budget
            passen. Oder ich zeig dir, wie du es selbst machst.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a href="#boden-check" className={`${buttonPrimary} !px-6 !py-4 text-base`}>
              Boden-Check starten
              <ArrowIcon />
            </a>
            <span className={`${eyebrow} text-graphit-muted`}>7 Schritte · ohne Anmeldung</span>
          </div>
          {next ? (
            <a
              href="#sprechstunde"
              className="mt-6 self-start text-base text-graphit underline decoration-graphit/35 decoration-1 underline-offset-4 hover:decoration-graphit"
            >
              Nächste Boden-Sprechstunde: {next.compact}
            </a>
          ) : null}
        </div>

        <AufmassCard />
      </div>
    </section>
  );
}

/** Illustration: floor plan of an example flat with measurements (Aufmaß). */
function AufmassCard() {
  return (
    <figure className={`${card} flex min-w-0 flex-col gap-3 p-4 shadow-[0_24px_48px_-32px_rgb(34_37_42/0.45)] sm:p-5`}>
      <div className={`${eyebrow} flex justify-between gap-3 text-[0.6875rem] text-graphit-muted`}>
        <span>Aufmaß · Beispielwohnung</span>
        <span>M 1:100</span>
      </div>
      <FloorPlan />
      <div className="flex flex-col text-[0.8125rem]">
        <SpecRow label="Estrichfeuchte (CM-Messung)" value={<>1,8 % <span className="text-kreide">✓</span></>} />
        <SpecRow label="Fläche gesamt" value="62,4 m²" />
        <SpecRow label="Vorschlag Wohnen und Flur" value="Eiche Schiffsboden, geölt" />
        <SpecRow label="Vorschlag Bad und Küche" value="Vinyl, wasserfest" />
      </div>
      <figcaption className={`${eyebrow} text-[0.625rem] text-graphit-muted`}>Illustration · so sieht ein Aufmaß bei mir aus</figcaption>
    </figure>
  );
}

function SpecRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <LeaderRow
      className="border-t border-dashed border-strich py-2"
      label={<span className="text-graphit-muted">{label}</span>}
      value={<span className="font-mono text-graphit">{value}</span>}
    />
  );
}

function FloorPlan() {
  return (
    <svg
      viewBox="0 0 440 300"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Grundriss mit Aufmaß: fünf Räume, zusammen 62,4 Quadratmeter"
      className="h-auto w-full"
    >
      <defs>
        <pattern id="aufmass-ship" width="60" height="12" patternUnits="userSpaceOnUse">
          <g fill="#e6cba0" stroke="#b98a52" strokeWidth="0.6">
            <rect x="0" y="0" width="36" height="4" />
            <rect x="36" y="0" width="36" height="4" />
            <rect x="-24" y="4" width="36" height="4" />
            <rect x="12" y="4" width="36" height="4" />
            <rect x="48" y="4" width="36" height="4" />
            <rect x="-12" y="8" width="36" height="4" />
            <rect x="24" y="8" width="36" height="4" />
          </g>
        </pattern>
        <pattern id="aufmass-planks" width="48" height="12" patternUnits="userSpaceOnUse">
          <g fill="#ecd7b3" stroke="#b98a52" strokeWidth="0.6">
            <rect x="0" y="0" width="24" height="6" />
            <rect x="24" y="0" width="24" height="6" />
            <rect x="-12" y="6" width="24" height="6" />
            <rect x="12" y="6" width="24" height="6" />
            <rect x="36" y="6" width="24" height="6" />
          </g>
        </pattern>
        <pattern id="aufmass-vinyl" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="10" height="10" fill="#e2e1dc" />
          <path d="M0 0H10M0 5H10" stroke="#c3c1ba" strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect x="52" y="56" width="210.8" height="149.6" fill="url(#aufmass-ship)" />
      <rect x="52" y="205.6" width="122.4" height="54.4" fill="url(#aufmass-ship)" />
      <rect x="174.4" y="205.6" width="88.4" height="54.4" fill="url(#aufmass-vinyl)" />
      <rect x="262.8" y="56" width="142.8" height="115.6" fill="url(#aufmass-planks)" />
      <rect x="262.8" y="171.6" width="142.8" height="88.4" fill="url(#aufmass-vinyl)" />
      <rect x="52" y="56" width="353.6" height="204" fill="none" stroke="#22252a" strokeWidth="3" />
      <path d="M262.8 56V260M52 205.6H262.8M174.4 205.6V260M262.8 171.6H405.6" fill="none" stroke="#22252a" strokeWidth="2" />
      <g fill="#f7f7f4">
        <rect x="110" y="203" width="40" height="5" />
        <rect x="260.3" y="180" width="5" height="22" />
        <rect x="260.3" y="80" width="5" height="26" />
        <rect x="171.9" y="222" width="5" height="24" />
        <rect x="80" y="257" width="28" height="6" />
      </g>
      <g fill="none" stroke="#22252a" strokeWidth="1">
        <path d="M262.8 80H288.8M288.8 80A26 26 0 0 1 262.8 106" />
        <path d="M174.4 222H198.4M198.4 222A24 24 0 0 1 174.4 246" />
        <path d="M80 260V232M108 260A28 28 0 0 0 80 232" />
      </g>
      <g fill="#f7f7f4" stroke="#22252a" strokeWidth="1">
        <rect x="96" y="53" width="80" height="6" />
        <rect x="300" y="53" width="70" height="6" />
        <rect x="402.6" y="190" width="6" height="50" />
      </g>
      <g fontFamily="var(--font-archivo), system-ui, sans-serif" fontSize="12" fontWeight="600" fill="#22252a" textAnchor="middle">
        <rect x="117" y="110" width="82" height="40" fill="#f7f7f4" />
        <text x="158" y="126">Wohnen</text>
        <rect x="296" y="94" width="78" height="40" fill="#f7f7f4" />
        <text x="335" y="110">Schlafen</text>
        <rect x="302" y="196" width="66" height="40" fill="#f7f7f4" />
        <text x="335" y="212">Küche</text>
        <rect x="112" y="214" width="58" height="34" fill="#f7f7f4" />
        <text x="141" y="228">Flur</text>
        <rect x="204" y="214" width="54" height="34" fill="#f7f7f4" />
        <text x="231" y="228">Bad</text>
      </g>
      <g fontFamily="var(--font-plex-mono), ui-monospace, monospace" fontSize="11" fill="#3a3d43" textAnchor="middle">
        <text x="158" y="143">27,3 m²</text>
        <text x="335" y="127">14,3 m²</text>
        <text x="335" y="229">10,9 m²</text>
        <text x="141" y="243">5,8 m²</text>
        <text x="231" y="243">4,2 m²</text>
      </g>
      <g stroke="#2d5ba8" fill="none">
        <path d="M52 50V28M405.6 50V28M46 56H22M46 260H22" strokeWidth="0.8" strokeDasharray="3 2" />
        <path d="M52 36H405.6M30 56V260" strokeWidth="1" />
        <path d="M48 40L56 32M401.6 40L409.6 32M26 60L34 52M26 264L34 256" strokeWidth="1.4" />
      </g>
      <g fontFamily="var(--font-plex-mono), ui-monospace, monospace" fontSize="11" fill="#2d5ba8" textAnchor="middle">
        <rect x="200" y="28" width="58" height="16" fill="#f7f7f4" />
        <text x="229" y="40">10,40 m</text>
        <g transform="rotate(-90 30 158)">
          <rect x="3" y="150" width="54" height="16" fill="#f7f7f4" />
          <text x="30" y="162">6,00 m</text>
        </g>
      </g>
    </svg>
  );
}
