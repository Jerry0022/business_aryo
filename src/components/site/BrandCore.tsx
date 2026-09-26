import { VALUES } from "./content";
import { container, eyebrow } from "./ui";

export function BrandCore() {
  return (
    <section id="haltung" aria-labelledby="haltung-title" className="scroll-mt-16 py-20 sm:py-24 xl:scroll-mt-20">
      <div className={`${container} grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-16`}>
        <div className="flex flex-col gap-5">
          <p className={`${eyebrow} flex items-center gap-3 text-kreide`}>
            <span className="h-px w-6 bg-current" aria-hidden="true" />
            Markenkern
          </p>
          <h2
            id="haltung-title"
            className="text-balance font-display text-[clamp(2rem,6vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.01em] font-semiwide"
          >
            Man läuft jeden Tag darauf.
          </h2>
          <p className="text-pretty text-lg leading-relaxed text-graphit-soft sm:text-[1.1875rem]">
            Deshalb verdient jeder Raum den Boden, der zu ihm passt, und zu den Menschen, die darin leben.
          </p>
          <p className="text-pretty leading-relaxed text-graphit-muted">
            Draußen gibt die Natur den Boden vor. Drinnen wählst du ihn selbst. Ich mache aus Naturmaterial einen Boden,
            auf dem du dich zuhause fühlst.
          </p>
        </div>

        <ol className="grid border-l border-t border-strich sm:grid-cols-2">
          {VALUES.map((value, index) => (
            <li key={value.name} className="flex flex-col gap-3 border-b border-r border-strich bg-blatt/60 p-5 sm:p-6">
              <span className="font-mono text-xs text-kreide">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="font-display text-xl font-bold leading-tight font-semiwide">{value.name}</h3>
              <div className="flex flex-col gap-1">
                <p className={`${eyebrow} text-[0.625rem] text-graphit-muted`}>Heißt konkret</p>
                <p className="text-pretty leading-relaxed text-graphit-soft">{value.means}</p>
              </div>
              <div className="mt-auto flex flex-col gap-1 border-t border-dashed border-strich pt-3">
                <p className={`${eyebrow} text-[0.625rem] text-graphit-muted`}>Heißt nicht</p>
                <p className="text-sm leading-relaxed text-graphit-muted">{value.not}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
