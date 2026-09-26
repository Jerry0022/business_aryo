import { Check } from "lucide-react";
import { siteConfig } from "@/config/site";
import { buildParquet } from "./parquet/geometry";
import { ParquetSvg } from "./parquet/ParquetSvg";
import { SectionHeading } from "./SectionHeading";

const cardFloor = buildParquet("fischgraet", { width: 480, height: 600, unit: 15, seed: 23 });

const PRINCIPLES = ["Ehrlich beraten", "Sauber arbeiten", "Termine halten"] as const;

function MonogramCard() {
  return (
    <div className="site-reveal relative mx-auto w-full max-w-[26rem] lg:mx-0">
      <div
        className="absolute -inset-4 -z-10 rotate-3 rounded-[2.25rem] bg-sand-deep/60 sm:-inset-5"
        aria-hidden="true"
      />
      <div className="relative aspect-[4/5] -rotate-2 overflow-hidden rounded-[2rem] bg-walnut shadow-[0_50px_90px_-45px_rgb(23_19_15/0.8)] ring-1 ring-ink/10 transition-transform duration-700 ease-out-soft hover:rotate-0">
        <ParquetSvg geometry={cardFloor} wood="eiche-geraeuchert" className="absolute inset-0 size-full" />
        <div
          className="absolute inset-0 bg-[radial-gradient(90%_70%_at_30%_15%,rgb(255_226_182/0.28),transparent_60%),linear-gradient(180deg,rgb(23_19_15/0)_40%,rgb(23_19_15/0.8)_100%)]"
          aria-hidden="true"
        />
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <svg viewBox="0 0 200 200" className="size-[62%] drop-shadow-[0_20px_30px_rgb(0_0_0/0.45)]">
            <defs>
              <path id="monogram-ring" d="M100 100m-74 0a74 74 0 1 1 148 0a74 74 0 1 1-148 0" />
            </defs>
            <circle cx="100" cy="100" r="96" fill="#17130f" />
            <circle cx="100" cy="100" r="88" fill="none" stroke="#deb27c" strokeOpacity="0.45" strokeWidth="0.8" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="#deb27c" strokeOpacity="0.3" strokeWidth="0.8" />
            <text
              fill="#deb27c"
              fontSize="10.5"
              letterSpacing="3.2"
              fontWeight="600"
              style={{ fontFamily: "var(--font-manrope)" }}
            >
              <textPath href="#monogram-ring" startOffset="0" textLength="464" lengthAdjust="spacing">
                PARKETT &amp; BODEN · HANDWERK MIT SORGFALT ·
              </textPath>
            </text>
            <text
              x="100"
              y="116"
              textAnchor="middle"
              fill="#f8f4ed"
              fontSize="50"
              fontWeight="500"
              letterSpacing="-1"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              AS
            </text>
          </svg>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 text-paper sm:p-7">
          <div>
            <p className="font-display text-2xl font-medium leading-none">{siteConfig.name}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-oak-light">Parkettfachmann</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function About() {
  return (
    <section
      id="ueber-mich"
      aria-labelledby="ueber-mich-title"
      className="site-light scroll-mt-20 overflow-hidden border-t border-ink/10 bg-paper py-24 sm:py-32"
    >
      <div className="mx-auto grid w-full max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12">
        <div className="lg:col-span-5">
          <MonogramCard />
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <SectionHeading
            id="ueber-mich-title"
            eyebrow="Über mich"
            title="Holz verzeiht wenig. Deshalb arbeite ich genau."
          />
          <div className="site-reveal mt-8 space-y-5 text-pretty text-lg leading-relaxed text-ink-muted">
            <p>
              Ich bin Aryo Sabouri, Parkettfachmann. Mich fasziniert, dass jeder Holzboden seine eigene Geschichte
              erzählt – durch die Maserung, durch das Muster und durch die Menschen, die jeden Tag darüber gehen.
            </p>
            <p>
              Wenn ich einen Boden verlege oder aufarbeite, arbeite ich so, als wäre es mein eigenes Zuhause: gründlich
              vorbereitet, ruhig und präzise ausgeführt, sauber hinterlassen. Denn am Ende sieht man jede Fuge und jede
              Kante.
            </p>
            <p>
              Genauso wichtig ist mir ehrliche Beratung. Manchmal ist ein neuer Schliff die bessere Wahl als ein neuer
              Boden – dann sage ich Ihnen das auch.
            </p>
          </div>
          <div className="site-reveal mt-10 flex flex-col gap-6 border-t border-ink/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="w-fit whitespace-nowrap font-display text-3xl font-normal tracking-[-0.01em] text-ink [font-variation-settings:'SOFT'_100]">
              Aryo Sabouri
              <svg
                viewBox="0 0 180 14"
                preserveAspectRatio="none"
                className="mt-1 block h-3 w-full text-copper"
                aria-hidden="true"
              >
                <path
                  d="M2 9c30-6 60-7 92-3s58 3 84-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </p>
            <ul className="flex flex-wrap gap-2">
              {PRINCIPLES.map((principle) => (
                <li
                  key={principle}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white/60 px-3.5 py-1.5 text-sm font-medium text-ink-soft"
                >
                  <Check className="size-3.5 text-oak-deep" strokeWidth={2.5} aria-hidden="true" />
                  {principle}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
