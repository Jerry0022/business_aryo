import { CalendarDays, Camera, Mail, MapPin, Phone, Ruler } from "lucide-react";
import { siteConfig } from "@/config/site";
import { QUOTE_MAILTO, telHref } from "./content";
import { QuoteForm } from "./QuoteForm";
import { SectionHeading } from "./SectionHeading";

const HINTS = [
  { icon: Camera, text: "Ein paar Fotos vom aktuellen Boden" },
  { icon: Ruler, text: "Ungefähre Raummaße oder Fläche" },
  { icon: CalendarDays, text: "Ihr Wunschzeitraum" },
] as const;

export function Contact() {
  const { phone, serviceArea, email } = siteConfig;
  return (
    <section
      id="kontakt"
      aria-labelledby="kontakt-title"
      className="site-dark relative isolate scroll-mt-20 overflow-hidden bg-ink py-24 text-paper sm:py-32"
    >
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_15%_20%,rgb(216_113_44/0.18),transparent_70%),radial-gradient(40%_50%_at_90%_90%,rgb(196_138_74/0.12),transparent_70%)]"
        aria-hidden="true"
      />
      <div className="mx-auto grid w-full max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-12 lg:gap-12 lg:px-12">
        <div className="lg:col-span-5">
          <SectionHeading id="kontakt-title" eyebrow="Kontakt" title="Erzählen Sie mir von Ihrem Boden." tone="dark">
            Ein paar Eckdaten genügen. Ich melde mich bei Ihnen, und wir vereinbaren einen Termin zur Besichtigung.
            Danach erhalten Sie ein Festpreis-Angebot.
          </SectionHeading>

          <div className="site-reveal mt-10 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <a
              href={QUOTE_MAILTO}
              className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-copper px-6 py-4 text-base font-semibold text-ink shadow-[0_18px_40px_-18px_rgb(216_113_44/0.9)] transition hover:bg-oak-light"
            >
              <Mail className="size-[1.1rem]" aria-hidden="true" />
              E-Mail schreiben
            </a>
            {phone ? (
              <a
                href={telHref(phone)}
                className="inline-flex items-center justify-center gap-2.5 rounded-full border border-paper/25 px-6 py-4 text-base font-medium text-paper transition hover:border-paper/60 hover:bg-paper/5"
              >
                <Phone className="size-[1.1rem]" aria-hidden="true" />
                Anrufen
              </a>
            ) : null}
          </div>

          <dl className="site-reveal mt-12 space-y-5 border-t border-paper/15 pt-8 text-sm">
            <div className="flex items-start gap-4">
              <dt className="flex size-10 shrink-0 items-center justify-center rounded-full bg-paper/5 text-oak-light ring-1 ring-paper/10">
                <Mail className="size-4" aria-hidden="true" />
                <span className="sr-only">E-Mail</span>
              </dt>
              <dd className="pt-2.5">
                <a
                  href={`mailto:${email}`}
                  className="break-all text-base font-medium text-paper underline-offset-4 hover:underline"
                >
                  {email}
                </a>
              </dd>
            </div>
            {phone ? (
              <div className="flex items-start gap-4">
                <dt className="flex size-10 shrink-0 items-center justify-center rounded-full bg-paper/5 text-oak-light ring-1 ring-paper/10">
                  <Phone className="size-4" aria-hidden="true" />
                  <span className="sr-only">Telefon</span>
                </dt>
                <dd className="pt-2.5">
                  <a
                    href={telHref(phone)}
                    className="text-base font-medium text-paper underline-offset-4 hover:underline"
                  >
                    {phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {serviceArea ? (
              <div className="flex items-start gap-4">
                <dt className="flex size-10 shrink-0 items-center justify-center rounded-full bg-paper/5 text-oak-light ring-1 ring-paper/10">
                  <MapPin className="size-4" aria-hidden="true" />
                  <span className="sr-only">Einsatzgebiet</span>
                </dt>
                <dd className="pt-2.5 text-base font-medium text-paper">{serviceArea}</dd>
              </div>
            ) : null}
          </dl>

          <div className="site-reveal mt-10 rounded-2xl border border-paper/10 bg-paper/[0.03] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-oak-light">
              Hilfreich für Ihre Anfrage
            </p>
            <ul className="mt-4 space-y-3 text-[0.95rem] text-paper/80">
              {HINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <Icon className="size-4 shrink-0 text-oak-light" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="site-reveal site-light lg:col-span-7">
          <div className="rounded-[1.75rem] bg-paper p-6 text-ink shadow-[0_50px_100px_-50px_rgb(0_0_0/0.8)] sm:p-9">
            <h3 className="font-display text-2xl font-medium tracking-[-0.015em]">Anfrage vorbereiten</h3>
            <p className="mt-2 text-ink-muted">Füllen Sie aus, was Sie schon wissen – den Rest klären wir gemeinsam.</p>
            <div className="mt-8">
              <QuoteForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
