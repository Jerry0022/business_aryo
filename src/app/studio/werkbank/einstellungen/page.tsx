import type { Metadata } from "next";
import { SettingsView } from "@/components/werkbank/modules/SettingsView";
import { PageBody, PageHeader } from "@/components/werkbank/ui";
import { stableHash } from "@/lib/werkbank/format";
import { getSettingsData } from "@/lib/werkbank/queries";

export const metadata: Metadata = { title: "Einstellungen" };


export default async function SettingsPage() {
  const data = await getSettingsData(new Date());
  return (
    <PageBody wide>
      <PageHeader title="Einstellungen" subtitle="Änderungen wirken sofort überall: Kalender, Übersicht und Website." />
      <SettingsView key={stableHash(data.settings)} settings={data.settings} partners={data.partners} stats={data.stats} />
    </PageBody>
  );
}
