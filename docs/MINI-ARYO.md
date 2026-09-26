# Mini-Aryo – KI-Bodenberater

Unten rechts auf der öffentlichen Website sitzt **Mini-Aryo**: ein kleiner animierter Aryo (schwarze Haare, schwarzer Bart, Exzenterschleifer). Ein Klick öffnet einen Chat, in dem ein KI-Sprachmodell Fragen zu Böden aller Art beantwortet – mit Schwerpunkt Parkett.

## Anbieter

| Reihenfolge | Anbieter | Env-Variable | Standardmodell | Kosten |
|---|---|---|---|---|
| 1 | **Groq** (groq.com – nicht zu verwechseln mit Grok!) | `GROQ_API_KEY` (optional `GROQ_MODEL`) | `openai/gpt-oss-120b` | kostenloser Developer-Plan (ca. 1.000 Anfragen bzw. 200.000 Token pro Tag, 8.000 Token pro Minute) |
| 2 | **Grok** von xAI (x.ai) | `XAI_API_KEY` (optional `XAI_MODEL`) | `grok-4.3` | Guthaben nötig, ca. 0,5 Cent pro Frage |

Genutzt wird der erste Anbieter, für den ein Key gesetzt ist. Ohne Key zeigt der Chat einen Hinweis mit der Kontakt-E-Mail.

## Limits

- **10 Fragen pro Stunde und Besucher** (gehashte IP, Zeitfenster ab der ersten Frage). Danach zeigt der Chat die Meldung mit **Live-Countdown**, bis wieder gefragt werden kann; die letzte Frage bleibt im Eingabefeld stehen. Ab 3 verbleibenden Fragen weist der Chat darauf hin.
- **Globales Limit über alle Besucher: 80 % des Groq-Kontingents** (`BERATER_QUOTA_SHARE`, Standard 0.8). Gezählt werden Anfragen und geschätzte Token (Zeichen ÷ 3 + 600 für die Antwort), pro Minute und pro UTC-Tag. Beim Gratis-Plan für `gpt-oss-120b` ergibt das 24 Anfragen/Min., 6.400 Token/Min., 800 Anfragen/Tag, 160.000 Token/Tag. Da eine Frage wegen des Systemprompts etwa 3.000–3.500 Token braucht, sind das in der Praxis **ca. 2 Fragen pro Minute und ca. 45–50 Fragen pro Tag** für alle zusammen. Mehr geht mit einem kürzeren Prompt oder dem bezahlten Groq-Plan (Werte in `llm.ts` → `quota` anpassen).
- **Tageslimit für alle zusammen** (zusätzlich, v. a. für xAI): `BERATER_DAILY_LIMIT` (Standard 500) – Countdown bis Mitternacht (UTC).
- Meldet der Anbieter selbst „zu viele Anfragen“ (z. B. Groq-Gratislimit), erscheint ebenfalls ein Countdown.

## Aufbau

| Datei | Zweck |
|---|---|
| `src/features/berater/system-prompt.ts` | Briefing: Rolle, Ton, Fachwissen, Leistungen (aus `content.ts`), **ausgeschlossene Arbeiten** (`EXCLUDED_WORK`), harte Regeln |
| `src/features/berater/llm.ts` | Anbieter (Groq, xAI), Modell, Request-Parameter |
| `src/app/api/berater/route.ts` | `POST /api/berater`: Herkunft, Eingaben, Rate-Limit prüfen, Anbieter aufrufen, Antwort als Text streamen |
| `src/features/berater/rate-limit.ts` | 10 Fragen/Stunde pro Besucher + Tageslimit (Tabelle `rate_limit`) |
| `src/features/berater/ui/` | Floating-Button, Chat-Panel mit Countdown, SVG-Figur (`MiniAryo.tsx`); Animationen in `globals.css` unter „Mini-Aryo“ |

## Key einrichten

**Groq (kostenlos):** Auf <https://console.groq.com> registrieren → „API Keys“ → „Create API Key“ → in Vercel (Projekt `business-aryo` → Settings → Environment Variables) als `GROQ_API_KEY` für Production und Preview eintragen → neu deployen.

**Grok/xAI (optional, kostenpflichtig):** <https://console.x.ai> → Konto anlegen → Guthaben aufladen → „API Keys“ → Key als `XAI_API_KEY` in Vercel eintragen. Wird nur genutzt, wenn kein `GROQ_API_KEY` gesetzt ist.

Lokal: Key in `.env.local` eintragen und `npm run dev` neu starten. Keys niemals committen.

## Prompt anpassen

- Leistungen kommen automatisch aus `SERVICES` in `src/components/site/content.ts`.
- Arbeiten, die **nicht** angeboten werden dürfen, stehen in `EXCLUDED_WORK`. Der Test `system-prompt.test.ts` prüft, dass sie weder in Leistungen noch im Muster-Explorer auftauchen.
- Nach Änderungen: `npm test`.
