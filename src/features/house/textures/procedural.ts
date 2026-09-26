import * as THREE from "three";
import { createRandom, fbm, type Random } from "../engine/random";

// All textures are generated at runtime on a canvas: no downloads, fully deterministic.
// Every texture is seamless so it can be repeated with world-space UVs.

export interface WoodTone {
  base: [number, number, number];
  variance: number;
}

export const WOOD_TONES = {
  oakNatural: { base: [196, 150, 101], variance: 22 },
  oakLight: { base: [214, 178, 134], variance: 18 },
  oakSmoked: { base: [120, 86, 58], variance: 18 },
  walnut: { base: [104, 70, 46], variance: 16 },
  teak: { base: [150, 102, 64], variance: 18 },
} satisfies Record<string, WoodTone>;

function createCanvas(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas not available");
  return { canvas, context };
}

function finishTexture(canvas: HTMLCanvasElement, color: boolean): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

const rgb = (r: number, g: number, b: number, a = 1) =>
  `rgba(${Math.round(Math.max(0, Math.min(255, r)))},${Math.round(Math.max(0, Math.min(255, g)))},${Math.round(
    Math.max(0, Math.min(255, b)),
  )},${a})`;

/** Paints one plank (in its local frame: x along the grain) with tone variation, grain and bevel. */
function paintPlank(
  context: CanvasRenderingContext2D,
  random: Random,
  tone: WoodTone,
  length: number,
  width: number,
  scale: number,
) {
  const shift = random.range(-tone.variance, tone.variance);
  const warm = random.range(-6, 6);
  const [r, g, b] = tone.base;
  context.fillStyle = rgb(r + shift + warm, g + shift, b + shift - warm);
  context.fillRect(0, 0, length, width);

  // Growth rings / grain: long, slightly wavy strokes.
  const lines = Math.round(width / (1.6 * scale)) + 4;
  for (let i = 0; i < lines; i++) {
    const y = random.range(0, width);
    const dark = random.next() < 0.6;
    context.strokeStyle = dark ? rgb(r - 55, g - 50, b - 40, random.range(0.05, 0.16)) : rgb(r + 40, g + 34, b + 26, 0.08);
    context.lineWidth = random.range(0.4, 1.4) * scale;
    context.beginPath();
    const amplitude = random.range(0.2, 1.4) * scale;
    const frequency = random.range(0.01, 0.04) / scale;
    const phase = random.range(0, Math.PI * 2);
    for (let x = 0; x <= length; x += 6 * scale) {
      const yy = y + Math.sin(x * frequency + phase) * amplitude;
      if (x === 0) context.moveTo(x, yy);
      else context.lineTo(x, yy);
    }
    context.stroke();
  }

  // Occasional knot.
  if (random.next() < 0.12) {
    const kx = random.range(length * 0.15, length * 0.85);
    const ky = random.range(width * 0.25, width * 0.75);
    const gradient = context.createRadialGradient(kx, ky, 0, kx, ky, width * 0.22);
    gradient.addColorStop(0, rgb(r - 80, g - 70, b - 55, 0.55));
    gradient.addColorStop(1, rgb(r - 80, g - 70, b - 55, 0));
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(kx, ky, width * 0.35, width * 0.18, 0, 0, Math.PI * 2);
    context.fill();
  }

  // Subtle bevel: darker joints, lighter top edge.
  context.strokeStyle = rgb(r - 90, g - 80, b - 65, 0.7);
  context.lineWidth = Math.max(1, 0.9 * scale);
  context.strokeRect(0, 0, length, width);
  context.strokeStyle = rgb(r + 50, g + 45, b + 35, 0.12);
  context.beginPath();
  context.moveTo(1, 1.5 * scale);
  context.lineTo(length - 1, 1.5 * scale);
  context.stroke();
}

/**
 * Herringbone parquet. Planks run at 0°/90° inside the tile; the material rotates UVs by 45°.
 * Lattice: H(k,m) = [kW + mL, +L] × [kW − mL, +W], V(k,m) = [kW + mL, +W] × [kW − mL + W, +L]
 * which is periodic with P = 2L in both axes, so the tile is seamless.
 */
