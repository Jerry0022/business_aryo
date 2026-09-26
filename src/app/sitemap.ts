import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url.replace(/\/+$/, "");
  const lastModified = new Date();
  return [
    { url: `${base}/`, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/impressum`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/datenschutz`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
