import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { OpenDrawer } from "@/components/werkbank/DrawerButtons";
import { SubscriptionsView } from "@/components/werkbank/modules/SubscriptionsView";
import { PageBody, PageHeader } from "@/components/werkbank/ui";
import { getSubscriptionsData } from "@/lib/werkbank/queries";

export const metadata: Metadata = { title: "Abos" };

export default async function SubscriptionsPage() {
  const data = await getSubscriptionsData();
  return (
    <PageBody wide>
      <PageHeader
        title="Abos"
        subtitle="Laufende Betreuung: planbar für dich, planbar für die Kunden."
        actions={
          <OpenDrawer view={{ type: "entityForm", entity: "subscription" }} variant="primary">
            <Plus className="size-4" aria-hidden /> Abo anlegen
          </OpenDrawer>
        }
      />
      <SubscriptionsView subscriptions={data.subscriptions} services={data.services} settings={data.settings} used={data.used} />
    </PageBody>
  );
}
