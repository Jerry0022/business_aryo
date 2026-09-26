import { ImageResponse } from "next/og";
import { logoSvgMarkup } from "@/components/site/logo-data";
import { buildParquet } from "@/components/site/parquet/geometry";
import { parquetSvgMarkup } from "@/components/site/parquet/ParquetSvg";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} – ${siteConfig.trade}: Parkett mit Handschrift`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const toDataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

// The root segment has no dynamic params, so the (Promise-based) `params` prop is not needed here.
export default async function OpenGraphImage() {
  const floor = toDataUri(
    parquetSvgMarkup(
      buildParquet("landhausdiele", { width: 600, height: 630, unit: 16, seed: 11, vertical: true }),
      "eiche-natur",
    ),
  );
  const logo = toDataUri(logoSvgMarkup());

  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#17130f", position: "relative" }}>
      <img src={floor} width={600} height={630} alt="" style={{ position: "absolute", right: 0, top: 0 }} />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: 600,
          height: 630,
          display: "flex",
          backgroundImage:
            "linear-gradient(90deg, #17130f 0%, rgba(23,19,15,0.55) 35%, rgba(23,19,15,0) 70%), radial-gradient(80% 60% at 70% 30%, rgba(255,226,182,0.22), rgba(255,226,182,0) 70%)",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 760,
          height: "100%",
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <img src={logo} width={64} height={64} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, color: "#f8f4ed", letterSpacing: -0.5 }}>{siteConfig.name}</div>
            <div style={{ fontSize: 16, color: "#deb27c", letterSpacing: 5, marginTop: 4 }}>
              {siteConfig.trade.toUpperCase()}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 92, lineHeight: 1, color: "#f8f4ed", letterSpacing: -3 }}>Parkett mit</div>
          <div style={{ fontSize: 92, lineHeight: 1.05, color: "#d8712c", letterSpacing: -3 }}>Handschrift.</div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "rgba(248,244,237,0.72)" }}>
          Verlegen · Schleifen · Ölen · Montage
        </div>
      </div>
    </div>,
    size,
  );
}
