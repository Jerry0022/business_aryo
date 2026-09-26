import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/** Web app manifest: makes the site installable (see src/features/pwa and docs/PWA.md). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: siteConfig.title,
    short_name: siteConfig.name,
    description: siteConfig.description,
    lang: "de",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#efe6d6",
    theme_color: "#231913",
    categories: ["business", "lifestyle"],
    icons: [
      { src: "/app-icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Boden-Check", short_name: "Boden-Check", url: "/#boden-check" },
      { name: "Ratgeber", short_name: "Ratgeber", url: "/ratgeber" },
      { name: "Kontakt", short_name: "Kontakt", url: "/#kontakt" },
    ],
  };
}
