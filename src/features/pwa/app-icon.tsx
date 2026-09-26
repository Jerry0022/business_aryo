import { ImageResponse } from "next/og";
import { LOGO_ACCENT, LOGO_DIMENSION_PATH, LOGO_PLANK_SIZE, LOGO_PLANKS } from "@/components/site/logo-data";

export type AppIconVariant = "any" | "maskable" | "apple";

const SCREED = "#efe6d6";
/** Visual centre of the logo mark (planks x 1–29 plus the dimension line up to x 36, y 3–27). */
const MARK_CENTER = { x: 18.5, y: 15 } as const;
/** `maskable` keeps the mark inside the 80 % safe circle; `apple` leaves room for iOS' rounded corners. */
const MARK_SCALE: Record<AppIconVariant, number> = { any: 0.8, apple: 0.72, maskable: 0.66 };

/**
 * Logo mark as app icon on linen. `any` keeps the rounded tile of the favicon; `maskable` and `apple`
 * fill the whole square (the OS applies its own mask).
 */
export function appIconSvg(variant: AppIconVariant): string {
  const tile = variant === "any" ? `rx="6"` : "";
  const planks = LOGO_PLANKS.map(
    ([x, y, fill]) =>
      `<rect x="${x}" y="${y}" width="${LOGO_PLANK_SIZE.width}" height="${LOGO_PLANK_SIZE.height}" fill="${fill}"/>`,
  ).join("");
  const mark = `<g transform="translate(18 18) scale(${MARK_SCALE[variant]}) translate(${-MARK_CENTER.x} ${-MARK_CENTER.y})">${planks}<path d="${LOGO_DIMENSION_PATH}" stroke="${LOGO_ACCENT}" stroke-width="1.5" fill="none"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36"><rect width="36" height="36" ${tile} fill="${SCREED}"/>${mark}</svg>`;
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
