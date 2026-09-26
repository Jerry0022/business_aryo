import type { ArticleCta as ArticleCtaData } from "@/content/ratgeber";
import { CtaLinks } from "./CtaLinks";

/** Closing call to action of an article, on the dark graphite band. */
export function ArticleCta({ cta }: { cta: ArticleCtaData }) {
  return (
    <section aria-labelledby="naechster-schritt" className="mt-16 bg-nuss p-6 text-creme sm:p-9">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-kupfer-light sm:text-xs">Nächster Schritt</p>
      <h2 id="naechster-schritt" className="mt-3 font-display text-2xl font-semibold leading-tight text-balance sm:text-[1.75rem]">
        {cta.heading}
      </h2>
      <p className="mt-3 max-w-[60ch] text-[1.0625rem] leading-relaxed text-leinen-deep">{cta.text}</p>
      <div className="mt-7">
        <CtaLinks primary={cta.primary} secondary={cta.secondary} />
      </div>
    </section>
  );
}
