import type { Metadata } from "next";
import { WerkbankProvider } from "@/components/werkbank/WerkbankProvider";
import { WerkbankShell } from "@/components/werkbank/WerkbankShell";
import { getNavCounts } from "@/lib/werkbank/queries";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: { default: "Werkbank", template: "%s · Werkbank" },
};

export default async function WerkbankLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const counts = await getNavCounts();
  return (
    <WerkbankProvider>
      <WerkbankShell newLeads={counts.newLeads}>{children}</WerkbankShell>
    </WerkbankProvider>
  );
}
