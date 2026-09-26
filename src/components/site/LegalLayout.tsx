import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

interface LegalLayoutProps {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
}

/** Shared frame for Impressum / Datenschutz: solid header, readable text column, footer. */
export function LegalLayout({ eyebrow, title, intro, children }: LegalLayoutProps) {
  return (
    <>
      <SiteHeader variant="solid" />
      <main id="main" className="site-light bg-paper pb-24 pt-32 sm:pb-32 sm:pt-40">
        <article className="mx-auto w-full max-w-3xl px-5 sm:px-8">
          <header className="border-b border-ink/10 pb-10">
            <p className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-oak-deep">
              <span className="h-px w-8 bg-current" aria-hidden="true" />
              {eyebrow}
            </p>
            <h1 className="mt-5 font-display text-[clamp(2.25rem,6vw,4rem)] font-medium leading-[1.02] tracking-[-0.025em] text-ink">
              {title}
            </h1>
            {intro ? <div className="mt-6 text-lg leading-relaxed text-ink-muted">{intro}</div> : null}
          </header>
          <div className="legal-prose mt-10">{children}</div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

/** Clearly visible marker for data that must be filled in before go-live. */
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded-md bg-copper/15 px-1.5 py-0.5 font-semibold text-oak-deep ring-1 ring-copper/50">
      {children}
    </mark>
  );
}
