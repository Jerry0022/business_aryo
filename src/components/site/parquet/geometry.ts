/**
 * Deterministic, dependency-free parquet generator.
 *
 * Every pattern is described as a list of planks (parallelograms: origin + long edge + end edge).
 * Planks are grouped by tone bucket into a handful of compound SVG paths, so even a floor with
 * hundreds of planks stays a few kilobytes of markup. Only IEEE basic arithmetic (+ − × ÷ √) and an
 * integer PRNG are used, so server and client produce byte-identical output (safe for hydration).
 */

export type PatternId = "fischgraet" | "chevron" | "schiffsboden" | "landhausdiele" | "tafelparkett";

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
  /** Herringbone only: leave one plank out (used by the 404 page). */
  gap?: { i: number; j: number };
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

type ToView = (x: number, y: number) => Vec;
const identity: ToView = (x, y) => [x, y];

function plankPath({ p, e1, e2 }: Plank): string {
  return `M${fmt(p[0])} ${fmt(p[1])}${seg(e1[0], e1[1])}${seg(e2[0], e2[1])}${seg(-e1[0], -e1[1])}z`;
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

  private visible({ p, e1, e2 }: Plank, view: ToView): boolean {
    const m = 4;
    const corners = [
      view(p[0], p[1]),
      view(p[0] + e1[0], p[1] + e1[1]),
      view(p[0] + e2[0], p[1] + e2[1]),
      view(p[0] + e1[0] + e2[0], p[1] + e1[1] + e2[1]),
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

  add(plank: Plank, view: ToView | null = identity): void {
    if (view && !this.visible(plank, view)) return;
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

/** Classic herringbone: rectangular planks at 90°, rotated 45° so the spines run vertically. */
function herringbone(o: ParquetOptions, b: Builder): { transform: string; gapPath?: string } {
  const w = o.unit;
  const L = w * 6;
  const cx = o.width / 2;
  const cy = o.height / 2;
  const c = Math.SQRT1_2;
  const view: ToView = (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    return [cx + (dx - dy) * c, cy + (dx + dy) * c];
  };
  const jMax = Math.ceil((o.width / 2 + L) / (L * Math.SQRT2)) + 1;
  const iMax = Math.ceil((o.height / 2 + L) / (w * Math.SQRT2)) + 1;
  let gapPath: string | undefined;
  for (let j = -jMax; j <= jMax; j++) {
    for (let i = -iMax; i <= iMax; i++) {
      const ox = cx + i * w + j * L;
      const oy = cy + i * w - j * L;
      const horizontal: Plank = { p: [ox, oy], e1: [L, 0], e2: [0, w] };
      if (o.gap && o.gap.i === i && o.gap.j === j) {
        gapPath = plankPath(horizontal);
      } else {
        b.add(horizontal, view);
      }
      b.add({ p: [ox, oy + w], e1: [0, L], e2: [w, 0] }, view);
    }
  }
  return { transform: `rotate(45 ${fmt(cx)} ${fmt(cy)})`, gapPath };
}

/** French herringbone (chevron): planks with 45° mitred ends meeting on straight spines. */
function chevron(o: ParquetOptions, b: Builder): void {
  const w = o.unit;
  const cw = w * 4.2;
  const h = w * Math.SQRT2;
  const cols = Math.ceil(o.width / cw / 2) + 1;
  const nMin = Math.floor(-(cw + h) / h) - 1;
  const nMax = Math.ceil((o.height + cw) / h) + 1;
  for (let k = -cols; k <= cols; k++) {
    const x = o.width / 2 + k * cw;
    const odd = ((k % 2) + 2) % 2 === 1;
    for (let n = nMin; n <= nMax; n++) {
      const y = n * h + (odd ? cw : 0);
      b.add({ p: [x, y], e1: [cw, odd ? -cw : cw], e2: [0, h] });
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

/** Basket weave: square fields of parallel strips, alternating direction. */
function basket(o: ParquetOptions, b: Builder): void {
  const w = o.unit * 0.95;
  const strips = 4;
  const s = w * strips;
  const offX = ((o.width / 2) % s) - s;
  const offY = ((o.height / 2) % s) - s;
  for (let gy = 0; offY + gy * s < o.height; gy++) {
    for (let gx = 0; offX + gx * s < o.width; gx++) {
      const X = offX + gx * s;
      const Y = offY + gy * s;
      const horizontal = (gx + gy) % 2 === 0;
      for (let k = 0; k < strips; k++) {
        b.add(
          horizontal ? { p: [X, Y + k * w], e1: [s, 0], e2: [0, w] } : { p: [X + k * w, Y], e1: [0, s], e2: [w, 0] },
        );
      }
    }
  }
}

export function buildParquet(pattern: PatternId, options: ParquetOptions): ParquetGeometry {
  const o = { detail: true, seed: 1, ...options };
  const rand = mulberry32(o.seed);
  const u = o.unit;
  const knotChance = pattern === "landhausdiele" ? 0.4 : pattern === "schiffsboden" ? 0.05 : 0.03;
  const grainSpacing = pattern === "landhausdiele" ? u * 0.42 : u * 0.45;
  const b = new Builder(rand, o, knotChance, grainSpacing);

  let transform: string | undefined;
  let gapPath: string | undefined;
  switch (pattern) {
    case "fischgraet": {
      const r = herringbone(o, b);
      transform = r.transform;
      gapPath = r.gapPath;
      break;
    }
    case "chevron":
      chevron(o, b);
      break;
    case "schiffsboden":
      rows(o, b, rand, u * 0.9, u * 7, u * 15);
      break;
    case "landhausdiele":
      rows(o, b, rand, u * 2.7, u * 16, u * 30);
      break;
    case "tafelparkett":
      basket(o, b);
      break;
  }

  return {
    width: o.width,
    height: o.height,
    transform,
    planks: b.planks.map((list) => list.join("")),
    grainFaint: b.faint.join(""),
    grainDark: b.dark.join(""),
    grainLight: b.light.join(""),
    knots: b.knots.join(""),
    seamWidth: Math.max(0.5, u * 0.035),
    gapPath,
  };
}

export interface HerringboneTile extends ParquetGeometry {
  /** Edge length of the square, axis-aligned period (in unrotated pattern space). */
  tile: number;
  /** Offsets (pattern space) at which the tile must be repeated to cover width × height. */
  offsets: Array<readonly [number, number]>;
}

/**
 * Herringbone as one periodic tile plus repeat offsets, for large surfaces (hero floor).
 *
 * With L = 6w the herringbone lattice {i·(w,w) + j·(L,−L)} contains (12w, 0) and (0, 12w), so the
 * floor repeats every 12w·periods. Each plank is assigned to exactly one tile by its origin, which
 * means translated copies (<use>) interlock seamlessly without any clipping.
 */
export function buildHerringboneTile(options: ParquetOptions & { periods: number }): HerringboneTile {
  const o = { detail: true, seed: 1, ...options };
  const w = o.unit;
  const L = w * 6;
  const T = 12 * w * o.periods;
  const b = new Builder(mulberry32(o.seed), o, 0.015, w * 0.4);
  const mod = (v: number) => ((v % T) + T) % T;
  for (let j = 0; j < o.periods; j++) {
    for (let i = 0; i < 12 * o.periods; i++) {
      const ox = mod(i * w + j * L);
      const oy = mod(i * w - j * L);
      b.add({ p: [ox, oy], e1: [L, 0], e2: [0, w] }, null);
      b.add({ p: [ox, oy + w], e1: [0, L], e2: [w, 0] }, null);
    }
  }

  // Cover the view rectangle, rotated by 45° about its centre, with tile copies.
  const cx = o.width / 2;
  const cy = o.height / 2;
  const c = Math.SQRT1_2;
  const toPattern = (x: number, y: number): Vec => {
    const dx = x - cx;
    const dy = y - cy;
    return [cx + (dx + dy) * c, cy + (dy - dx) * c];
  };
  const corners = [toPattern(0, 0), toPattern(o.width, 0), toPattern(0, o.height), toPattern(o.width, o.height)];
  const xs = corners.map((p) => p[0]);
  const ys = corners.map((p) => p[1]);
  const reach = L + w;
  const offsets: Array<readonly [number, number]> = [];
  for (let a = Math.floor((Math.min(...xs) - reach) / T); a <= Math.floor(Math.max(...xs) / T); a++) {
    for (let d = Math.floor((Math.min(...ys) - reach) / T); d <= Math.floor(Math.max(...ys) / T); d++) {
      offsets.push([a * T, d * T]);
    }
  }

  return {
    width: o.width,
    height: o.height,
    transform: `rotate(45 ${fmt(cx)} ${fmt(cy)})`,
    planks: b.planks.map((list) => list.join("")),
    grainFaint: b.faint.join(""),
    grainDark: b.dark.join(""),
    grainLight: b.light.join(""),
    knots: b.knots.join(""),
    seamWidth: Math.max(0.5, w * 0.04),
    tile: T,
    offsets,
  };
}
