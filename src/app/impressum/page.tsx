import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, Placeholder } from "@/components/site/LegalLayout";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Impressum",
  description: `Impressum und Anbieterkennzeichnung von ${siteConfig.name}, Inhaber ${siteConfig.owner}, ${siteConfig.trade}.`,
  alternates: { canonical: "/impressum" },
};

// Legal form: Einzelunternehmen, so the owner is named as "Inhaber". If the business later becomes
// a GmbH or UG, the label must change to "Geschäftsführer" and the Impressum needs the
// Handelsregister entry (Registergericht and HRB number) — see docs/GO-LIVE.md.
function Address() {
  const { street, postalCode, city, country } = siteConfig.address;
  return (
    <address>
      <strong>{siteConfig.name}</strong>
      <br />
      Inhaber: {siteConfig.owner}
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
        <br />
        Telefon:{" "}
        {phone ? (
          <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>
        ) : (
          <Placeholder>[Telefonnummer wird ergänzt]</Placeholder>
        )}
      </p>

      {vatId ? (
        <>
          <h2>Umsatzsteuer-ID</h2>
          <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: {vatId}</p>
        </>
      ) : null}

      <h2>Handwerk und zuständige Kammer</h2>
      <p>
        Handwerk: {siteConfig.trade} (zulassungsfrei, keine Meisterpflicht)
        <br />
        Eingetragen im Verzeichnis der Inhaber eines zulassungsfreien Handwerks oder handwerksähnlichen Gewerbes
        (§ 19 Handwerksordnung) bei der: <Placeholder>[Zuständige Handwerkskammer wird ergänzt]</Placeholder>
        <br />
        Anschrift der Kammer: <Placeholder>[Anschrift wird ergänzt]</Placeholder>
      </p>
      <p>
        Berufsrechtliche Regelung: Handwerksordnung (HwO), einsehbar unter{" "}
        <a href="https://www.gesetze-im-internet.de/hwo/" rel="noopener noreferrer">
          gesetze-im-internet.de/hwo
        </a>
        .
      </p>

      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>{siteConfig.owner}, Anschrift wie oben.</p>

      <h2>Verbraucherstreitbeilegung</h2>
      <p>
        Ich bin nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.
      </p>

      <h2>Haftung für Inhalte und Links</h2>
      <p>
        Die Inhalte dieser Website, auch die Artikel im Ratgeber, habe ich sorgfältig erstellt. Sie ersetzen keine
        Beratung vor Ort. Für Richtigkeit, Vollständigkeit und Aktualität kann ich keine Gewähr übernehmen. Diese Website
        enthält Links zu externen Websites Dritter, auf deren Inhalte ich keinen Einfluss habe. Für diese fremden Inhalte
        ist stets der jeweilige Anbieter oder Betreiber verantwortlich. Werden mir Rechtsverletzungen bekannt, entferne
        ich solche Links umgehend.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Texte und Grafiken dieser Website unterliegen dem deutschen Urheberrecht. Eine Vervielfältigung oder Verwendung
        außerhalb der Grenzen des Urheberrechts bedarf der vorherigen Zustimmung.
      </p>

      <p className="text-[0.95rem]">
        Wie ich mit deinen Daten umgehe, steht in der <Link href="/datenschutz">Datenschutzerklärung</Link>.
      </p>
    </LegalLayout>
  );
}
