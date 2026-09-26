import { siteConfig } from "@/config/site";
import { EmergencyForm } from "./EmergencyForm";
import { ArrowIcon, buttonPrimary, buttonSecondary, card, container, eyebrow, SectionHeader } from "./ui";

// Closing section on walnut: the light cards lie on the workbench.

export function Contact() {
  const mailto = `mailto:${siteConfig.email}`;
  return (
    <section id="kontakt" aria-labelledby="kontakt-title" className="surface-nuss site-dark scroll-mt-16 pb-24 pt-20 sm:pt-24 xl:scroll-mt-20">
      <div className={container}>
        <SectionHeader id="kontakt" label="Retten und auffrischen" title={<>Kontakt und <em>Notfall</em></>} dark>
          <p>Wasserschaden? Foto schicken, Ruhe bewahren. Ich melde mich mit einer ehrlichen Einschätzung.</p>
        </SectionHeader>

        <div className="mt-12 grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div className={`${card} p-5 text-nuss sm:p-8`}>
            <h3 className="font-display text-2xl font-semibold">Schaden melden</h3>
            <p className="mt-2 text-pretty leading-relaxed text-nuss-soft">
              Beschreib kurz, was passiert ist. Danach schickst du mir 2 bis 3 Fotos per E-Mail.
            </p>
            <div className="mt-6">
              <EmergencyForm />
            </div>
          </div>

          <aside aria-labelledby="kontakt-direkt" className={`${card} flex flex-col gap-5 p-5 text-nuss sm:p-8`}>
            <h3 id="kontakt-direkt" className="font-display text-2xl font-semibold">
              Direkt schreiben
            </h3>
            <p className="text-pretty leading-relaxed text-nuss-soft">
              Für alles andere reicht eine E-Mail. Die lese und beantworte ich selbst.
            </p>
            <div className="flex flex-col gap-1.5">
              <span className={`${eyebrow} text-[0.6875rem] text-nuss-muted`}>E-Mail</span>
              <span className="select-all break-all font-mono text-[0.95rem] text-nuss">{siteConfig.email}</span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <a href={mailto} className={buttonPrimary}>
                E-Mail schreiben
                <ArrowIcon />
              </a>
              {siteConfig.phone ? (
                <a href={`tel:${siteConfig.phone}`} className={buttonSecondary}>
                  Anrufen
                </a>
              ) : null}
            </div>
            <dl className="mt-auto grid gap-3 border-t border-dashed border-fuge pt-5 text-sm">
              <div className="flex flex-col gap-0.5">
                <dt className={`${eyebrow} text-[0.625rem] text-nuss-muted`}>Gebiet</dt>
                <dd className="text-nuss">{siteConfig.serviceArea ?? "NRW"}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className={`${eyebrow} text-[0.625rem] text-nuss-muted`}>Handwerk</dt>
                <dd className="text-nuss">{siteConfig.trade}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </section>
  );
}
