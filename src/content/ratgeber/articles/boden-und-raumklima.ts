import { LINKS } from "../links";
import type { ArticleSource } from "../types";

export const bodenUndRaumklima: ArticleSource = {
  slug: "boden-und-raumklima",
  title: "Was ein Holzboden fürs Raumklima tut – und was nicht",
  pillar: "raumklima",
  teaser:
    "Holz nimmt Feuchtigkeit auf und gibt sie wieder ab, fühlt sich warm an und lässt sich gut reinigen. Wunder vollbringt es nicht. Eine ehrliche Einordnung.",
  description:
    "Holzboden und Raumklima ehrlich eingeordnet: Feuchtigkeit, Fußwärme, Staub und Emissionen. Was belegbar ist und was nur Werbung.",
  published: "2026-09-26",
  updated: "2026-09-26",
  summary: [
    "Holz nimmt Feuchtigkeit aus der Luft auf und gibt sie wieder ab. Eine geölte, offenporige Oberfläche kann das in gewissem Maß, Lack schließt die Oberfläche stärker ab.",
    "Holz fühlt sich wärmer an als Fliese, weil es dem Fuß weniger Wärme entzieht. Die Raumtemperatur ändert das nicht.",
    "Glatte Böden lassen sich gut reinigen. Dass ein Boden Allergien heilt, behaupte ich nicht.",
    "Für gute Luft zählen emissionsarme Klebstoffe, Öle und Lacke, Lüften und eine vernünftige Luftfeuchte.",
  ],
  sections: [
    {
      id: "vorweg",
      heading: "Warum ich hier vorsichtig bin",
      blocks: [
        {
          type: "p",
          text: "Über Holz und Wohngesundheit wird viel versprochen. „Reguliert das Raumklima“, „gut für Allergiker“, „atmet“. Manches davon hat einen wahren Kern, vieles ist Werbung. Ich schreibe hier nur auf, was sich physikalisch erklären lässt oder was allgemein anerkannt ist, und sage dazu, wo die Grenzen sind.",
        },
      ],
    },
    {
      id: "feuchtigkeit",
      heading: "Feuchtigkeit: Holz puffert, ein bisschen",
      blocks: [
        {
          type: "p",
          text: "Holz ist hygroskopisch. Es nimmt Feuchtigkeit aus der Luft auf, wenn sie feucht ist, und gibt sie ab, wenn sie trocken ist. Deshalb bewegt sich ein Holzboden im Lauf des Jahres, und deshalb gibt es im Winter manchmal kleine Fugen.",
        },
        {
          type: "p",
          text: "Wie viel davon im Raum ankommt, hängt von der Oberfläche ab. Eine **geölte Oberfläche** ist offenporig, das Holz kann in gewissem Maß Feuchtigkeit austauschen. **Lack** bildet einen Film und schließt die Oberfläche stärker ab. Im Verhältnis zu Wänden, Möbeln, Textilien und vor allem zum Lüften ist der Beitrag des Bodens aber begrenzt. Einen Luftbefeuchter oder regelmäßiges Stoßlüften ersetzt er nicht.",
        },
        {
          type: "note",
          label: "Praxis",
          text: "Viele Hersteller empfehlen für Holzböden etwa 40 bis 60 Prozent relative Luftfeuchte. Dieser Bereich gilt auch für Menschen als angenehm. Ein Hygrometer zeigt dir, wo du stehst.",
        },
      ],
    },
    {
      id: "fusswaerme",
      heading: "Warm unter den Füßen",
      blocks: [
        {
          type: "p",
          text: "Barfuß auf Holz fühlt sich wärmer an als auf Fliese, auch wenn beide Böden genau gleich warm sind. Der Grund: Holz leitet Wärme schlechter als Stein und Keramik. Es zieht deinem Fuß also weniger Wärme ab. Das ist angenehm und der Grund, warum viele Menschen Holz „gemütlich“ finden. Die Raumtemperatur oder deine Heizkosten ändert das nicht. Auf einer Fußbodenheizung bremst Holz die Wärme sogar etwas, mehr dazu in [Fußbodenheizung und Holz](/ratgeber/fussbodenheizung-und-holz).",
        },
      ],
    },
    {
      id: "staub",
      heading: "Staub und Allergien",
      blocks: [
        {
          type: "p",
          text: "Auf glatten Böden bleibt Staub liegen, statt in Fasern zu verschwinden. Du siehst ihn schneller, und du kannst ihn feucht aufwischen. Deshalb raten Allergie-Ratgeber Menschen mit Hausstauballergie oft zu glatten Böden statt Teppich. Das gilt für Parkett genauso wie für Laminat, Vinyl oder Fliese.",
        },
        {
          type: "p",
          text: "Was ein Holzboden **nicht** tut: Er heilt keine Allergie, er filtert keine Luft, und er macht niemanden gesünder. Wenn du oder dein Kind Allergien habt, sprich mit eurer Ärztin oder eurem Arzt. Ich kann dir einen Boden bauen, der sich gut reinigen lässt und aus emissionsarmen Materialien besteht. Mehr verspreche ich nicht.",
        },
      ],
    },
    {
      id: "emissionen",
      heading: "Was in der Luft landet",
      blocks: [
        {
          type: "p",
          text: "Ein Boden besteht nicht nur aus Holz. Klebstoff, Grundierung, Spachtelmasse, Öl und Lack können flüchtige Stoffe abgeben, vor allem in den ersten Tagen und Wochen. Das ist kein Grund zur Panik, aber ein Grund, genau hinzuschauen:",
        },
        {
          type: "list",
          items: [
            "**Prüfzeichen:** Der Blaue Engel oder EMICODE EC1 für Verlegewerkstoffe stehen für geprüft emissionsarme Produkte.",
            "**Lüften:** Nach dem Verlegen und nach dem Ölen gut lüften. Natürliche Öle riechen ein paar Tage, bis sie ausgehärtet sind.",
            "**Weniger ist mehr:** Ein schwimmend verlegter Boden braucht keinen Klebstoff. Ob das zu deinem Raum passt, ist eine andere Frage.",
          ],
        },
        {
          type: "p",
          text: "Laminat und Vinyl sind keine Naturmaterialien. Das heißt nicht, dass sie schlecht für die Luft sind, aber hier gilt dasselbe: Nach Prüfzeichen fragen und nicht auf „Öko“ auf der Verpackung verlassen.",
        },
      ],
    },
    {
      id: "fazit",
      heading: "Was bleibt",
      blocks: [
        {
          type: "p",
          text: "Ein Holzboden fühlt sich warm an, lässt sich gut reinigen und puffert Feuchtigkeit in bescheidenem Maß, geölt etwas mehr als lackiert. Für ein gutes Raumklima sorgen aber vor allem Lüften, eine vernünftige Luftfeuchte und emissionsarme Materialien. Wer dir mehr verspricht, sollte das belegen können.",
        },
      ],
    },
  ],
  cta: {
    heading: "Allergiker im Haushalt?",
    text: "Sag es mir im Boden-Check in Schritt 2. Ich berücksichtige das bei der Empfehlung, mit ehrlichen Aussagen statt Versprechen.",
    primary: { label: "Boden-Check starten", href: LINKS.bodenCheck },
    secondary: { label: "Zur Boden-Sprechstunde", href: LINKS.sprechstunde },
  },
  related: ["geoelt-oder-lackiert", "welcher-boden-wofuer", "fussbodenheizung-und-holz"],
};
