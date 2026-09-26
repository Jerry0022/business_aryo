"use client";

import { useFrame } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { POOL, POOL_WATER_Y } from "../data/plan";
import { ROOMS, roomFloorY } from "../data/rooms";
import type { RoomItem } from "../data/types";
import { buildMeshes, type BuiltMesh } from "../models/builder";
import { getModel, type ItemType, resolveSlots } from "../models/catalog";
import type { MaterialKey, MaterialSlot, Quality } from "../models/materials";
import { frameState, useStudio } from "../ui/store";
import { useMaterials } from "./MaterialsContext";
import { buildStructureParts } from "./structure";

const NO_SHADOW: ReadonlySet<MaterialKey> = new Set(["glass", "glassFrosted", "water", "lampGlow", "lampShade"]);
const STRUCTURE_SLOTS = resolveSlots("sofa");

function Meshes({ meshes, castShadow = true, receiveShadow = true }: { meshes: BuiltMesh[]; castShadow?: boolean; receiveShadow?: boolean }) {
  const { materials } = useMaterials();
  return (
    <>
      {meshes.map((mesh) => (
        <mesh
          key={mesh.material}
          geometry={mesh.geometry}
          material={materials[mesh.material]}
          castShadow={castShadow && !NO_SHADOW.has(mesh.material)}
          receiveShadow={receiveShadow && !NO_SHADOW.has(mesh.material)}
          renderOrder={mesh.material === "glass" ? 2 : 0}
        />
      ))}
    </>
  );
}

function useDisposeMeshes(meshes: BuiltMesh[]) {
  useEffect(() => () => meshes.forEach((mesh) => mesh.geometry.dispose()), [meshes]);
}

export function HouseStructure() {
  const roofHidden = useStudio((state) => state.roofHidden);
  const built = useMemo(() => {
    const parts = buildStructureParts();
    return {
      ground: buildMeshes(parts.ground, STRUCTURE_SLOTS),
      groundGlass: buildMeshes(parts.groundGlass, STRUCTURE_SLOTS),
      roof: buildMeshes(parts.roof, STRUCTURE_SLOTS),
      roofGlass: buildMeshes(parts.roofGlass, STRUCTURE_SLOTS),
      water: buildMeshes(parts.water, STRUCTURE_SLOTS),
    };
  }, []);
  useDisposeMeshes(useMemo(() => Object.values(built).flat(), [built]));

  return (
    <group name="house">
      <Meshes meshes={built.ground} />
      <Meshes meshes={built.groundGlass} castShadow={false} />
      <Meshes meshes={built.water} castShadow={false} />
      <group visible={!roofHidden}>
        <Meshes meshes={built.roof} />
        <Meshes meshes={built.roofGlass} castShadow={false} />
      </group>
    </group>
  );
}

// ---- furniture --------------------------------------------------------------------------------

const modelCache = new Map<string, BuiltMesh[]>();

function getBuiltModel(type: ItemType, mats?: Partial<Record<MaterialSlot, MaterialKey>>): BuiltMesh[] {
  const key = `${type}|${mats ? JSON.stringify(mats) : ""}`;
  let meshes = modelCache.get(key);
  if (!meshes) {
    const model = getModel(type);
    meshes = buildMeshes(model.parts(), resolveSlots(type, mats));
    modelCache.set(key, meshes);
  }
  return meshes;
}

const Item = memo(function Item({ item, floorY }: { item: RoomItem; floorY: number }) {
  const meshes = getBuiltModel(item.type, item.mats);
  const model = getModel(item.type);
  return (
    <group
      position={[item.at[0], floorY + (item.at[2] ?? 0), item.at[1]]}
      rotation={[0, ((item.rot ?? 0) * Math.PI) / 180, 0]}
      name={item.id}
    >
      <Meshes meshes={meshes} castShadow={model.castShadow !== false} />
    </group>
  );
});

export function Furniture() {
  const roofHidden = useStudio((state) => state.roofHidden);
  return (
    <group name="furniture">
      {ROOMS.map((room) => (
        <group key={room.id} visible={!(room.level === "roof" && roofHidden)}>
          {room.items.map((item) => (
            <Item key={item.id} item={item} floorY={roomFloorY(room)} />
          ))}
        </group>
      ))}
    </group>
  );
}

// ---- night lighting ---------------------------------------------------------------------------

interface LightSpot {
  position: [number, number, number];
  color: string;
  intensity: number;
  distance: number;
  roof: boolean;
}

function collectLightSpots(quality: Quality): LightSpot[] {
  if (quality === "low") return [];
  const spots: LightSpot[] = [];
  for (const room of ROOMS) {
    const lights = quality === "high" ? room.lights : room.lights.slice(0, 1);
    for (const [x, z] of lights) {
      const outdoor = room.level === "roof" || room.id === "garden";
      spots.push({
        position: [x, roomFloorY(room) + (outdoor ? 2.4 : 2.55), z],
        color: outdoor ? "#ffc27a" : "#ffd9a8",
        intensity: outdoor ? 9 : 14,
        distance: outdoor ? 9 : 8,
        roof: room.level === "roof",
      });
    }
  }
  spots.push({
    position: [(POOL.x0 + POOL.x1) / 2, POOL_WATER_Y - 0.6, (POOL.z0 + POOL.z1) / 2],
    color: "#5fe3ff",
    intensity: 10,
    distance: 7,
    roof: false,
  });
  return spots;
}

/** Warm interior and terrace lights that fade in after sunset. */
export function NightLights() {
  const quality = useStudio((state) => state.quality);
  const roofHidden = useStudio((state) => state.roofHidden);
  const spots = useMemo(() => collectLightSpots(quality), [quality]);
  const refs = useRef<(THREE.PointLight | null)[]>([]);

  useFrame(() => {
    const night = THREE.MathUtils.smoothstep(frameState.sky.night, 0.15, 0.85);
    // Intensity only: toggling visibility would change the light count and recompile every shader.
    refs.current.forEach((light, index) => {
      const spot = spots[index]!;
      if (light) light.intensity = spot.roof && roofHidden ? 0 : spot.intensity * night;
    });
  });

  return (
    <group name="night-lights">
      {spots.map((spot, index) => (
        <pointLight
          key={`${spot.position.join(",")}`}
          ref={(light) => {
            refs.current[index] = light;
          }}
          position={spot.position}
          color={spot.color}
          intensity={0}
          distance={spot.distance}
          decay={2}
        />
      ))}
    </group>
  );
}
