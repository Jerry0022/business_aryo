import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { articlePath, pillarByKey, type Article } from "@/content/ratgeber";

interface ArticleCardProps {
  article: Article;
  /** Heading level inside the surrounding outline. */
  headingLevel?: "h2" | "h3";
  /** Hide the pillar eyebrow when the card sits under its pillar heading already. */
  showPillar?: boolean;
}

/** Card for the Ratgeber index and "Weiterlesen": the whole card is one link target. */
export function ArticleCard({ article, headingLevel: Heading = "h3", showPillar = true }: ArticleCardProps) {
  const pillar = pillarByKey(article.pillar);
  return (
    <article className="group relative flex h-full flex-col gap-3.5 rounded-2xl border border-fuge bg-creme p-6 transition-colors hover:border-kupfer sm:p-7">
      <p className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.1em]">
        {showPillar ? <span className="text-kupfer">{pillar.label}</span> : null}
        <span className="text-nuss-muted">{article.readingMinutes} Min. Lesezeit</span>
      </p>
      <Heading className="font-display text-xl font-semibold leading-snug text-nuss sm:text-[1.375rem]">
        <Link
          href={articlePath(article.slug)}
          className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-kupfer"
        >
          {article.title}
        </Link>
      </Heading>
      <p className="text-[0.95rem] leading-relaxed text-nuss-soft">{article.teaser}</p>
      <span
        aria-hidden="true"
        className="mt-auto inline-flex items-center gap-2 pt-2 text-[0.95rem] font-semibold text-kupfer transition-colors group-hover:text-kupfer-deep"
      >
        Weiterlesen
        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.6} />
      </span>
    </article>
  );
}
