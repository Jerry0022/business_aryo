"use client";

import {
  CalendarDays,
  ExternalLink,
  Hammer,
  House,
  Inbox,
  LayoutGrid,
  Menu,
  Repeat,
  SlidersHorizontal,
  Tag,
  Users,
  Video,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { WERKBANK_PATH } from "@/lib/werkbank/constants";
import { cx } from "./ui";

const MODULES = [
  { href: WERKBANK_PATH, label: "Übersicht", icon: LayoutGrid },
  { href: `${WERKBANK_PATH}/kalender`, label: "Kalender", icon: CalendarDays },
  { href: `${WERKBANK_PATH}/anfragen`, label: "Anfragen", icon: Inbox },
  { href: `${WERKBANK_PATH}/projekte`, label: "Projekte", icon: House },
  { href: `${WERKBANK_PATH}/kunden`, label: "Kunden & Boden-Pässe", icon: Users },
  { href: `${WERKBANK_PATH}/sprechstunde`, label: "Sprechstunde", icon: Video },
  { href: `${WERKBANK_PATH}/werkzeug`, label: "Werkzeug", icon: Hammer },
  { href: `${WERKBANK_PATH}/abos`, label: "Abos", icon: Repeat },
  { href: `${WERKBANK_PATH}/preise`, label: "Preise & Leistungen", icon: Tag },
  { href: `${WERKBANK_PATH}/einstellungen`, label: "Einstellungen", icon: SlidersHorizontal },
] as const;

/** Module sidebar (a collapsible menu on phones) and the scrollable content area. */
export function WerkbankShell({ newLeads, children }: { newLeads: number; children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (href: string) => (href === WERKBANK_PATH ? pathname === href : pathname.startsWith(href));
  const current = MODULES.find((module) => isActive(module.href)) ?? MODULES[0];

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <aside className="shrink-0 border-b border-studio-line bg-studio-panel/70 lg:flex lg:w-60 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex h-12 items-center justify-between gap-2 px-4 lg:h-auto lg:px-5 lg:pb-2 lg:pt-5">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-oak-light">Werkbank</p>
            <p className="truncate text-sm font-medium lg:hidden">{current.label}</p>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="werkbank-nav"
            className="flex items-center gap-1.5 rounded-lg border border-studio-line px-2.5 py-1.5 text-sm text-studio-muted transition hover:text-studio-text lg:hidden"
          >
            {menuOpen ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
            Menü
          </button>
        </div>
        <nav
          id="werkbank-nav"
          aria-label="Werkbank"
          className={cx("px-2 pb-3 lg:block lg:flex-1 lg:px-3", menuOpen ? "block" : "hidden")}
        >
          <ul className="space-y-0.5">
            {MODULES.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              const badge = href.endsWith("/anfragen") && newLeads > 0 ? newLeads : null;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                      active ? "bg-white/10 text-white" : "text-studio-muted hover:bg-white/5 hover:text-studio-text",
                    )}
                  >
                    <Icon className={cx("size-4 shrink-0", active && "text-oak-light")} aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {badge ? (
                      <span className="rounded-full bg-copper/90 px-1.5 text-[0.7rem] font-semibold tabular-nums text-white" aria-label={`${badge} neue`}>
                        {badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 border-t border-studio-line pt-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-studio-muted transition hover:bg-white/5 hover:text-studio-text"
            >
              <ExternalLink className="size-4" aria-hidden />
              Website ansehen
            </a>
          </div>
        </nav>
      </aside>
      <main id="werkbank-main" className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
