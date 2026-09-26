# Mini-Aryo – KI-Bodenberater (Grok)

Unten rechts auf der öffentlichen Website sitzt **Mini-Aryo**: ein kleiner animierter Aryo (schwarze Haare, schwarzer Bart, Exzenterschleifer). Ein Klick öffnet einen Chat, in dem Grok (xAI) Fragen zu Böden aller Art beantwortet – mit Schwerpunkt Parkett.

## Aufbau

| Datei | Zweck |
|---|---|
| `src/features/berater/system-prompt.ts` | Briefing für Grok: Rolle, Ton, Fachwissen, Leistungen (aus `content.ts`), **ausgeschlossene Arbeiten** (`EXCLUDED_WORK`), harte Regeln |
| `src/app/api/berater/route.ts` | `POST /api/berater`: prüft Herkunft, Eingaben und Rate-Limit, ruft xAI auf und streamt die Antwort als Text zurück |
| `src/features/berater/rate-limit.ts` | 15 Fragen / 10 Min. und 60 / Tag pro Besucher (gehashte IP), dazu ein Tageslimit für alle zusammen (`BERATER_DAILY_LIMIT`, Standard 500) |
| `src/features/berater/ui/` | Floating-Button, Chat-Panel, SVG-Figur (`MiniAryo.tsx`); Animationen in `globals.css` unter „Mini-Aryo“ |

Ohne `XAI_API_KEY` bleibt der Button sichtbar, der Chat zeigt dann nur einen Hinweis mit der Kontakt-E-Mail.

## xAI-Konto und API-Key einrichten

1. Auf <https://console.x.ai> mit **„Sign up“** ein neues Konto anlegen (am besten mit der Geschäfts-E-Mail, z. B. Maximilian.Parkett@gmail.com). E-Mail bestätigen.
2. In der Console ein **Team** anlegen bzw. das Standard-Team verwenden.
3. Unter **Billing** eine Zahlungsmethode hinterlegen und **Credits** aufladen (z. B. 10–20 $ zum Start). Ohne Guthaben antwortet die API mit einem Fehler. Wenn angeboten: ein **monatliches Ausgabenlimit** setzen.
4. Unter **API Keys** → **Create API key**: Name z. B. `business-aryo-vercel`, Berechtigung nur für Chat/Text bzw. das Modell `grok-4.3` (falls die Console das Einschränken anbietet). Den Key sofort kopieren – er wird nur einmal angezeigt.
5. In Vercel (Projekt `business-aryo` → Settings → Environment Variables) `XAI_API_KEY` für **Production** und **Preview** anlegen, alternativ per CLI:
   ```bash
   npx vercel env add XAI_API_KEY production --scope business-aryo
   npx vercel env add XAI_API_KEY preview --scope business-aryo
   ```
   Optional: `XAI_MODEL` (Standard `grok-4.3`) und `BERATER_DAILY_LIMIT` (Standard 500).
6. Neu deployen (Umgebungsvariablen greifen erst mit dem nächsten Deployment) und im Chat eine Testfrage stellen.
7. Datenschutz: In der xAI-Console bzw. über xAI den **Datenverarbeitungsvertrag (DPA)** abschließen und in `src/app/datenschutz/page.tsx` (Abschnitt 4) Firmierung und Anschrift von xAI eintragen.

Lokal: `XAI_API_KEY=…` in `.env.local` eintragen und `npm run dev` neu starten. Den Key niemals committen.

## Kosten

`grok-4.3` kostet laut xAI 1,25 $ pro 1 Mio. Eingabe- und 2,50 $ pro 1 Mio. Ausgabe-Token. Eine typische Frage (Systemprompt + Verlauf + Antwort) liegt grob bei 0,5 Cent. Das Tageslimit von 500 Fragen deckelt die Kosten damit auf wenige Dollar pro Tag.

## Prompt anpassen

- Leistungen kommen automatisch aus `SERVICES` in `src/components/site/content.ts`.
- Arbeiten, die **nicht** angeboten werden dürfen, stehen in `EXCLUDED_WORK`. Der Test `system-prompt.test.ts` prüft, dass sie weder in Leistungen noch im Muster-Explorer auftauchen.
- Nach Änderungen: `npm test`.
