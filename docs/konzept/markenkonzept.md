# Markenkonzept Maximilian Parkett

Ergebnis der Konzept-Session zur Unternehmenswebsite (öffentlicher Teil und Admin-Bereich). Das 3D-Haus für Aryos Account ist ein separates Projekt und nicht Teil dieses Dokuments.

**Stand:** 26.09.2026, nach Runde 6 (Design). Offene Entscheidungen stehen am Ende.

**Verhältnis zur Erstimplementierung** (Branch `claude/amazing-wozniak-41vwku`, Next.js):
- **Dieses Dokument ist führend** für die öffentliche Website und die Fachlichkeit des Admin-Bereichs: Marke, Inhalte, Aufbau, Geschäftslogik, Preise, Kontingente und Design.
- **Aktueller ist die Erstimplementierung** beim 3D-Traumhaus und bei der Login-Grundlage des Admin-Bereichs. Diese Teile werden übernommen und ergänzen das Konzept:
  - Login unter `/login`
  - Ersteinrichtung des Admins unter `/einrichten`
  - Bereich `/studio` mit dem 3D-Traumhaus als Sonderbereich für Aryos Account
  - Benutzerverwaltung unter `/studio/benutzer` und Konto unter `/studio/konto`
- Die Module aus Kapitel 13 kommen als weitere Menüpunkte in diesen Bereich: Kalender, Preise und Leistungen, Abos, Einstellungen, PostHog-Link.
- Bei Widersprüchen im öffentlichen Teil gilt dieses Dokument.

---

## 1. Das Unternehmen

| | |
|---|---|
| Name | **Maximilian Parkett** (Arbeitsname, wird später umbenannt) |
| Rechtsform | Einzelunternehmen, Inhaber Aryo |
| Handwerk | Bodenleger (zulassungsfrei). **Kein** Parkettleger-Meister, siehe Kapitel 10 |
| Region | NRW und angrenzende Gebiete |
| Arbeitszeit | halbtags im Schnitt, abwechselnd Block-Wochen und Halbtags-Wochen |
| Schwerpunkt | Parkett, außerdem Laminat und Vinyl |
| Leistungen | Planung, Material, Werkzeug (Verkauf und Verleih), Einweisung, Ausbessern, Vollleistung |
| Kunden | Privatkunden, andere Kleinunternehmen und Handwerker, Hausverwaltungen und Gewerbe |
| Gesicht | vorerst kein Foto auf der Website. Im Impressum stehen Name und Anschrift (Pflicht) |

## 2. Markenkern

> **Man läuft jeden Tag darauf.**

**Warum es uns gibt:**
> Draußen gibt die Natur den Boden vor. Drinnen wählen wir ihn selbst und laufen jeden Tag darauf. Ich mache aus Naturmaterial einen Boden, auf dem du dich zuhause fühlst.

**Wie ich arbeite:**
> Ich plane, liefere und verlege Holzböden, die zum Raum, zum Leben und zum Budget passen. Wer selbst Hand anlegen will, bekommt von mir Material, Werkzeug und das Wissen dazu.

**Wohin es gehen soll (3–5 Jahre):**
> Die erste Adresse für Holzböden in NRW, für Bauherren wie für Handwerkskollegen. *Intern: weniger Aufträge, dafür die richtigen.*

**Laminat und Vinyl:** Parkett ist das Herz der Marke. Laminat und Vinyl sind die ehrliche Alternative, wo sie besser passen, etwa im Bad, in der Mietwohnung oder bei kleinem Budget.

## 3. Werte

| Wert | Heißt konkret | Heißt nicht |
|---|---|---|
| **Sorgfalt bis zur letzten Fuge** | Übergänge, Sockelleisten und Schwellen entscheiden | Perfektionismus, der den Termin sprengt |
| **Ehrlich beraten** | Ich empfehle, was passt, nicht was am meisten kostet. Auch mal: „Brauchst du nicht.“ | Billigangebote um jeden Preis |
| **Aus Liebe zum Naturmaterial** | Das Material verstehen und erklären können, Stolz auf jeden Boden | Romantik ohne Fachwissen |
| **Bodenständig** | Nahbar, direkt, pragmatisch, egal ob Studentenbude oder Villa | Hemdsärmelig |

## 4. Persönlichkeit und Sprache

**Persönlichkeit: der ehrliche Tüftler.** Macher, detailverliebt, pragmatisch und flexibel. Der Ton ist ehrlich und direkt, die Bilder sind edel und nah am Material, die Bedienung ist modern und interaktiv.

