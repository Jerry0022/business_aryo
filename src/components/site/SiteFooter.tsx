import Link from "next/link";
import type { ReactNode } from "react";
import { CookieSettingsButton } from "@/components/consent/CookieSettingsButton";
import { analyticsEnabled } from "@/config/analytics";
import { siteConfig } from "@/config/site";
import { resolveHref } from "./content";
import { Logo } from "./Logo";

// Footer as the title block (Schriftfeld) of a technical drawing.

function Cell({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 border-b border-r border-graphit px-3.5 py-3 ${className}`}>
      <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-graphit-muted">{label}</span>
      <div className="text-sm text-graphit">{children}</div>
    </div>
  );
}

const footerLink =
  "underline decoration-graphit/30 decoration-1 underline-offset-4 transition-colors hover:text-kreide hover:decoration-kreide";

export function SiteFooter({ onHome = false }: { onHome?: boolean }) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-estrich pb-14 pt-4">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-12 xl:px-20">
        <div className="grid grid-cols-2 border-l border-t border-graphit md:grid-cols-4">
          <Cell label="Zeichnung" className="col-span-2 md:row-span-2">
            <div className="flex h-full flex-col justify-between gap-4 pb-1">
              <Logo href={onHome ? "#top" : "/"} />
              <p className="max-w-xs text-pretty text-sm leading-relaxed text-graphit-soft">{siteConfig.tagline}</p>
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
            <Link href="/login" prefetch={false} className={footerLink}>
              Login
            </Link>
          </Cell>
          <Cell label="Blatt">
            <span className="font-mono text-[0.8125rem]">1/1 · M 1:1</span>
          </Cell>
          <Cell label="Claim" className="col-span-2 md:col-span-3">
            <span className="font-display text-base font-extrabold font-semiwide">{siteConfig.claim}</span>
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
