import type { Metadata } from "next";
import { OfficeHoursView } from "@/components/werkbank/modules/OfficeHoursView";
import { PageBody, PageHeader } from "@/components/werkbank/ui";
import { getOfficeHourData } from "@/lib/werkbank/queries";

export const metadata: Metadata = { title: "Sprechstunde" };

export default async function OfficeHourPage() {
  const data = await getOfficeHourData(new Date());
  return (
    <PageBody>
      <PageHeader
        title="Boden-Sprechstunde"
        subtitle="Gratis, live, einmal im Monat. Anmeldungen, Teilnahme und der Gutschein für die Erstberatung."
      />
      <OfficeHoursView data={data} />
    </PageBody>
  );
}
