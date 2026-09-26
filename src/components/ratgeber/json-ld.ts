import { siteConfig } from "@/config/site";
import { articlePath, pillarByKey, type Article } from "@/content/ratgeber";

const base = () => siteConfig.url.replace(/\/+$/, "");

/** schema.org Article for a Ratgeber page; the publisher points at the business entity on "/". */
export function articleJsonLd(article: Article) {
  const url = `${base()}${articlePath(article.slug)}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: article.title,
    description: article.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: "de-DE",
    datePublished: article.published,
    dateModified: article.updated,
    articleSection: pillarByKey(article.pillar).label,
    wordCount: article.wordCount,
    timeRequired: `PT${article.readingMinutes}M`,
    author: { "@type": "Person", name: siteConfig.owner, jobTitle: siteConfig.trade },
    publisher: {
      "@type": "HomeAndConstructionBusiness",
      "@id": `${base()}/#business`,
      name: siteConfig.name,
      logo: `${base()}/icon.svg`,
    },
  };
}

export function breadcrumbJsonLd(items: readonly { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${base()}${item.path}`,
    })),
  };
}
