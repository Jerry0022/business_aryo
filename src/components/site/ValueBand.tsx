import { CalendarCheck, ReceiptText, Ruler, Wind } from "lucide-react";

const VALUES = [
  {
    icon: Ruler,
    title: "Präzision bis ins Detail",
    text: "Gerade Fugen, exakte Anschlüsse – auch dort, wo später niemand mehr hinschaut.",
  },
  {
    icon: Wind,
    title: "Staubarm & sauber",
    text: "Staubarmes Schleifen und eine Baustelle, die ich ordentlich und besenrein hinterlasse.",
  },
  {
    icon: ReceiptText,
    title: "Festpreis nach Besichtigung",
    text: "Sie wissen vorher, was es kostet. Klare Positionen, keine Überraschungen.",
  },
  {
    icon: CalendarCheck,
    title: "Ehrlich & termintreu",
    text: "Verlässliche Absprachen und eine Beratung, die zu Ihrem Boden passt.",
  },
] as const;

export function ValueBand() {
  return (
    <section
      aria-label="Worauf Sie sich verlassen können"
      className="site-light relative border-b border-ink/10 bg-paper"
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <ul className="grid grid-cols-1 divide-y divide-ink/10 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, text }, index) => (
            <li
              key={title}
              className={`site-reveal flex gap-4 py-8 sm:py-10 lg:flex-col lg:gap-5 lg:px-8 lg:py-12 ${
                index > 0 ? "lg:border-l lg:border-ink/10" : "lg:pl-0"
              } ${index % 2 === 1 ? "sm:pl-8 sm:border-l sm:border-ink/10 lg:pl-8" : ""} ${
                index > 1 ? "sm:border-t sm:border-ink/10 lg:border-t-0" : ""
              }`}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sand text-oak-deep ring-1 ring-sand-deep">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-display text-xl font-medium leading-snug tracking-[-0.01em] text-ink">{title}</h3>
                <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