- **Ansprache:** „Ich“ und „Du“.
- **Bilder: Hände statt Gesicht.** Hände am Holz, Werkzeug, Maserung, Details.
- **Sprachstil:**
  - kurz und konkret, Zahlen statt Adjektive („hält 30 Jahre“ statt „langlebig“)
  - Nachteile ehrlich nennen
  - trockener Humor, nie auf Kosten des Kunden
  - keine Superlative, kein Fachwort ohne Erklärung

| Typisch Branche | So klingt Maximilian Parkett |
|---|---|
| „Wir bieten hochwertige Parkettböden in großer Auswahl.“ | „Ich zeig dir drei Böden, die zu deinem Leben passen. Und einen, von dem ich dir abrate.“ |

## 5. Positionierung, Zielgruppen, Kundenvorteile

**Positionierung:**
> Für alle, die einen Holzboden wollen, der wirklich passt: Ich plane, liefere und verlege, oder ich zeige dir, wie du es selbst machst. Anders als Baumarkt und Großhandel berate ich persönlich und ehrlich. Anders als der klassische Parkettleger zeige ich dir vorher, wie der Boden in deinem Raum wirkt.

**Was uns unterscheidet:**
1. **Erst planen, dann verlegen:** Boden-Check in 7 Schritten, mit Vorschau, wie der Boden im Raum wirkt.
2. **Du entscheidest, wie viel du selbst machst:** vom Werkzeugverleih bis zur Vollleistung.
3. **Ehrlich für jedes Budget:** dieselbe Sorgfalt für die Mietwohnung wie für die Villa.

| Zielgruppe | Ihr Problem | Der Vorteil für sie |
|---|---|---|
| Eigentümer | Riesige Auswahl, Angst vor dem Fehlkauf, unklare Kosten | Klarheit durch Planung, ein Ansprechpartner, ein Boden für Jahrzehnte |
| Bauherren im Luxussegment | Wollen Besonderes (Fischgrät, besondere Hölzer) | Planung bis ins Detail, Umsetzung mit Meisterpartner |
| Vermieter, Hausverwaltungen, Gewerbe | Leerstand, Schäden, Ausfallzeiten, Kosten | Robuste Böden, schnelle Umsetzung, Werterhalt, Rundum-sorglos-Pflege |
| Heimwerker | Profi-Werkzeug ist teuer, Angst vor Fehlern | Profi-Ergebnis mit Material, Werkzeug und Einweisung |
| Handwerkskollegen | Keine Kapazität, kein Parkett-Wissen, Materialbeschaffung | Verlässlicher Partner, der keine Kunden abwirbt |

## 6. Die drei Wege

Der Aufbau der Website beantwortet eine Frage: **„Wie viel willst du selbst machen?“**

| Weg | Für wen | Inhalt |
|---|---|---|
| **Machen lassen** | Eigentümer, Bauherren, Vermieter | Planung, Material, Verlegung, Boden-Pass |
| **Selbst machen** | Heimwerker mit Anspruch | Material, Profi-Werkzeug leihen, Einweisung, Rückendeckung |
| **Für Profis** | Handwerksbetriebe, Bauträger, Hausverwaltungen, Gewerbe | Material, Werkzeug, Planungshilfe, Rundum-sorglos-Pflege, Bewerbung als Partner |

Dazu kommt **Retten und Auffrischen** als Schnelleinstieg für Wasserschaden, Kratzer und stumpfe Stellen: Foto hochladen, dann kommt eine Einschätzung.

## 7. Geschäftskonzept: „Planen für viele, verlegen für wenige“

**Großzügig mit Wissen, sparsam mit Zeit.** Alles, was sich vervielfältigen lässt, gibt es für viele: Wissen, Planung, Material, Werkzeug. Die eigene Arbeitszeit gibt es nur für wenige ausgewählte Projekte. Die Knappheit ist echt, weil der Inhaber allein arbeitet.

| Ebene | Was | Für wen | Einnahme |
|---|---|---|---|
| 1 · Wissen | Ratgeber, Boden-Check, Boden-Sprechstunde | alle | Vertrauen und Kontakte |
| 2 · Planung und Material | Bodenprofil, Material, Werkzeug, Einweisung | viele | Marge, ohne selbst zu verlegen |
| 3 · Eigene Arbeit | Erstberatung vor Ort, Verlegung, Pflege | Jahreskontingent | Vollleistung zum Premiumpreis |

