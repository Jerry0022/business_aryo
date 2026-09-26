# Go-live-Checkliste

Alles Technische ist fertig und getestet. Vor der öffentlichen Freischaltung fehlen noch diese Punkte:

## Inhalte & Recht
- [ ] **Texte gegenlesen** (Aryo): Hero, Leistungen, Ablauf, „Über mich“ in `src/components/site/content.ts` bzw. den Section-Komponenten. Enthalten sind nur allgemeine, qualitative Aussagen, keine erfundenen Zahlen oder Referenzen.
- [ ] **Leistungsumfang prüfen:** Aryo ist Bodenleger (zulassungsfrei). Parkettleger ist seit 2020 wieder zulassungspflichtig. Kurz bei der Handwerkskammer klären, ob Bezeichnungen wie „Parkettfachmann“ und Leistungen wie das Schleifen und Versiegeln von Massivparkett so beworben werden dürfen. Texte ggf. anpassen.
- [ ] **Telefonnummer** (optional): `siteConfig.phone` in `src/config/site.ts`. Der Anruf-Button erscheint dann automatisch.
- [ ] **Einsatzgebiet** (optional, gut für lokale Suche): `siteConfig.serviceArea`, z. B. „Bonn & Umgebung“.
- [ ] **USt-ID**, falls vorhanden: `siteConfig.vatId`.
- [ ] **Verbraucherstreitbeilegung:** Aryo bestätigt die Formulierung „nicht bereit und nicht verpflichtet“ im Impressum.
- [ ] **Datenschutzerklärung:** Anbieterangaben zu Vercel, Neon und Google (Gmail) einmal gegenprüfen.
- [x] Anschrift im Impressum (Florusstraße 9, 53225 Bonn)
- [x] **Keine Fischgrät- und Tafelparkett-Versprechen** (Meisterpflicht): aus Leistungen, Muster-Explorer, Grafiken, Logo/Favicon und Mini-Aryo-Prompt entfernt; ein Unit-Test (`src/features/berater/system-prompt.test.ts`) verhindert, dass sie zurückkommen.
- [ ] **Mini-Aryo (KI-Chat):** xAI-Konto + API-Key einrichten, siehe [MINI-ARYO.md](MINI-ARYO.md). In der Datenschutzerklärung (Abschnitt 4) die Firmierung und Anschrift von xAI ergänzen und den Datenverarbeitungsvertrag (DPA) von xAI abschließen.

## Betrieb
- [ ] Vercel + Neon einrichten, siehe [DEPLOYMENT.md](DEPLOYMENT.md)
- [ ] Admin-Konto über `/einrichten` anlegen
- [ ] Optional: eigene Domain + `NEXT_PUBLIC_SITE_URL`

## Später sinnvoll
- Passwort-Reset per E-Mail (z. B. über Resend). Bis dahin setzt ein Admin neue Passwörter in der Nutzerverwaltung.
- Echte Referenzfotos von Aryos Arbeiten für die Website.
