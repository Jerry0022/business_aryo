// PostHog web analytics. Stays completely off (no banner, no script, no cookies) until
// NEXT_PUBLIC_POSTHOG_KEY is set — see docs/ANALYTICS.md.
const ingestHost = (process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com").replace(/\/+$/, "");

export const analyticsConfig = {
  /** Project API key (phc_…) — public by design, it only allows sending events. */
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY || null,
  /** PostHog cloud region the reverse proxy forwards to (EU by default). */
  ingestHost,
  assetsHost: ingestHost.replace(".i.posthog.com", "-assets.i.posthog.com"),
  uiHost: ingestHost.replace(".i.posthog.com", ".posthog.com"),
  /** Same-origin path proxied to PostHog (next.config.ts), so no third-party host is contacted directly. */
  apiPath: "/ingest",
} as const;

export const analyticsEnabled = analyticsConfig.posthogKey !== null;
