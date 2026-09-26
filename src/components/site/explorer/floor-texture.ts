import * as THREE from "three";
import type { MaterialId } from "../content";
import { buildParquet, type ParquetGeometry, type PatternId } from "../parquet/geometry";
import { WOODS, type WoodId, type WoodTone } from "../parquet/woods";

// Textures for the 3D floor sample, painted from the same polygons as the SVG previews
// (buildParquet). Everything is generated in the browser, nothing is downloaded.

export const SAMPLE = { width: 1.6, depth: 1 } as const;

/** Board thickness per material, exaggerated so the layers are visible. */
export const THICKNESS: Record<MaterialId, number> = { parkett: 0.07, laminat: 0.05, vinyl: 0.035 };

const TEXTURE = { width: 1024, height: 640, scale: 2 } as const;

const UNITS: Record<PatternId, number> = {
  schiffsboden: 32,
  landhausdiele: 34,
};

/** Laminate and vinyl are printed: less variation between the boards than real wood. */
function printedTone(tone: WoodTone, amount: number): WoodTone {
  const channels = tone.fills.map((hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)));
  const mean = [0, 1, 2].map((c) => channels.reduce((sum, rgb) => sum + (rgb[c] ?? 0), 0) / channels.length);
  const fills = channels.map((rgb) => {
    const mixed = rgb.map((value, c) => Math.round(value + ((mean[c] ?? value) - value) * amount));
    return `#${mixed.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
  }) as unknown as WoodTone["fills"];
  return { ...tone, fills };
}

function toneFor(material: MaterialId, wood: WoodId): WoodTone {
  const tone = WOODS[wood];
  if (material === "laminat") return printedTone(tone, 0.6);
  if (material === "vinyl") return printedTone(tone, 0.75);
  return tone;
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas not available");
  return { canvas, context };
}

function applyTransform(context: CanvasRenderingContext2D, transform: string | undefined) {
  const match = transform?.match(/rotate\(([-\d.]+) ([-\d.]+) ([-\d.]+)\)/);
  if (!match) return;
  const [, angle = "0", cx = "0", cy = "0"] = match;
  context.translate(Number(cx), Number(cy));
  context.rotate((Number(angle) * Math.PI) / 180);
  context.translate(-Number(cx), -Number(cy));
}

function geometryFor(pattern: PatternId, material: MaterialId): ParquetGeometry {
  const plankPattern: PatternId = material === "parkett" ? pattern : "landhausdiele";
  const unit = material === "vinyl" ? 30 : material === "laminat" ? 36 : UNITS[plankPattern];
  return buildParquet(plankPattern, { width: TEXTURE.width, height: TEXTURE.height, unit, seed: 7 });
}

function finish(canvas: HTMLCanvasElement, color: boolean, anisotropy: number) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

export interface FloorTextures {
  map: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
  side: THREE.CanvasTexture;
  dispose: () => void;
}

export function createFloorTextures(
  pattern: PatternId,
  wood: WoodId,
  material: MaterialId,
  anisotropy = 4,
): FloorTextures {
  const g = geometryFor(pattern, material);
  const tone = toneFor(material, wood);
  const { width, height, scale } = TEXTURE;

  // Colour map
  const color = createCanvas(width * scale, height * scale);
  const c = color.context;
  c.scale(scale, scale);
  c.fillStyle = tone.seam;
  c.fillRect(0, 0, width, height);
  c.save();
  applyTransform(c, g.transform);
  g.planks.forEach((d, index) => {
    if (!d) return;
    const path = new Path2D(d);
    c.fillStyle = tone.fills[index % tone.fills.length] ?? tone.fills[0];
    c.fill(path);
    c.globalAlpha = 0.7;
    c.strokeStyle = tone.seam;
    c.lineWidth = g.seamWidth * 1.2;
    c.lineJoin = "round";
    c.stroke(path);
    c.globalAlpha = 1;
  });
  const grainAlpha = material === "parkett" ? 1 : 0.7;
  const strokes: [string, string, number, number][] = [
    [g.grainFaint, tone.grainDark, 0.22 * grainAlpha, 0.7],
    [g.grainDark, tone.grainDark, 0.34 * grainAlpha, 0.9],
    [g.grainLight, tone.grainLight, 0.3 * grainAlpha, 0.9],
  ];
  for (const [d, colour, alpha, lineWidth] of strokes) {
    if (!d) continue;
    c.globalAlpha = alpha;
    c.strokeStyle = colour;
    c.lineWidth = lineWidth;
    c.stroke(new Path2D(d));
  }
  if (g.knots && material === "parkett") {
    c.globalAlpha = 0.4;
    c.fillStyle = tone.knot;
    c.fill(new Path2D(g.knots));
  }
  c.restore();

  // Bump map: grooves along every seam (laminate and vinyl get a visible bevel).
  const bumpCanvas = createCanvas(width, height);
  const b = bumpCanvas.context;
  b.fillStyle = "#ffffff";
  b.fillRect(0, 0, width, height);
  b.save();
  applyTransform(b, g.transform);
  b.strokeStyle = "#000000";
  b.lineWidth = material === "parkett" ? g.seamWidth * 2.2 : g.seamWidth * 3.5;
  for (const d of g.planks) if (d) b.stroke(new Path2D(d));
  if (g.grainDark) {
    b.globalAlpha = material === "parkett" ? 0.25 : 0.1;
    b.lineWidth = 1;
    b.stroke(new Path2D(g.grainDark));
  }
  b.restore();

  // Side: the layer structure of the board, top to bottom.
  const layers: [number, string][] =
    material === "parkett"
      ? [
          [0.3, tone.fills[0]],
          [0.5, "#e2cc9c"],
          [0.2, "#cdb688"],
        ]
      : material === "laminat"
        ? [
            [0.07, tone.fills[0]],
            [0.85, "#8a7660"],
            [0.08, "#5d5146"],
          ]
        : [
            [0.14, tone.fills[0]],
            [0.66, "#d3d1cb"],
            [0.2, "#6c7264"],
          ];
  const sideCanvas = createCanvas(64, 128);
  const s = sideCanvas.context;
  let y = 0;
  for (const [share, colour] of layers) {
    const h = share * 128;
    s.fillStyle = colour;
    s.fillRect(0, y, 64, h);
    s.fillStyle = "rgba(0,0,0,0.25)";
    s.fillRect(0, y + h - 1, 64, 1);
    y += h;
  }
  if (material === "parkett") {
    s.fillStyle = "rgba(90,60,30,0.18)";
    for (let x = 4; x < 64; x += 9) s.fillRect(x, 128 * 0.3, 1, 128 * 0.5);
  }

  const map = finish(color.canvas, true, anisotropy);
  const bump = finish(bumpCanvas.canvas, false, anisotropy);
  const side = finish(sideCanvas.canvas, true, 1);
  return {
    map,
    bump,
    side,
    dispose: () => {
      map.dispose();
      bump.dispose();
      side.dispose();
    },
  };
}
