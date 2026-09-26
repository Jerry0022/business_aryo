import { buildHerringboneTile } from "./parquet/geometry";
import { ParquetPaths } from "./parquet/ParquetSvg";
import { WOODS } from "./parquet/woods";

// One periodic herringbone tile, repeated with <use>. Deterministic (fixed seed), rendered on the server.
const floor = buildHerringboneTile({ width: 3200, height: 1800, unit: 16, periods: 3, seed: 11 });
const TILE_ID = "hero-floor-tile";

/** Herringbone floor receding into the hero, lit by drifting window light. Purely decorative. */
export function HeroFloor() {
  return (
    <div className="hero-floor" aria-hidden="true">
      <div className="hero-floor__plane">
        <svg
          viewBox={`0 0 ${floor.width} ${floor.height}`}
          preserveAspectRatio="xMidYMid slice"
          className="hero-floor__wood"
          focusable="false"
        >
          <rect width={floor.width} height={floor.height} fill={WOODS["eiche-natur"].seam} />
          <g transform={floor.transform}>
            <g id={TILE_ID}>
              <ParquetPaths geometry={floor} wood="eiche-natur" />
            </g>
            {floor.offsets.map(([x, y]) =>
              x === 0 && y === 0 ? null : <use key={`${x}:${y}`} href={`#${TILE_ID}`} x={x} y={y} />,
            )}
          </g>
        </svg>
        <div className="hero-floor__window">
          <span />
          <span />
          <span />
        </div>
        <div className="hero-floor__sheen" />
        <div className="hero-floor__shade" />
      </div>
      <div className="hero-floor__horizon" />
    </div>
  );
}
