/** Five rows of long, staggered floorboards (one copper board): a plank floor seen from above. */
export const LOGO_PLANKS: ReadonlyArray<readonly [points: string, fill: string]> = [
  ["5.5,7.3 18.4,7.3 18.4,10.3 5.5,10.3", "#e8c28c"],
  ["19,7.3 26.5,7.3 26.5,10.3 19,10.3", "#c99352"],
  ["5.5,10.9 9.4,10.9 9.4,13.9 5.5,13.9", "#b57a3e"],
  ["10,10.9 26.5,10.9 26.5,13.9 10,13.9", "#dca565"],
  ["5.5,14.5 21.4,14.5 21.4,17.5 5.5,17.5", "#d8712c"],
  ["22,14.5 26.5,14.5 26.5,17.5 22,17.5", "#e8c28c"],
  ["5.5,18.1 13.4,18.1 13.4,21.1 5.5,21.1", "#dca565"],
  ["14,18.1 26.5,18.1 26.5,21.1 14,21.1", "#a0602a"],
  ["5.5,21.7 23.4,21.7 23.4,24.7 5.5,24.7", "#c99352"],
  ["24,21.7 26.5,21.7 26.5,24.7 24,24.7", "#dca565"],
];

/** Standalone SVG markup of the logo mark (used for generated images). */
export function logoSvgMarkup(): string {
  const planks = LOGO_PLANKS.map(
    ([points, fill]) =>
      `<polygon points="${points}" fill="${fill}" stroke="#17130f" stroke-width="0.6" stroke-linejoin="round"/>`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" rx="8" fill="#17130f"/>${planks}</svg>`;
}
