import { bodenUndRaumklima } from "./articles/boden-und-raumklima";
import { fussbodenheizungUndHolz } from "./articles/fussbodenheizung-und-holz";
import { geoeltOderLackiert } from "./articles/geoelt-oder-lackiert";
import { hundKinderRotwein } from "./articles/hund-kinder-rotwein";
import { kostenProJahr } from "./articles/kosten-pro-jahr";
import { selbstVerlegen } from "./articles/selbst-verlegen";
import { welcherBodenWofuer } from "./articles/welcher-boden-wofuer";
import { PILLARS } from "./pillars";
import type { Article, ArticleBlock, ArticleSource, Pillar } from "./types";

export { PILLARS, pillarByKey } from "./pillars";
export { LINKS, articlePath } from "./links";
export type * from "./types";

/** Words per minute used for the reading time (calm reading of German prose). */
const WORDS_PER_MINUTE = 200;

/** Removes the inline markup (**bold**, [label](href)) and keeps the visible text. */
export function plainText(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, "");
}

export function countWords(text: string): number {
  const words = plainText(text).trim().split(/\s+/);
  return words.filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

function blockText(block: ArticleBlock): string[] {
  switch (block.type) {
    case "p":
      return [block.text];
    case "list":
      return [...block.items];
    case "table":
      return [block.caption, ...block.head, ...block.rows.flat()];
    case "note":
      return [block.label, block.text];
    case "calculator":
      return [];
  }
}

/** All visible article text: Kurz gesagt, sections and the closing CTA. */
export function articleText(article: ArticleSource): string[] {
  return [
    ...article.summary,
    ...article.sections.flatMap((section) => [section.heading, ...section.blocks.flatMap(blockText)]),
    article.cta.heading,
    article.cta.text,
  ];
}

function withReadingTime(source: ArticleSource): Article {
  const wordCount = articleText(source).reduce((sum, text) => sum + countWords(text), 0);
  return { ...source, wordCount, readingMinutes: Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE)) };
}

/**
 * All articles in display order. The landing page features the first three, so keep
 * `hund-kinder-rotwein`, `fussbodenheizung-und-holz` and `kosten-pro-jahr` at the top.
 */
export const ARTICLES: readonly Article[] = [
  hundKinderRotwein,
  fussbodenheizungUndHolz,
  kostenProJahr,
  welcherBodenWofuer,
  bodenUndRaumklima,
  selbstVerlegen,
  geoeltOderLackiert,
].map(withReadingTime);

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((article) => article.slug === slug);
}

export function articlesByPillar(): { pillar: Pillar; articles: Article[] }[] {
  return PILLARS.map((pillar) => ({
    pillar,
    articles: ARTICLES.filter((article) => article.pillar === pillar.key),
  }));
}

export function relatedArticles(article: Article, limit = 3): Article[] {
  const picked = article.related
    .map((slug) => getArticle(slug))
    .filter((item): item is Article => Boolean(item) && item?.slug !== article.slug);
  if (picked.length < limit) {
    for (const candidate of ARTICLES) {
      if (picked.length >= limit) break;
      if (candidate.slug !== article.slug && !picked.includes(candidate)) picked.push(candidate);
    }
  }
  return picked.slice(0, limit);
}

/** Articles with at least this many sections get a table of contents. */
export const TOC_MIN_SECTIONS = 4;

const dateFormat = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });

export function formatArticleDate(isoDate: string): string {
  return dateFormat.format(new Date(`${isoDate}T00:00:00Z`));
}
