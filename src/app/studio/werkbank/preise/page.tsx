import type { Metadata } from "next";
import { ServiceCatalogEditor, SubscriptionTermsSettings, VoucherSettings } from "@/components/werkbank/modules/PricesView";
import { PageBody, PageHeader } from "@/components/werkbank/ui";
import { stableHash } from "@/lib/werkbank/format";
import { getPricesData } from "@/lib/werkbank/queries";

export const metadata: Metadata = { title: "Preise & Leistungen" };


export default async function PricesPage() {
  const { settings, services, hasMasterPartner } = await getPricesData();
  return (
    <PageBody wide>
      <PageHeader
        title="Preise & Leistungen"
        subtitle="Alle Preise sind leer, bis du sie setzt. Eine Leistung erscheint immer, die Preiszeile nur mit Preis."
      />
      <div className="mt-6">
        <ServiceCatalogEditor key={stableHash([services, settings.pricing, hasMasterPartner])} services={services} settings={settings} hasMasterPartner={hasMasterPartner} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <VoucherSettings key={stableHash([settings.voucher, settings.pricing.vatPercent])} voucher={settings.voucher} vatPercent={settings.pricing.vatPercent} />
        <SubscriptionTermsSettings key={stableHash([settings.pricing, settings.subscriptions])} pricing={settings.pricing} subscriptions={settings.subscriptions} />
      </div>
    </PageBody>
  );
}
