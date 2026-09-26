import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { type MaterialKey, type MaterialSlot, UV_SCALE } from "./materials";

export type V3 = [number, number, number];
export type MatRef = MaterialKey | { slot: MaterialSlot };

interface PartBase {
  at: V3;
  /** Euler rotation in radians. */
  rot?: V3;
  /** Non-uniform scale, applied before rotation. */
  scale?: V3;
  mat: MatRef;
}

export type Part =
  | (PartBase & { kind: "box"; size: V3; round?: number })
  | (PartBase & { kind: "cyl"; radius: number; radiusTop?: number; height: number; segments?: number })
  | (PartBase & { kind: "sphere"; radius: number; segments?: number; hemisphere?: boolean })
  | (PartBase & { kind: "torus"; radius: number; tube: number; arc?: number; segments?: number })
  | (PartBase & { kind: "lathe"; points: [number, number][]; segments?: number })
  | (PartBase & { kind: "geometry"; geometry: THREE.BufferGeometry });

// ---- concise part helpers -------------------------------------------------------------

export const box = (size: V3, at: V3, mat: MatRef, extra: { rot?: V3; round?: number } = {}): Part => ({
  kind: "box",
  size,
  at,
  mat,
  ...extra,
});

export const cyl = (
  radius: number,
  height: number,
  at: V3,
  mat: MatRef,
  extra: { rot?: V3; radiusTop?: number; segments?: number } = {},
): Part => ({ kind: "cyl", radius, height, at, mat, ...extra });

export const sphere = (
  radius: number,
  at: V3,
  mat: MatRef,
  extra: { rot?: V3; scale?: V3; segments?: number; hemisphere?: boolean } = {},
): Part => ({ kind: "sphere", radius, at, mat, ...extra });

export const torus = (radius: number, tube: number, at: V3, mat: MatRef, extra: { rot?: V3; arc?: number } = {}): Part => ({
  kind: "torus",
  radius,
  tube,
  at,
  mat,
  ...extra,
});

export const lathe = (
  points: [number, number][],
  at: V3,
  mat: MatRef,
  extra: { rot?: V3; segments?: number; scale?: V3 } = {},
): Part => ({
  kind: "lathe",
  points,
  at,
  mat,
  ...extra,
});

export const slot = (name: MaterialSlot): MatRef => ({ slot: name });

// ---- geometry assembly ----------------------------------------------------------------

function createPartGeometry(part: Part): THREE.BufferGeometry {
  switch (part.kind) {
    case "box":
      return part.round && part.round > 0
        ? new RoundedBoxGeometry(part.size[0], part.size[1], part.size[2], 2, Math.min(part.round, Math.min(...part.size) / 2 - 0.001))
        : new THREE.BoxGeometry(...part.size);
    case "cyl":
      return new THREE.CylinderGeometry(part.radiusTop ?? part.radius, part.radius, part.height, part.segments ?? 24);
    case "sphere": {
      const segments = part.segments ?? 20;
      const geometry = new THREE.SphereGeometry(
        part.radius,
        segments,
        Math.max(6, Math.round(segments * 0.6)),
        0,
        Math.PI * 2,
        0,
        part.hemisphere ? Math.PI / 2 : Math.PI,
      );
      return geometry;
    }
    case "torus":
      return new THREE.TorusGeometry(part.radius, part.tube, 10, part.segments ?? 32, part.arc ?? Math.PI * 2);
    case "lathe":
      return new THREE.LatheGeometry(
        part.points.map(([x, y]) => new THREE.Vector2(x, y)),
        part.segments ?? 28,
      );
    case "geometry":
      return part.geometry.clone();
  }
}

/** Replaces UVs with a box projection in (local) space so textures keep a constant texel density. */
export function applyBoxProjectedUV(geometry: THREE.BufferGeometry, metersPerRepeat: number) {
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    const nx = Math.abs(normal.getX(i));
    const ny = Math.abs(normal.getY(i));
    const nz = Math.abs(normal.getZ(i));
    let u: number;
    let v: number;
    if (ny >= nx && ny >= nz) {
      u = position.getX(i);
      v = -position.getZ(i);
    } else if (nx >= nz) {
      u = position.getZ(i);
      v = position.getY(i);
    } else {
      u = position.getX(i);
      v = position.getY(i);
    }
    uv[i * 2] = u / metersPerRepeat;
    uv[i * 2 + 1] = v / metersPerRepeat;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

function normalizeForMerge(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const result = geometry.index ? geometry.toNonIndexed() : geometry;
  for (const name of Object.keys(result.attributes)) {
    if (name !== "position" && name !== "normal" && name !== "uv") result.deleteAttribute(name);
  }
  if (!result.getAttribute("uv")) {
    result.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(result.getAttribute("position").count * 2), 2));
  }
  return result;
}

const tmpMatrix = new THREE.Matrix4();
const tmpQuaternion = new THREE.Quaternion();
const tmpEuler = new THREE.Euler();
const tmpPosition = new THREE.Vector3();
const unitScale = new THREE.Vector3(1, 1, 1);

export interface BuiltMesh {
  material: MaterialKey;
  geometry: THREE.BufferGeometry;
}

/**
 * Transforms every part, applies world-projected UVs for textured materials and merges parts
 * by material: a whole model renders with one draw call per material.
 */
export function buildMeshes(parts: Part[], slots: Record<MaterialSlot, MaterialKey>): BuiltMesh[] {
  const groups = new Map<MaterialKey, THREE.BufferGeometry[]>();
  for (const part of parts) {
    const material = typeof part.mat === "string" ? part.mat : slots[part.mat.slot];
    const geometry = createPartGeometry(part);
    if (part.scale) geometry.scale(...part.scale);
    tmpEuler.set(...(part.rot ?? [0, 0, 0]));
    tmpQuaternion.setFromEuler(tmpEuler);
    tmpPosition.set(...part.at);
    tmpMatrix.compose(tmpPosition, tmpQuaternion, unitScale);
    geometry.applyMatrix4(tmpMatrix);
    const uvScale = UV_SCALE[material];
    if (uvScale) applyBoxProjectedUV(geometry, uvScale);
    const list = groups.get(material) ?? [];
    list.push(normalizeForMerge(geometry));
    groups.set(material, list);
  }
  const meshes: BuiltMesh[] = [];
  for (const [material, geometries] of groups) {
    const merged = geometries.length === 1 ? geometries[0]! : mergeGeometries(geometries, false);
    if (!merged) continue;
    merged.computeBoundingSphere();
    meshes.push({ material, geometry: merged });
    if (geometries.length > 1) for (const geometry of geometries) geometry.dispose();
  }
  return meshes;
}
