import { WAYS } from "./content";
import { ArrowIcon, card, CheckIcon, container, eyebrow, LeaderRow, SectionHeader, textLink } from "./ui";

export function Ways() {
  return (
    <section id="wege" aria-labelledby="wege-title" className="scroll-mt-16 border-t border-strich py-20 sm:py-24 xl:scroll-mt-20">
      <div className={container}>
        <SectionHeader id="wege" label="Drei Wege" title="Wie viel willst du selbst machen?">
          <p>Du entscheidest. Planung, Material und Wissen bekommst du von mir auf jedem Weg.</p>
        </SectionHeader>

        <ul className="mt-12 grid gap-5 md:grid-cols-3 lg:gap-6">
          {WAYS.map((way) => (
            <li key={way.title} className={`${card} flex flex-col gap-4 p-6 sm:p-7`}>
              <p className={`${eyebrow} text-[0.6875rem] text-kreide`}>{way.eyebrow}</p>
              <h3 className="font-display text-[1.75rem] font-bold leading-tight font-semiwide">{way.title}</h3>
              <p className="text-pretty leading-relaxed text-graphit-soft">{way.text}</p>
              <div className="flex flex-col gap-1.5 font-mono text-[0.8125rem]" aria-label={`${way.title}: enthalten`} role="group">
                {way.items.map((item) => (
                  <LeaderRow
                    key={item}
                    label={item}
                    value={
                      <span className="text-kreide">
                        <CheckIcon />
                        <span className="sr-only">enthalten</span>
                      </span>
                    }
                  />
                ))}
              </div>
              <a href={way.link.href} className={`${textLink} mt-auto pt-2 no-underline`}>
                {way.link.label}
                <ArrowIcon />
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-3 rounded-xs border border-dashed border-kreide p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
          <p className="font-semibold text-graphit">
            <span className="mr-2 font-mono text-xs font-normal uppercase tracking-[0.1em] text-kreide">Notfall</span>
            Wasserschaden, Kratzer oder stumpfe Stellen?
          </p>
          <a href="#kontakt" className={`${textLink} no-underline`}>
            Foto schicken, ich melde mich mit einer Einschätzung
            <ArrowIcon className="size-4 shrink-0" />
          </a>
        </div>
      </div>
    </section>
  );
}
