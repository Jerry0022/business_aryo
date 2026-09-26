import type { Metadata } from "next";
import { BeforeAfter } from "@/components/site/BeforeAfter";
import { BrandCore } from "@/components/site/BrandCore";
import { Contact } from "@/components/site/Contact";
import { Contingent } from "@/components/site/Contingent";
import { FloorExplorer } from "@/components/site/explorer/FloorExplorer";
import { FloorCheck } from "@/components/site/FloorCheck";
import { Guides } from "@/components/site/Guides";
import { Hero } from "@/components/site/Hero";
import { businessJsonLd, JsonLd } from "@/components/site/JsonLd";
import { OfficeHours } from "@/components/site/OfficeHours";
import { Professionals } from "@/components/site/Professionals";
import { ServicesList } from "@/components/site/ServicesList";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Subscriptions } from "@/components/site/Subscriptions";
import { Ways } from "@/components/site/Ways";
import { getPublicSiteData } from "@/lib/business/data";
import { BeraterFab } from "@/features/berater/ui/BeraterFab";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  // Per request (connection() inside): contingents, dates and prices come from the Werkbank.
  const data = await getPublicSiteData();
  const nextOfficeHour = data.officeHours[0] ?? null;

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[70] rounded-lg bg-kupfer px-5 py-3 font-semibold text-creme focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
      >
        Zum Inhalt springen
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero nextOfficeHour={nextOfficeHour} />
        <Contingent projects={data.projects} founding={data.founding} live={data.live} />
        <BrandCore />
        <Ways />
        <BeforeAfter />
        <FloorExplorer hasMasterPartner={data.hasMasterPartner} />
        <FloorCheck nextOfficeHour={nextOfficeHour} />
        <ServicesList groups={data.serviceGroups} anyPriceShown={data.anyPriceShown} vatPercent={data.settings.pricing.vatPercent} />
        <Subscriptions plans={data.plans} settings={data.settings} slots={data.subscriptionSlots} live={data.live} />
        <OfficeHours
          officeHours={data.officeHours}
          voucherConditions={data.voucherConditions}
          voucherValue={data.voucherValue}
          founding={data.founding}
          live={data.live}
        />
        <Professionals partnerSlots={data.settings.contingent.partnerSlots} />
        <Guides />
        <Contact />
      </main>
      <SiteFooter onHome />
      <BeraterFab />
      <JsonLd data={businessJsonLd()} />
    </>
  );
}
