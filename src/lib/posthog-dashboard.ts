/**
 * Link from the studio to the PostHog dashboard (analytics are wired up in the public site, see
 * docs/ANALYTICS.md). Derived from the same `NEXT_PUBLIC_POSTHOG_HOST` as the tracking (EU cloud by
 * default); with `NEXT_PUBLIC_POSTHOG_PROJECT_ID` it opens the project's web analytics directly.
 */
export function posthogDashboardUrl(
  ingestHost: string | undefined = process.env.NEXT_PUBLIC_POSTHOG_HOST,
  projectId: string | undefined = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID,
): string {
  const host = (ingestHost || "https://eu.i.posthog.com").replace(/\/+$/, "");
  // Ingest hosts look like https://eu.i.posthog.com, the app lives at https://eu.posthog.com.
  const app = host.includes(".i.posthog.com") ? host.replace(".i.posthog.com", ".posthog.com") : host;
  const id = projectId?.trim();
  return id && /^\d+$/.test(id) ? `${app}/project/${id}/web` : app;
}
