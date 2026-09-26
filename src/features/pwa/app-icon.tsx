import { ImageResponse } from "next/og";
import { LOGO_PLANKS } from "@/components/site/logo-data";

export type AppIconVariant = "any" | "maskable" | "apple";

/**
 * Logo mark as app icon. `any` keeps the rounded tile of the favicon; `maskable` and `apple` fill the whole
 * square (the OS applies its own mask) and shrink the planks into the safe zone.
 */
export function appIconSvg(variant: AppIconVariant): string {
  const scale = variant === "any" ? 1 : variant === "maskable" ? 0.78 : 0.86;
  const offset = 16 * (1 - scale);
  const tile = variant === "any" ? `rx="7"` : "";
  const planks = LOGO_PLANKS.map(
    ([points, fill]) =>
      `<polygon points="${points}" fill="${fill}" stroke="#17130f" stroke-width="0.6" stroke-linejoin="round"/>`,
  ).join("");
  // The planks sit slightly above centre in the 32×32 logo; nudge them down to balance the icon.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" ${tile} fill="#17130f"/><g transform="translate(${offset} ${offset + 0.1 * scale}) scale(${scale})">${planks}</g></svg>`;
}

export function appIconResponse(variant: AppIconVariant, size: number): ImageResponse {
  const src = `data:image/svg+xml;base64,${Buffer.from(appIconSvg(variant)).toString("base64")}`;
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse (Satori), not the browser */}
      <img src={src} width={size} height={size} alt="" />
    </div>,
    { width: size, height: size },
  );
}
