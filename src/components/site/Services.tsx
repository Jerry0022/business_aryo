import { ArrowRight, ChevronsLeftRight } from "lucide-react";
import { PATTERNS, SERVICES } from "./content";
import { buildParquet } from "./parquet/geometry";
import { ParquetSvg } from "./parquet/ParquetSvg";
import { SectionHeading } from "./SectionHeading";
import { ServiceIcon } from "./ServiceIcon";

const featureFloor = buildParquet("landhausdiele", { width: 720, height: 520, unit: 16, seed: 5 });
const sandingFloor = buildParquet("schiffsboden", { width: 400, height: 140, unit: 17, seed: 9 });

/** Before/after illustration for sanding: worn, scratched boards on the left, fresh finish on the right. */
function SandingVisual() {
  return (
    <div className="relative mt-8 h-32 overflow-hidden rounded-2xl ring-1 ring-ink/10" aria-hidden="true">
      <ParquetSvg geometry={sandingFloor} wood="eiche-natur" className="absolute inset-0 size-full" />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_45%,rgb(255_246_230/0.45)_62%,transparent_78%)]" />
      <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
        <ParquetSvg
          geometry={sandingFloor}
          wood="eiche-natur"
          className="absolute inset-y-0 left-0 h-full w-[200%] brightness-[0.72] contrast-[0.8] grayscale-[0.55] sepia-[0.25]"
        />
        <svg viewBox="0 0 200 140" preserveAspectRatio="none" className="absolute inset-0 size-full">
          <g fill="none" strokeLinecap="round">
            <path
              d="M8 30c40-6 70-2 110-12M20 96c30 4 60-8 96-2M60 60c20-10 50-12 90-4"
              stroke="#fff"
              strokeOpacity="0.28"
              strokeWidth="1"
            />
            <path
              d="M14 118c50-10 90-6 150-16M30 16c26 8 60 6 84 0M90 84l60-22"
              stroke="#fff"
              strokeOpacity="0.18"
              strokeWidth="0.8"
            />
            <path
              d="M40 44c20 4 30 12 60 10M120 118c20-6 40-6 70-2"
              stroke="#3b2716"
              strokeOpacity="0.3"
              strokeWidth="1.2"
            />
          </g>
          <ellipse cx="150" cy="40" rx="26" ry="14" fill="#3b2716" fillOpacity="0.14" />
        </svg>
      </div>
      <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-paper/90 shadow-[0_0_12px_rgb(0_0_0/0.3)]" />
      <span className="absolute left-1/2 top-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-paper text-ink shadow-md">
        <ChevronsLeftRight className="size-3.5" strokeWidth={2.5} />
      </span>
      <span className="absolute bottom-2.5 left-2.5 rounded-full bg-ink/70 px-2.5 py-1 text-[0.7rem] font-semibold text-paper backdrop-blur-sm">
        vorher
      </span>
      <span className="absolute bottom-2.5 right-2.5 rounded-full bg-paper/90 px-2.5 py-1 text-[0.7rem] font-semibold text-ink backdrop-blur-sm">
        nachher
      </span>
    </div>
  );
}

/** Widens the last card so the grid (featured card = 2 cells) ends without a gap at 2 and 3 columns. */
function lastCardSpan(restCount: number): string {
  const cells = 2 + restCount;
  const sm = cells % 2 === 1 ? "sm:col-span-2" : "";
  const lg = cells % 3 === 1 ? "lg:col-span-3" : cells % 3 === 2 ? "lg:col-span-2" : sm ? "lg:col-span-1" : "";
  return `${sm} ${lg}`.trim();
}

export function Services() {
  const [featured, ...rest] = SERVICES;
  if (!featured) return null;
  return (
    <section
      id="leistungen"
      aria-labelledby="leistungen-title"
      className="site-light scroll-mt-20 bg-paper py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <SectionHeading
            id="leistungen-title"
            eyebrow="Leistungen"
            title="Alles für Ihren Holzboden."
            className="lg:col-span-7"
          />
          <p className="site-reveal max-w-xl text-pretty text-lg leading-relaxed text-ink-muted lg:col-span-5 lg:pb-2">
            Ob Neubau, Altbau oder Renovierung zwischen zwei Mietern: Ich begleite Ihren Boden von der Vorbereitung des
            Untergrunds bis zur letzten Leiste.
          </p>
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3 lg:gap-5">
          <li className="site-reveal relative isolate flex min-h-[25rem] flex-col overflow-hidden rounded-card bg-ink text-paper sm:col-span-2">
            <div className="absolute inset-y-0 right-0 -z-10 w-full sm:w-[62%]" aria-hidden="true">
              <ParquetSvg
                geometry={featureFloor}
                wood="eiche-natur"
                className="site-mask-fade-left size-full opacity-90"
              />
              <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_80%_20%,rgb(255_226_182/0.18),transparent_70%)]" />
            </div>
            <div
              className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/10 sm:via-ink/70 sm:to-transparent"
              aria-hidden="true"
            />
            <div className="flex flex-1 flex-col p-7 sm:max-w-[30rem] sm:p-10">
              <span className="flex size-12 items-center justify-center rounded-full bg-copper text-ink">
                <ServiceIcon name={featured.icon} className="size-6" />
              </span>
              <h3 className="mt-8 font-display text-3xl font-medium tracking-[-0.02em] sm:text-4xl">
                {featured.title}
              </h3>
              <p className="mt-4 text-pretty leading-relaxed text-paper/75">{featured.text}</p>
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Verlegemuster">
                {PATTERNS.map((pattern) => (
                  <li
                    key={pattern.id}
                    className="rounded-full border border-paper/20 bg-ink/40 px-3 py-1 text-xs font-medium text-paper/85 backdrop-blur-sm"
                  >
                    {pattern.label}
                  </li>
                ))}
              </ul>
              <a
                href="#muster"
                className="group mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold text-oak-light transition-colors hover:text-paper"
              >
                Muster ausprobieren
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </a>
            </div>
          </li>

          {rest.map((service, index) => (
            <li
              key={service.id}
              className={`site-reveal group relative flex flex-col rounded-card border border-ink/10 bg-white/50 p-7 transition duration-500 ease-out-soft hover:-translate-y-1 hover:border-oak/40 hover:bg-white/80 hover:shadow-[0_24px_48px_-28px_rgb(86_53_33/0.45)] sm:p-8 ${
                index === rest.length - 1 ? lastCardSpan(rest.length) : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="flex size-12 items-center justify-center rounded-full bg-sand text-oak-deep ring-1 ring-sand-deep transition-colors duration-500 group-hover:bg-copper group-hover:text-ink group-hover:ring-copper">
                  <ServiceIcon name={service.icon} className="size-[1.4rem]" />
                </span>
                <span className="font-display text-sm tabular-nums text-ink-muted" aria-hidden="true">
                  {String(index + 2).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-7 font-display text-2xl font-medium tracking-[-0.015em] text-ink">{service.title}</h3>
              <p className="mt-3 text-pretty leading-relaxed text-ink-muted">{service.text}</p>
              {service.id === "schleifen" ? <SandingVisual /> : null}
              <div className="mt-auto pt-7" aria-hidden="true">
                <span className="block h-[3px] w-10 rounded-full bg-oak/50 transition-all duration-500 ease-out-soft group-hover:w-20 group-hover:bg-copper" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
