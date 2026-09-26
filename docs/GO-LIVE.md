# Go-live-Checkliste

Die Website, der Ratgeber und die Werkbank sind technisch fertig und getestet. Vor der öffentlichen Freischaltung fehlen noch diese Punkte. Grundlage ist das Markenkonzept ([`konzept/markenkonzept.md`](konzept/markenkonzept.md)). Auf den Rechtsseiten sind offene Angaben als hervorgehobene Platzhalter markiert; vor dem Go-live darf keiner mehr sichtbar sein.

## Recht und Handwerkskammer
- [ ] **Rechtsform bestätigen:** Einzelunternehmen (Inhaber) oder GmbH/UG (Geschäftsführer + Handelsregister). Heute steht im Impressum und in der Datenschutzerklärung „Inhaber: Aryo Sabouri“. Bei GmbH/UG: Bezeichnung auf „Geschäftsführer“ ändern und Registergericht + HRB-Nummer ins Impressum (`src/app/impressum/page.tsx`, `src/app/datenschutz/page.tsx`, `src/components/site/LegalLayout.tsx`).
- [ ] **Termin bei der Handwerkskammer** (Konzept Kapitel 10) mit diesen Fragen:
  1. Darf ich als Bodenleger Fertigparkett verlegen, schwimmend und verklebt?
  2. Wo liegt die Grenze zwischen Ausbessern und Pflege-Nachölen einerseits und Abschleifen und Versiegeln andererseits?
  3. Darf ich Parkettverlegung als Generalunternehmer anbieten und an einen Meisterbetrieb weitergeben?
  4. Darf der Firmenname „Parkett“ enthalten?
  5. Bin ich im Verzeichnis der zulassungsfreien Handwerke korrekt eingetragen (Anlage B1 oder B2 der Handwerksordnung)?
  6. Welche Wege zur Berechtigung als Parkettleger gibt es für mich?
- [ ] **Impressum: zuständige Handwerkskammer** mit Anschrift eintragen (Platzhalter „[Zuständige Handwerkskammer wird ergänzt]“ in `src/app/impressum/page.tsx`).
- [ ] **Telefonnummer** in `siteConfig.phone` (`src/config/site.ts`). Im Impressum steht bis dahin ein Platzhalter; ein zweiter Kontaktweg neben der E-Mail ist empfehlenswert.
- [ ] **USt-ID**, falls vorhanden: `siteConfig.vatId`.
- [ ] **Verbraucherstreitbeilegung:** Aryo bestätigt die Formulierung „nicht bereit und nicht verpflichtet“ im Impressum.
- [ ] **Datenschutzerklärung fertigstellen** (`src/app/datenschutz/page.tsx`), am besten von einem Anwalt prüfen lassen. Offen sind:
  - Datenbank: Anbieter, Anschrift und Region bestätigen (geplant Neon, Frankfurt, siehe [DEPLOYMENT.md](DEPLOYMENT.md)) und die Rechtsgrundlage der USA-Übermittlung prüfen.
  - E-Mail- und Newsletter-Versanddienst eintragen.
  - Webinar-Tool eintragen, dazu die Regeln zur Aufzeichnung (sind Namen und Chat sichtbar, werden Ausschnitte veröffentlicht?).
  - Speicherfristen festlegen (Vorschläge stehen als Platzhalter im Text).
  - Boden-Check: Die Antwort „Allergiker“ kann ein Gesundheitsdatum sein (Art. 9 DSGVO). Entweder ausdrückliche Einwilligung im Formular einholen oder die Option neutral formulieren.
  - Prüfen, ob ein Formular Zwischenstände im Browser speichert (localStorage), und das dann ergänzen.
  - Anschrift der Aufsichtsbehörde (LDI NRW) und die Anbieterangaben zu Vercel, Neon, Google (Gmail) und PostHog einmal gegenprüfen.
