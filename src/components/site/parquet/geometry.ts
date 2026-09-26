/**
 * Deterministic, dependency-free parquet generator.
 *
 * Every pattern is described as a list of planks (parallelograms: origin + long edge + end edge).
 * Planks are grouped by tone bucket into a handful of compound SVG paths, so even a floor with
 * hundreds of planks stays a few kilobytes of markup. Only IEEE basic arithmetic (+ − × ÷ √) and an
 * integer PRNG are used, so server and client produce byte-identical output (safe for hydration).
 */

export type PatternId = "schiffsboden" | "landhausdiele";

export const TONE_BUCKETS = 6;

type Vec = readonly [number, number];

interface Plank {
  /** Origin corner. */
  p: Vec;
  /** Long edge (grain direction). */
  e1: Vec;
  /** End edge (plank width). */
  e2: Vec;
}

export interface ParquetOptions {
  width: number;
  height: number;
  /** Base plank width in viewBox units. */
  unit: number;
  seed?: number;
  /** Grain lines and knots. Disable for tiny thumbnails. */
  detail?: boolean;
  /** Run the planks top to bottom instead of left to right (e.g. a floor receding into the view). */
  vertical?: boolean;
  /** Leave out the plank that covers this point, in unrotated coordinates (used by the 404 page). */
  gap?: { x: number; y: number };
}

export interface ParquetGeometry {
  width: number;
  height: number;
  transform?: string;
  /** One compound path per tone bucket. */
  planks: string[];
  grainFaint: string;
  grainDark: string;
  grainLight: string;
  knots: string;
  seamWidth: number;
  /** Outline of the omitted plank, if `gap` was requested. */
  gapPath?: string;
}

/** Small, fast, seedable PRNG (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fmt = (n: number): string => {
  const r = Math.round(n * 10) / 10;
  return r === 0 ? "0" : String(r);
};

const seg = (x: number, y: number): string => {
  if (y === 0) return `h${fmt(x)}`;
  if (x === 0) return `v${fmt(y)}`;
  return `l${fmt(x)} ${fmt(y)}`;
};

const len = (v: Vec): number => Math.sqrt(v[0] * v[0] + v[1] * v[1]);

function plankPath({ p, e1, e2 }: Plank): string {
  return `M${fmt(p[0])} ${fmt(p[1])}${seg(e1[0], e1[1])}${seg(e2[0], e2[1])}${seg(-e1[0], -e1[1])}z`;
}

/** Whether the point lies inside the plank (parallelogram p + s·e1 + t·e2, 0 ≤ s, t ≤ 1). */
function covers({ p, e1, e2 }: Plank, { x, y }: { x: number; y: number }): boolean {
  const det = e1[0] * e2[1] - e1[1] * e2[0];
  if (det === 0) return false;
  const dx = x - p[0];
  const dy = y - p[1];
  const s = (dx * e2[1] - dy * e2[0]) / det;
  const t = (e1[0] * dy - e1[1] * dx) / det;
  return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}

class Builder {
  readonly planks: string[][] = Array.from({ length: TONE_BUCKETS }, () => []);
  readonly faint: string[] = [];
  readonly dark: string[] = [];
  readonly light: string[] = [];
  readonly knots: string[] = [];

  constructor(
    private readonly rand: () => number,
    private readonly opts: ParquetOptions,
    private readonly knotChance: number,
    private readonly grainSpacing: number,
  ) {}

