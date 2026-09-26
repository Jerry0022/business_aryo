import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, Placeholder } from "@/components/site/LegalLayout";
import { siteConfig } from "@/config/site";
import { QUESTIONS_PER_HOUR } from "@/features/berater/limits";
import { getLlmConfig } from "@/features/berater/llm";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description: `Wie ${siteConfig.name} – ${siteConfig.trade} mit personenbezogenen Daten umgeht: Hosting, Kontakt per E-Mail, KI-Bodenberater, Login-Bereich und Ihre Rechte.`,
  alternates: { canonical: "/datenschutz" },
};

export default function DatenschutzPage() {
  const { street, postalCode, city, country } = siteConfig.address;
  const { email } = siteConfig;
  const llm = getLlmConfig();
  return (
    <LegalLayout
      eyebrow="Rechtliches"
      title={<>Datenschutz&shy;erklärung</>}
      intro={
        <p>
          Kurz gesagt: Diese Website verzichtet auf Tracking, Analyse-Tools, Werbe-Cookies und eingebundene Inhalte
          Dritter. Personenbezogene Daten werden nur verarbeitet, soweit es für den Betrieb der Website, Ihre Anfrage,
          den freiwilligen KI-Bodenberater oder den geschützten Login-Bereich nötig ist.
        </p>
      }
    >
      <h2>1. Verantwortlicher</h2>
      <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
      <address>
        {siteConfig.name} – {siteConfig.trade}
        <br />
        {street ?? <Placeholder>[Straße und Hausnummer werden ergänzt]</Placeholder>}
        <br />
        {postalCode ?? <Placeholder>[PLZ]</Placeholder>} {city ?? <Placeholder>[Ort wird ergänzt]</Placeholder>}
        <br />
        {country}
        <br />
        E-Mail: <a href={`mailto:${email}`}>{email}</a>
      </address>

      <h2>2. Hosting und Server-Logfiles</h2>
      <p>
        Diese Website wird bei Vercel gehostet (Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA). Beim
        Aufruf der Website verarbeitet Vercel automatisch technisch notwendige Daten, die Ihr Browser übermittelt:
      </p>
      <ul>
        <li>IP-Adresse des anfragenden Geräts</li>
        <li>Datum und Uhrzeit des Zugriffs</li>
        <li>aufgerufene Seite bzw. Datei und übertragene Datenmenge</li>
        <li>Referrer-URL (die zuvor besuchte Seite), sofern übermittelt</li>
        <li>Browsertyp, Betriebssystem (User-Agent)</li>
      </ul>
      <p>
        Die Verarbeitung ist erforderlich, um die Website auszuliefern sowie ihre Sicherheit und Stabilität zu
        gewährleisten (Art. 6 Abs. 1 lit. f DSGVO). Die Logdaten werden nur so lange gespeichert, wie es für diese
        Zwecke erforderlich ist. Vercel verarbeitet die Daten als Auftragsverarbeiter auf Grundlage eines
        Auftragsverarbeitungsvertrags (Art. 28 DSGVO). Da eine Übermittlung in die USA nicht ausgeschlossen werden kann,
        erfolgt diese auf Grundlage der EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO).
      </p>

      <h2>3. Kontakt per E-Mail und Anfrageformular</h2>
      <p>
        Wenn Sie mir eine E-Mail schreiben, verarbeite ich die von Ihnen mitgeteilten Daten (z. B. Name, E-Mail-Adresse,
        Ort, Angaben zu Ihrem Boden und Ihre Nachricht), um Ihre Anfrage zu beantworten und gegebenenfalls ein Angebot
        zu erstellen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Anbahnung bzw. Durchführung eines Vertrags) sowie
        Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von Anfragen).
      </p>
      <p>
        Das Anfrageformular auf der Startseite sendet keine Daten an diese Website. Es erstellt lediglich eine
        vorbereitete Nachricht in Ihrem eigenen E-Mail-Programm, die Sie selbst prüfen und absenden. Auf dem Server
        dieser Website wird dabei nichts gespeichert.
      </p>
      <p>
        Für den Empfang von E-Mails nutze ich den Dienst Gmail der Google Ireland Limited, Gordon House, Barrow Street,
        Dublin 4, Irland. Dabei kann eine Übermittlung an die Google LLC in den USA nicht ausgeschlossen werden; diese
        stützt sich auf die Zertifizierung nach dem EU-US Data Privacy Framework (Art. 45 DSGVO) bzw. auf
        EU-Standardvertragsklauseln. Ihre Anfragen lösche ich, sobald sie erledigt sind und keine gesetzlichen
        Aufbewahrungspflichten (etwa für Angebote und Rechnungen) entgegenstehen.
      </p>

      <h2 id="mini-aryo">4. KI-Bodenberater „Mini-Aryo“</h2>
      <p>
        Unten rechts auf der Website können Sie freiwillig den Chat „Mini-Aryo“ öffnen und Fragen rund um Böden stellen.
        Die Antworten erzeugt ein KI-Sprachmodell automatisch; sie können fehlerhaft sein und ersetzen keine Beratung
        vor Ort. Solange Sie keine Frage absenden, werden keine Daten übertragen.
      </p>
      <p>
        Wenn Sie eine Frage absenden, werden Ihre Frage und der bisherige Gesprächsverlauf über den Server dieser
        Website an die Programmierschnittstelle des KI-Anbieters {llm?.provider.company ?? "Groq, Inc. (USA)"}{" "}
        übermittelt, dort verarbeitet und die Antwort an Ihren Browser zurückgesendet. Dabei findet eine Übermittlung in
        die USA statt; sie erfolgt auf Grundlage der EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO). Der
        Gesprächsverlauf wird auf dem Server dieser Website nicht gespeichert und ist in Ihrem Browser nur so lange
        vorhanden, bis Sie die Seite schließen oder neu laden. Welche Daten der KI-Anbieter wie lange speichert, richtet
        sich nach dessen Datenschutzbestimmungen.
      </p>
      <p>
        Zum Schutz vor Missbrauch und unverhältnismäßigen Kosten sind höchstens {QUESTIONS_PER_HOUR} Fragen pro Stunde
        möglich. Dazu wird aus Ihrer IP-Adresse ein pseudonymer Prüfwert (gesalzener Hash) gebildet; gespeichert werden
        nur dieser Wert und ein Zähler, die IP-Adresse selbst nicht.
        {llm?.provider.id === "xai"
          ? " Derselbe Prüfwert wird dem KI-Anbieter als anonyme Kennung zur Missbrauchserkennung übermittelt."
          : ""}{" "}
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung Ihrer Fragen und an
        einem sicheren, wirtschaftlichen Betrieb). Bitte geben Sie im Chat keine personenbezogenen Daten wie Namen,
        Adressen oder Telefonnummern ein – für eine persönliche Anfrage nutzen Sie bitte E-Mail oder das
        Anfrageformular.
      </p>

      <p id="app">
        Diese Website lässt sich als App auf Smartphone, Tablet oder Computer installieren. Die Installation übernimmt
        Ihr Browser bzw. Betriebssystem; dabei werden keine zusätzlichen Daten an diese Website übertragen. Damit
        Seitenaufrufe ohne Internetverbindung eine Hinweisseite zeigen können, legt ein sogenannter Service Worker eine
        Offline-Seite im Speicher Ihres Browsers ab. Etwa alle zwei Wochen weist Mini-Aryo auf die App hin; damit dieser
        Hinweis nicht bei jedem Besuch erscheint, wird der Zeitpunkt des letzten Hinweises im lokalen Speicher Ihres
        Browsers (Local Storage) abgelegt. Diese Angaben verlassen Ihr Gerät nicht und lassen sich jederzeit über die
        Browser-Einstellungen („Websitedaten löschen“) entfernen. Rechtsgrundlage ist § 25 Abs. 2 Nr. 2 TDDDG, da die
        Speicherung für diese von Ihnen genutzten Funktionen erforderlich ist.
      </p>

      <h2>5. Geschützter Login-Bereich</h2>
      <p>
        Über den Link „Login“ erreichen Sie einen geschützten Bereich, der ausschließlich eingeladenen Personen zur
        Verfügung steht. Eine öffentliche Registrierung gibt es nicht. Für eingeladene Nutzerinnen und Nutzer werden
        folgende Daten verarbeitet:
      </p>
      <ul>
        <li>Name, E-Mail-Adresse und Rolle des Nutzerkontos</li>
        <li>Passwort, ausschließlich als kryptografischer Hash gespeichert</li>
        <li>Sitzungsdaten: Zeitpunkt der Anmeldung, Ablaufzeit, IP-Adresse und Browserkennung (User-Agent)</li>
        <li>gegebenenfalls Inhalte, die Sie im geschützten Bereich selbst anlegen</li>
      </ul>
      <p>
        Zum Schutz vor Missbrauch (Begrenzung von Anmeldeversuchen) wird die IP-Adresse zudem kurzzeitig verarbeitet.
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Bereitstellung des Zugangs) und Art. 6 Abs. 1 lit. f DSGVO
        (Sicherheit des Systems). Die Kontodaten werden gespeichert, bis das Konto gelöscht wird; abgelaufene Sitzungen
        verlieren ihre Gültigkeit.
      </p>
      <p>
        Die Daten werden in einer Datenbank beim Anbieter Neon (Neon, Inc., USA) gespeichert, der als
        Auftragsverarbeiter tätig ist (Art. 28 DSGVO). Soweit dabei Daten in die USA übermittelt werden, erfolgt dies
        auf Grundlage der EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO).
      </p>

      <h2>6. Cookies</h2>
      <p>
        Auf den öffentlichen Seiten dieser Website werden keine Cookies gesetzt. Erst wenn Sie sich im Login-Bereich
        anmelden, werden technisch notwendige Sitzungs-Cookies gespeichert (z. B. „better-auth.session_token“), die Sie
        als angemeldete Person wiedererkennen. Sie verlieren spätestens nach 14 Tagen ihre Gültigkeit bzw. werden beim
        Abmelden gelöscht. Da diese Cookies für den von Ihnen ausdrücklich gewünschten Dienst unbedingt erforderlich
        sind, ist keine Einwilligung nötig (§ 25 Abs. 2 Nr. 2 TDDDG, Art. 6 Abs. 1 lit. b und f DSGVO).
      </p>

      <h2>7. Schriftarten</h2>
      <p>
        Die verwendeten Schriftarten sind lokal in diese Website eingebunden und werden zusammen mit ihr über den oben
        genannten Hoster ausgeliefert. Beim Aufruf der Seiten findet keine Verbindung zu Servern von Google oder anderen
        Schriftanbietern statt.
      </p>

      <h2>8. Keine Analyse- und Tracking-Dienste</h2>
      <p>
        Ich setze keine Analyse- oder Tracking-Werkzeuge ein, keine Werbenetzwerke und keine Social-Media-Plugins. Alle
        Grafiken dieser Website werden direkt im Browser erzeugt; es werden keine Inhalte von Drittanbietern
        nachgeladen.
      </p>

      <h2>9. SSL-/TLS-Verschlüsselung</h2>
      <p>
        Diese Website nutzt aus Sicherheitsgründen eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung
        erkennen Sie an „https://“ in der Adresszeile Ihres Browsers.
      </p>

      <h2>10. Ihre Rechte</h2>
      <p>Sie haben gegenüber mir folgende Rechte hinsichtlich der Sie betreffenden personenbezogenen Daten:</p>
      <ul>
        <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
        <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
        <li>Recht auf Löschung (Art. 17 DSGVO)</li>
        <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
        <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
        <li>Recht auf Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)</li>
      </ul>
      <h3>Widerspruchsrecht (Art. 21 DSGVO)</h3>
      <p>
        Soweit eine Verarbeitung auf Art. 6 Abs. 1 lit. f DSGVO beruht, können Sie ihr aus Gründen, die sich aus Ihrer
        besonderen Situation ergeben, jederzeit widersprechen. Eine formlose Nachricht an{" "}
        <a href={`mailto:${email}`}>{email}</a> genügt.
      </p>
      <h3>Beschwerderecht bei einer Aufsichtsbehörde</h3>
      <p>
        Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, insbesondere in dem
        Mitgliedstaat Ihres gewöhnlichen Aufenthalts, Ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes
        (Art. 77 DSGVO).
      </p>

      <h2>11. Aktualität</h2>
      <p>
        Stand: September 2026. Ich passe diese Datenschutzerklärung an, sobald sich die Website oder die rechtlichen
        Anforderungen ändern.
      </p>

      <p className="pt-6 text-sm text-ink-muted">
        Angaben zum Anbieter finden Sie im <Link href="/impressum">Impressum</Link>.
      </p>
    </LegalLayout>
  );
}
