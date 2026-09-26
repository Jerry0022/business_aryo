"use client";

import { Box, ChartLine, ExternalLink, LogOut, UserCog, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { posthogDashboardUrl } from "@/lib/posthog-dashboard";

const LINKS = [
  { href: "/studio", label: "Traumhaus", icon: Box, adminOnly: false },
  { href: "/studio/benutzer", label: "Nutzer", icon: Users, adminOnly: true },
  { href: "/studio/konto", label: "Konto", icon: UserCog, adminOnly: false },
] as const;

export function StudioNav({ userName, isAdmin }: { userName: string; isAdmin: boolean }) {
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
      <nav aria-label="Studio" className="flex min-w-0 flex-1 items-center gap-1">
        {LINKS.filter((link) => isAdmin || !link.adminOnly).map(({ href, label, icon: Icon }) => {
          const active = href === "/studio" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active ? "bg-white/10 text-white" : "text-studio-muted hover:bg-white/5 hover:text-studio-text"
              }`}
            >
              <Icon className="size-4" aria-hidden />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
        {isAdmin ? (
          // The website's visitor statistics live in PostHog – easy to forget, so it sits right here.
          <a
            href={posthogDashboardUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-studio-muted transition hover:bg-white/5 hover:text-studio-text"
            aria-label="Statistik – Website-Besucher in PostHog (öffnet in neuem Tab)"
            title="Besucherstatistik der Website in PostHog"
          >
            <ChartLine className="size-4" aria-hidden />
            <span className="hidden sm:inline">Statistik</span>
            <ExternalLink className="hidden size-3 opacity-60 sm:block" aria-hidden />
          </a>
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
