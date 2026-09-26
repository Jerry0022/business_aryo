import { ArrowDown, ArrowUpRight, Mail } from "lucide-react";
import { siteConfig } from "@/config/site";
import { QUOTE_MAILTO } from "./content";
import { HeroFloor } from "./HeroFloor";

export function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="hero relative isolate flex min-h-[max(40rem,100svh)] flex-col overflow-hidden bg-ink text-paper"
    >
      <HeroFloor />
      <div className="hero__glow" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-[38svh] pt-28 sm:px-8 sm:pt-32 lg:px-12 lg:pb-[30svh] lg:pt-36">
        <p className="site-rise inline-flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-oak-light sm:text-xs">
          <span className="h-px w-8 bg-current" aria-hidden="true" />
          Parkettfachmann{siteConfig.serviceArea ? ` · ${siteConfig.serviceArea}` : ""}
        </p>

        <h1
          id="hero-title"
          className="site-rise mt-6 max-w-[14ch] font-display text-[clamp(3.35rem,9.2vw,7.6rem)] font-medium leading-[0.92] tracking-[-0.025em] text-paper hero__title [animation-delay:80ms]"
        >
          Parkett mit <span className="hero__accent">Handschrift.</span>
        </h1>

        <p className="site-rise mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-paper/75 [animation-delay:160ms] sm:text-xl">
          Ich verlege, schleife und pflege Holzböden – präzise, staubarm und mit einer sauberen Übergabe. Für Böden,
          über die Sie sich jeden Tag freuen.
        </p>

        <div className="site-rise mt-10 flex flex-col gap-3 [animation-delay:240ms] sm:flex-row sm:items-center">
          <a
            href={QUOTE_MAILTO}
            className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-copper px-7 py-4 text-base font-semibold text-ink shadow-[0_18px_40px_-18px_rgb(216_113_44/0.9)] transition hover:bg-oak-light"
          >
            <Mail className="size-[1.1rem]" aria-hidden="true" />
            Angebot anfragen
            <ArrowUpRight
              className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </a>
          <a
            href="#leistungen"
            className="group inline-flex items-center justify-center gap-2.5 rounded-full border border-paper/25 px-7 py-4 text-base font-medium text-paper backdrop-blur-sm transition hover:border-paper/60 hover:bg-paper/5"
          >
            Leistungen ansehen
            <ArrowDown
              className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>

      <a
        href="#muster"
        className="hero__tag absolute bottom-6 right-5 z-10 hidden items-center gap-3 rounded-full border border-paper/15 bg-ink/55 py-2 pl-2 pr-4 text-xs text-paper/80 backdrop-blur-md transition hover:border-paper/40 hover:text-paper sm:inline-flex lg:bottom-8 lg:right-12"
      >
        <span className="hero__tag-swatch size-7 rounded-full" aria-hidden="true" />
        <span>
          <span className="block font-semibold text-paper">Fischgrät · Eiche natur</span>
          <span className="block text-paper/65">Muster selbst ausprobieren</span>
        </span>
      </a>
    </section>
  );
}