  private visible({ p, e1, e2 }: Plank): boolean {
    const m = 4;
    const corners: Vec[] = [
      [p[0], p[1]],
      [p[0] + e1[0], p[1] + e1[1]],
      [p[0] + e2[0], p[1] + e2[1]],
      [p[0] + e1[0] + e2[0], p[1] + e1[1] + e2[1]],
    ];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y] of corners) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    return maxX > -m && minX < this.opts.width + m && maxY > -m && minY < this.opts.height + m;
  }

  /** Outline of the plank omitted because it covers `opts.gap`. */
  gapPath: string | undefined;

  add(plank: Plank): void {
    if (!this.visible(plank)) return;
    if (this.opts.gap && this.gapPath === undefined && covers(plank, this.opts.gap)) {
      this.gapPath = plankPath(plank);
      return;
    }
    const r = this.rand;
    const bucket = Math.min(TONE_BUCKETS - 1, Math.floor(r() * TONE_BUCKETS));
    this.planks[bucket]!.push(plankPath(plank));
    if (this.opts.detail === false) return;

    const { p, e1, e2 } = plank;
    const width = len(e2);
    const lines = Math.max(1, Math.round(width / this.grainSpacing));
    for (let g = 0; g < lines; g++) {
      const t = (g + 0.2 + r() * 0.6) / lines;
      const start = r() * 0.3;
      const span = Math.min(0.97 - start, 0.35 + r() * 0.65);
      const bow = (r() - 0.5) * 0.6;
      const sx = p[0] + e2[0] * t + e1[0] * start;
      const sy = p[1] + e2[1] * t + e1[1] * start;
      const dx = e1[0] * span;
      const dy = e1[1] * span;
      const bx = (e2[0] / lines) * bow;
      const by = (e2[1] / lines) * bow;
      const d = `M${fmt(sx)} ${fmt(sy)}q${fmt(dx / 2 + bx)} ${fmt(dy / 2 + by)} ${fmt(dx)} ${fmt(dy)}`;
      const k = r();
      (k < 0.55 ? this.faint : k < 0.85 ? this.dark : this.light).push(d);
    }

    const axisAligned = e1[0] === 0 || e1[1] === 0;
    if (axisAligned && r() < this.knotChance) {
      const u = 0.15 + r() * 0.7;
      const v = 0.3 + r() * 0.4;
      const cx = p[0] + e1[0] * u + e2[0] * v;
      const cy = p[1] + e1[1] * u + e2[1] * v;
      const along = width * 0.26 * (0.6 + r() * 0.8);
      const across = width * 0.085 * (0.7 + r() * 0.6);
      if (e1[1] === 0) {
        this.knots.push(
          `M${fmt(cx - along)} ${fmt(cy)}a${fmt(along)} ${fmt(across)} 0 1 0 ${fmt(2 * along)} 0a${fmt(along)} ${fmt(across)} 0 1 0 ${fmt(-2 * along)} 0z`,
        );
      } else {
        this.knots.push(
          `M${fmt(cx)} ${fmt(cy - along)}a${fmt(across)} ${fmt(along)} 0 1 0 0 ${fmt(2 * along)}a${fmt(across)} ${fmt(along)} 0 1 0 0 ${fmt(-2 * along)}z`,
        );
      }
    }
  }
}

/** Running rows with random lengths ("wilder Verband"). */
function rows(o: ParquetOptions, b: Builder, rand: () => number, w: number, min: number, max: number): void {
  for (let y = ((o.height % w) - w) / 2 - w / 2; y < o.height; y += w) {
    let x = -rand() * max;
    while (x < o.width) {
      const l = min + rand() * (max - min);
      b.add({ p: [x, y], e1: [l, 0], e2: [0, w] });
      x += l;
    }
  }
}

export function buildParquet(pattern: PatternId, options: ParquetOptions): ParquetGeometry {
  const o = { detail: true, seed: 1, ...options };
  if (o.vertical) {
    // Lay the rows out in a transposed box, then turn them upright.
    const rotated = buildParquet(pattern, { ...o, vertical: false, width: o.height, height: o.width });
    return {
      ...rotated,
      width: o.width,
      height: o.height,
      transform: `translate(${fmt(o.width)} 0) rotate(90)`,
    };
  }
  const rand = mulberry32(o.seed);
  const u = o.unit;
  const knotChance = pattern === "landhausdiele" ? 0.4 : 0.05;
  const grainSpacing = pattern === "landhausdiele" ? u * 0.42 : u * 0.45;
  const b = new Builder(rand, o, knotChance, grainSpacing);

  switch (pattern) {
    case "schiffsboden":
      rows(o, b, rand, u * 0.9, u * 7, u * 15);
      break;
    case "landhausdiele":
      rows(o, b, rand, u * 2.7, u * 16, u * 30);
      break;
  }

  return {
    width: o.width,
    height: o.height,
    planks: b.planks.map((list) => list.join("")),
    grainFaint: b.faint.join(""),
    grainDark: b.dark.join(""),
    grainLight: b.light.join(""),
    knots: b.knots.join(""),
    seamWidth: Math.max(0.5, u * 0.035),
    gapPath: b.gapPath,
  };
}