**Kein Kontakt geht verloren.** Wer keinen Projektplatz bekommt, verlegt selbst (mit Material, Werkzeug und Einweisung) oder wird an einen geprüften Partnerbetrieb vermittelt.

### 7.1 Weg für Privatkunden

```
Entdecken → Boden-Check → Bodenprofil → Sprechstunde → Gutschein → Erstberatung → Projektplatz
```

1. **Entdecken:** Ratgeber, 3D-Bodentypen, Vorher/Nachher-Vergleiche. Gratis, ohne Anmeldung.
2. **Boden-Check** (7 Schritte, siehe Kapitel 12). Das Ergebnis ist das **Bodenprofil** per E-Mail: 2–3 passende Böden, Vor- und Nachteile, Pflegeaufwand.
3. **Boden-Sprechstunde:** gratis, live, einmal im Monat (2. Donnerstag, 19 Uhr, 45 Minuten plus Fragen). Die **Werkbank-Kamera** zeigt Hände, Holz und Werkzeug, nicht das Gesicht.
4. **Gutschein für die Erstberatung vor Ort.** Wert im Admin einstellbar, wird bei Auftrag angerechnet. Er gilt nur, wenn
   - der Teilnehmer live dabei war oder die Aufzeichnung innerhalb von 72 Stunden ganz gesehen hat,
   - der Boden-Check ausgefüllt ist und 3 Raumfotos hochgeladen sind,
   - das Projekt im Einzugsgebiet liegt,
   - es um mindestens 25 m² oder einen besonderen Boden geht,
   - die Buchung innerhalb von 14 Tagen erfolgt, solange das Kontingent reicht.
5. **Erstberatung vor Ort:** Aufmaß, Feuchtemessung des Untergrunds, Muster zum Anfassen, ehrliche Empfehlung.
6. **Projektplatz:** Angebot, Anzahlung, fester Termin.

**Abkürzungen:**
- **Großprojekt** (ab ca. 60 m², Bauherr oder Architekt): direkt „Projekt bewerben“, Rückruf innerhalb von 48 Stunden.
- **Notfall:** Fotos hochladen, Einschätzung zum Festpreis.

### 7.2 Weg für Profis: Bewerbung als Partnerbetrieb

- Kurzes Formular: Gewerk, Region, Volumen, gewünschte Hilfe. Tonfall: „Damit wir beide wissen, ob es passt.“
- Begrenzte Plätze, zum Beispiel 10 Partnerbetriebe in NRW.
- Aufnahmegespräch, danach Zugang zum Partnerbereich (Login).
- Versprechen: keine Kunden abwerben, auf Wunsch Arbeit im Namen des Partners.
- Partner bekommen Projekte vermittelt, die der Inhaber nicht selbst übernimmt.

### 7.3 Kontingente

- **Gründungskontingent 2026:** 12 Erstberatungen bis 31.12.2026. Im Gegenzug dürfen Vorher/Nachher-Fotos gezeigt werden. So entstehen die ersten Referenzen.
- **Jahreskontingent 2027:** **12 Projektplätze, einer pro Monat.** Erstberatungen gibt es nur, solange Projektplätze frei sind.
- **Abo-Plätze:** begrenzt, zum Beispiel 20 (siehe Kapitel 9).
- Die Zähler auf der Website kommen **direkt aus dem Admin-Kalender**. Erfundene Knappheit ist verboten, siehe Kapitel 10.

### 7.4 Digitaler Boden-Pass

Jeder verlegte Boden bekommt einen Pass mit Holzart, Charge, Oberfläche, Verlegedatum und Pflegeplan. Der Kunde kann damit beim Verkauf oder Vermieten den Werterhalt belegen. Für den Inhaber erzeugt der Pass Pflege-Erinnerungen, aus denen wiederkehrende Aufträge werden. Er ist außerdem die Grundlage für das Abo „Boden-Pass Plus“.

### 7.5 Marketing-Taktiken

| Taktik | Umsetzung |
|---|---|
| Erst geben, dann fragen | Ratgeber, Bodenprofil und Sprechstunde gratis |
| Kleine Schritte | ein Klick, eine E-Mail, eine Stunde |
| Echte Knappheit | Kontingent und Stichtag |
| Bewerbung statt Anfrage | Partner und Großprojekte bewerben sich |
| Verdienter Gutschein | Er gilt nur unter Bedingungen |
| Echte Beweise | Vorher/Nachher nur aus echten Projekten |
| Lokal gefunden werden | Google-Unternehmensprofil, Ratgeber, Stadtseiten mit echten Projekten |
| Sprechstunde als Quelle für Inhalte | Clips für Instagram, TikTok und YouTube |

