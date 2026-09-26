import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/ratgeber/ArticleBody";
import { ArticleCard } from "@/components/ratgeber/ArticleCard";
import { ArticleCta } from "@/components/ratgeber/ArticleCta";
import { Breadcrumb } from "@/components/ratgeber/Breadcrumb";
import { DimensionLine } from "@/components/ratgeber/DimensionLine";
import { articleJsonLd, breadcrumbJsonLd } from "@/components/ratgeber/json-ld";
import { KurzGesagt } from "@/components/ratgeber/KurzGesagt";
import { TableOfContents } from "@/components/ratgeber/TableOfContents";
import { JsonLd } from "@/components/site/JsonLd";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { siteConfig } from "@/config/site";
import {
  ARTICLES,
  articlePath,
  formatArticleDate,
  getArticle,
  pillarByKey,
  relatedArticles,
  TOC_MIN_SECTIONS,
} from "@/content/ratgeber";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

// Every article is prerendered at build time (generateStaticParams). Unknown slugs end in
// notFound() below; `dynamicParams = false` would do the same but makes `next start` log an
// internal NoFallbackError for every such request.
export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  const path = articlePath(article.slug);
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      locale: "de_DE",
      siteName: siteConfig.name,
      title: article.title,
      description: article.description,
      url: path,
      publishedTime: article.published,
      modifiedTime: article.updated,
      section: pillarByKey(article.pillar).label,
      authors: [siteConfig.owner],
    },
    twitter: { card: "summary_large_image", title: article.title, description: article.description },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const pillar = pillarByKey(article.pillar);
  const related = relatedArticles(article);
  const showToc = article.sections.length >= TOC_MIN_SECTIONS;
  const sheet = ARTICLES.findIndex((item) => item.slug === article.slug) + 1;
  const path = articlePath(article.slug);

  return (
    <>
      <SiteHeader variant="solid" />
      <main id="main" className="bg-estrich pb-20 pt-28 text-graphit sm:pb-28 sm:pt-32 lg:pt-36">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
          <Breadcrumb
            items={[
              { label: "Start", href: "/" },
              { label: "Ratgeber", href: "/ratgeber" },
              { label: article.title },
            ]}
          />

          <article className="mt-10">
            <header className="max-w-4xl">
              <Link
                href={`/ratgeber#${pillar.key}`}
                className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-kreide underline decoration-transparent underline-offset-4 transition-colors hover:decoration-kreide sm:text-xs"
              >
                Thema {String(pillar.number).padStart(2, "0")} · {pillar.label}
              </Link>
              <h1 className="mt-4 font-wide text-[clamp(2rem,5.6vw,3.75rem)] font-extrabold leading-[1.02] tracking-[-0.015em] text-balance">
                {article.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-graphit-soft sm:text-xl">{article.teaser}</p>
              <p className="mt-7 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs uppercase tracking-[0.1em] text-graphit-muted">
                <span>{article.readingMinutes} Min. Lesezeit</span>
                <span>
                  Stand <time dateTime={article.updated}>{formatArticleDate(article.updated)}</time>
                </span>
              </p>
            </header>

            <DimensionLine label={`BLATT ${sheet} / ${ARTICLES.length} · M 1:1`} className="mt-8" />

            <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-x-16">
              <div className="min-w-0 max-w-[70ch] lg:col-start-1 lg:row-start-1">
                <KurzGesagt items={article.summary} />
              </div>

              {showToc ? (
                <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
                  <div className="lg:sticky lg:top-28">
                    <TableOfContents sections={article.sections} />
                  </div>
                </aside>
              ) : null}

              <div className="min-w-0 max-w-[70ch] lg:col-start-1 lg:row-start-2">
                <ArticleBody sections={article.sections} />
                <ArticleCta cta={article.cta} />
              </div>
            </div>
          </article>

          <section aria-labelledby="weiterlesen" className="mt-24 border-t border-graphit pt-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-kreide sm:text-xs">Ratgeber</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <h2 id="weiterlesen" className="font-semiwide text-[1.875rem] font-extrabold leading-tight sm:text-4xl">
                Weiterlesen
              </h2>
              <Link
                href="/ratgeber"
                className="font-medium text-kreide underline decoration-kreide/40 underline-offset-4 transition-colors hover:text-kreide-deep"
              >
                Alle Artikel
              </Link>
            </div>
            <ul className="mt-8 grid gap-5 md:grid-cols-3">
              {related.map((item) => (
                <li key={item.slug}>
                  <ArticleCard article={item} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
      <JsonLd data={articleJsonLd(article)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Start", path: "/" },
          { name: "Ratgeber", path: "/ratgeber" },
          { name: article.title, path },
        ])}
      />
    </>
  );
}
