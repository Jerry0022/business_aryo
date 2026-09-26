import type { Metadata } from "next";
import { StudioNav } from "@/components/studio/StudioNav";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="flex h-dvh flex-col bg-studio-bg text-studio-text">
      <StudioNav userName={session.user.name} isAdmin={session.user.role === "admin"} />
      <div className="relative min-h-0 flex-1">{children}</div>
    </div>
  );
}
