import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { ARTICLES, articlePath } from "@/content/ratgeber";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/+$/, "");
  const lastModified = new Date();
  const newestArticle = ARTICLES.reduce((latest, article) => (article.updated > latest ? article.updated : latest), "");
  return [
    { url: `${base}/`, lastModified, changeFrequency: "monthly", priority: 1 },
    {
      url: `${base}/ratgeber`,
      lastModified: newestArticle ? new Date(`${newestArticle}T00:00:00Z`) : lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...ARTICLES.map((article) => ({
      url: `${base}${articlePath(article.slug)}`,
      lastModified: new Date(`${article.updated}T00:00:00Z`),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    { url: `${base}/impressum`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/datenschutz`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
