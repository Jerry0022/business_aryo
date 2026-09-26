"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createRandom, fbm } from "../engine/random";
import { generateCity, isInCity, isOnPlateau, terrainColor, terrainHeight, VALLEY_Y } from "../engine/terrain";
import type { Quality } from "../models/materials";
import { createNoiseTexture } from "../textures/procedural";
import { frameState } from "../ui/store";

/** Polar grid: dense around the house, coarse towards the horizon. */
function createTerrainGeometry(quality: Quality): THREE.BufferGeometry {
  const rings = quality === "low" ? 110 : 150;
  const segments = quality === "low" ? 160 : quality === "medium" ? 224 : 288;
  const maxRadius = 4600;
  const minRadius = 0.8;
  const growth = Math.pow(maxRadius / minRadius, 1 / rings);
  const vertexCount = 1 + (rings + 1) * segments;
  const positions = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const indices: number[] = [];

  const setVertex = (index: number, x: number, z: number) => {
    positions[index * 3] = x;
    positions[index * 3 + 1] = terrainHeight(x, z);
    positions[index * 3 + 2] = z;
    uvs[index * 2] = x / 7;
    uvs[index * 2 + 1] = z / 7;
  };

  setVertex(0, 0, 0);
  for (let ring = 0; ring <= rings; ring++) {
    const radius = minRadius * Math.pow(growth, ring);
    for (let s = 0; s < segments; s++) {
      const angle = (s / segments) * Math.PI * 2;
      setVertex(1 + ring * segments + s, Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
  }
  for (let s = 0; s < segments; s++) {
    indices.push(0, 1 + ((s + 1) % segments), 1 + s);
  }
  for (let ring = 0; ring < rings; ring++) {
    for (let s = 0; s < segments; s++) {
      const a = 1 + ring * segments + s;
      const b = 1 + ring * segments + ((s + 1) % segments);
      const c = a + segments;
      const d = b + segments;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const normal = geometry.getAttribute("normal");
  for (let i = 0; i < vertexCount; i++) {
    const [r, g, b] = terrainColor(positions[i * 3]!, positions[i * 3 + 2]!, positions[i * 3 + 1]!, normal.getY(i));
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

interface TreeInstances {
  pines: { matrices: THREE.Matrix4[]; colors: THREE.Color[] };
  broadleaf: { matrices: THREE.Matrix4[]; colors: THREE.Color[] };
}

function createTrees(quality: Quality): TreeInstances {
  const random = createRandom(77);
  const target = quality === "low" ? 900 : quality === "medium" ? 2400 : 4200;
  const result: TreeInstances = { pines: { matrices: [], colors: [] }, broadleaf: { matrices: [], colors: [] } };
  const dummy = new THREE.Object3D();
  let placed = 0;
  let attempts = 0;
  while (placed < target && attempts < target * 14) {
    attempts++;
    const radius = 30 + Math.pow(random.next(), 1.5) * 2300;
    const angle = random.range(0, Math.PI * 2);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (isOnPlateau(x, z) || isInCity(x, z)) continue;
    if (Math.hypot(x, z) < 48) continue;
    const y = terrainHeight(x, z);
    const slope = Math.abs(terrainHeight(x + 2, z) - y) + Math.abs(terrainHeight(x, z + 2) - y);
    if (slope > 3.4) continue;
    // Clustered forests with open meadows between them.
    const forest = fbm(x / 160, z / 160, 3, 31);
    if (forest < 0.47) continue;
    const pine = fbm(x / 400, z / 400, 2, 5) > 0.5 || y > 80;
    const scale = random.range(0.75, 1.35) * (radius > 700 ? 1.5 : 1);
    dummy.position.set(x, y - 0.3, z);
    dummy.scale.set(scale, scale * random.range(0.85, 1.35), scale);
    dummy.rotation.set(random.range(-0.05, 0.05), random.range(0, Math.PI * 2), random.range(-0.05, 0.05));
    dummy.updateMatrix();
    const bucket = pine ? result.pines : result.broadleaf;
    bucket.matrices.push(dummy.matrix.clone());
    bucket.colors.push(
      new THREE.Color().setHSL(
        pine ? random.range(0.27, 0.33) : random.range(0.2, 0.28),
        random.range(0.3, 0.5),
        pine ? random.range(0.07, 0.12) : random.range(0.1, 0.17),
      ),
    );
    placed++;
  }
  return result;
}

function jitter(geometry: THREE.BufferGeometry, amount: number, seed: number) {
  const random = createRandom(seed);
  const position = geometry.getAttribute("position");
  const offsets = new Map<string, [number, number, number]>();
  for (let i = 0; i < position.count; i++) {
    const key = `${position.getX(i).toFixed(3)}|${position.getY(i).toFixed(3)}|${position.getZ(i).toFixed(3)}`;
    let offset = offsets.get(key);
    if (!offset) {
      offset = [random.range(-amount, amount), random.range(-amount, amount) * 0.5, random.range(-amount, amount)];
      offsets.set(key, offset);
    }
    position.setXYZ(i, position.getX(i) + offset[0], position.getY(i) + offset[1], position.getZ(i) + offset[2]);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** Layered conifer: three stacked, slightly irregular cones on a short trunk. */
function createPineGeometry(): THREE.BufferGeometry {
  const layers = [
    { radius: 2.6, height: 4.2, y: 2.6 },
    { radius: 2.0, height: 3.6, y: 4.8 },
    { radius: 1.3, height: 3.0, y: 6.9 },
  ].map(({ radius, height, y }, index) => {
    const cone = new THREE.ConeGeometry(radius, height, 10, 2, true);
    cone.translate(0, y, 0);
    return jitter(cone.toNonIndexed(), 0.25, 11 + index);
  });
  const trunk = new THREE.CylinderGeometry(0.18, 0.28, 2.4, 6, 1, true).toNonIndexed();
  trunk.translate(0, 1.2, 0);
  return mergeGeometries([...layers, trunk]) ?? layers[0]!;
}

/** Broadleaf / olive-like tree: lumpy crown made of displaced spheres. */
function createBroadleafGeometry(): THREE.BufferGeometry {
  const crowns = [
    { r: 2.4, at: [0, 4.4, 0] },
    { r: 1.7, at: [1.3, 3.7, 0.4] },
    { r: 1.8, at: [-1.1, 3.9, -0.5] },
  ].map(({ r, at }, index) => {
    const blob = new THREE.IcosahedronGeometry(r, 2);
    jitter(blob, r * 0.18, 21 + index);
    blob.translate(at[0]!, at[1]!, at[2]!);
    return blob.index ? blob.toNonIndexed() : blob;
  });
  const trunk = new THREE.CylinderGeometry(0.16, 0.26, 3, 6, 1, true).toNonIndexed();
  trunk.translate(0, 1.5, 0);
  return mergeGeometries([...crowns, trunk]) ?? crowns[0]!;
}

function createInstancedTrees(geometry: THREE.BufferGeometry, data: { matrices: THREE.Matrix4[]; colors: THREE.Color[] }) {
  const material = new THREE.MeshStandardMaterial({ roughness: 0.92, color: "#ffffff" });
  const mesh = new THREE.InstancedMesh(geometry, material, Math.max(1, data.matrices.length));
  mesh.count = data.matrices.length;
  data.matrices.forEach((matrix, index) => {
    mesh.setMatrixAt(index, matrix);
    mesh.setColorAt(index, data.colors[index]!);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;
  return mesh;
}

export function Landscape({ quality }: { quality: Quality }) {
  const terrain = useMemo(() => {
    const geometry = createTerrainGeometry(quality);
    const detail = createNoiseTexture({ size: 256, scale: 16, contrast: 0.5 });
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97, map: detail });
    return { geometry, material, detail };
  }, [quality]);

  const trees = useMemo(() => {
    const data = createTrees(quality);
    return [createInstancedTrees(createPineGeometry(), data.pines), createInstancedTrees(createBroadleafGeometry(), data.broadleaf)];
  }, [quality]);

  useEffect(
    () => () => {
      terrain.geometry.dispose();
      terrain.material.dispose();
      terrain.detail.dispose();
      for (const tree of trees) {
        tree.geometry.dispose();
        (tree.material as THREE.Material).dispose();
      }
    },
    [terrain, trees],
  );

  return (
    <>
      <mesh geometry={terrain.geometry} material={terrain.material} receiveShadow />
      {trees.map((tree, index) => (
        <primitive key={index} object={tree} />
      ))}
    </>
  );
}

// ---- City -----------------------------------------------------------------------------------

const CITY_VERTEX = /* glsl */ `
  varying vec3 vCityWorld;
  varying vec3 vCityNormal;
`;

export function City({ quality }: { quality: Quality }) {
  const city = useMemo(() => {
    const { buildings, streetLights } = generateCity(quality === "low" ? 0.45 : quality === "medium" ? 0.75 : 1);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    geometry.translate(0, 0.5, 0);
    const uniforms = { uNight: { value: 0 } };
    const material = new THREE.MeshStandardMaterial({ color: "#c9c4bb", roughness: 0.75, metalness: 0.05 });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uNight = uniforms.uNight;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>\n${CITY_VERTEX}`)
        .replace(
          "#include <worldpos_vertex>",
          `#include <worldpos_vertex>
           vec4 cityWorld = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
           vCityWorld = cityWorld.xyz;
           vCityNormal = normalize(mat3(modelMatrix * instanceMatrix) * objectNormal);`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>\n${CITY_VERTEX}\nuniform float uNight;\nfloat cityHash(vec2 p){return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);}`)
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
           {
             float side = step(abs(vCityNormal.y), 0.5);
             vec2 facade = abs(vCityNormal.x) > abs(vCityNormal.z) ? vCityWorld.zy : vCityWorld.xy;
             vec2 cell = floor(facade / vec2(3.2, 3.4));
             vec2 local = fract(facade / vec2(3.2, 3.4));
             float windowShape = step(0.18, local.x) * step(local.x, 0.82) * step(0.22, local.y) * step(local.y, 0.78);
             float lit = step(0.55, cityHash(cell + floor(vCityWorld.xz / 40.0)));
             float warm = cityHash(cell * 1.7);
             vec3 lightColor = mix(vec3(1.0, 0.72, 0.42), vec3(0.85, 0.9, 1.0), step(0.7, warm));
             float groundFloor = step(vCityWorld.y, ${(VALLEY_Y + 4).toFixed(1)});
             totalEmissiveRadiance += side * windowShape * lit * lightColor * uNight * 2.2 * (1.0 - groundFloor);
             diffuseColor.rgb *= mix(1.0, 0.55, side * windowShape);
           }`,
        );
    };
    const mesh = new THREE.InstancedMesh(geometry, material, buildings.length);
    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();
    const random = createRandom(9);
    buildings.forEach((building, index) => {
      dummy.position.set(building.x, VALLEY_Y - 2, building.z);
      dummy.scale.set(building.width, building.height + 2, building.depth);
      dummy.rotation.set(0, building.rotation, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, tint.setHSL(random.range(0.05, 0.12), random.range(0.03, 0.12), random.range(0.55, 0.85)));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;

    const lightPositions = new Float32Array(streetLights.flat());
    const lightGeometry = new THREE.BufferGeometry();
    lightGeometry.setAttribute("position", new THREE.BufferAttribute(lightPositions, 3));
    const lightMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(1.0, 0.72, 0.38).multiplyScalar(3),
      size: 3.2,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    });
    const lights = new THREE.Points(lightGeometry, lightMaterial);
    lights.frustumCulled = false;
    return { mesh, uniforms, lights, geometry, material, lightGeometry, lightMaterial };
  }, [quality]);

  useEffect(
    () => () => {
      city.geometry.dispose();
      city.material.dispose();
      city.lightGeometry.dispose();
      city.lightMaterial.dispose();
    },
    [city],
  );

  useFrame(() => {
    const night = frameState.sky.night;
    city.uniforms.uNight.value = night;
    city.lightMaterial.opacity = THREE.MathUtils.smoothstep(night, 0.35, 0.9);
    city.lights.visible = city.lightMaterial.opacity > 0.01;
  });

  return (
    <>
      <primitive object={city.mesh} />
      <primitive object={city.lights} />
    </>
  );
}
