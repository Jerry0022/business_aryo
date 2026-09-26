import { siteConfig } from "@/config/site";
import { SERVICES } from "./content";

/** schema.org data built strictly from siteConfig — fields that are still null are omitted. */
export function businessJsonLd() {
  const base = siteConfig.url.replace(/\/+$/, "");
  const { street, postalCode, city } = siteConfig.address;
  const hasAddress = Boolean(street || postalCode || city);

  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "@id": `${base}/#business`,
    name: siteConfig.title,
    description: siteConfig.description,
    url: `${base}/`,
    email: siteConfig.email,
    logo: `${base}/icon.svg`,
    founder: { "@type": "Person", name: siteConfig.name },
    knowsAbout: SERVICES.map((service) => service.title),
    ...(siteConfig.phone ? { telephone: siteConfig.phone } : {}),
    ...(siteConfig.serviceArea ? { areaServed: siteConfig.serviceArea } : {}),
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
