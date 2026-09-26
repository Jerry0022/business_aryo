import type { Metadata } from "next";
import Link from "next/link";
import { CookieSettingsButton } from "@/components/consent/CookieSettingsButton";
import { LegalLayout, Placeholder } from "@/components/site/LegalLayout";
import { analyticsEnabled } from "@/config/analytics";
import { siteConfig } from "@/config/site";
import { QUESTIONS_PER_HOUR } from "@/features/berater/limits";
import { getLlmConfig } from "@/features/berater/llm";
import { CONSENT_COOKIE } from "@/lib/consent";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description: `Wie ${siteConfig.name} mit personenbezogenen Daten umgeht: Hosting, Formulare und Datenbank, Boden-Sprechstunde, Newsletter, KI-Bodenberater, Login-Bereich, Cookies, Webanalyse und deine Rechte.`,
  alternates: { canonical: "/datenschutz" },
};

// Conservative first version, not legal advice. Everything marked with <Placeholder> must be
// filled in or confirmed before go-live (docs/GO-LIVE.md), ideally checked by a lawyer.
// The cookie and analytics sections switch with `analyticsEnabled` (NEXT_PUBLIC_POSTHOG_KEY).

const cookieOverview = [
  {
    name: CONSENT_COOKIE,
    consent: false,
    purpose: "Merkt sich deine Auswahl im Cookie-Hinweis, damit du nicht bei jedem Besuch gefragt wirst.",
    duration: "12 Monate",
  },
  {
    name: "better-auth.session_token",
    consent: false,
    purpose: "Hält dich im Login-Bereich angemeldet (samt zugehöriger Sitzungs-Cookies). Nur nach der Anmeldung.",
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
  const mail = <a href={`mailto:${email}`}>{email}</a>;
  const llm = getLlmConfig();
  return (
    <LegalLayout
      eyebrow="Rechtliches"
      title={<>Datenschutz&shy;erklärung</>}
      intro={
        analyticsEnabled ? (
          <p>
            Kurz gesagt: Ich verarbeite deine Daten nur, soweit es für die Website, deine Anfrage oder deine Anmeldung
            nötig ist. Im freiwilligen KI-Bodenberater geht nur das raus, was du dort absendest. Was du in die Formulare einträgst, speichere ich in einer Datenbank, die für diese Website
            betrieben wird. Eine Nutzungsstatistik mit PostHog läuft nur, wenn du ausdrücklich zustimmst. Werbe-Cookies
            und Social-Media-Plugins gibt es nicht.
          </p>
        ) : (
          <p>
            Kurz gesagt: Ich verarbeite deine Daten nur, soweit es für die Website, deine Anfrage oder deine Anmeldung
            nötig ist. Im freiwilligen KI-Bodenberater geht nur das raus, was du dort absendest. Was du in die Formulare einträgst, speichere ich in einer Datenbank, die für diese Website
            betrieben wird. Tracking, Analyse-Tools und Werbe-Cookies gibt es hier derzeit nicht.
          </p>
        )
      }
    >
      <h2>1. Verantwortlicher</h2>
      <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
      {/* Einzelunternehmen: owner as "Inhaber". A GmbH/UG would need "Geschäftsführer" + Handelsregister. */}
      <address>
        <strong>{siteConfig.name}</strong>
        <br />
        Inhaber: {siteConfig.owner}
        <br />
        {street ?? <Placeholder>[Straße und Hausnummer werden ergänzt]</Placeholder>}
        <br />
        {postalCode ?? <Placeholder>[PLZ]</Placeholder>} {city ?? <Placeholder>[Ort wird ergänzt]</Placeholder>}
        <br />
        {country}
        <br />
        E-Mail: {mail}
      </address>

      <h2>2. Hosting und Server-Logfiles</h2>
      <p>
        Diese Website wird bei Vercel gehostet (Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA). Die
        Server-Funktionen laufen in der Region Frankfurt am Main, ausgeliefert werden die Seiten über das weltweite Netz
        von Vercel. Beim Aufruf der Website verarbeitet Vercel automatisch technisch notwendige Daten, die dein Browser
        übermittelt:
      </p>
      <ul>
        <li>IP-Adresse des anfragenden Geräts</li>
        <li>Datum und Uhrzeit des Zugriffs</li>
        <li>aufgerufene Seite bzw. Datei und übertragene Datenmenge</li>
        <li>Referrer-URL (die zuvor besuchte Seite), sofern übermittelt</li>
        <li>Browsertyp und Betriebssystem (User-Agent)</li>
      </ul>
      <p>
        Die Verarbeitung ist erforderlich, um die Website auszuliefern und ihre Sicherheit und Stabilität zu
        gewährleisten (Art. 6 Abs. 1 lit. f DSGVO). Die Logdaten werden nur so lange gespeichert, wie es für diese Zwecke
        erforderlich ist. Vercel verarbeitet die Daten als Auftragsverarbeiter auf Grundlage eines
        Auftragsverarbeitungsvertrags (Art. 28 DSGVO). Da eine Übermittlung in die USA nicht ausgeschlossen werden kann,
        erfolgt diese auf Grundlage der EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO).
      </p>

      <h2>3. Datenbank der Website</h2>
      <p>
        Was du in die Formulare dieser Website einträgst, die Anmeldungen zur Boden-Sprechstunde und die Daten des
        Login-Bereichs speichere ich in einer Datenbank, die für diese Website betrieben wird. Ich bearbeite die Einträge
        in einem geschützten Admin-Bereich, der nur mit Login erreichbar ist.
      </p>
      <ul>
        <li>
          Anbieter: Neon (Neon, Inc., USA), eingebunden über Vercel.{" "}
          <Placeholder>[Anbieter und Anschrift laut Auftragsverarbeitungsvertrag bestätigen]</Placeholder>
        </li>
        <li>
          Speicherort: <Placeholder>[Region bestätigen, geplant: Frankfurt am Main, EU (eu-central-1)]</Placeholder>
        </li>
      </ul>
      <p>
        Der Anbieter verarbeitet die Daten als Auftragsverarbeiter (Art. 28 DSGVO). Soweit dabei ein Zugriff aus den USA
        nicht ausgeschlossen werden kann, stützt er sich auf die EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c
        DSGVO). <Placeholder>[Rechtsgrundlage der Übermittlung beim Anbieter prüfen]</Placeholder>
      </p>

      <h2>4. Formulare auf dieser Website</h2>
      <p>
        Die Formulare senden deine Eingaben verschlüsselt an den Server dieser Website. Dort werden sie geprüft und in der
        Datenbank (Abschnitt 3) gespeichert. Ohne die Pflichtangaben, in der Regel Name und E-Mail-Adresse, kann ich
        deine Anfrage nicht bearbeiten. Alle weiteren Angaben sind freiwillig.
      </p>
      <p>
        Für automatische E-Mails, etwa die Bestätigung deiner Anmeldung, dein Bodenprofil oder meine Benachrichtigung über
        neue Anfragen, nutze ich einen E-Mail-Versanddienst:{" "}
        <Placeholder>[Anbieter, Sitz und Rechtsgrundlage der Übermittlung werden ergänzt]</Placeholder>
      </p>

      <h3>4.1 Boden-Check und Bodenprofil</h3>
      <p>
        Verarbeitet werden: Name, E-Mail-Adresse, Postleitzahl, optional die Fläche, deine Antworten zu Räumen, Bewohnern
        (zum Beispiel Kinder, Haustiere, Allergiker), Stil, Raumklima, heutigem Boden, gewünschter Eigenleistung und
        Zeitplan sowie die daraus automatisch errechneten Empfehlungen. Zweck: dein Bodenprofil erstellen und dir
        zuschicken, prüfen, ob du im Einzugsgebiet liegst, und eine mögliche Erstberatung vorbereiten. Rechtsgrundlage ist
        Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen auf deine Anfrage).
      </p>
      <p>
        <Placeholder>
          [Rechtlich prüfen: Die Angabe „Allergiker“ kann ein Gesundheitsdatum sein (Art. 9 DSGVO). Entweder im Formular
          eine ausdrückliche Einwilligung einholen (Art. 9 Abs. 2 lit. a DSGVO) oder die Option neutral formulieren.]
        </Placeholder>
      </p>

      <h3>4.2 Boden-Sprechstunde</h3>
      <p>
        Verarbeitet werden: Vorname, E-Mail-Adresse und der gewählte Termin, der Zeitpunkt deiner Bestätigung, ob du live
        teilgenommen oder die Aufzeichnung angesehen hast und gegebenenfalls ein Gutscheincode. Zweck: deine Teilnahme
        organisieren, dir den Zugangslink und eine Erinnerung schicken und prüfen, ob die Bedingungen für den Gutschein zur
        Erstberatung erfüllt sind. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
      </p>
      <p>
        Deine Anmeldung bestätigst du über einen Link in einer E-Mail (Double-Opt-in). So stelle ich sicher, dass sich
        niemand mit fremder Adresse anmeldet. Wie die Teilnahme festgestellt wird, hängt vom Webinar-Tool ab (Abschnitt 6).
      </p>

      <h3>4.3 Newsletter (optional)</h3>
      <p>
        Bei der Anmeldung zur Sprechstunde kannst du zusätzlich und freiwillig den Newsletter bestellen. Das ist keine
        Bedingung für die Teilnahme. Auch hier gilt das Double-Opt-in: Erst wenn du den Link in der Bestätigungs-E-Mail
        anklickst, bekommst du den Newsletter. Ich speichere dazu Vorname, E-Mail-Adresse sowie Zeitpunkt von Anmeldung und
        Bestätigung als Nachweis deiner Einwilligung. Rechtsgrundlage ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).
      </p>
      <p>
        Du kannst die Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen, über den Abmeldelink in jeder
        Newsletter-E-Mail oder mit einer kurzen Nachricht an {mail}. Danach lösche ich deine Adresse aus dem Verteiler. Den
        Nachweis deiner früheren Einwilligung bewahre ich bis zu{" "}
        <Placeholder>[Vorschlag: drei Jahre]</Placeholder> auf, um sie im Zweifel belegen zu können (Art. 6 Abs. 1 lit. f
        DSGVO). Versand über: <Placeholder>[Newsletter-Dienst wird ergänzt]</Placeholder>
      </p>

      <h3>4.4 Projekt bewerben</h3>
      <p>
        Verarbeitet werden: Name, E-Mail-Adresse, optional Telefonnummer, Postleitzahl, deine Rolle (zum Beispiel privat,
        Bauherr, Architektur, Hausverwaltung, Gewerbe) und optional Fläche, Bodenwunsch, Zeitrahmen und Nachricht. Zweck:
        dein Projekt einschätzen, dich zurückrufen und gegebenenfalls ein Angebot erstellen. Rechtsgrundlage ist Art. 6
        Abs. 1 lit. b DSGVO.
      </p>

      <h3>4.5 Bewerbung als Partnerbetrieb</h3>
      <p>
        Verarbeitet werden: Name des Betriebs, Name der Ansprechperson, E-Mail-Adresse, optional Telefonnummer, Gewerk,
        Region, ob es sich um einen Meisterbetrieb handelt, die gewünschte Unterstützung und deine Nachricht. Zweck:
        prüfen, ob eine Zusammenarbeit passt, und ein Aufnahmegespräch vereinbaren. Rechtsgrundlage ist Art. 6 Abs. 1
        lit. b DSGVO und, soweit du für einen Betrieb handelst, mein berechtigtes Interesse an der geschäftlichen
        Kommunikation (Art. 6 Abs. 1 lit. f DSGVO).
      </p>

      <h3>4.6 Notfall-Anfrage</h3>
      <p>
        Verarbeitet werden: Name, E-Mail-Adresse, optional Telefonnummer, Postleitzahl, die Art des Schadens und deine
        Beschreibung. Zweck: dir eine Einschätzung geben und gegebenenfalls einen Termin anbieten. Rechtsgrundlage ist
        Art. 6 Abs. 1 lit. b DSGVO. Fotos des Schadens schickst du mir derzeit per E-Mail (Abschnitt 7).{" "}
        <Placeholder>
          [Sobald Fotos direkt über die Website hochgeladen werden: Speicherdienst, Speicherort und Speicherdauer ergänzen]
        </Placeholder>
      </p>

      <h3>4.7 Abo-Anfrage</h3>
      <p>
        Verarbeitet werden: das gewünschte Abo, Name, optional Firma, E-Mail-Adresse, optional Telefonnummer und Fläche
        sowie deine Nachricht. Zweck: dir einen Vorschlag für das Abo machen. Ein Abo kannst du auf dieser Website derzeit
        nur anfragen, nicht abschließen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
      </p>

      <h3>4.8 Schutz vor Spam</h3>
      <p>
        Die Formulare enthalten ein für Menschen unsichtbares Feld (Honeypot). Füllt ein Programm dieses Feld aus, wird die
        Anfrage verworfen. Außerdem prüft der Server, ob ein Formular verdächtig schnell abgeschickt wurde; der Zeitpunkt,
        zu dem du das Formular geöffnet hast, wird dafür verarbeitet, aber nicht gespeichert. Ich nutze dafür keinen
        externen Dienst und kein CAPTCHA. Rechtsgrundlage ist mein berechtigtes Interesse, die Website und meinen
        Posteingang vor Missbrauch zu schützen (Art. 6 Abs. 1 lit. f DSGVO).
      </p>

      <h2>5. Speicherdauer</h2>
      <p>
        Ich lösche deine Daten, sobald sie für den jeweiligen Zweck nicht mehr nötig sind oder wenn du es verlangst, soweit
        keine gesetzlichen Aufbewahrungspflichten entgegenstehen. Geplante Fristen:
      </p>
      <ul>
        <li>
          Anfragen ohne Auftrag (Boden-Check, Projekt, Notfall, Abo):{" "}
          <Placeholder>[Vorschlag: 12 Monate nach dem letzten Kontakt]</Placeholder>
        </li>
        <li>
          Anmeldungen zur Sprechstunde:{" "}
          <Placeholder>[Vorschlag: 6 Monate nach dem Termin, mit Gutschein bis zum Ende der Gutscheinfrist]</Placeholder>
        </li>
        <li>
          Nicht bestätigte Anmeldungen: <Placeholder>[Vorschlag: nach 7 Tagen]</Placeholder>
        </li>
        <li>
          Bewerbungen als Partnerbetrieb ohne Zusammenarbeit:{" "}
          <Placeholder>[Vorschlag: 6 Monate nach der Absage]</Placeholder>
        </li>
        <li>Newsletter: bis zu deinem Widerruf (zum Nachweis siehe Abschnitt 4.3)</li>
        <li>
          Kommt ein Auftrag zustande: die gesetzlichen Aufbewahrungsfristen nach Handels- und Steuerrecht, je nach Unterlage
          bis zu zehn Jahre
        </li>
      </ul>

      <h2>6. Boden-Sprechstunde: Webinar-Tool</h2>
      <p>
        Die Boden-Sprechstunde findet online statt. Dafür nutze ich:{" "}
        <Placeholder>[Anbieter, Sitz, Serverstandort und Rechtsgrundlage werden ergänzt]</Placeholder>
      </p>
      <p>
        Wenn du teilnimmst, verarbeitet das Tool in der Regel deinen angezeigten Namen, deine Fragen im Chat, technische
        Daten wie IP-Adresse, Gerät und Browser sowie Beginn und Ende deiner Teilnahme. Meine Kamera zeigt die Werkbank:
        Hände, Holz und Werkzeug. Deine eigene Kamera und dein Mikrofon brauchst du nicht. Rechtsgrundlage ist Art. 6 Abs. 1
        lit. b DSGVO. Die Sprechstunde wird aufgezeichnet, damit du sie später ansehen kannst.{" "}
        <Placeholder>
          [Regeln zur Aufzeichnung ergänzen: ob Namen und Chatbeiträge darin sichtbar sind und ob Ausschnitte
          veröffentlicht werden]
        </Placeholder>
      </p>

      <h2>7. Kontakt per E-Mail</h2>
      <p>
        Wenn du mir eine E-Mail schreibst, verarbeite ich die Daten, die du mir mitteilst (zum Beispiel Name,
        E-Mail-Adresse, Angaben zu deinem Boden, Fotos und deine Nachricht), um deine Anfrage zu beantworten und
        gegebenenfalls ein Angebot zu erstellen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Anbahnung bzw.
        Durchführung eines Vertrags) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von
        Anfragen).
      </p>
      <p>
        Für mein E-Mail-Postfach nutze ich Gmail der Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland.
        Dabei kann eine Übermittlung an die Google LLC in den USA nicht ausgeschlossen werden. Sie stützt sich auf die
        Zertifizierung nach dem EU-US Data Privacy Framework (Art. 45 DSGVO) bzw. auf EU-Standardvertragsklauseln.
      </p>

      <h2>8. Empfänger</h2>
      <p>Deine Daten erhalten nur Dienstleister, die ich für den Betrieb brauche, und das nur im nötigen Umfang:</p>
      <ul>
        <li>Vercel (Hosting, Abschnitt 2)</li>
        <li>der Anbieter der Datenbank (Abschnitt 3)</li>
        <li>der E-Mail- und Newsletter-Versanddienst (Abschnitte 4 und 4.3)</li>
        <li>der Anbieter des Webinar-Tools (Abschnitt 6)</li>
        <li>Google für mein E-Mail-Postfach (Abschnitt 7)</li>
        <li>der KI-Anbieter für Mini-Aryo, nur wenn du dort eine Frage absendest (Abschnitt 10)</li>
      </ul>
      <p>
        Vermittle ich dein Projekt an einen Partnerbetrieb, etwa für Arbeiten, die ein Parkettleger-Meisterbetrieb
        übernehmen muss, gebe ich deine Daten nur weiter, wenn du einverstanden bist. Behörden erhalten Daten nur, wenn ich
        gesetzlich dazu verpflichtet bin. Ich verkaufe keine Daten.
      </p>

      <h2>9. Geschützter Login-Bereich</h2>
      <p>
        Über den Link „Login“ erreichst du einen geschützten Bereich, der ausschließlich eingeladenen Personen zur
        Verfügung steht. Eine öffentliche Registrierung gibt es nicht. Für eingeladene Nutzerinnen und Nutzer werden
        folgende Daten verarbeitet:
      </p>
      <ul>
        <li>Name, E-Mail-Adresse und Rolle des Nutzerkontos</li>
        <li>Passwort, ausschließlich als kryptografischer Hash gespeichert</li>
        <li>Sitzungsdaten: Zeitpunkt der Anmeldung, Ablaufzeit, IP-Adresse und Browserkennung (User-Agent)</li>
        <li>gegebenenfalls Inhalte, die du im geschützten Bereich selbst anlegst</li>
      </ul>
      <p>
        Zum Schutz vor Missbrauch (Begrenzung von Anmeldeversuchen) wird die IP-Adresse zudem kurzzeitig verarbeitet.
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Bereitstellung des Zugangs) und Art. 6 Abs. 1 lit. f DSGVO
        (Sicherheit des Systems). Die Kontodaten werden gespeichert, bis das Konto gelöscht wird; abgelaufene Sitzungen
        verlieren ihre Gültigkeit. Gespeichert wird in der Datenbank aus Abschnitt 3.
      </p>

      <h2 id="mini-aryo" className="scroll-mt-28">
        10. KI-Bodenberater „Mini-Aryo“
      </h2>
      <p>
        Unten rechts auf der Website kannst du freiwillig den Chat „Mini-Aryo“ öffnen und Fragen rund um Böden stellen.
        Die Antworten erzeugt ein KI-Sprachmodell automatisch; sie können fehlerhaft sein und ersetzen keine Beratung vor
        Ort. Solange du keine Frage absendest, werden keine Daten übertragen.
      </p>
      <p>
        Wenn du eine Frage absendest, werden deine Frage und der bisherige Gesprächsverlauf über den Server dieser
        Website an die Programmierschnittstelle des KI-Anbieters {llm?.provider.company ?? "Groq, Inc. (USA)"}{" "}
        übermittelt, dort verarbeitet und die Antwort an deinen Browser zurückgesendet. Dabei findet eine Übermittlung in
        die USA statt; sie erfolgt auf Grundlage der EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO). Der
        Gesprächsverlauf wird auf dem Server dieser Website nicht gespeichert und ist in deinem Browser nur so lange
        vorhanden, bis du die Seite schließt oder neu lädst. Welche Daten der KI-Anbieter wie lange speichert, richtet
        sich nach dessen Datenschutzbestimmungen.
      </p>
      <p>
        Zum Schutz vor Missbrauch und unverhältnismäßigen Kosten sind höchstens {QUESTIONS_PER_HOUR} Fragen pro Stunde
        möglich. Dazu wird aus deiner IP-Adresse ein pseudonymer Prüfwert (gesalzener Hash) gebildet; gespeichert werden
        nur dieser Wert und ein Zähler, die IP-Adresse selbst nicht.
        {llm?.provider.id === "xai"
          ? " Derselbe Prüfwert wird dem KI-Anbieter als anonyme Kennung zur Missbrauchserkennung übermittelt."
          : ""}{" "}
        Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung deiner Fragen und an
        einem sicheren, wirtschaftlichen Betrieb). Bitte gib im Chat keine personenbezogenen Daten wie Namen, Adressen
        oder Telefonnummern ein. Für eine persönliche Anfrage nutz bitte E-Mail oder die Formulare auf der Startseite.
      </p>

      <h2 id="cookies" className="scroll-mt-28">
        11. Cookies und Einwilligung
      </h2>
      {analyticsEnabled ? (
        <>
          <p>
            Cookies sind kleine Textdateien, die dein Browser speichert. Ähnlich funktionieren Einträge im lokalen
            Speicher des Browsers (Local Storage). Diese Website unterscheidet zwei Arten:
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {cookieOverview.map((cookie) => (
              <div key={cookie.name} className="rounded-xs border border-strich bg-blatt p-4 text-[0.95rem] leading-snug">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <code className="font-mono text-[0.85rem] font-semibold text-graphit [overflow-wrap:anywhere]">
                    {cookie.name}
                  </code>
                  <span
                    className={`rounded-xs px-2 py-0.5 font-mono text-[0.7rem] uppercase tracking-[0.08em] ${
                      cookie.consent ? "bg-eiche/20 text-graphit" : "bg-kreide/10 text-kreide-deep"
                    }`}
                  >
                    {cookie.consent ? "nur mit Einwilligung" : "notwendig"}
                  </span>
                </div>
                <div className="mt-2 text-graphit-soft">{cookie.purpose}</div>
                <div className="mt-2 text-sm text-graphit-muted">
                  <strong className="text-graphit-soft">Dauer:</strong> {cookie.duration}
                </div>
              </div>
            ))}
          </div>
          <h3>Technisch notwendige Cookies</h3>
          <p>
            Die als „notwendig“ markierten Cookies sind für den Betrieb der Website bzw. den von dir gewünschten Dienst
            unbedingt erforderlich; eine Einwilligung ist dafür nicht nötig (§ 25 Abs. 2 Nr. 2 TDDDG, Art. 6 Abs. 1
            lit. b und f DSGVO). Die Login-Cookies werden erst gesetzt, wenn du dich anmeldest.
          </p>
          <h3>Statistik-Cookies (nur mit Einwilligung)</h3>
          <p>
            Nur wenn du im Cookie-Hinweis auf „Einverstanden“ klickst, speichert PostHog ein Cookie bzw. einen
            Local-Storage-Eintrag. Er enthält eine zufällig erzeugte Kennung, mit der wiederholte Besuche desselben
            Browsers erkannt werden. Details dazu in Abschnitt 13. Rechtsgrundlage ist deine Einwilligung (§ 25 Abs. 1
            TDDDG, Art. 6 Abs. 1 lit. a DSGVO).
          </p>
          <h3>Browser-Erweiterungen für Cookie-Hinweise</h3>
          <p>
            Nutzt du eine Browser-Erweiterung, die Cookie-Hinweise für dich beantwortet (etwa Consent-O-Matic), trifft
            sie die Auswahl in deinem Auftrag, so wie du sie dort eingestellt hast. Blendet eine Erweiterung den Hinweis
            nur aus, gilt das nicht als Einwilligung: Die Statistik bleibt dann aus. Sendet dein Browser das Signal „Do
            Not Track“, wird auch nach einer Einwilligung nichts erfasst.
          </p>
          <h3>Einwilligung ändern oder widerrufen</h3>
          <p>
            Deine Einwilligung ist freiwillig. Du kannst sie jederzeit mit Wirkung für die Zukunft widerrufen oder
            erneut erteilen, über den Link „Cookie-Einstellungen“ im Seitenfuß oder direkt hier:{" "}
            <CookieSettingsButton className="cursor-pointer font-semibold text-kreide underline underline-offset-4" />.
            Nach einem Widerruf werden die Statistik-Cookies aus deinem Browser entfernt.
          </p>
        </>
      ) : (
        <p>
          Auf den öffentlichen Seiten dieser Website werden keine Cookies gesetzt. Erst wenn du dich im Login-Bereich
          anmeldest, werden technisch notwendige Sitzungs-Cookies gespeichert (zum Beispiel „better-auth.session_token“),
          die dich als angemeldete Person wiedererkennen. Sie verlieren spätestens nach 14 Tagen ihre Gültigkeit bzw.
          werden beim Abmelden gelöscht. Da diese Cookies für den von dir ausdrücklich gewünschten Dienst unbedingt
          erforderlich sind, ist keine Einwilligung nötig (§ 25 Abs. 2 Nr. 2 TDDDG, Art. 6 Abs. 1 lit. b und f DSGVO).
        </p>
      )}
      <p>
        <Placeholder>
          [Vor Go-live prüfen: Speichert ein Formular Zwischenstände im Browser (localStorage)? Dann hier ergänzen.]
        </Placeholder>
      </p>

      <h2>12. Schriftarten</h2>
      <p>
        Die verwendeten Schriftarten sind lokal in diese Website eingebunden und werden zusammen mit ihr über den oben
        genannten Hoster ausgeliefert. Beim Aufruf der Seiten findet keine Verbindung zu Servern von Google oder anderen
        Schriftanbietern statt.
      </p>

      {analyticsEnabled ? (
        <>
          <h2 id="webanalyse" className="scroll-mt-28">
            13. Webanalyse mit PostHog
          </h2>
          <p>
            Wenn du eingewilligt hast, nutze ich den Analysedienst PostHog der PostHog Inc., 2261 Market Street #4008,
            San Francisco, CA 94114, USA. PostHog hilft mir zu verstehen, welche Seiten und Schritte im Boden-Check
            hilfreich sind und wo die Website besser werden kann. Dabei werden folgende Daten verarbeitet:
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
            <li>eine zufällig erzeugte Kennung deines Browsers (siehe Abschnitt 11)</li>
          </ul>
          <p>
            Die IP-Adresse wird in PostHog nicht gespeichert. Es werden keine Bildschirmaufzeichnungen (Session
            Recordings) angefertigt, keine geräteübergreifenden Profile gebildet und die Daten nicht mit anderen Daten
            zusammengeführt oder für Werbung verwendet. Sendet dein Browser das Signal „Do Not Track“, findet keine
            Erfassung statt.
          </p>
          <p>
            Die Daten werden in der EU-Cloud von PostHog (Rechenzentrum in Frankfurt am Main) gespeichert. Dein Browser
            sendet sie dabei nicht direkt an PostHog, sondern an diese Website, die sie an PostHog weiterleitet. PostHog
            ist als Auftragsverarbeiter tätig (Art. 28 DSGVO). Soweit ein Zugriff aus den USA nicht ausgeschlossen
            werden kann, erfolgt die Übermittlung auf Grundlage der EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c
            DSGVO).
          </p>
          <p>
            Rechtsgrundlage ist deine Einwilligung (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO), die du jederzeit
            über die Cookie-Einstellungen widerrufen kannst. Ohne Einwilligung wird PostHog nicht geladen. Die
            Analysedaten werden gelöscht, sobald sie für die Auswertung nicht mehr erforderlich sind.
          </p>
          <p>
            Werbenetzwerke und Social-Media-Plugins setze ich nicht ein. Der Kosten-Rechner im Ratgeber rechnet nur in
            deinem Browser, deine Eingaben werden weder gespeichert noch gesendet.
          </p>
        </>
      ) : (
        <>
          <h2>13. Keine Analyse- und Tracking-Dienste</h2>
          <p>
            Derzeit setze ich keine Analyse- oder Tracking-Werkzeuge ein, keine Werbenetzwerke und keine
            Social-Media-Plugins. Der Kosten-Rechner im Ratgeber rechnet nur in deinem Browser, deine Eingaben werden
            weder gespeichert noch gesendet.
          </p>
          <p>
            Vorbereitet ist ein Analyse-Werkzeug (PostHog, mit Hosting in der EU), um zu verstehen, welche Seiten und
            Schritte im Boden-Check hilfreich sind. Es wird erst geladen, wenn du über einen Cookie-Hinweis ausdrücklich
            zustimmst (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO). Sobald es aktiv ist, steht hier, welche Daten es
            verarbeitet.
          </p>
        </>
      )}

      <h2>14. SSL-/TLS-Verschlüsselung</h2>
      <p>
        Diese Website nutzt aus Sicherheitsgründen eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung
        erkennst du an „https://“ in der Adresszeile deines Browsers.
      </p>

      <h2>15. Keine automatisierte Entscheidung</h2>
      <p>
        Die Empfehlungen im Bodenprofil werden automatisch aus deinen Antworten errechnet. Das ist ein Vorschlag, keine
        automatisierte Entscheidung mit rechtlicher Wirkung im Sinne von Art. 22 DSGVO.
      </p>

      <h2>16. Deine Rechte</h2>
      <p>Du hast mir gegenüber folgende Rechte hinsichtlich der dich betreffenden personenbezogenen Daten:</p>
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
        Soweit eine Verarbeitung auf Art. 6 Abs. 1 lit. f DSGVO beruht, kannst du ihr aus Gründen, die sich aus deiner
        besonderen Situation ergeben, jederzeit widersprechen. Eine formlose Nachricht an {mail} genügt.
      </p>
      <h3>Beschwerderecht bei einer Aufsichtsbehörde</h3>
      <p>
        Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, insbesondere in dem Mitgliedstaat
        deines gewöhnlichen Aufenthalts, deines Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes (Art. 77 DSGVO).
        Für mich zuständig ist die Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen (LDI
        NRW), Kavalleriestraße 2–4, 40213 Düsseldorf.
      </p>

      <h2>17. Aktualität</h2>
      <p>
        Stand: September 2026. Ich passe diese Datenschutzerklärung an, sobald sich die Website oder die rechtlichen
        Anforderungen ändern.
      </p>

      <p className="text-[0.95rem]">
        Angaben zum Anbieter findest du im <Link href="/impressum">Impressum</Link>.
      </p>
    </LegalLayout>
  );
}
