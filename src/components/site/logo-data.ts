/** Logo mark: three staggered oak planks with a copper dimension line (direction "Werkstatt"). */
export const LOGO_VIEWBOX = { width: 36, height: 30 } as const;

export const LOGO_PLANKS: ReadonlyArray<readonly [x: number, y: number, fill: string]> = [
  [1, 3, "#c0894a"],
  [9, 12, "#a8713a"],
  [1, 21, "#c0894a"],
];

export const LOGO_PLANK_SIZE = { width: 20, height: 6 } as const;

/** Vertical dimension line with end ticks, right of the planks. */
export const LOGO_DIMENSION_PATH = "M33 3v24M30 3h6M30 27h6";

export const LOGO_ACCENT = "#9a4418";

/** Standalone SVG markup of the logo mark (used for generated images). */
export function logoSvgMarkup(): string {
  const planks = LOGO_PLANKS.map(
    ([x, y, fill]) =>
      `<rect x="${x}" y="${y}" width="${LOGO_PLANK_SIZE.width}" height="${LOGO_PLANK_SIZE.height}" fill="${fill}"/>`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}" width="${LOGO_VIEWBOX.width * 4}" height="${LOGO_VIEWBOX.height * 4}">${planks}<path d="${LOGO_DIMENSION_PATH}" stroke="${LOGO_ACCENT}" stroke-width="1.5" fill="none"/></svg>`;
}
