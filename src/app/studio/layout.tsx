import type { Metadata } from "next";
import { StudioNav } from "@/components/studio/StudioNav";
import { getSettings } from "@/lib/business/data";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const isAdmin = session.user.role === "admin";
  // The PostHog link is admin-only; getSettings() falls back to defaults if the database is unavailable.
  const posthogUrl = isAdmin ? (await getSettings()).analytics.posthogUrl : "";

  return (
    <div className="flex h-dvh flex-col bg-studio-bg text-studio-text">
      <StudioNav userName={session.user.name} isAdmin={isAdmin} posthogUrl={posthogUrl} />
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  );
}
