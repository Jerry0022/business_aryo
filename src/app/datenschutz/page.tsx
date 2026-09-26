import type { Metadata } from "next";
import Link from "next/link";
import { CookieSettingsButton } from "@/components/consent/CookieSettingsButton";
import { LegalLayout, Placeholder } from "@/components/site/LegalLayout";
import { analyticsEnabled } from "@/config/analytics";
import { siteConfig } from "@/config/site";
import { CONSENT_COOKIE } from "@/lib/consent";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description: `Wie ${siteConfig.name} – ${siteConfig.trade} mit personenbezogenen Daten umgeht: Hosting, Kontakt per E-Mail, Login-Bereich, Cookies, Webanalyse und Ihre Rechte.`,
  alternates: { canonical: "/datenschutz" },
};

const cookieOverview = [
  {
    name: CONSENT_COOKIE,
    consent: false,
    purpose: "Merkt sich Ihre Auswahl im Cookie-Hinweis, damit Sie nicht bei jedem Besuch gefragt werden.",
    duration: "12 Monate",
  },
  {
    name: "better-auth.session_token",
    consent: false,
    purpose: "Hält Sie im Login-Bereich angemeldet (samt zugehöriger Sitzungs-Cookies). Nur nach der Anmeldung.",
    duration: "bis zur Abmeldung, höchstens 14 Tage",
  },
  {
    name: "ph_<Projektschlüssel>_posthog",
    consent: true,
    purpose: "Zufällige Kennung von PostHog, um Seitenaufrufe desselben Browsers pseudonym zusammenzufassen.",
    duration: "bis zu 12 Monate",
  },
] as const;

