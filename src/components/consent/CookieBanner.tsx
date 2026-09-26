"use client";

import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { isConsentSettingsOpen, readConsent, subscribeConsent, writeConsent } from "@/lib/consent";

const buttonClass =
  "inline-flex flex-1 items-center justify-center rounded-full border border-paper/30 px-5 py-3 text-sm font-semibold text-paper transition hover:border-paper hover:bg-paper hover:text-ink";

/** Consent banner for PostHog. Both choices are equally prominent; nothing loads before a decision. */
export function CookieBanner() {
  const consent = useSyncExternalStore(subscribeConsent, readConsent, () => "pending" as const);
  const settingsOpen = useSyncExternalStore(subscribeConsent, isConsentSettingsOpen, () => false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (settingsOpen) headingRef.current?.focus();
  }, [settingsOpen]);

  if (consent === "pending" || (consent !== "unknown" && !settingsOpen)) return null;

  return (
    <section
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-text"
      className="site-dark fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-xl rounded-card border border-paper/10 bg-ink p-5 text-paper shadow-2xl shadow-ink/40 sm:bottom-5 sm:p-6"
    >
      <h2
        id="cookie-banner-title"
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-xl font-medium tracking-tight outline-none"
      >
        Cookies &amp; Statistik
      </h2>
      <p id="cookie-banner-text" className="mt-2 text-sm leading-relaxed text-paper/75">
        Mit Ihrer Einwilligung nutze ich PostHog (Server in der EU), um in pseudonymisierter Form zu verstehen, welche
        Seiten und Inhalte gefragt sind. Technisch notwendige Cookies, etwa für den Login und diese Auswahl, sind immer aktiv. Sie können
        Ihre Entscheidung jederzeit unter „Cookie-Einstellungen“ im Seitenfuß ändern. Mehr dazu in der{" "}
        <Link href="/datenschutz#cookies" className="underline underline-offset-2 hover:text-paper">
          Datenschutzerklärung
        </Link>
        .
      </p>
      {consent !== "unknown" ? (
        <p className="mt-3 text-xs text-paper/60">
          Aktuelle Auswahl: {consent === "granted" ? "Statistik erlaubt" : "nur notwendige Cookies"}
        </p>
      ) : null}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button type="button" className={buttonClass} onClick={() => writeConsent("denied")}>
          Nur notwendige
        </button>
        <button type="button" className={buttonClass} onClick={() => writeConsent("granted")}>
          Statistik erlauben
        </button>
      </div>
    </section>
  );
}
