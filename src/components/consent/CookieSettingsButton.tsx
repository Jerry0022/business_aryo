"use client";

import { openConsentSettings } from "@/lib/consent";

/** Re-opens the cookie banner so visitors can change or withdraw their consent. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={openConsentSettings}>
      Cookie-Einstellungen
    </button>
  );
}