- [ ] **AGB und Widerrufsbelehrung** von einem Anwalt formulieren lassen, **bevor Abos online abgeschlossen werden** können. Dazu gehören der Kündigungsbutton (§ 312k BGB), das Widerrufsrecht von 14 Tagen und höchstens 24 Monate Erstlaufzeit für Privatkunden. Formuliert als Pflege- und Wartungsvertrag, nicht als Versicherung oder Garantie. Heute kann man Abos nur anfragen.

## Partner und Preise
- [ ] **Ersten Parkettleger-Meisterbetrieb als Partner gewinnen** (Innung, HWK-Betriebsbörse, Großhändler, Meister kurz vor dem Ruhestand). Bis dahin bleiben Leistungen mit Meisterpflicht auf der Website ausgeblendet. Die Ratgeber-Artikel sprechen allgemein von „einem Parkettleger-Meisterbetrieb als Partner“; sobald ein Partner feststeht, die Formulierungen einmal gegenlesen.
- [ ] **Preise in der Werkbank pflegen** (`/studio`, Preise und Leistungen). Ohne Preis erscheint auf der Website keine Preiszeile. Der Kosten-Rechner im Ratgeber startet bewusst mit leeren Feldern und zeigt keine eigenen Preise.

## Technik und Dienste
- [ ] **E-Mail-Anbieter einrichten** (z. B. Resend oder Postmark, möglichst mit Servern in der EU): Double-Opt-in für Sprechstunde und Newsletter, Versand des Bodenprofils, Benachrichtigung an Aryo bei neuen Anfragen (Boden-Check, Projekt, Partner, Notfall, Abo), später Passwort-Reset.
- [ ] **Speicher für Foto-Uploads** bei Notfall-Anfragen (und für die 3 Raumfotos der Gutschein-Bedingung) auswählen, z. B. Vercel Blob. Bis dahin schicken Kunden Fotos per E-Mail. Danach Datenschutzerklärung ergänzen.
- [ ] **Webinar-Tool für die Boden-Sprechstunde** auswählen (Aufzeichnung, Teilnahme-Nachweis für den Gutschein, möglichst EU-Hosting) und in der Datenschutzerklärung eintragen.
- [ ] **PostHog** (optional, Einwilligungsbanner ist eingebaut): `NEXT_PUBLIC_POSTHOG_KEY` in Vercel setzen, „Discard client IP data“ aktivieren, DPA abschließen und die Projekt-URL in den Werkbank-Einstellungen eintragen, siehe [ANALYTICS.md](ANALYTICS.md). Ohne Key bleiben Banner und Tracking aus.
- [ ] Vercel + Neon einrichten, siehe [DEPLOYMENT.md](DEPLOYMENT.md)
- [ ] Admin-Konto über `/einrichten` anlegen
- [ ] Optional: eigene Domain + `NEXT_PUBLIC_SITE_URL` (Canonical-URLs, Sitemap und JSON-LD nutzen diese Adresse)

## Inhalte
- [ ] **Texte gegenlesen** (Aryo): Startseite und die 7 Ratgeber-Artikel in `src/content/ratgeber/articles/`. Sie enthalten keine erfundenen Zahlen, Preise oder Referenzen; allgemeine Richtwerte (z. B. Luftfeuchte, Dehnungsfuge) sind als Herstellerangaben gekennzeichnet.
- [ ] **Echte Vorher/Nachher-Fotos** aus eigenen Projekten (Gründungskontingent: Fotos gegen Erstberatung). Bis dahin nur als Illustration gekennzeichnet.
- [x] Anschrift im Impressum (Florusstraße 9, 53225 Bonn)
- [x] Einsatzgebiet: `siteConfig.serviceArea` = „NRW und angrenzend“

## Später sinnvoll
- Passwort-Reset per E-Mail (mit dem E-Mail-Anbieter oben). Bis dahin setzt ein Admin neue Passwörter in der Nutzerverwaltung.
- Weitere Ratgeber-Artikel aus den Fragen der Sprechstunde, Stadtseiten mit echten Projekten.
