import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/** Web app manifest: makes the site installable (see src/features/pwa and docs/PWA.md). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: siteConfig.title,
    short_name: "Aryo Parkett",
    description: siteConfig.description,
    lang: "de",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#17130f",
    theme_color: "#17130f",
    categories: ["business", "lifestyle"],
    icons: [
      { src: "/app-icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Angebot anfragen", short_name: "Anfrage", url: "/#kontakt" },
      { name: "Muster entdecken", short_name: "Muster", url: "/#muster" },
    ],
  };
}
