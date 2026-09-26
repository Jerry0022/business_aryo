/** Three herringbone plank pairs stacked along the spine: reads as parquet and as a stylised "A". */
export const LOGO_PLANKS: ReadonlyArray<readonly [points: string, fill: string]> = [
  ["17.41,3.45 25.55,11.58 22.72,14.41 14.59,6.28", "#e8c28c"],
  ["14.59,6.28 17.41,9.11 9.28,17.24 6.45,14.41", "#c99352"],
  ["17.41,9.11 25.55,17.24 22.72,20.07 14.59,11.93", "#dca565"],
  ["14.59,11.93 17.41,14.76 9.28,22.89 6.45,20.07", "#b57a3e"],
  ["17.41,14.76 25.55,22.89 22.72,25.72 14.59,17.59", "#d8712c"],
  ["14.59,17.59 17.41,20.42 9.28,28.55 6.45,25.72", "#a0602a"],
];

/** Standalone SVG markup of the logo mark (used for generated images). */
export function logoSvgMarkup(): string {
  const planks = LOGO_PLANKS.map(
    ([points, fill]) =>
      `<polygon points="${points}" fill="${fill}" stroke="#17130f" stroke-width="0.6" stroke-linejoin="round"/>`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" rx="8" fill="#17130f"/>${planks}</svg>`;
}
