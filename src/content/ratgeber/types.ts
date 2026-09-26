// Content model for the Ratgeber (concept chapter 12, "Ratgeber-Säulen").
// Articles are plain typed data so word count, reading time and structure can be checked in tests.
//
// Inline text supports two tiny markups, rendered without dangerouslySetInnerHTML:
//   **bold**            -> <strong>
//   [label](/path)      -> link (internal paths and #anchors only)

export type PillarKey =
  | "was-kann-passieren"
  | "welcher-boden-wofuer"
  | "raumklima"
  | "wert-und-geld"
  | "selbst-machen"
  | "werkstatt";

export interface Pillar {
  key: PillarKey;
  /** Position 1–6, as in the concept. */
  number: number;
  label: string;
  lead: string;
}

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: readonly string[]; ordered?: boolean }
  | {
      type: "table";
      caption: string;
      head: readonly string[];
      /** First cell of every row is the row header. */
      rows: readonly (readonly string[])[];
    }
  | { type: "note"; label: string; text: string }
  /** Embeds the interactive Kosten-pro-Jahr-Rechner. */
  | { type: "calculator" };

export interface ArticleSection {
  /** Anchor id, unique within the article. */
  id: string;
  heading: string;
  blocks: readonly ArticleBlock[];
}

export interface ArticleLink {
  label: string;
  href: string;
}

export interface ArticleCta {
  heading: string;
  text: string;
  primary: ArticleLink;
  secondary?: ArticleLink;
}

export interface ArticleSource {
  slug: string;
  title: string;
  pillar: PillarKey;
  /** One or two sentences for cards and the lead paragraph. */
  teaser: string;
  /** Meta description, at most 160 characters. */
  description: string;
  /** ISO dates (YYYY-MM-DD). */
  published: string;
  updated: string;
  /** "Kurz gesagt" box: the article in three to four sentences. */
  summary: readonly string[];
  sections: readonly ArticleSection[];
  cta: ArticleCta;
  /** Slugs of related articles, in display order. */
  related: readonly string[];
}

export interface Article extends ArticleSource {
  wordCount: number;
  readingMinutes: number;
}
