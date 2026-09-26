import { VALUES } from "./content";
import { container, eyebrow } from "./ui";

export function BrandCore() {
  return (
    <section id="haltung" aria-labelledby="haltung-title" className="scroll-mt-16 py-20 sm:py-24 xl:scroll-mt-20">
      <div className={`${container} grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-16`}>
        <div className="flex flex-col gap-5">
          <p className={`${eyebrow} flex items-center gap-3 text-kupfer`}>
            <span className="h-px w-8 bg-current" aria-hidden="true" />
            Markenkern
          </p>
          <h2
            id="haltung-title"
            className="text-balance font-display text-[clamp(2.25rem,6.5vw,3.5rem)] font-medium leading-[1.02] tracking-[-0.025em]"
          >
            Man läuft jeden Tag <em>darauf.</em>
          </h2>
          <p className="text-pretty text-lg leading-relaxed text-nuss-soft sm:text-[1.1875rem]">
            Deshalb verdient jeder Raum den Boden, der zu ihm passt, und zu den Menschen, die darin leben.
          </p>
          <p className="text-pretty leading-relaxed text-nuss-muted">
            Draußen gibt die Natur den Boden vor. Drinnen wählst du ihn selbst. Ich mache aus Naturmaterial einen Boden,
            auf dem du dich zuhause fühlst.
          </p>
        </div>

        <ol className="grid border-l border-t border-fuge sm:grid-cols-2">
          {VALUES.map((value, index) => (
            <li key={value.name} className="flex flex-col gap-3 border-b border-r border-fuge bg-creme/60 p-5 sm:p-6">
              <span className="font-mono text-xs text-kupfer">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="font-display text-xl font-semibold leading-tight">{value.name}</h3>
              <div className="flex flex-col gap-1">
                <p className={`${eyebrow} text-[0.625rem] text-nuss-muted`}>Heißt konkret</p>
                <p className="text-pretty leading-relaxed text-nuss-soft">{value.means}</p>
              </div>
              <div className="mt-auto flex flex-col gap-1 border-t border-dashed border-fuge pt-3">
                <p className={`${eyebrow} text-[0.625rem] text-nuss-muted`}>Heißt nicht</p>
                <p className="text-sm leading-relaxed text-nuss-muted">{value.not}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
