import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { buildParquet } from "@/components/site/parquet/geometry";
import { ParquetSvg } from "@/components/site/parquet/ParquetSvg";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export const metadata: Metadata = {
  title: "Seite nicht gefunden",
  robots: { index: false },
};

// Plank floor with exactly one board missing — the page that "isn't there".
const floor = buildParquet("schiffsboden", { width: 560, height: 400, unit: 22, seed: 404, gap: { x: 280, y: 200 } });

export default function NotFound() {
  return (
    <>
      <SiteHeader variant="solid" />
      <main id="main" className="site-light bg-paper pb-24 pt-32 sm:pb-32 sm:pt-40">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:px-12">
          <div>
            <p className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-oak-deep">
              <span className="h-px w-8 bg-current" aria-hidden="true" />
              Fehler 404
            </p>
            <h1 className="mt-5 font-display text-[clamp(2.8rem,7vw,5.2rem)] font-medium leading-[0.98] tracking-[-0.03em] text-ink">
              Hier fehlt ein Stück.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-muted">
              Die Seite, die Sie suchen, gibt es nicht (mehr) – oder die Adresse hat sich verändert. Auf der Startseite
              finden Sie alles über meine Arbeit.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 font-semibold text-paper transition hover:bg-walnut"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Zur Startseite
              </Link>
              <Link
                href="/#kontakt"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-6 py-3.5 font-medium text-ink transition hover:border-ink/40 hover:bg-sand"
              >
                <Mail className="size-4" aria-hidden="true" />
                Kontakt aufnehmen
              </Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-40px_rgb(86_53_33/0.6)] ring-1 ring-ink/10">
            <ParquetSvg geometry={floor} wood="eiche-natur" className="block aspect-[7/5] w-full" />
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,transparent_40%,rgb(23_19_15/0.35)_100%)]"
              aria-hidden="true"
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
