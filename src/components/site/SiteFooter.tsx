import Link from "next/link";
import type { ReactNode } from "react";
import { CookieSettingsButton } from "@/components/consent/CookieSettingsButton";
import { analyticsEnabled } from "@/config/analytics";
import { siteConfig } from "@/config/site";
import { InstallAppButton } from "@/features/pwa/ui/InstallAppButton";
import { resolveHref } from "./content";
import { Logo } from "./Logo";

// Footer as the title block (Schriftfeld) of a technical drawing, on walnut like the contact section.

function Cell({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 border-b border-r border-creme/15 px-3.5 py-3 ${className}`}>
      <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-fuge-dark">{label}</span>
      <div className="text-sm text-leinen-deep">{children}</div>
    </div>
  );
}

const footerLink =
  "underline decoration-leinen-deep/30 decoration-1 underline-offset-4 transition-colors hover:text-kupfer-light hover:decoration-kupfer-light";

export function SiteFooter({ onHome = false }: { onHome?: boolean }) {
  const year = new Date().getFullYear();
  return (
    <footer className={`site-dark bg-nuss pb-14 text-creme ${onHome ? "pt-4" : "pt-14"}`}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-12 xl:px-20">
        <div className="grid grid-cols-2 border-l border-t border-creme/15 md:grid-cols-4">
          <Cell label="Zeichnung" className="col-span-2 md:row-span-2">
            <div className="flex h-full flex-col justify-between gap-4 pb-1">
              <Logo href={onHome ? "#top" : "/"} tone="dark" />
              <p className="max-w-xs text-pretty text-sm leading-relaxed text-fuge">{siteConfig.tagline}</p>
            </div>
          </Cell>
          <Cell label="Firma">
            <span className="font-bold">
              {siteConfig.name} · {siteConfig.trade}
            </span>
          </Cell>
          <Cell label="Leistung">Planung · Material · Werkzeug · Verlegung</Cell>
          <Cell label="Gebiet">{siteConfig.serviceArea ?? "NRW"}</Cell>
          <Cell label="B2B">
            <a href={resolveHref("#profis", onHome)} className={footerLink}>
              Als Partner bewerben
            </a>
          </Cell>
          <Cell label="Rechtliches">
            <span className="flex flex-wrap gap-x-3 gap-y-1">
              <Link href="/impressum" className={footerLink}>
                Impressum
              </Link>
              <Link href="/datenschutz" className={footerLink}>
                Datenschutz
              </Link>
              {analyticsEnabled ? (
                <CookieSettingsButton className={`cursor-pointer ${footerLink}`} />
              ) : null}
            </span>
          </Cell>
          <Cell label="Wissen">
            <Link href="/ratgeber" prefetch={false} className={footerLink}>
              Ratgeber
            </Link>
          </Cell>
          <Cell label="Zugang">
            <span className="flex flex-wrap gap-x-3 gap-y-1">
              <Link href="/login" prefetch={false} className={footerLink}>
                Login
              </Link>
              <InstallAppButton className={`inline-flex cursor-pointer items-center gap-1 ${footerLink}`} />
            </span>
          </Cell>
          <Cell label="Blatt">
            <span className="font-mono text-[0.8125rem]">1/1 · M 1:1</span>
          </Cell>
          <Cell label="Claim" className="col-span-2 md:col-span-3">
            <span className="font-display text-lg italic text-kupfer-light">{siteConfig.claim}</span>
          </Cell>
          <Cell label="Stand" className="col-span-2 md:col-span-1">
            <span className="font-mono text-[0.8125rem]">
              © {year} {siteConfig.name}
            </span>
          </Cell>
        </div>
      </div>
    </footer>
  );
}