## 8. Kapazität und Wirtschaftlichkeit

**Arbeitsrhythmus:** Block-Wochen und Halbtags-Wochen wechseln sich ab, jeweils etwa 20 Stunden.
- **Block-Woche:** zum Beispiel Dienstag und Mittwoch volle Verlegetage, Freitag vormittags Büro.
- **Halbtags-Woche:** Montag bis Freitag vormittags. In diese Woche gehören Erstberatungen, Einweisungen, Pflege- und Abo-Termine, Kleinaufträge und Büro.

| Posten | Stunden pro Jahr |
|---|---|
| Verfügbar (20 h × 44 Wochen) | 880 |
| Büro, Material, Partner | −130 |
| Sprechstunde (12 × 3 h) | −36 |
| Inhalte | −44 |
| Einweisungen, kleine Reparaturen | −60 |
| Puffer (ca. 10 %) | −90 |
| **Bleibt für Projekte** | **≈ 520** |

Ein Projekt (60 m², Vollleistung) braucht etwa 40 Stunden: 2 Erstberatungen à 4 Stunden plus rund 32 Stunden Verlegung. Das ergibt **13 Projekte**. Öffentlich werden **12 Projektplätze** versprochen, eines bleibt als Puffer. Abo-Termine gehen von diesem Budget ab, 20 Abos entsprechen etwa 2 Projekten.

Die Umsatzskizze aus der Session kam auf rund 66.000 € Rohertrag pro Jahr. Etwa ein Drittel davon entsteht ohne eigene Verlegezeit. Die Preise darin sind Platzhalter. Echte Preise werden erst im Admin gepflegt und bis dahin nicht veröffentlicht.

## 9. Abo-Modell

**Grundsatz:** Privatkunden schließen kein „Service-Abo“ aus dem Nichts ab. Sie tun es, wenn
1. es die große Anschaffung **sofort günstiger** macht (Rabatt auf die Verlegung),
2. es eine **Investition schützt**, die sie gerade getätigt haben,
3. das Muster bekannt ist: **„wie die Heizungswartung, nur für deinen Boden“**.

Deshalb gibt es das Privatkunden-Abo nur zusammen mit einem Projekt oder nach einer Erstinspektion. Das eigentliche Abo-Geschäft liegt beim **Gewerbe**.

| Abo | Für wen | Inhalt | Status |
|---|---|---|---|
| **Boden-Pass Plus** | Privatkunden | Nachölen alle 2 Jahre (halbtägiger Termin); bis zu 3 Ausbesserungen pro Jahr (kleine Dellen oder Kratzer bis zu einer festen Größe, z. B. 1 cm², einstellbar); Pflegeset passend zur Oberfläche; Vorrang bei Notfällen; Erinnerungen über den Boden-Pass | Start |
| **Rundum-sorglos (Gewerbe)** | Hausverwaltungen, Vermieter, Büros, Praxen, Kanzleien, Gastronomie, Läden, Ferienwohnungen | Pflege nach Plan, auch außerhalb der Öffnungszeiten; Kontingent für Ausbesserungen; feste Reaktionszeit; Zustandsprotokoll mit Fotos bei Mieterwechsel; Reserve-Material aus derselben Charge; eine planbare Rate pro m² und Monat | Start |
| **Rückendeckung** | Selbermacher | Monatlich, solange das Projekt läuft: Chat- und Video-Support, Foto-Check des Untergrunds vor dem Verlegen, Rabatt auf Werkzeugverleih | Start |
| **Werkstatt-Mitgliedschaft** | Handwerksbetriebe | Werkzeug-Flatrate, Planungshilfe, Einweisung für Mitarbeiter, Projektvermittlung | später |

**Rabatt auf die Verlegung:** Wer Boden-Pass Plus zusammen mit dem Projekt abschließt, zahlt weniger für die Verlegung (Prozentsatz im Admin einstellbar). Faustregel: Der Rabatt darf höchstens so groß sein wie der Deckungsbeitrag des Abos in der Mindestlaufzeit.

