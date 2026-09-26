"use client";

import { Box, ChartColumn, ExternalLink, Hammer, LogOut, UserCog, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

const LINKS = [
  { href: "/studio", label: "Traumhaus", icon: Box, adminOnly: false },
  { href: "/studio/werkbank", label: "Werkbank", icon: Hammer, adminOnly: true },
  { href: "/studio/benutzer", label: "Nutzer", icon: Users, adminOnly: true },
  { href: "/studio/konto", label: "Konto", icon: UserCog, adminOnly: false },
] as const;

const linkClass = (active: boolean) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
    active ? "bg-white/10 text-white" : "text-studio-muted hover:bg-white/5 hover:text-studio-text"
  }`;

export function StudioNav({ userName, isAdmin, posthogUrl = "" }: { userName: string; isAdmin: boolean; posthogUrl?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b border-studio-line bg-studio-panel/95 px-3 backdrop-blur sm:gap-4 sm:px-5">
      <Link href="/" className="flex items-center gap-2 pr-1 sm:pr-3" aria-label="Zur Website">
        <span className="grid size-8 place-items-center rounded-lg bg-oak font-display text-sm font-bold text-ink">AS</span>
        <span className="hidden font-display text-base font-semibold tracking-tight md:inline">Studio</span>
      </Link>
      <nav aria-label="Studio" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {LINKS.filter((link) => isAdmin || !link.adminOnly).map(({ href, label, icon: Icon }) => {
          const active = href === "/studio" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} aria-label={label} aria-current={active ? "page" : undefined} className={linkClass(active)}>
              <Icon className="size-4" aria-hidden />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
        {isAdmin ? (
          posthogUrl ? (
            <a href={posthogUrl} target="_blank" rel="noopener noreferrer" aria-label="Analytics (PostHog, öffnet in neuem Tab)" className={linkClass(false)}>
              <ChartColumn className="size-4" aria-hidden />
              <span className="hidden sm:inline">Analytics</span>
              <ExternalLink className="size-3.5 opacity-70" aria-hidden />
            </a>
          ) : (
            <Link
              href="/studio/werkbank/einstellungen#posthog"
              aria-label="Analytics: nicht verbunden"
              title="PostHog ist noch nicht verbunden. Die Projekt-URL trägst du in den Einstellungen ein."
              className={linkClass(false)}
            >
              <ChartColumn className="size-4" aria-hidden />
              <span className="hidden sm:inline">Analytics</span>
              <ExternalLink className="size-3.5 opacity-70" aria-hidden />
              <span className="hidden rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[0.65rem] font-semibold text-amber-300 lg:inline">nicht verbunden</span>
            </Link>
          )
        ) : null}
      </nav>
      <span className="hidden max-w-[16ch] truncate text-sm text-studio-muted lg:inline" title={userName}>
        {userName}
      </span>
      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-studio-muted transition hover:bg-white/5 hover:text-studio-text disabled:opacity-60"
      >
        <LogOut className="size-4" aria-hidden />
        <span className="hidden sm:inline">Abmelden</span>
      </button>
    </header>
  );
}
