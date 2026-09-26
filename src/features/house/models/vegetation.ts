import * as THREE from "three";
import { createRandom } from "../engine/random";

/** One palm frond: a curved, V-folded ribbon (UV: u across, v from base to tip). */
function createFrondGeometry(length: number, width: number, lift: number, droop: number): THREE.BufferGeometry {
  const segments = 12;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = lift - (lift + droop) * t * t;
    const distance = length * t;
    const z = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance * 0.9;
    const halfWidth = (width / 2) * Math.sin(Math.PI * Math.min(1, 0.15 + t)) ;
    const fold = halfWidth * 0.35;
    positions.push(-halfWidth, y + fold, z, 0, y, z, halfWidth, y + fold, z);
    uvs.push(0, t, 0.5, t, 1, t);
    if (i < segments) {
      const a = i * 3;
      const b = a + 3;
      indices.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Palm crown made of `count` fronds around the Y axis, origin at the crown base. */
export function createPalmCrownGeometry(seed: number, count = 12, size = 1): THREE.BufferGeometry {
  const random = createRandom(seed);
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < count; i++) {
    const inner = i % 3 === 0;
    const length = (inner ? 1.5 : 2.3) * size * random.range(0.85, 1.1);
    const frond = createFrondGeometry(length, 1.05 * size, inner ? 0.9 : random.range(0.35, 0.6), inner ? 0.4 : random.range(0.7, 1.1));
    frond.rotateY((i / count) * Math.PI * 2 + random.range(-0.2, 0.2));
    parts.push(frond.index ? frond.toNonIndexed() : frond);
  }
  const merged = mergeSimple(parts);
  return merged;
}

/** Slightly leaning, tapered trunk with growth rings. Origin at the ground, returns top position too. */
export function createPalmTrunkGeometry(seed: number, height: number, radius: number) {
  const random = createRandom(seed);
  const leanX = random.range(-0.12, 0.12) * height;
  const leanZ = random.range(-0.08, 0.08) * height;
  const points: THREE.Vector3[] = [];
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push(new THREE.Vector3(leanX * t * t, height * t, leanZ * t * t));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const tube = new THREE.TubeGeometry(curve, 28, radius, 10, false);
  // Taper towards the top and add ring bulges.
  const position = tube.getAttribute("position");
  const center = new THREE.Vector3();
  const vertex = new THREE.Vector3();
  const radial = 11;
  for (let i = 0; i < position.count; i++) {
    const ring = Math.floor(i / radial);
    const t = ring / 28;
    curve.getPointAt(Math.min(1, t), center);
    vertex.fromBufferAttribute(position, i).sub(center);
    const bulge = 1 + 0.08 * Math.max(0, Math.sin(t * 28 * Math.PI));
    vertex.multiplyScalar((1 - t * 0.35) * bulge).add(center);
    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  tube.computeVertexNormals();
  return { geometry: tube, top: new THREE.Vector3(leanX, height, leanZ) };
}

function mergeSimple(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  let count = 0;
  for (const geometry of geometries) count += geometry.getAttribute("position").count;
  const position = new Float32Array(count * 3);
  const normal = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  let offset = 0;
  for (const geometry of geometries) {
    const p = geometry.getAttribute("position");
    const n = geometry.getAttribute("normal");
    const u = geometry.getAttribute("uv");
    position.set(p.array as Float32Array, offset * 3);
    normal.set(n.array as Float32Array, offset * 3);
    uv.set(u.array as Float32Array, offset * 2);
    offset += p.count;
    geometry.dispose();
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(position, 3));
  merged.setAttribute("normal", new THREE.BufferAttribute(normal, 3));
  merged.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return merged;
}

/** Irregular foliage blob (for olive trees, shrubs): a displaced icosphere. */
export function createFoliageGeometry(seed: number, radius: number, detail = 2): THREE.BufferGeometry {
  const random = createRandom(seed);
  const geometry = new THREE.IcosahedronGeometry(radius, detail);
  const position = geometry.getAttribute("position");
  const vertex = new THREE.Vector3();
  const offsets = new Map<string, number>();
  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    const key = `${vertex.x.toFixed(3)}|${vertex.y.toFixed(3)}|${vertex.z.toFixed(3)}`;
    let factor = offsets.get(key);
    if (factor === undefined) {
      factor = random.range(0.78, 1.12);
      offsets.set(key, factor);
    }
    vertex.multiplyScalar(factor);
    vertex.y *= 0.8;
    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}
