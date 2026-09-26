import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LINKS } from "@/content/ratgeber";

const OPTIONS = [
  {
    eyebrow: "Boden-Check · 7 Schritte",
    title: "7 Schritte zu deinem Boden.",
    text: "Du beantwortest sieben kurze Fragen zu Räumen, Alltag und Budget. Ich schicke dir dein Bodenprofil mit drei ehrlichen Empfehlungen.",
    link: { label: "Boden-Check starten", href: LINKS.bodenCheck },
  },
  {
    eyebrow: "Boden-Sprechstunde · live · gratis",
    title: "Eine Stunde, die dir teure Fehler erspart.",
    text: "Einmal im Monat live an der Werkbank. Die Kamera zeigt Hände, Holz und Werkzeug. Kein Verkaufsgespräch, dafür Antworten auf deine Fragen.",
    link: { label: "Platz sichern", href: LINKS.sprechstunde },
  },
] as const;

/** Closing band of the Ratgeber index: from reading to the next step. */
export function RatgeberCta() {
  return (
    <section aria-labelledby="ratgeber-weiter" className="mt-24 bg-graphit text-blatt">
      <div className="border-b border-graphit-soft px-6 py-8 sm:px-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-kreide-light sm:text-xs">Lieber persönlich?</p>
        <h2 id="ratgeber-weiter" className="mt-3 max-w-2xl font-semiwide text-2xl font-bold leading-tight text-balance sm:text-3xl">
          Lesen hilft. Fragen hilft mehr.
        </h2>
      </div>
      <ul className="grid md:grid-cols-2">
        {OPTIONS.map((option, index) => (
          <li
            key={option.title}
            className={`flex flex-col gap-3 px-6 py-8 sm:px-10 ${index > 0 ? "border-t border-graphit-soft md:border-l md:border-t-0" : ""}`}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-strich sm:text-xs">{option.eyebrow}</p>
            <h3 className="font-semiwide text-xl font-bold leading-snug">{option.title}</h3>
            <p className="max-w-md leading-relaxed text-estrich-deep">{option.text}</p>
            <Link
              href={option.link.href}
              className="mt-3 inline-flex items-center justify-center gap-2.5 self-start rounded-[2px] bg-kreide px-5 py-3.5 font-semibold text-white transition-colors hover:bg-kreide-deep focus-visible:outline-kreide-light"
            >
              {option.link.label}
              <ArrowRight className="size-4" strokeWidth={1.6} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