export default function DatenschutzPage() {
  const { street, postalCode, city, country } = siteConfig.address;
  const { email } = siteConfig;
  return (
    <LegalLayout
      eyebrow="Rechtliches"
      title={<>Datenschutz&shy;erklärung</>}
      intro={
        analyticsEnabled ? (
          <p>
            Kurz gesagt: Personenbezogene Daten werden nur verarbeitet, soweit es für den Betrieb der Website, Ihre
            Anfrage oder den geschützten Login-Bereich nötig ist. Eine Nutzungsstatistik mit PostHog läuft
            ausschließlich, wenn Sie ausdrücklich zustimmen. Werbe-Cookies und Social-Media-Plugins gibt es nicht.
          </p>
        ) : (
          <p>
            Kurz gesagt: Diese Website verzichtet auf Tracking, Analyse-Tools, Werbe-Cookies und eingebundene Inhalte
            Dritter. Personenbezogene Daten werden nur verarbeitet, soweit es für den Betrieb der Website, Ihre Anfrage
            oder den geschützten Login-Bereich nötig ist.
          </p>
        )
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

      <h2>4. Geschützter Login-Bereich</h2>
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

      <h2 id="cookies" className="scroll-mt-28">5. Cookies und Einwilligung</h2>
      {analyticsEnabled ? (
        <>
          <p>
            Cookies sind kleine Textdateien, die Ihr Browser speichert. Ähnlich funktionieren Einträge im lokalen
            Speicher des Browsers (Local Storage). Diese Website unterscheidet zwei Arten:
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {cookieOverview.map((cookie) => (
              <div key={cookie.name} className="rounded-card border border-ink/10 bg-sand/40 p-4 text-[0.95rem] leading-snug">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <code className="font-semibold text-ink [overflow-wrap:anywhere]">{cookie.name}</code>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      cookie.consent ? "bg-copper/15 text-oak-deep" : "bg-sage/20 text-ink-soft"
                    }`}
                  >
                    {cookie.consent ? "nur mit Einwilligung" : "notwendig"}
                  </span>
                </div>
                <div className="mt-2 text-ink-muted">{cookie.purpose}</div>
                <div className="mt-2 text-sm text-ink-muted">
                  <strong className="text-ink-soft">Dauer:</strong> {cookie.duration}
                </div>
              </div>
            ))}
          </div>
          <h3>Technisch notwendige Cookies</h3>
          <p>
            Die als „notwendig“ markierten Cookies sind für den Betrieb der Website bzw. den von Ihnen gewünschten
            Dienst unbedingt erforderlich; eine Einwilligung ist dafür nicht nötig (§ 25 Abs. 2 Nr. 2 TDDDG, Art. 6
            Abs. 1 lit. b und f DSGVO). Die Login-Cookies werden erst gesetzt, wenn Sie sich anmelden.
          </p>
          <h3>Statistik-Cookies (nur mit Einwilligung)</h3>
          <p>
            Nur wenn Sie im Cookie-Hinweis auf „Einverstanden“ klicken, speichert PostHog ein Cookie bzw. einen
            Local-Storage-Eintrag. Er enthält eine zufällig erzeugte Kennung, mit der wiederholte Besuche desselben
            Browsers erkannt werden. Details dazu in Abschnitt 7. Rechtsgrundlage ist Ihre Einwilligung (§ 25 Abs. 1
            TDDDG, Art. 6 Abs. 1 lit. a DSGVO).
          </p>
          <h3>Browser-Erweiterungen für Cookie-Hinweise</h3>
          <p>
            Nutzen Sie eine Browser-Erweiterung, die Cookie-Hinweise für Sie beantwortet (etwa Consent-O-Matic), trifft
            sie die Auswahl in Ihrem Auftrag, so wie Sie sie dort eingestellt haben. Blendet eine Erweiterung den
            Hinweis nur aus, gilt das nicht als Einwilligung: Die Statistik bleibt dann aus. Senden Sie das Signal „Do
            Not Track“, wird auch nach einer Einwilligung nichts erfasst.
          </p>
          <h3>Einwilligung ändern oder widerrufen</h3>
          <p>
            Ihre Einwilligung ist freiwillig. Sie können sie jederzeit mit Wirkung für die Zukunft widerrufen oder
            erneut erteilen, über den Link „Cookie-Einstellungen“ im Seitenfuß oder direkt hier:{" "}
            <CookieSettingsButton className="cursor-pointer font-semibold text-oak-deep underline underline-offset-2" />
            . Nach einem Widerruf werden die Statistik-Cookies aus Ihrem Browser entfernt.
          </p>
        </>
      ) : (
        <p>
          Auf den öffentlichen Seiten dieser Website werden keine Cookies gesetzt. Erst wenn Sie sich im Login-Bereich
          anmelden, werden technisch notwendige Sitzungs-Cookies gespeichert (z. B. „better-auth.session_token“), die
          Sie als angemeldete Person wiedererkennen. Sie verlieren spätestens nach 14 Tagen ihre Gültigkeit bzw. werden
          beim Abmelden gelöscht. Da diese Cookies für den von Ihnen ausdrücklich gewünschten Dienst unbedingt
          erforderlich sind, ist keine Einwilligung nötig (§ 25 Abs. 2 Nr. 2 TDDDG, Art. 6 Abs. 1 lit. b und f DSGVO).
        </p>
      )}

      <h2>6. Schriftarten</h2>
      <p>
        Die verwendeten Schriftarten sind lokal in diese Website eingebunden und werden zusammen mit ihr über den oben
        genannten Hoster ausgeliefert. Beim Aufruf der Seiten findet keine Verbindung zu Servern von Google oder anderen
        Schriftanbietern statt.
      </p>

      {analyticsEnabled ? (
        <>
          <h2 id="webanalyse" className="scroll-mt-28">7. Webanalyse mit PostHog</h2>
          <p>
            Sofern Sie eingewilligt haben, nutze ich den Analysedienst PostHog der PostHog Inc., 2261 Market Street
            #4008, San Francisco, CA 94114, USA. PostHog hilft mir zu verstehen, welche Seiten und Inhalte gefragt sind
            und wo die Website verbessert werden kann. Dabei werden folgende Daten verarbeitet:
          </p>
          <ul>
            <li>aufgerufene Seiten, Zeitpunkt und Dauer des Besuchs sowie die zuvor besuchte Seite (Referrer)</li>
            <li>
              Klicks auf Links und Schaltflächen (auch solche ohne Wirkung); Eingaben in Formularfelder werden nicht
              erfasst
            </li>
            <li>Ladezeiten und technische Leistungswerte der Seite</li>
            <li>Gerätetyp, Browser, Betriebssystem, Bildschirmgröße und Spracheinstellung</li>
            <li>ungefährer Standort (Land, Region, Stadt), abgeleitet aus der IP-Adresse</li>
            <li>eine zufällig erzeugte Kennung Ihres Browsers (siehe Abschnitt 5)</li>
          </ul>
          <p>
            Die IP-Adresse wird in PostHog nicht gespeichert. Es werden keine Bildschirmaufzeichnungen (Session
            Recordings) angefertigt, keine geräteübergreifenden Profile gebildet und die Daten nicht mit anderen Daten
            zusammengeführt oder für Werbung verwendet. Sendet Ihr Browser das Signal „Do Not Track“, findet keine
            Erfassung statt.
          </p>
          <p>
            Die Daten werden in der EU-Cloud von PostHog (Rechenzentrum in Frankfurt am Main) gespeichert. Ihr Browser
            sendet sie dabei nicht direkt an PostHog, sondern an diese Website, die sie an PostHog weiterleitet. PostHog
            ist als Auftragsverarbeiter tätig (Art. 28 DSGVO). Soweit ein Zugriff aus den USA nicht ausgeschlossen
            werden kann, erfolgt die Übermittlung auf Grundlage der EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c
            DSGVO).
          </p>
          <p>
            Rechtsgrundlage ist Ihre Einwilligung (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO), die Sie jederzeit
            über die Cookie-Einstellungen widerrufen können. Ohne Einwilligung wird PostHog nicht geladen. Die
            Analysedaten werden gelöscht, sobald sie für die Auswertung nicht mehr erforderlich sind.
          </p>
          <p>
            Werbenetzwerke und Social-Media-Plugins setze ich nicht ein. Alle Grafiken dieser Website werden direkt im
            Browser erzeugt; es werden keine Inhalte von Drittanbietern nachgeladen.
          </p>
        </>
      ) : (
        <>
          <h2>7. Keine Analyse- und Tracking-Dienste</h2>
          <p>
            Ich setze keine Analyse- oder Tracking-Werkzeuge ein, keine Werbenetzwerke und keine Social-Media-Plugins.
            Alle Grafiken dieser Website werden direkt im Browser erzeugt; es werden keine Inhalte von Drittanbietern
            nachgeladen.
          </p>
        </>
      )}

      <h2>8. SSL-/TLS-Verschlüsselung</h2>
      <p>
        Diese Website nutzt aus Sicherheitsgründen eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung
        erkennen Sie an „https://“ in der Adresszeile Ihres Browsers.
      </p>

      <h2>9. Ihre Rechte</h2>
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

      <h2>10. Aktualität</h2>
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