**Rechtliches beim Abo:**
- Für Privatkunden gilt eine Erstlaufzeit von höchstens 24 Monaten, danach monatlich kündbar.
- Bei Online-Abschluss ist ein Kündigungsbutton Pflicht, es gilt ein Widerrufsrecht von 14 Tagen.
- Formuliert wird es als **Pflege- und Wartungsvertrag mit Ausbesserungs-Kontingent**, nicht als „Versicherung“ oder „Garantie“. Die AGB soll ein Anwalt formulieren.
- Die Größengrenze für Ausbesserungen muss klar definiert sein.

## 10. Rechtliche Leitplanken

- **Handwerksrolle:** Parkettleger ist seit 2020 wieder meisterpflichtig, Bodenleger nicht.
  - **Ohne Meisterpflicht:** Beratung, Planung, Material- und Werkzeughandel, Einweisung, Laminat, Vinyl, Designbeläge. Fertigparkett mit Klicksystem ist meist möglich, muss aber bestätigt werden.
  - **In der Regel meisterpflichtig:** Massiv- und Stabparkett verkleben, Parkett schleifen und versiegeln, größere Parkettsanierungen. Diese Arbeiten übernimmt ein **Parkettleger-Meisterbetrieb als Partner**. Am saubersten beauftragt der Kunde den Partner direkt.
  - **Auf der Website nie für sich selbst verwenden:** „Parkettleger“, „Meister“, „Meisterbetrieb“.
- **Knappheit:** Kontingente müssen echt sein. Erfundene Knappheit steht im UWG auf der schwarzen Liste.
- **Gutschein-Bedingungen** müssen vorab klar sichtbar sein.
- **E-Mail und Sprechstunde:** Double-Opt-In, Newsletter-Einwilligung getrennt einholen.
- **Keine Rabatte gegen Bewertungen.** Rabatt gegen die Erlaubnis für Fotos ist in Ordnung.
- **Preise für Privatkunden** immer inklusive MwSt. (Preisangabenverordnung).
- **Impressum:** voller Name und Anschrift des Inhabers.

**Fragen an die Handwerkskammer:**
1. Darf ich als Bodenleger Fertigparkett verlegen, schwimmend und verklebt?
2. Wo liegt die Grenze zwischen Ausbessern und Pflege-Nachölen auf der einen Seite und Abschleifen und Versiegeln auf der anderen?
3. Darf ich Parkettverlegung als Generalunternehmer anbieten und an einen Meisterbetrieb weitergeben?
4. Darf der Firmenname „Parkett“ enthalten?
5. Bin ich im Verzeichnis der zulassungsfreien Handwerke korrekt eingetragen?
6. Welche Wege zur Berechtigung als Parkettleger gibt es für mich?

**Partner-Suche** (aktuell gibt es keine Partner): Kontakte über die Innung, die HWK-Betriebsbörse, Großhändler und Meister kurz vor dem Ruhestand. Das Angebot an den Partner: vorgeplante, vorqualifizierte Projekte plus Material. Bis ein Partner feststeht, bleiben Leistungen mit Meisterpflicht auf der Website ausgeblendet. Beim Großhandel Gewerbekonten eröffnen, die Konditionen wachsen mit dem gebündelten Volumen.

## 11. Name und Claim

- **Hauptclaim:** **„Da stehst du drauf.“**
- **Beschreibung unter dem Logo:** „Böden aus Naturmaterial: geplant, geliefert, verlegt. In NRW.“
- **Kriterien für die spätere Umbenennung:**
  - Der Name klingt nicht nach Parkettleger („Böden“ statt „Parkett“).
  - Er deckt alle Bodenarten ab und passt zum Claim.
  - Die .de-Domain ist frei.
  - Er ist kurz.

| Bereich | Zeile |
|---|---|
| Boden-Check | 7 Schritte zu deinem Boden. |
| Sprechstunde | Eine Stunde, die dir teure Fehler erspart. |
| Kontingent | Ich verlege nur 12 Böden im Jahr. Einen pro Monat. |
| Selbst machen | Du verlegst. Ich zeig dir, wie. |
| Partner | Bewirb dich. Ich arbeite nur mit Betrieben, die so genau sind wie ich. |
| Notfall | Wasserschaden? Foto schicken, Ruhe bewahren. |
| Boden-Pass | Jeden Tag gut drauf, auch in 20 Jahren. |
| Ratgeber | Worauf es ankommt. |

## 12. Inhalte und Werkzeuge der Website