export function createHerringboneTexture(options: { size: number; tone: WoodTone; seed?: number }) {
  const { size, tone } = options;
  const seed = options.seed ?? 7;
  const { canvas, context } = createCanvas(size);
  const ratio = 6; // plank length : width, e.g. 60 × 10 cm
  const length = size / 2; // period P = 2L
  const width = length / ratio;
  const scale = size / 1024;
  const mod = (value: number, n: number) => ((value % n) + n) % n;

  for (let m = -2; m <= 2; m++) {
    for (let k = -3 * ratio; k <= 3 * ratio; k++) {
      const hx = k * width + m * length;
      const hy = k * width - m * length;
      // (k, m) ~ (k + ratio, m ± 1) describe the same plank one tile further: canonical id keeps copies identical.
      const canonical = mod(k + ratio * mod(m, 2), 2 * ratio);
      for (const horizontal of [true, false]) {
        const x = hx;
        const y = horizontal ? hy : hy + width;
        const w = horizontal ? length : width;
        const h = horizontal ? width : length;
        if (x > size || y > size || x + w < 0 || y + h < 0) continue;
        context.save();
        if (horizontal) {
          context.translate(x, y);
        } else {
          context.translate(x + width, y);
          context.rotate(Math.PI / 2);
        }
        const plankRandom = createRandom(seed * 7919 + canonical * 104729 + (horizontal ? 1 : 2) * 1299709);
        paintPlank(context, plankRandom, tone, length, width, scale);
        context.restore();
      }
    }
  }
  return finishTexture(canvas, true);
}

/** Wide floor boards (Landhausdiele) or deck boards with staggered joints; seamless. */
export function createPlankTexture(options: {
  size: number;
  tone: WoodTone;
  rows: number;
  seed?: number;
  gap?: number;
}) {
  const { size, tone, rows } = options;
  const random = createRandom(options.seed ?? 11);
  const { canvas, context } = createCanvas(size);
  const rowHeight = size / rows;
  const scale = size / 1024;
  const gap = (options.gap ?? 0) * scale;

  context.fillStyle = rgb(tone.base[0] - 100, tone.base[1] - 90, tone.base[2] - 75);
  context.fillRect(0, 0, size, size);

  for (let row = 0; row < rows; row++) {
    // Two planks per row whose joint position varies; the row wraps horizontally.
    const joint = random.range(0.25, 0.75) * size;
    const offset = random.range(0, size);
    const segments = [
      [offset, joint],
      [offset + joint, size - joint],
    ];
    segments.forEach(([start, length], index) => {
      const plankSeed = (options.seed ?? 11) * 7919 + row * 104729 + index * 1299709;
      for (const shift of [-size, 0]) {
        context.save();
        context.translate(start! + shift, row * rowHeight + gap / 2);
        paintPlank(context, createRandom(plankSeed), tone, length!, rowHeight - gap, scale);
        context.restore();
      }
    });
  }
  return finishTexture(canvas, true);
}

/** Large format stone/porcelain tiles with soft veining. */
export function createStoneTileTexture(options: {
  size: number;
  base: [number, number, number];
  tilesX: number;
  tilesY: number;
  seed?: number;
  veins?: boolean;
}) {
  const { size, base, tilesX, tilesY } = options;
  const seed = options.seed ?? 5;
  const random = createRandom(seed);
  const { canvas, context } = createCanvas(size);
  const image = context.createImageData(size, size);
  const period = 8;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * period;
      const v = (y / size) * period;
      const cloud = fbm(u, v, 5, seed, period);
      let value = (cloud - 0.5) * 22;
      if (options.veins) {
        const vein = Math.abs(Math.sin((u * 0.9 + v * 0.45 + fbm(u * 1.5, v * 1.5, 4, seed + 3, period * 1.5) * 4) * 2.2));
        value -= Math.pow(1 - vein, 18) * 45;
      }
      const index = (y * size + x) * 4;
      image.data[index] = base[0] + value;
      image.data[index + 1] = base[1] + value;
      image.data[index + 2] = base[2] + value;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  // Per-tile tone shift + grout lines.
  const tileW = size / tilesX;
  const tileH = size / tilesY;
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const shade = random.range(-8, 8);
      context.fillStyle = shade > 0 ? `rgba(255,255,255,${shade / 255})` : `rgba(0,0,0,${-shade / 255})`;
      context.fillRect(tx * tileW, ty * tileH, tileW, tileH);
    }
  }
  context.strokeStyle = rgb(base[0] - 70, base[1] - 70, base[2] - 70, 0.55);
  context.lineWidth = Math.max(1, size / 700);
  for (let tx = 0; tx <= tilesX; tx++) {
    context.beginPath();
    context.moveTo(tx * tileW, 0);
    context.lineTo(tx * tileW, size);
    context.stroke();
  }
  for (let ty = 0; ty <= tilesY; ty++) {
    context.beginPath();
    context.moveTo(0, ty * tileH);
    context.lineTo(size, ty * tileH);
    context.stroke();
  }
  return finishTexture(canvas, true);
}

