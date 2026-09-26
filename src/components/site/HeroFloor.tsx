import { buildParquet } from "./parquet/geometry";
import { ParquetPaths } from "./parquet/ParquetSvg";
import { WOODS } from "./parquet/woods";

// Wide oak boards running away from the viewer. Deterministic (fixed seed), rendered on the server.
const floor = buildParquet("landhausdiele", { width: 3200, height: 1800, unit: 13, seed: 11, vertical: true });

/** Plank floor receding into the hero, lit by drifting window light. Purely decorative. */
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
            <ParquetPaths geometry={floor} wood="eiche-natur" />
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
