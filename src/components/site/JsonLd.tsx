import { siteConfig } from "@/config/site";
import { defaultServices } from "@/lib/business/services";

/**
 * schema.org data for the business, built strictly from siteConfig and the service catalog.
 * Fields that are still null are omitted. Services that need a Meister partner are left out of
 * `knowsAbout`: the owner is a Bodenleger and must not appear to offer Parkettleger work himself.
 */
export function businessJsonLd() {
  const base = siteConfig.url.replace(/\/+$/, "");
  const { street, postalCode, city } = siteConfig.address;
  const hasAddress = Boolean(street || postalCode || city);

  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "@id": `${base}/#business`,
    name: siteConfig.name,
    slogan: siteConfig.claim,
    description: siteConfig.description,
    url: `${base}/`,
    email: siteConfig.email,
    logo: `${base}/icon.svg`,
    founder: { "@type": "Person", name: siteConfig.owner },
    areaServed: "Nordrhein-Westfalen",
    knowsAbout: defaultServices()
      .filter((service) => !service.requiresMasterPartner)
      .map((service) => service.title),
    ...(siteConfig.phone ? { telephone: siteConfig.phone } : {}),
    ...(siteConfig.vatId ? { vatID: siteConfig.vatId } : {}),
    ...(hasAddress
      ? {
          address: {
            "@type": "PostalAddress",
            ...(street ? { streetAddress: street } : {}),
            ...(postalCode ? { postalCode } : {}),
            ...(city ? { addressLocality: city } : {}),
            addressCountry: "DE",
          },
        }
      : {}),
  };
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
