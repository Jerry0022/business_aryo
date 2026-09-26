import type { FoundingContingent, MonthState, ProjectContingent } from "@/lib/business/contingent";
import { countLabel, formatDateKey, MONTHS } from "./format";
import { container, eyebrow } from "./ui";

// Jahreskontingent (concept 7.3): the counters come straight from the Werkbank calendar. Without a
// database connection (`live` false) no numbers are shown, only the promise.

const STATE_LABEL: Record<MonthState, string> = {
  gebucht: "gebucht",
  reserviert: "reserviert",
  frei: "frei",
};

function PlankCell({ state, live }: { state: MonthState; live: boolean }) {
  if (!live) return <div className="plank-cell plank-neutral" aria-hidden="true" />;
  return <div className={`plank-cell plank-${state}`} aria-hidden="true" />;
}

interface ContingentProps {
  projects: ProjectContingent;
  founding: FoundingContingent;
  live: boolean;
}

export function Contingent({ projects, founding, live }: ContingentProps) {
  const foundingYear = founding.deadline.slice(0, 4);
  return (
    <section
      id="kontingent"
      aria-labelledby="kontingent-title"
      className="site-dark scroll-mt-16 bg-graphit py-14 text-blatt sm:py-16 xl:scroll-mt-20"
    >
      <div className={`${container} grid items-center gap-10 lg:grid-cols-[5fr_7fr] lg:gap-14`}>
        <div className="flex flex-col gap-4">
          <p className={`${eyebrow} text-strich`}>Jahreskontingent {projects.year}</p>
          <h2
            id="kontingent-title"
            className="text-balance font-display text-[clamp(1.75rem,4.5vw,2.125rem)] font-bold leading-[1.12] font-semiwide"
          >
            Ich verlege nur {projects.total} Böden im Jahr. Einen pro Monat.
          </h2>
          <p className="max-w-md text-pretty leading-relaxed text-estrich-deep">
            Weil ich jeden Boden selbst verlege.
            {live ? " Der Zähler kommt direkt aus meinem Kalender, er ist also immer echt." : ""}
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <ol className="grid grid-cols-6 gap-x-1.5 gap-y-4 sm:grid-cols-12 sm:gap-2" aria-label={`Projektplätze ${projects.year}`}>
            {projects.months.map((month) => {
              const name = MONTHS[month.month - 1];
              return (
                <li key={month.month} className="flex flex-col items-stretch gap-2">
                  <PlankCell state={month.state} live={live} />
                  <span
                    className={`text-center font-mono text-[0.6875rem] tracking-[0.06em] ${
                      live && month.state === "frei" ? "text-strich-dark" : "text-estrich-deep"
                    }`}
                    aria-hidden="true"
                  >
                    {name?.short}
                  </span>
                  <span className="sr-only">
                    {name?.long}
                    {live ? `: ${STATE_LABEL[month.state]}` : ""}
                  </span>
                </li>
              );
            })}
          </ol>

          {live ? (
            <ul className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-estrich-deep" aria-label="Legende">
              <li className="flex items-center gap-2">
                <span className="plank-gebucht inline-block h-3 w-5" aria-hidden="true" /> gebucht
              </li>
              <li className="flex items-center gap-2">
                <span className="plank-reserviert inline-block h-3 w-5" aria-hidden="true" /> reserviert
              </li>
              <li className="flex items-center gap-2">
                <span className="plank-frei inline-block h-3 w-5" aria-hidden="true" /> frei
              </li>
            </ul>
          ) : null}

          <div className="flex flex-col gap-1.5">
            {live ? (
              <p className="text-lg font-semibold">
                {projects.free > 0
                  ? `Noch ${countLabel(projects.free, "Projektplatz", "Projektplätze")} frei`
                  : `Alle ${projects.total} Projektplätze für ${projects.year} sind vergeben.`}
              </p>
            ) : (
              <p className="text-lg font-semibold">Ob in deinem Wunschmonat noch ein Platz frei ist, sag ich dir nach dem Boden-Check.</p>
            )}
            {live && projects.free === 0 ? (
              <p className="text-pretty text-estrich-deep">
                Kein Kontakt geht verloren: Du kannst mit Material, Werkzeug und Einweisung selbst verlegen.
              </p>
            ) : null}
            {live && founding.open ? (
              <p className="font-mono text-xs uppercase leading-relaxed tracking-[0.06em] text-strich">
                Gründungskontingent {foundingYear}: noch {founding.free} von {founding.total} Erstberatungen · bis{" "}
                {formatDateKey(founding.deadline)}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