/** Fine-grained noise used as bump map for plaster/concrete and as detail for fabrics. */
export function createNoiseTexture(options: { size: number; seed?: number; scale?: number; contrast?: number }) {
  const { size } = options;
  const seed = options.seed ?? 3;
  const period = options.scale ?? 32;
  const contrast = options.contrast ?? 1;
  const { canvas, context } = createCanvas(size);
  const image = context.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = fbm((x / size) * period, (y / size) * period, 4, seed, period);
      const value = 128 + (n - 0.5) * 255 * contrast;
      const index = (y * size + x) * 4;
      image.data[index] = value;
      image.data[index + 1] = value;
      image.data[index + 2] = value;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  return finishTexture(canvas, false);
}

/** Board-formed concrete: soft clouds plus horizontal formwork lines. */
export function createConcreteTexture(options: { size: number; base: [number, number, number]; seed?: number }) {
  const { size, base } = options;
  const seed = options.seed ?? 21;
  const { canvas, context } = createCanvas(size);
  const image = context.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * 6;
      const v = (y / size) * 6;
      const cloud = fbm(u, v, 5, seed, 6) - 0.5;
      const pores = fbm(u * 12, v * 12, 2, seed + 9, 72) > 0.78 ? -18 : 0;
      const value = cloud * 26 + pores;
      const index = (y * size + x) * 4;
      image.data[index] = base[0] + value;
      image.data[index + 1] = base[1] + value;
      image.data[index + 2] = base[2] + value;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  context.strokeStyle = rgb(base[0] - 30, base[1] - 30, base[2] - 30, 0.35);
  context.lineWidth = Math.max(1, size / 512);
  for (let i = 1; i <= 4; i++) {
    context.beginPath();
    context.moveTo(0, (i * size) / 4 - 1);
    context.lineTo(size, (i * size) / 4 - 1);
    context.stroke();
  }
  return finishTexture(canvas, true);
}

/** Vertical timber slats with shadow gaps (facade cladding, soffit). */
export function createSlatTexture(options: { size: number; tone: WoodTone; slats: number; seed?: number }) {
  const { size, tone, slats } = options;
  const random = createRandom(options.seed ?? 31);
  const { canvas, context } = createCanvas(size);
  const slatWidth = size / slats;
  const scale = size / 1024;
  context.fillStyle = "#16110c";
  context.fillRect(0, 0, size, size);
  for (let i = 0; i < slats; i++) {
    context.save();
    context.translate(i * slatWidth + slatWidth * 0.12, size);
    context.rotate(-Math.PI / 2);
    paintPlank(context, random, tone, size, slatWidth * 0.76, scale);
    context.restore();
  }
  return finishTexture(canvas, true);
}

/** Tileable normal map for water ripples. */
export function createWaterNormalTexture(size: number) {
  const { canvas, context } = createCanvas(size);
  const image = context.createImageData(size, size);
  const period = 6;
  const height = (x: number, y: number) => fbm((x / size) * period, (y / size) * period, 4, 77, period);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = height((x + 1) % size, y) - height((x - 1 + size) % size, y);
      const dy = height(x, (y + 1) % size) - height(x, (y - 1 + size) % size);
      const index = (y * size + x) * 4;
      image.data[index] = 128 - dx * 900;
      image.data[index + 1] = 128 - dy * 900;
      image.data[index + 2] = 255;
      image.data[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  return finishTexture(canvas, false);
}

/** Palm leaflet alpha texture: a feather-shaped frond with individual leaflets. */
export function createFrondTexture(size: number) {
  const { canvas, context } = createCanvas(size);
  context.clearRect(0, 0, size, size);
  const random = createRandom(91);
  const mid = size / 2;
  context.strokeStyle = "#5c7a36";
  context.lineWidth = size / 90;
  context.beginPath();
  context.moveTo(mid, size);
  context.lineTo(mid, 0);
  context.stroke();
  const leaflets = 34;
  for (let i = 0; i < leaflets; i++) {
    const t = i / leaflets;
    const y = size * (1 - t * 0.98);
    const lengthFactor = Math.sin(Math.PI * Math.min(1, t * 1.15)) * 0.95 + 0.05;
    const leafLength = (size / 2) * lengthFactor;
    for (const side of [-1, 1]) {
      const green = 95 + random.range(-20, 25);
      context.fillStyle = `rgb(${50 + random.range(-10, 15)},${green + 30},${38 + random.range(-8, 10)})`;
      context.beginPath();
      context.moveTo(mid, y);
      context.quadraticCurveTo(mid + side * leafLength * 0.5, y - leafLength * 0.18, mid + side * leafLength, y - leafLength * 0.42);
      context.quadraticCurveTo(mid + side * leafLength * 0.5, y - leafLength * 0.08, mid, y + size / 70);
      context.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
