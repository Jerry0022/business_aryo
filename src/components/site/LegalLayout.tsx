import type { ReactNode } from "react";
import { DimensionLine } from "@/components/ratgeber/DimensionLine";
import { siteConfig } from "@/config/site";
import { BeraterFab } from "@/features/berater/ui/BeraterFab";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

interface LegalLayoutProps {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  /** Shown in the title block at the end of the sheet, e.g. "September 2026". */
  updated?: string;
  children: ReactNode;
}

/**
 * Shared frame for Impressum / Datenschutz in the Werkstatt look: the text sits on a linen
 * sheet with a title block ("Schriftfeld") at the end.
 */
export function LegalLayout({ eyebrow, title, intro, updated, children }: LegalLayoutProps) {
  return (
    <>
      <SiteHeader variant="solid" />
      <main id="main" className="bg-leinen pb-20 pt-28 text-nuss sm:pb-28 sm:pt-32 lg:pt-36">
        <article className="mx-auto w-full max-w-4xl px-4 sm:px-8">
          <header>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-kupfer sm:text-xs">{eyebrow}</p>
            <DimensionLine className="mt-6 max-w-md" />
            <h1 className="mt-4 font-display text-[clamp(2.1rem,7vw,4rem)] font-medium leading-[1] tracking-[-0.02em] text-balance hyphens-manual">
              {title}
            </h1>
            {intro ? <div className="mt-6 max-w-2xl text-lg leading-relaxed text-nuss-soft">{intro}</div> : null}
          </header>

          <div className="mt-10 rounded-2xl border border-fuge bg-creme px-5 py-8 sm:px-10 sm:py-12">
            <div className="legal-prose">{children}</div>
          </div>

          {/* "Inhaber" fits the Einzelunternehmen; a GmbH/UG would need "Geschäftsführer" (see Impressum). */}
          <dl className="grid grid-cols-2 border-b border-l border-nuss font-mono text-[11px] uppercase tracking-[0.1em] sm:grid-cols-4">
            <SchriftfeldCell label="Firma">{siteConfig.name}</SchriftfeldCell>
            <SchriftfeldCell label="Inhaber">{siteConfig.owner}</SchriftfeldCell>
            <SchriftfeldCell label="Stand">{updated ?? "September 2026"}</SchriftfeldCell>
            <SchriftfeldCell label="Blatt">1 / 1 · M 1 : 1</SchriftfeldCell>
          </dl>
        </article>
      </main>
      <SiteFooter />
      <BeraterFab />
    </>
  );
}

function SchriftfeldCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-r border-t border-nuss px-3 py-2.5">
      <dt className="text-[10px] text-nuss-muted">{label}</dt>
      <dd className="mt-1 normal-case tracking-normal text-nuss">{children}</dd>
    </div>
  );
}

/** Clearly visible marker for data that must be filled in or checked before go-live. */
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <mark
      data-placeholder=""
      className="rounded-[2px] bg-eiche/20 px-1.5 py-0.5 font-semibold text-nuss outline-1 outline-offset-0 outline-eiche-deep outline-dashed [box-decoration-break:clone]"
    >
      {children}
    </mark>
  );
}
