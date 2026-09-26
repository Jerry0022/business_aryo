import type { PublicServiceGroup } from "@/lib/business/data";
import { container, eyebrow, SectionHeader } from "./ui";

// Leistungen as a bill of materials. Rule from the concept: a service is always listed, a price
// line only appears when a price is configured. No price, no placeholder text either.

interface ServicesListProps {
  groups: PublicServiceGroup[];
  anyPriceShown: boolean;
  vatPercent: number;
}

export function ServicesList({ groups, anyPriceShown, vatPercent }: ServicesListProps) {
  return (
    <section id="leistungen" aria-labelledby="leistungen-title" className="scroll-mt-16 py-20 sm:py-24 xl:scroll-mt-20">
      <div className={container}>
        <SectionHeader id="leistungen" label="Stückliste" title="Leistungen">
          <p>Sortiert nach deinem Weg. Was ich nicht selbst mache, steht dabei.</p>
        </SectionHeader>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {groups.map((group, groupIndex) => (
            <section
              key={group.key}
              aria-labelledby={`leistungen-${group.key}`}
              className="flex flex-col rounded-2xl border border-fuge bg-creme"
            >
              <header className="flex flex-col gap-1 border-b border-fuge px-5 py-4 sm:px-6">
                <p className={`${eyebrow} text-[0.6875rem] text-kupfer`}>Pos. {String(groupIndex + 1).padStart(2, "0")}</p>
                <h3 id={`leistungen-${group.key}`} className="font-display text-2xl font-semibold">
                  {group.label}
                </h3>
                <p className="text-nuss-soft">{group.lead}</p>
              </header>
              <ul className="divide-y divide-dashed divide-fuge">
                {group.items.map((item, index) => (
                  <li key={item.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[auto_1fr_auto] sm:gap-x-4 sm:px-6">
                    <span className="hidden pt-0.5 font-mono text-xs text-nuss-muted sm:block" aria-hidden="true">
                      {String(groupIndex + 1)}.{String(index + 1)}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-semibold leading-snug text-nuss">{item.title}</h4>
                      <p className="mt-1 text-pretty text-[0.95rem] leading-relaxed text-nuss-soft">{item.description}</p>
                      {item.viaMasterPartner ? (
                        <p className="mt-2 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-kupfer">
                          Über meinen Meisterpartner
                        </p>
                      ) : null}
                    </div>
                    {item.priceLine || item.discountLine ? (
                      <div className="flex flex-col gap-1 font-mono text-sm sm:items-end sm:text-right">
                        {item.priceLine ? <span className="whitespace-nowrap text-nuss">{item.priceLine}</span> : null}
                        {item.discountLine ? (
                          <span className="text-[0.8125rem] text-kupfer">mit Boden-Pass Plus: {item.discountLine}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {anyPriceShown ? (
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.08em] text-nuss-muted">
            Alle Preise inkl. {vatPercent.toLocaleString("de-DE")} % MwSt.
          </p>
        ) : null}
      </div>
    </section>
  );
}
