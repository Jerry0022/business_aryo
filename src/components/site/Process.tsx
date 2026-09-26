import { SectionHeading } from "./SectionHeading";

const STEPS = [
  {
    title: "Anfrage",
    text: "Schreiben Sie mir kurz, worum es geht: Raum, ungefähre Fläche, Ihr Wunsch. Gern mit ein paar Fotos vom Bestand.",
    tone: "bg-oak-light",
  },
  {
    title: "Besichtigung & Beratung vor Ort",
    text: "Ich sehe mir Untergrund, Raum und Bestand an und berate Sie zu Holz, Muster und Oberfläche – ehrlich und ohne Verkaufsdruck.",
    tone: "bg-oak",
  },
  {
    title: "Festpreis-Angebot",
    text: "Sie erhalten ein klares Angebot zum Festpreis, mit allen Positionen. So wissen Sie vorher, woran Sie sind.",
    tone: "bg-oak-deep",
  },
  {
    title: "Verlegung & saubere Übergabe",
    text: "Termintreue Ausführung, staubarm und ordentlich. Zum Schluss gehen wir gemeinsam über Ihren neuen Boden.",
    tone: "bg-walnut",
  },
] as const;

export function Process() {
  return (
    <section id="ablauf" aria-labelledby="ablauf-title" className="site-light scroll-mt-20 bg-paper py-24 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <SectionHeading
          id="ablauf-title"
          eyebrow="Ablauf"
          title="In vier Schritten zum neuen Boden."
          className="max-w-3xl"
        >
          Kein Rätselraten, keine offenen Fragen: So läuft die Zusammenarbeit mit mir ab.
        </SectionHeading>

        <ol className="mt-16 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="site-reveal relative">
              <div className="flex items-center gap-4" aria-hidden="true">
                <span className="font-display text-[3.5rem] font-light leading-none tracking-[-0.04em] text-oak-deep tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={`h-2.5 flex-1 rounded-full ${step.tone} shadow-[inset_0_-1px_0_rgb(0_0_0/0.15)]`} />
              </div>
              <h3 className="mt-7 font-display text-2xl font-medium leading-snug tracking-[-0.015em] text-ink">
                <span className="sr-only">Schritt {index + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-3 text-pretty leading-relaxed text-ink-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
