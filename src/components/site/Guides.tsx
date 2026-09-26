import Link from "next/link";
import { GUIDE_TEASERS } from "./content";
import { ArrowIcon, card, container, eyebrow, SectionHeader, textLink } from "./ui";

export function Guides() {
  return (
    <section id="ratgeber" aria-labelledby="ratgeber-title" className="scroll-mt-16 py-20 sm:py-24 xl:scroll-mt-20">
      <div className={container}>
        <SectionHeader
          id="ratgeber"
          label="Ratgeber"
          title="Worauf es ankommt."
          aside={
            <Link href="/ratgeber" className={`${textLink} self-start lg:self-end`}>
              Alle Ratgeber
              <ArrowIcon />
            </Link>
          }
        >
          <p>Antworten auf Alltagsfragen rund um deinen Boden. Ehrlich, auch wenn die Antwort „kommt drauf an“ heißt.</p>
        </SectionHeader>

        <ul className="mt-12 grid gap-5 md:grid-cols-3 lg:gap-6">
          {GUIDE_TEASERS.map((guide) => (
            <li key={guide.href} className={`${card} group relative flex flex-col gap-3.5 p-6 transition-colors hover:border-graphit sm:p-7`}>
              <p className={`${eyebrow} text-[0.6875rem] text-kreide`}>{guide.pillar}</p>
              <h3 className="text-balance font-display text-[1.375rem] font-bold leading-snug">
                <Link href={guide.href} className="after:absolute after:inset-0 after:rounded-xs focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-kreide focus-visible:after:outline-solid">
                  {guide.title}
                </Link>
              </h3>
              <p className="text-pretty leading-relaxed text-graphit-soft">{guide.text}</p>
              <span className="mt-auto inline-flex items-center gap-2 pt-2 font-semibold text-kreide" aria-hidden="true">
                Weiterlesen
                <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
