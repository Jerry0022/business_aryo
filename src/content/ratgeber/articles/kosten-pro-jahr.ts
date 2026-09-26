import { LINKS } from "../links";
import type { ArticleSource } from "../types";

export const kostenProJahr: ArticleSource = {
  slug: "kosten-pro-jahr",
  title: "Kosten pro Jahr statt pro Quadratmeter",
  pillar: "wert-und-geld",
  teaser: "Ein Boden, der doppelt so lange hält, darf mehr kosten. So rechnest du ehrlich, mit Rechner zum Selbst-Ausprobieren.",
  description:
    "Warum der Preis pro m² allein wenig sagt: Kosten pro m² und Jahr aus Preis, Lebensdauer und Pflege berechnen. Mit Rechner für bis zu drei Böden.",
  published: "2026-09-26",
  updated: "2026-09-26",
  summary: [
    "Der Preis pro Quadratmeter sagt nur, was du heute zahlst. Wichtiger ist, was dich der Boden pro Jahr kostet.",
    "Die Rechnung: Preis inklusive Verlegung geteilt durch die Lebensdauer, plus Pflege pro Jahr.",
    "Rechne mit der Zeit, die du den Boden nutzt. Wer in fünf Jahren auszieht, hat von 30 Jahren Haltbarkeit wenig.",
    "Die Lebensdauer ist eine Schätzung. Parkett lässt sich abschleifen, Laminat und Vinyl nicht.",
  ],
  sections: [
    {
      id: "warum",
      heading: "Warum der Quadratmeterpreis täuscht",
      blocks: [
        {
          type: "p",
          text: "Im Baumarkt und in fast jedem Angebot steht ein Preis pro Quadratmeter. Der ist leicht zu vergleichen, sagt aber nur, was du heute bezahlst. Ob ein Boden günstig war, weißt du erst, wenn du ihn wieder rausreißt. Ein Boden, der doppelt so viel kostet und dreimal so lange hält, ist pro Jahr günstiger. Das klingt banal. Entschieden wird trotzdem meistens nach dem Preisschild.",
        },
      ],
    },
    {
      id: "rechnung",
      heading: "Die Rechnung",
      blocks: [
        {
          type: "note",
          label: "Formel",
          text: "Kosten pro m² und Jahr = Preis pro m² inklusive Verlegung ÷ Lebensdauer in Jahren + Pflege pro m² und Jahr",
        },
        {
          type: "p",
          text: "Mehr ist es nicht. Die Kunst liegt darin, ehrliche Zahlen einzusetzen. Drei Stellen, an denen man sich gern etwas vormacht:",
        },
        {
          type: "list",
          items: [
            "**Der Preis:** Rechne alles ein, was einmal anfällt: Material, Unterlage, Sockelleisten, Übergangsprofile, Untergrund vorbereiten, alten Belag entfernen und entsorgen, Verlegung. Ein günstiger Boden auf einem Untergrund, der erst aufwendig ausgeglichen werden muss, ist nicht mehr günstig.",
            "**Die Lebensdauer:** Nimm nicht die Zahl vom Karton, sondern das, was bei deiner Nutzung realistisch ist. Eine Garantiezeit ist keine Lebensdauer.",
            "**Die Pflege:** Reinigungsmittel, Pflegeöl, Filzgleiter, vielleicht ein Pflegetermin. Bei geölten Böden kommt das Nachölen dazu, bei lackierten irgendwann das Abschleifen und Neuversiegeln.",
          ],
        },
      ],
    },
    {
      id: "rechner",
      heading: "Rechne selbst",
      blocks: [
        {
          type: "p",
          text: "Trag für zwei oder drei Böden ein, was du weißt, zum Beispiel aus Angeboten, die du schon hast. Der Rechner zeigt dir die Kosten pro Quadratmeter und Jahr im direkten Vergleich. Deine Zahlen bleiben in deinem Browser, gespeichert oder gesendet wird nichts.",
        },
        { type: "calculator" },
      ],
    },
    {
      id: "nutzungsdauer",
      heading: "Deine Zeit zählt, nicht die des Bodens",
      blocks: [
        {
          type: "p",
          text: "Ein Punkt, den viele Rechnungen unterschlagen: Rechne mit der Zeit, die **du** den Boden nutzt. Wohnst du zur Miete und ziehst in fünf Jahren weiter, teilst du den Preis durch fünf, egal wie lange der Boden danach noch hält. Dann kann ein einfacher Klick-Boden die ehrlichere Wahl sein. Das sage ich dir auch so.",
        },
        {
          type: "p",
          text: "Im eigenen Haus sieht das anders aus. Ein Holzboden, der gepflegt ist und sich auffrischen lässt, kann beim Verkauf oder Vermieten ein Argument sein. Einen festen Betrag dafür kann dir niemand seriös nennen. Mit einem Boden-Pass, in dem Holzart, Oberfläche, Verlegedatum und Pflege dokumentiert sind, kannst du den Zustand aber belegen.",
        },
      ],
    },
    {
      id: "abschleifen",
      heading: "Abschleifen: das zweite Leben",
      blocks: [
        {
          type: "p",
          text: "Parkett hat einen Vorteil, den Laminat und Vinyl nicht haben: Wenn die Oberfläche durch ist, kann man es abschleifen und neu ölen oder versiegeln. Wie oft das geht, hängt von der **Nutzschicht** ab, also der Edelholzschicht oben. Bei Massivparkett ist die Reserve groß, bei Mehrschichtparkett hängt sie von der Stärke dieser Schicht ab. Frag beim Kauf nach der Nutzschichtstärke in Millimetern. Steht sie nicht im Datenblatt, ist das auch eine Antwort.",
        },
        {
          type: "p",
          text: "Jeder Schliff kostet aber Geld und ein paar Tage, in denen der Raum nicht nutzbar ist. Das Schleifen übernimmt ein Parkettleger-Meisterbetrieb als Partner. Im Rechner kannst du es als Pflegekosten einplanen oder die Lebensdauer entsprechend länger ansetzen, nur bitte nicht beides.",
        },
      ],
    },
    {
      id: "was-nicht-drinsteht",
      heading: "Was in keiner Rechnung steht",
      blocks: [
        {
          type: "p",
          text: "Wie sich ein Boden anfühlt, wie er klingt und ob du dich jeden Morgen darüber freust, steht in keiner Tabelle. Das darf mitentscheiden. Die Rechnung soll dir nur zeigen, was es dich pro Jahr kostet, damit du weißt, wofür du bezahlst.",
        },
      ],
    },
  ],
  cta: {
    heading: "Du willst mit echten Zahlen rechnen?",
    text: "Im Boden-Check findest du heraus, welche Böden zu deinem Leben passen. Bei der Erstberatung vor Ort messe ich auf, prüfe den Untergrund und wir rechnen mit deinen Zahlen.",
    primary: { label: "Boden-Check starten", href: LINKS.bodenCheck },
    secondary: { label: "Zur Boden-Sprechstunde", href: LINKS.sprechstunde },
  },
  related: ["geoelt-oder-lackiert", "welcher-boden-wofuer", "hund-kinder-rotwein"],
};
