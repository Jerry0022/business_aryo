import { CLIFF_EDGE_Z, POOL } from "../data/plan";
import { clamp, createRandom, fbm, lerp, smoothstep } from "./random";

export const VALLEY_Y = -240;
/** Plateau lawn sits a few centimeters below decks and floors. */
export const PLATEAU_Y = -0.04;
export const CITY = { centerX: 150, centerZ: -1750, radiusX: 1500, radiusZ: 820 } as const;

/** Signed distance to the rounded plateau rectangle (negative inside). */
function plateauDistance(x: number, z: number): number {
  const cx = 0;
  const cz = 2;
  const halfX = 25;
  const halfZ = 16.6;
  const radius = 7;
  const qx = Math.abs(x - cx) - (halfX - radius);
  const qz = Math.abs(z - cz) - (halfZ - radius);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qz, 0));
  return outside + Math.min(Math.max(qx, qz), 0) - radius;
}

function cityMask(x: number, z: number): number {
  const dx = (x - CITY.centerX) / (CITY.radiusX * 1.15);
  const dz = (z - CITY.centerZ) / (CITY.radiusZ * 1.15);
  return 1 - smoothstep(0.75, 1.05, Math.hypot(dx, dz));
}

/** Terrain height in meters: plateau at 0, cliff towards the valley (-z), mountains behind and around. */
export function terrainHeight(x: number, z: number): number {
  const distanceFromHouse = Math.hypot(x, z);

  // Valley in front: steep near the plateau edge, then easing out onto the valley floor.
  const beyondEdge = Math.max(0, CLIFF_EDGE_Z - z);
  const front = VALLEY_Y * (1 - Math.exp(-beyondEdge / 34));

  // The house sits on a spur: the ground falls away to both sides, rises behind.
  const sideFall = -Math.pow(Math.max(0, Math.abs(x) - 24), 1.15) * 0.45 * (1 - smoothstep(-40, 320, z));
  const behind = Math.max(0, z - 18);
  const back = behind * 0.42 + smoothstep(120, 900, z) * 260;

  // Ring of mountains around the valley.
  const cityDistance = Math.hypot((x - CITY.centerX) / 1.4, z - CITY.centerZ);
  const ring = smoothstep(1900, 3600, cityDistance) * 620;

  const detailAmplitude = lerp(2, 70, smoothstep(40, 900, distanceFromHouse));
  const detail = (fbm(x / 260 + 11.3, z / 260 - 4.1, 6, 42) - 0.45) * detailAmplitude * 2;
  const ridges = Math.pow(fbm(x / 900, z / 900, 4, 7), 2) * 380 * smoothstep(700, 2600, distanceFromHouse);

  let height = Math.max(front + sideFall, VALLEY_Y - 8) + back + ring + detail + ridges;

  // Flatten the valley floor under the city.
  const city = cityMask(x, z);
  if (city > 0) height = lerp(height, VALLEY_Y + fbm(x / 120, z / 120, 3, 5) * 3, city);

  // Blend into the flat plateau; the front edge stays crisp (cliff), sides soften.
  const edge = plateauDistance(x, z);
  const blendWidth = z < CLIFF_EDGE_Z + 1 ? 1.5 : 12;
  const plateau = 1 - smoothstep(0, blendWidth, edge);
  // Leave room for the pool basin (its edges are hidden under the paving).
  const margin = 0.6;
  if (x > POOL.x0 - margin && x < POOL.x1 + margin && z > POOL.z0 - margin && z < POOL.z1 + margin) return -1.8;
  return lerp(height, PLATEAU_Y, plateau);
}

export function isOnPlateau(x: number, z: number): boolean {
  return plateauDistance(x, z) <= 0;
}

export function isInCity(x: number, z: number): boolean {
  const dx = (x - CITY.centerX) / CITY.radiusX;
  const dz = (z - CITY.centerZ) / CITY.radiusZ;
  return dx * dx + dz * dz < 1;
}

/** Linear RGB triplet for a terrain vertex based on height, slope and location. */
export function terrainColor(x: number, z: number, height: number, slope: number): [number, number, number] {
  const n = fbm(x / 40, z / 40, 3, 9) * 0.7 + fbm(x / 7, z / 7, 2, 13) * 0.3;
  if (isOnPlateau(x, z)) return [0.09 + n * 0.03, 0.17 + n * 0.04, 0.045];
  const city = cityMask(x, z);
  const grass: [number, number, number] = [0.1 + n * 0.05, 0.15 + n * 0.05, 0.055];
  const dry: [number, number, number] = [0.26 + n * 0.06, 0.22 + n * 0.05, 0.12];
  const rock: [number, number, number] = [0.24 + n * 0.07, 0.21 + n * 0.06, 0.18 + n * 0.05];
  const urban: [number, number, number] = [0.16, 0.16, 0.15];
  const rockiness = smoothstep(0.82, 0.55, slope);
  const dryness = clamp(smoothstep(-60, 260, height) * 0.8 + n * 0.3, 0, 1);
  const mixed = grass.map((value, i) => lerp(value, dry[i]!, dryness)) as [number, number, number];
  const withRock = mixed.map((value, i) => lerp(value, rock[i]!, rockiness)) as [number, number, number];
  return withRock.map((value, i) => lerp(value, urban[i]!, city * 0.85)) as [number, number, number];
}

export interface CityBuilding {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  rotation: number;
}

/** Deterministic city layout on a street grid in the valley. */
export function generateCity(density: number): { buildings: CityBuilding[]; streetLights: [number, number, number][] } {
  const random = createRandom(2026);
  const buildings: CityBuilding[] = [];
  const streetLights: [number, number, number][] = [];
  const block = 64;
  const street = 16;
  const rotation = 0.18;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const toWorld = (u: number, v: number): [number, number] => [
    CITY.centerX + u * cos - v * sin,
    CITY.centerZ + u * sin + v * cos,
  ];
  const span = 1700;
  for (let u = -span; u <= span; u += block + street) {
    for (let v = -span; v <= span; v += block + street) {
      const [bx, bz] = toWorld(u, v);
      if (!isInCity(bx, bz)) continue;
      const centerFactor = Math.exp(-Math.pow(Math.hypot((bx - CITY.centerX) / 650, (bz - CITY.centerZ) / 380), 2));
      const lots = random.next() < density ? (centerFactor > 0.5 ? 2 : random.int(2, 4)) : 1;
      for (let lot = 0; lot < lots; lot++) {
        const ou = random.range(-block * 0.3, block * 0.3);
        const ov = random.range(-block * 0.3, block * 0.3);
        const [x, z] = toWorld(u + ou, v + ov);
        const width = random.range(14, lots > 1 ? 28 : 46);
        const depth = random.range(14, lots > 1 ? 28 : 46);
        const tall = random.next() < centerFactor * 0.55;
        const height = tall ? random.range(40, 140) * (0.5 + centerFactor * 0.7) : random.range(7, 20) + centerFactor * 22;
        buildings.push({ x, z, width, depth, height, rotation });
      }
      // Street lights along the block edges.
      for (let s = 0; s < block + street; s += 26) {
        const [lx, lz] = toWorld(u - (block + street) / 2 + s, v - block / 2 - street / 2);
        if (isInCity(lx, lz)) streetLights.push([lx, VALLEY_Y + 6, lz]);
        const [mx, mz] = toWorld(u - block / 2 - street / 2, v - (block + street) / 2 + s);
        if (isInCity(mx, mz)) streetLights.push([mx, VALLEY_Y + 6, mz]);
      }
    }
  }
  return { buildings, streetLights };
}
