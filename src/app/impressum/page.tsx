import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, Placeholder } from "@/components/site/LegalLayout";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Impressum",
  description: `Impressum und Anbieterkennzeichnung von ${siteConfig.name} – ${siteConfig.trade}.`,
  alternates: { canonical: "/impressum" },
};

function Address() {
  const { street, postalCode, city, country } = siteConfig.address;
  return (
    <address>
      {siteConfig.name}
      <br />
      {siteConfig.trade}
      <br />
      {street ?? <Placeholder>[Straße und Hausnummer werden ergänzt]</Placeholder>}
      <br />
      {postalCode && city ? (
        `${postalCode} ${city}`
      ) : (
        <>
          {postalCode ?? <Placeholder>[PLZ]</Placeholder>} {city ?? <Placeholder>[Ort wird ergänzt]</Placeholder>}
        </>
      )}
      <br />
      {country}
    </address>
  );
}

export default function ImpressumPage() {
  const { email, phone, vatId } = siteConfig;
  return (
    <LegalLayout eyebrow="Rechtliches" title="Impressum">
      <h2>Angaben gemäß § 5 DDG</h2>
      <Address />

      <h2>Kontakt</h2>
      <p>
        E-Mail: <a href={`mailto:${email}`}>{email}</a>
        {phone ? (
          <>
            <br />
            Telefon: <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>
          </>
        ) : null}
      </p>

      {vatId ? (
        <>
          <h2>Umsatzsteuer-ID</h2>
          <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: {vatId}</p>
        </>
      ) : null}

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>{siteConfig.name}, Anschrift wie oben.</p>

      <h2>Verbraucherstreitbeilegung</h2>
      <p>
        Ich bin nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <h2>Haftung für Inhalte und Links</h2>
      <p>
        Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und
        Aktualität kann ich jedoch keine Gewähr übernehmen. Diese Website enthält Links zu externen Websites Dritter,
        auf deren Inhalte ich keinen Einfluss habe. Für diese fremden Inhalte ist stets der jeweilige Anbieter oder
        Betreiber verantwortlich. Bei Bekanntwerden von Rechtsverletzungen entferne ich derartige Links umgehend.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Texte und Grafiken dieser Website unterliegen dem deutschen Urheberrecht. Eine Vervielfältigung oder Verwendung
        außerhalb der Grenzen des Urheberrechts bedarf der vorherigen Zustimmung.
      </p>

      <p className="pt-6 text-sm text-ink-muted">
        Informationen zum Umgang mit Ihren Daten finden Sie in der <Link href="/datenschutz">Datenschutzerklärung</Link>
        .
      </p>
    </LegalLayout>
  );
}
