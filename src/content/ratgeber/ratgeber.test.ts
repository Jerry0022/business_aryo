import { describe, expect, it } from "vitest";
import { ARTICLES, articleText, articlesByPillar, countWords, getArticle, PILLARS, relatedArticles } from ".";

const SLUGS = [
  "hund-kinder-rotwein",
  "fussbodenheizung-und-holz",
  "kosten-pro-jahr",
  "welcher-boden-wofuer",
  "boden-und-raumklima",
  "selbst-verlegen",
  "geoelt-oder-lackiert",
];

// Words the owner must never use for himself (concept chapter 10). "Parkettleger-Meisterbetrieb"
// is allowed, because it always names the partner, never the owner.
const FORBIDDEN = [/\bMeisterbetrieb\b(?<!Parkettleger-Meisterbetrieb)/, /\bich bin (ein )?(Parkettleger|Meister)/i, /Meisterbetrieb Maximilian/i];

describe("Ratgeber content", () => {
  it("has exactly the seven agreed articles, the featured three first", () => {
    expect(ARTICLES.map((article) => article.slug)).toEqual(SLUGS);
  });

  it("keeps every article between 500 and 900 words", () => {
    for (const article of ARTICLES) {
      expect(article.wordCount, article.slug).toBeGreaterThanOrEqual(500);
      expect(article.wordCount, article.slug).toBeLessThanOrEqual(900);
      expect(article.readingMinutes, article.slug).toBeGreaterThanOrEqual(3);
    }
  });

  it("has a Kurz-gesagt box, a closing CTA, unique anchors and a short meta description", () => {
    for (const article of ARTICLES) {
      expect(article.summary.length, article.slug).toBeGreaterThanOrEqual(3);
      expect(article.cta.primary.href, article.slug).toMatch(/^\/(#|ratgeber)/);
      expect(article.description.length, article.slug).toBeLessThanOrEqual(160);
      const ids = article.sections.map((section) => section.id);
      expect(new Set(ids).size, article.slug).toBe(ids.length);
      expect(article.updated >= article.published, article.slug).toBe(true);
    }
  });

  it("only links to existing articles and internal anchors", () => {
    for (const article of ARTICLES) {
      for (const slug of article.related) expect(getArticle(slug), `${article.slug} → ${slug}`).toBeDefined();
      for (const text of articleText(article)) {
        for (const [, href] of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
          expect(href, article.slug).toMatch(/^\/(#[a-z-]+|ratgeber\/[a-z-]+)$/);
          if (href?.startsWith("/ratgeber/")) expect(getArticle(href.slice("/ratgeber/".length)), href).toBeDefined();
        }
      }
      expect(relatedArticles(article)).toHaveLength(3);
      expect(relatedArticles(article).some((item) => item.slug === article.slug)).toBe(false);
    }
  });

  it("covers all six pillars", () => {
    expect(PILLARS).toHaveLength(6);
    for (const group of articlesByPillar()) expect(group.articles.length, group.pillar.label).toBeGreaterThan(0);
  });

  it("embeds the calculator in the cost article only", () => {
    const withCalculator = ARTICLES.filter((article) =>
      article.sections.some((section) => section.blocks.some((block) => block.type === "calculator")),
    );
    expect(withCalculator.map((article) => article.slug)).toEqual(["kosten-pro-jahr"]);
  });

  it("never calls the owner Parkettleger or Meisterbetrieb", () => {
    for (const article of ARTICLES) {
      const text = [article.title, article.teaser, article.description, ...articleText(article)].join("\n");
      for (const pattern of FORBIDDEN) expect(text, `${article.slug}: ${pattern}`).not.toMatch(pattern);
    }
  });

  it("counts words without markup", () => {
    expect(countWords("**Kurz** gesagt: [Boden-Check](/#boden-check) – 7 Schritte.")).toBe(5);
  });
});
