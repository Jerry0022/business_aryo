import { ImageResponse } from "next/og";
import { logoSvgMarkup } from "@/components/site/logo-data";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} – ${siteConfig.trade} in NRW: ${siteConfig.claim}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const toDataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

// Direction A "Aufmaß": screed grey, drawing grid, chalk-blue dimension line, oak planks.
const COLORS = {
  estrich: "#e4e3de",
  blatt: "#f7f7f4",
  graphit: "#22252a",
  muted: "#5b5e64",
  strich: "#b9b7b0",
  kreide: "#2d5ba8",
  eiche: "#c0894a",
  eicheDeep: "#a8713a",
};

function drawingSvg(): string {
  const grid = Array.from({ length: 27 }, (_, i) => `<path d="M${i * 24} 0V630" />`).join("");
  const rows = Array.from({ length: 27 }, (_, i) => `<path d="M0 ${i * 24}H1200" />`).join("");
  // Floor plan fragment on the right: herringbone living room, planks, dimension lines.
  const planks = Array.from({ length: 9 }, (_, i) => {
    const y = 150 + i * 36;
    const offset = i % 2 === 0 ? 0 : 60;
    return Array.from({ length: 4 }, (_, j) => {
      const x = 800 + offset + j * 120 - 60;
      const fill = (i + j) % 3 === 0 ? COLORS.eicheDeep : COLORS.eiche;
      return `<rect x="${x}" y="${y}" width="120" height="36" fill="${fill}" stroke="#8c5a2a" stroke-width="1"/>`;
    }).join("");
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="${COLORS.estrich}"/>
    <g stroke="${COLORS.graphit}" stroke-opacity="0.05" stroke-width="1">${grid}${rows}</g>
    <defs><clipPath id="room"><rect x="800" y="150" width="330" height="324"/></clipPath></defs>
    <g clip-path="url(#room)">${planks}</g>
    <rect x="800" y="150" width="330" height="324" fill="none" stroke="${COLORS.graphit}" stroke-width="5"/>
    <g stroke="${COLORS.kreide}" fill="none">
      <path d="M800 140V100M1130 140V100M790 150H750M790 474H750" stroke-width="1.5" stroke-dasharray="5 4"/>
      <path d="M800 112H1130M762 150V474" stroke-width="2"/>
      <path d="M792 120L808 104M1122 120L1138 104M754 158L770 142M754 482L770 466" stroke-width="2.5"/>
    </g>
  </svg>`;
}

// The root segment has no dynamic params, so the (Promise-based) `params` prop is not needed here.
export default async function OpenGraphImage() {
  const drawing = toDataUri(drawingSvg());
  const logo = toDataUri(logoSvgMarkup());

  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", position: "relative", background: COLORS.estrich }}>
      <img src={drawing} width={1200} height={630} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
      <div
        style={{
          position: "absolute",
          left: 937,
          top: 98,
          display: "flex",
          padding: "0 10px",
          background: COLORS.estrich,
          color: COLORS.kreide,
          fontSize: 20,
          letterSpacing: 2,
        }}
      >
        3,30 m
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 740,
          height: "100%",
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <img src={logo} width={72} height={60} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 32, color: COLORS.graphit, letterSpacing: 3 }}>{siteConfig.name.toUpperCase()}</div>
            <div style={{ fontSize: 18, color: COLORS.muted, letterSpacing: 4, marginTop: 6 }}>
              {`${siteConfig.trade.toUpperCase()} · NRW`}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, color: COLORS.kreide, fontSize: 18, letterSpacing: 3 }}>
            <div style={{ width: 2, height: 26, background: COLORS.kreide }} />
            <div style={{ width: 110, height: 2, background: COLORS.kreide }} />
            DU LÄUFST JEDEN TAG DARAUF.
            <div style={{ width: 110, height: 2, background: COLORS.kreide }} />
            <div style={{ width: 2, height: 26, background: COLORS.kreide }} />
          </div>
          <div style={{ fontSize: 112, lineHeight: 0.95, color: COLORS.graphit, letterSpacing: -3, marginTop: 18 }}>Da stehst</div>
          <div style={{ fontSize: 112, lineHeight: 0.95, color: COLORS.graphit, letterSpacing: -3 }}>du drauf.</div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: COLORS.muted }}>{siteConfig.tagline}</div>
      </div>
    </div>,
    size,
  );
}
