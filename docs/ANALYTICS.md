# Webanalyse mit PostHog + Cookie-Banner

Die Website nutzt [PostHog](https://posthog.com) für eine pseudonymisierte Nutzungsstatistik. PostHog läuft **nur nach Einwilligung** im Cookie-Banner. Solange kein Projekt-Key gesetzt ist, ist alles aus: kein Banner, kein Skript, keine Cookies, und die Datenschutzerklärung zeigt automatisch die Variante „keine Analyse-Tools“.

## So funktioniert es

- **Ein-/Ausschalter:** `NEXT_PUBLIC_POSTHOG_KEY`. Die Variable wird beim Build eingebacken, nach dem Setzen oder Ändern also neu deployen.
- **Cookie-Banner** (`src/components/consent/CookieBanner.tsx`): kompakte Karte unten links mit aufklappbarer Kurzfassung („Kurz erklärt“) und zwei gleichwertigen Buttons, „Nur notwendige“ und „Einverstanden“. Die festen IDs `cookie-banner`, `cookie-accept` und `cookie-reject` erleichtern es Consent-Erweiterungen wie Consent-O-Matic, den Banner im Auftrag der Nutzer zu beantworten. Ein bloßes Ausblenden durch Adblocker zählt nicht als Einwilligung. Die Wahl steht im Cookie `cookie_consent` (12 Monate). Über „Cookie-Einstellungen“ im Footer bzw. in der Datenschutzerklärung lässt sie sich jederzeit ändern.
- **PostHog** (`src/components/consent/PostHogAnalytics.tsx`) wird erst nach dem Opt-in nachgeladen. Beim Widerruf stoppt die Erfassung, die Seite lädt neu und alle `ph_*`-Cookies bzw. Local-Storage-Einträge werden gelöscht.
- **Reverse Proxy:** Der Browser spricht nur mit der eigenen Domain (`/ingest/*`). `next.config.ts` leitet an PostHog weiter. Das hält Adblocker-Verluste klein, und es gibt keine direkte Verbindung zu einem Drittanbieter.
- **Datensparsam konfiguriert:** keine Session Recordings, keine Umfragen, Personenprofile nur für identifizierte Nutzer (es wird niemand identifiziert), Do-Not-Track wird respektiert. Seitenaufrufe (inkl. Client-Navigation) und Klicks werden automatisch erfasst, Formulareingaben nicht.
- **Neue einwilligungspflichtige Dienste:** `CONSENT_VERSION` in `src/lib/consent.ts` erhöhen, dann werden alle Besucher erneut gefragt. Datenschutzerklärung ergänzen!

## Einrichtung (einmalig)

### 1. PostHog-Projekt
1. In PostHog das Projekt öffnen (Region **EU**, `eu.posthog.com`, empfohlen für DSGVO).
2. **Settings → Project → General → Project API key** kopieren (beginnt mit `phc_`). Der Key ist öffentlich, er erlaubt nur das Senden von Events. Den **Personal API Key** (`phx_…`) dagegen nie ins Repo oder in `NEXT_PUBLIC_*`-Variablen.
3. Datenschutz-Einstellungen im Projekt:
   - **Settings → Project → General → „Discard client IP data“** aktivieren. Die Datenschutzerklärung sagt, dass die IP-Adresse nicht gespeichert wird.
   - **Session Replay** ausgeschaltet lassen (ist im Code zusätzlich deaktiviert).
   - **Authorized URLs / Web analytics domains:** `https://business-aryo.vercel.app` (und später die eigene Domain) eintragen.
4. **Auftragsverarbeitungsvertrag (DPA)** mit PostHog abschließen: <https://posthog.com/dpa> (Formular ausfüllen, unterschriebenes PDF aufbewahren).

### 2. Vercel
Unter **Project `business-aryo` → Settings → Environment Variables** (Production **und** Preview):

| Name | Wert |
| --- | --- |
| `NEXT_PUBLIC_POSTHOG_KEY` | `phc_…` aus Schritt 1 |
| `NEXT_PUBLIC_POSTHOG_HOST` | nur bei US-Cloud: `https://us.i.posthog.com` (Standard ist EU) |

Oder per CLI:

```bash
npx vercel env add NEXT_PUBLIC_POSTHOG_KEY production --scope business-aryo
npx vercel env add NEXT_PUBLIC_POSTHOG_KEY preview --scope business-aryo
```

Danach neu deployen (Redeploy in Vercel oder ein Push auf `main`).

### 3. Prüfen
1. Website in einem privaten Fenster öffnen: Der Banner erscheint, bis zur Entscheidung gehen keine Requests an `/ingest`.
2. „Einverstanden“: In PostHog unter **Activity** bzw. **Web analytics** erscheint nach wenigen Sekunden der `$pageview`.
3. Footer → „Cookie-Einstellungen“ → „Nur notwendige“: Die `ph_*`-Cookies verschwinden.

PostHog filtert automatisierte Browser (Playwright, Headless Chrome mit `navigator.webdriver`) als Bots heraus. E2E-Läufe erzeugen deshalb keine Statistikdaten.

### Lokal testen
`NEXT_PUBLIC_POSTHOG_KEY=phc_… npm run dev` bzw. den Key in `.env.local` eintragen. Am besten ein eigenes PostHog-Projekt für Entwicklung nehmen, damit keine Testdaten in der Produktionsstatistik landen.

## Claude-Zugriff auf PostHog (Auswertungen)

Damit Claude in Cloud-Sessions Zahlen aus PostHog abfragen kann, gibt es zwei Wege:

1. **PostHog-MCP als Connector** (bequem): Auf <https://claude.ai/customize/connectors> einen eigenen Connector mit der URL `https://mcp-eu.posthog.com/mcp` (EU-Projekt) hinzufügen und per OAuth bei PostHog anmelden. Danach eine **neue** Session starten, denn Connectors werden beim Session-Start geladen.
2. **Personal API Key als Umgebungsvariable**: In PostHog unter *Account settings → Personal API keys* einen Key anlegen, nur mit **Read**-Scopes (z. B. Query, Insight, Dashboard) und nur für dieses Projekt. In der Cloud-Umgebung unter *Edit → Environment variables* als `POSTHOG_PERSONAL_API_KEY` eintragen, dazu `POSTHOG_PROJECT_ID` (die Projekt-ID steht in der PostHog-URL). Claude fragt dann die API unter `https://eu.posthog.com/api/…` ab. Den Key nie ins Repo und nie in den Chat.
