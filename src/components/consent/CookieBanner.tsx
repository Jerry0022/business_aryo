"use client";

import { ChevronDown, Cookie } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { isConsentSettingsOpen, readConsent, subscribeConsent, writeConsent } from "@/lib/consent";

// Both choices share one style on purpose: rejecting must be as easy as accepting.
const buttonClass =
  "inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-xs bg-blatt/10 px-4 py-2.5 text-sm font-semibold text-blatt ring-1 ring-blatt/25 transition-colors hover:bg-blatt hover:text-graphit";

/**
 * Compact consent banner for PostHog; nothing loads before a decision. The conventional ids
 * (`cookie-banner`, `cookie-accept`, `cookie-reject`) let consent browser extensions answer it
 * on the visitor's behalf.
 */
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
      id="cookie-banner"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-text"
      className="cookie-banner site-dark fixed inset-x-3 bottom-3 z-[70] max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-xs border border-blatt/10 bg-graphit/95 p-4 text-blatt shadow-2xl shadow-graphit/40 backdrop-blur sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[25rem]"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xs bg-eiche/20 text-eiche" aria-hidden="true">
          <Cookie className="size-5" strokeWidth={1.75} />
        </span>
        <div>
          <h2
            id="cookie-banner-title"
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-lg font-extrabold leading-tight font-semiwide outline-none"
          >
            Ein Keks für die Statistik?
          </h2>
          <p id="cookie-banner-text" className="mt-1 text-sm leading-snug text-blatt/70">
            Darf ich pseudonym mitzählen, welche Seiten gefragt sind? Keine Werbung, keine Weitergabe.{" "}
            <Link href="/datenschutz#cookies" className="whitespace-nowrap underline underline-offset-2 hover:text-blatt">
              Datenschutz
            </Link>
          </p>
        </div>
      </div>

      <details className="group mt-3 rounded-xs bg-blatt/5 text-sm text-blatt/70 open:bg-blatt/[0.07]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xs px-3 py-2 font-semibold text-blatt/85 hover:text-blatt [&::-webkit-details-marker]:hidden">
          Kurz erklärt
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <ul className="space-y-1.5 px-3 pb-3 leading-snug">
          <li>
            <strong className="text-blatt/90">Was:</strong> Seitenaufrufe, Klicks, Ladezeiten, Gerät und Browser. Keine
            Formulareingaben, keine IP-Adresse, keine Bildschirmaufzeichnung.
          </li>
          <li>
            <strong className="text-blatt/90">Wo:</strong> PostHog, Server in Frankfurt (EU).
          </li>
          <li>
            <strong className="text-blatt/90">Wie lange:</strong> Das Statistik-Cookie bis zu 12 Monate.
          </li>
          <li>
            <strong className="text-blatt/90">Immer aktiv:</strong> nur technisch Notwendiges, etwa deine Auswahl hier
            und der Login.
          </li>
          <li>
            Du kannst jederzeit im Seitenfuß unter „Cookie-Einstellungen“ widerrufen.{" "}
            <Link href="/datenschutz#cookies" className="underline underline-offset-2 hover:text-blatt">
              Alle Details
            </Link>
          </li>
        </ul>
      </details>

      {consent !== "unknown" ? (
        <p className="mt-3 text-xs text-blatt/55">
          Aktuell: {consent === "granted" ? "Statistik erlaubt" : "nur notwendige Cookies"}
        </p>
      ) : null}
      <div className="mt-3 flex gap-2">
        <button
          id="cookie-reject"
          type="button"
          data-consent="reject"
          className={buttonClass}
          onClick={() => writeConsent("denied")}
        >
          Nur notwendige
        </button>
        <button
          id="cookie-accept"
          type="button"
          data-consent="accept"
          className={buttonClass}
          onClick={() => writeConsent("granted")}
        >
          Einverstanden
        </button>
      </div>
    </section>
  );
}
