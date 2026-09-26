import type { ParquetGeometry } from "./geometry";
import { WOODS, type WoodId } from "./woods";

const GRAIN = {
  faint: { opacity: 0.2, width: 0.6 },
  dark: { opacity: 0.34, width: 0.8 },
  light: { opacity: 0.32, width: 0.8 },
} as const;

/** The plank/grain/knot paths of a geometry, without the surrounding <svg>. */
export function ParquetPaths({ geometry: g, wood }: { geometry: ParquetGeometry; wood: WoodId }) {
  const tone = WOODS[wood];
  return (
    <>
      {g.planks.map((d, i) => (
        <path
          key={i}
          d={d}
          fill={tone.fills[i % tone.fills.length]}
          stroke={tone.seam}
          strokeOpacity={0.75}
          strokeWidth={g.seamWidth}
          strokeLinejoin="round"
          className="parquet-tone"
        />
      ))}
      {g.grainFaint && (
        <path
          d={g.grainFaint}
          fill="none"
          stroke={tone.grainDark}
          strokeOpacity={GRAIN.faint.opacity}
          strokeWidth={GRAIN.faint.width}
          className="parquet-tone"
        />
      )}
      {g.grainDark && (
        <path
          d={g.grainDark}
          fill="none"
          stroke={tone.grainDark}
          strokeOpacity={GRAIN.dark.opacity}
          strokeWidth={GRAIN.dark.width}
          className="parquet-tone"
        />
      )}
      {g.grainLight && (
        <path
          d={g.grainLight}
          fill="none"
          stroke={tone.grainLight}
          strokeOpacity={GRAIN.light.opacity}
          strokeWidth={GRAIN.light.width}
          className="parquet-tone"
        />
      )}
      {g.knots && <path d={g.knots} fill={tone.knot} fillOpacity={0.4} className="parquet-tone" />}
    </>
  );
}

interface ParquetSvgProps {
  geometry: ParquetGeometry;
  wood: WoodId;
  className?: string;
  /** Accessible name. Without it the graphic is treated as decorative. */
  title?: string;
  /** How the viewBox maps onto the element box (defaults to cover). */
  preserveAspectRatio?: string;
}

/** Renders a generated parquet geometry. Hook-free, so it works in server and client components. */
export function ParquetSvg({
  geometry: g,
  wood,
  className,
  title,
  preserveAspectRatio = "xMidYMid slice",
}: ParquetSvgProps) {
  const tone = WOODS[wood];
  return (
    <svg
      viewBox={`0 0 ${g.width} ${g.height}`}
      preserveAspectRatio={preserveAspectRatio}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <rect width={g.width} height={g.height} fill={tone.seam} className="parquet-tone" />
      <g transform={g.transform}>
        <ParquetPaths geometry={g} wood={wood} />
        {g.gapPath && (
          <path
            d={g.gapPath}
            fill="#17130f"
            stroke="#d8712c"
            strokeWidth={Math.max(1.2, g.seamWidth * 2.5)}
            strokeDasharray="6 5"
          />
        )}
      </g>
    </svg>
  );
}

/** Serialises a geometry to a standalone SVG string (for next/og image generation). */
export function parquetSvgMarkup(g: ParquetGeometry, wood: WoodId): string {
  const tone = WOODS[wood];
  const planks = g.planks
    .map(
      (d, i) =>
        `<path d="${d}" fill="${tone.fills[i % tone.fills.length]}" stroke="${tone.seam}" stroke-opacity="0.75" stroke-width="${g.seamWidth}" stroke-linejoin="round"/>`,
    )
    .join("");
  const grain = [
    g.grainFaint &&
      `<path d="${g.grainFaint}" fill="none" stroke="${tone.grainDark}" stroke-opacity="${GRAIN.faint.opacity}" stroke-width="${GRAIN.faint.width}"/>`,
    g.grainDark &&
      `<path d="${g.grainDark}" fill="none" stroke="${tone.grainDark}" stroke-opacity="${GRAIN.dark.opacity}" stroke-width="${GRAIN.dark.width}"/>`,
    g.grainLight &&
      `<path d="${g.grainLight}" fill="none" stroke="${tone.grainLight}" stroke-opacity="${GRAIN.light.opacity}" stroke-width="${GRAIN.light.width}"/>`,
    g.knots && `<path d="${g.knots}" fill="${tone.knot}" fill-opacity="0.4"/>`,
  ]
    .filter(Boolean)
    .join("");
  const transform = g.transform ? ` transform="${g.transform}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g.width} ${g.height}" width="${g.width}" height="${g.height}"><rect width="${g.width}" height="${g.height}" fill="${tone.seam}"/><g${transform}>${planks}${grain}</g></svg>`;
}