### Boden-Check (7 Schritte)

| # | Schritt | Frage |
|---|---|---|
| 1 | Raum | Welche Räume bekommen einen neuen Boden? |
| 2 | Leben | Wer lebt auf dem Boden? (Kinder, Hund, Katze, Allergiker, Bürostuhl …) |
| 3 | Stil | Wie soll sich der Raum anfühlen? |
| 4 | Klima | Was muss der Boden aushalten? (Fußbodenheizung, Sonne, Feuchte, Trittschall) |
| 5 | Bestand | Was liegt heute drin? |
| 6 | Wer macht's | Wie viel willst du selbst machen? |
| 7 | Zeitplan | Wann soll es losgehen? Dazu die PLZ für den Check des Einzugsgebiets |

Das Ergebnis ist das Bodenprofil mit drei Empfehlungen und die Einladung zur Sprechstunde.

### Weitere Werkzeuge

- **Vorher/Nachher-Vergleich:** dieselbe Wohnung mit zwei Böden, getrennt durch einen verschiebbaren senkrechten Streifen. Später nur mit echten Projekten.
- **3D-Bodentypen:** Materialien und Verlegemuster zum Drehen.
- **„Kosten pro Jahr statt pro m²“:** Preis geteilt durch Lebensdauer. Wird erst eingeblendet, wenn Preise gepflegt sind.
- **Kontingent-Zähler:** live aus dem Admin-Kalender.

### Ratgeber-Säulen

1. **Was kann passieren?** Hund, Kinder, Rotwein, Bürostuhl, Wasser, Sonne, Fußbodenheizung.
2. **Welcher Boden wofür?** Raum für Raum und nach Lebenslage.
3. **Boden und Raumklima.** Nur belegbare Aussagen, keine Gesundheitsversprechen.
4. **Wert und Geld.** Lebensdauer, wie oft sich ein Boden abschleifen lässt, Werterhalt.
5. **Selbst machen.** Anleitungen, Werkzeug, typische Fehler.
6. **Aus der Werkstatt.** Bilder von der Werkbank-Kamera, Holzarten, Details.

### Sprechstunden-Plan 2027

| Monat | Thema |
|---|---|
| Januar | Parkett, Vinyl oder Laminat? |
| Februar | Fußbodenheizung und Holz |
| März | Frühjahrsprojekte planen |
| April | Selbst verlegen |
| Mai | Altbaudielen retten |
| Juni | Kinder, Hund, Rotwein |
| Juli | Vermieten: robust und wertsteigernd |
| August | Raumklima |
| September | Fischgrät und Co., mit Meisterpartner |
| Oktober | Pflege für 30 Jahre |
| November | Boden vor dem Verkauf |
| Dezember | Planung und Start des Kontingents 2028 |

## 13. Admin-Bereich („Werkbank“)

Der Admin-Bereich ist nach dem Login erreichbar. Alle Datensätze sind miteinander verknüpft. Technisch baut er auf dem Bereich `/studio` der Erstimplementierung auf, also Login, Benutzerverwaltung und 3D-Traumhaus. Die folgenden Module kommen dort als weitere Menüpunkte hinzu.

### Kalender (Kernstück)

- **Ansichten:** Jahr, Monat, Woche, Agenda. Die Übersicht zeigt auf den ersten Blick:
  - Projektplätze
  - Stunden der Woche im Vergleich zu 20 Stunden
  - nächster Urlaub mit Countdown
  - offene Anfragen
  - nächste Sprechstunde
  - eine Jahresleiste mit allen Wochen
- **Rhythmus-Ebene:** Jede Woche ist als Block- oder Halbtags-Woche gekennzeichnet, die geplanten Arbeitsfenster liegen als Hintergrund darunter. Außerdem gibt es eine Kapazitätsanzeige pro Woche mit Warnung bei Überbuchung.
- **Terminarten:**
  - Verlegung
  - Erstberatung
  - Einweisung
  - Sprechstunde
  - Werkzeug-Ausgabe und -Rückgabe
  - Material-Lieferung
  - Pflege und Abo
  - Partner
  - Büro
  - Urlaub
  - Feiertag NRW
- **Urlaub deutlich hervorgehoben:**
  - farbige Schraffur, im Jahresblick als durchgehendes Band
  - Countdown
  - Urlaubskonto: geplant, genommen, übrig
  - Brückentag-Tipps
  - Warnung, wenn ein Termin auf einen Urlaubstag fällt
