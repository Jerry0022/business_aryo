"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { PostHog } from "posthog-js";
import { analyticsConfig } from "@/config/analytics";
import { readConsent, subscribeConsent } from "@/lib/consent";

let client: PostHog | null = null;

/** Removes anything PostHog may have stored (e.g. after consent was withdrawn). */
function purgePostHogStorage() {
  for (const part of document.cookie.split(";")) {
    const name = part.split("=", 1)[0]?.trim() ?? "";
    if (name.startsWith("ph_")) document.cookie = `${name}=; Path=/; Max-Age=0`;
  }
  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (const key of Object.keys(storage)) {
      if (key.startsWith("ph_") || key.startsWith("__ph")) storage.removeItem(key);
    }
  }
}

async function startPostHog(key: string) {
  const { default: posthog } = await import("posthog-js");
  // Consent may have been withdrawn while the chunk was loading.
  if (readConsent() !== "granted" || client) return;
  posthog.init(key, {
    api_host: analyticsConfig.apiPath,
    ui_host: analyticsConfig.uiHost,
    defaults: "2026-08-30",
    person_profiles: "identified_only",
    // Only anonymous usage statistics — no screen recordings, surveys or cross-subdomain cookies.
    disable_session_recording: true,
    disable_surveys: true,
    cross_subdomain_cookie: false,
    respect_dnt: true,
  });
  client = posthog;
}

/** Loads PostHog only after the visitor has opted in; never renders anything itself. */
export function PostHogAnalytics() {
  const consent = useSyncExternalStore(subscribeConsent, readConsent, () => "pending" as const);

  useEffect(() => {
    const key = analyticsConfig.posthogKey;
    if (!key || consent === "pending") return;
    if (consent === "granted") {
      void startPostHog(key);
    } else if (client) {
      // Withdrawn during this visit: stop capturing, then reload so the cleanup below runs
      // without a live PostHog instance re-writing its storage.
      client.opt_out_capturing();
      window.location.reload();
    } else {
      purgePostHogStorage();
    }
  }, [consent]);

  return null;
}
