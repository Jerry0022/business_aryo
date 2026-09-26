import type { Metadata } from "next";
import { CustomersView } from "@/components/werkbank/modules/CustomersView";
import { PageBody, PageHeader } from "@/components/werkbank/ui";
import { getCustomersData } from "@/lib/werkbank/queries";

export const metadata: Metadata = { title: "Kunden & Boden-Pässe" };

export default async function CustomersPage() {
  const data = await getCustomersData(new Date());
  return (
    <PageBody wide>
      <PageHeader title="Kunden & Boden-Pässe" subtitle="Alle Datensätze sind verknüpft: Ein Klick auf einen Kunden zeigt Projekte, Termine, Pässe und Abos." />
      <CustomersView customers={data.customers} passes={data.passes} today={data.today} />
    </PageBody>
  );
}
