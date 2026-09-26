import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { ARTICLES, getArticle, pillarByKey } from "@/content/ratgeber";

export const alt = `Ratgeber von ${siteConfig.name}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }));
}

// Werkstatt colours (see globals.css): linen, walnut, copper, oak.
const LEINEN = "#efe6d6";
const CREME = "#f8f1e4";
const NUSS = "#231913";
const MUTED = "#6b5646";
const KUPFER = "#9a4418";
const EICHE = "#c0894a";
const EICHE_DEEP = "#a8713a";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  const title = article.title;
  const eyebrow = `RATGEBER · ${pillarByKey(article.pillar).label.toUpperCase()}`;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: "64px 72px",
        background: LEINEN,
        color: NUSS,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 3, color: KUPFER }}>{eyebrow}</div>
        {/* dimension line */}
        <div style={{ display: "flex", position: "relative", width: 640, height: 26, marginTop: 34 }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 2, height: 26, background: KUPFER }} />
          <div style={{ position: "absolute", right: 0, top: 0, width: 2, height: 26, background: KUPFER }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 12, height: 2, background: KUPFER }} />
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 26,
            fontSize: title.length > 48 ? 64 : 76,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -1.5,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", position: "relative", width: 64, height: 54 }}>
            <div style={{ position: "absolute", left: 0, top: 4, width: 36, height: 11, background: EICHE }} />
            <div style={{ position: "absolute", left: 14, top: 21, width: 36, height: 11, background: EICHE_DEEP }} />
            <div style={{ position: "absolute", left: 0, top: 38, width: 36, height: 11, background: EICHE }} />
            <div style={{ position: "absolute", left: 58, top: 4, width: 3, height: 45, background: KUPFER }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 800, letterSpacing: 2 }}>
              {siteConfig.name.toUpperCase()}
            </div>
            <div style={{ display: "flex", fontSize: 18, letterSpacing: 3, color: MUTED, marginTop: 4 }}>
              {`${siteConfig.trade.toUpperCase()} · NRW`}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            padding: "12px 20px",
            background: CREME,
            border: `2px solid ${NUSS}`,
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          {siteConfig.claim}
        </div>
      </div>
    </div>,
    size,
  );
}