- **Details mit einem Klick:** Das Seitenpanel zeigt einen Termin mit allen Verknüpfungen (Kunde, Projekt, Bodenprofil, Angebot, Material, Werkzeug, Sprechstunde, Gutschein, Boden-Pass, Abo). Jede Verknüpfung lässt sich weiter öffnen.
- **Feiertage NRW** werden automatisch berechnet. Schulferien werden nur mit geprüfter Datenquelle angezeigt.
- **Später:** Synchronisierung mit Google Kalender bzw. iCal.
- Der Kontingent-Zähler auf der Website speist sich aus diesem Kalender.

### Preise und Leistungen

- Jede Leistung hat eine Preisart (Festpreis, ab, pro m², pro Stunde, pro Tag, pro Monat, pro Jahr) und ein **optionales** Preisfeld.
- **Regel:** Eine Leistung wird immer angezeigt. Die Preiszeile erscheint **nur**, wenn ein Preis gesetzt und sichtbar ist. Ohne Preis erscheint auch kein „Preis auf Anfrage“.
- **Leistungen mit Meisterpflicht** bleiben ausgeblendet, solange kein Meisterpartner aktiv ist.
- **Abo-Rabatt auf die Verlegung (%):** „Verlegung X €“ und „mit Boden-Pass Plus Y €“ erscheinen nur, wenn beide Werte gesetzt sind.
- Privatkunden sehen Brutto-Preise, Partner netto.
- Einstellbar sind außerdem der Gutschein (Wert, Frist, Bedingungen), die Abo-Preise und die Mindestlaufzeiten.

### Einstellungen

- Kontingente: Projektplätze, Gründungs-Erstberatungen, Partnerplätze, Abo-Plätze
- Arbeitsrhythmus
- Urlaubskonto
- Einzugsgebiet
- Partnerliste
- PostHog-Projekt-URL

### PostHog

- In der Seitenleiste steht der Link „Analytics · PostHog ↗“. Die URL kommt aus den Einstellungen, ohne URL steht dort „nicht verbunden“.
- EU-Cloud nutzen und erst nach Einwilligung laden.
- **Tracking-Plan für den Trichter** (Event-Namen auf Englisch):
  - `floor_check_started`
  - `floor_check_step_completed` (`step`)
  - `floor_check_completed`
  - `floor_profile_requested`
  - `office_hours_registered`
  - `office_hours_attended`
  - `voucher_issued`
  - `voucher_redeemed`
  - `consultation_booked`
  - `project_application_submitted`
  - `partner_application_submitted`
  - `emergency_request_submitted`
  - `subscription_started` (`plan`)
  - `before_after_slider_used`

## 14. Design-Richtungen

Klickbare Vorschau: <https://claude.ai/artifact/Hmz3Q3JkUXWexvhzbHaWZx>. Das Artifact ist privat, bis es über das Teilen-Menü freigegeben wird.

| Richtung | Charakter | Schrift | Farben |
|---|---|---|---|
| **A · Aufmaß** (Empfehlung) | Der Tüftler mit Zollstock: technische Zeichnung, Bemaßungslinien, Aufmaß und Schriftfeld | Archivo (breit) und IBM Plex Mono | Estrich-Grau, Graphit, Kreideblau, Eiche |
| **B · Maserung** | Sinnlich und hochwertig: dunkles Nussbaum, große Holzflächen | Gloock und Hanken Grotesk | Nussbaum, Leinöl, geölte Eiche, Moos |
| **C · Fischgrät** | Modern und grafisch: Verlegemuster als Bildsprache, Vergleich ganz vorn | Bricolage Grotesque und Schibsted Grotesk | Tannengrün, Kalk, helle Eiche, Signalgelb |

Alle drei Richtungen enthalten dieselben Bausteine: Vorher/Nachher-Vergleich, Boden-Check, Kontingent-Anzeige, Einladung zur Sprechstunde und Ratgeber.

## 15. Offene Entscheidungen

1. Welche Design-Richtung: A, B, C oder eine Mischung?
2. Boden-Pass Plus: Größengrenze für Ausbesserungen, Pflegeintervall, Zielsegmente für Rundum-sorglos.
3. Termin bei der Handwerkskammer (Fragen siehe Kapitel 10).
4. Partner-Suche: erster Parkettleger-Meisterbetrieb.
5. Endgültiger Name (später).
6. Preise (später im Admin).
