"use client";

import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { MaterialId } from "../content";
import type { PatternId } from "../parquet/geometry";
import type { WoodId } from "../parquet/woods";
import { createFloorTextures, SAMPLE, THICKNESS } from "./floor-texture";

// 3D floor sample for the Boden-Explorer: one board you can turn by dragging. Limited orbit,
// no zoom and no pan, so it always stays a sample on the table.

export interface FloorSample3DProps {
  pattern: PatternId;
  wood: WoodId;
  material: MaterialId;
  /** Extra rotation around the vertical axis (buttons), in radians. */
  yaw: number;
  /** Section is on screen: render continuously for damping and the idle sway. */
  active: boolean;
  reducedMotion: boolean;
  /** Idle sway until the visitor interacts. */
  sway: boolean;
  onReady: () => void;
  onInteract: () => void;
}

const ROUGHNESS: Record<MaterialId, number> = { parkett: 0.72, laminat: 0.42, vinyl: 0.6 };

function Board({ pattern, wood, material, yaw, reducedMotion, sway }: Omit<FloorSample3DProps, "active" | "onReady" | "onInteract">) {
  const group = useRef<THREE.Group>(null);
  const gl = useThree((state) => state.gl);
  const thickness = THICKNESS[material];

  const textures = useMemo(
    () => createFloorTextures(pattern, wood, material, Math.min(8, gl.capabilities.getMaxAnisotropy())),
    [pattern, wood, material, gl],
  );
  const materials = useMemo(() => {
    const top = new THREE.MeshStandardMaterial({
      map: textures.map,
      bumpMap: textures.bump,
      bumpScale: material === "parkett" ? 1.2 : 2,
      roughness: ROUGHNESS[material],
      metalness: 0,
    });
    const side = new THREE.MeshStandardMaterial({ map: textures.side, roughness: 0.85, metalness: 0 });
    const bottom = new THREE.MeshStandardMaterial({ color: "#8d8a82", roughness: 1 });
    return { list: [side, side, top, bottom, side, side], top, side, bottom };
  }, [textures, material]);

  useEffect(
    () => () => {
      textures.dispose();
      materials.top.dispose();
      materials.side.dispose();
      materials.bottom.dispose();
    },
    [textures, materials],
  );

  useFrame((state) => {
    const board = group.current;
    if (!board) return;
    const target = yaw + (sway && !reducedMotion ? Math.sin(state.clock.elapsedTime * 0.45) * 0.14 : 0);
    const delta = target - board.rotation.y;
    board.rotation.y = reducedMotion || Math.abs(delta) < 0.0005 ? target : board.rotation.y + delta * 0.08;
  });

  return (
    <group ref={group}>
      <mesh castShadow receiveShadow position={[0, thickness / 2, 0]} material={materials.list}>
        <boxGeometry args={[SAMPLE.width, thickness, SAMPLE.depth]} />
      </mesh>
    </group>
  );
}

function ReadySignal({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    frames.current += 1;
    if (frames.current >= 2) {
      done.current = true;
      onReady();
    }
  });
  return null;
}

export default function FloorSample3D({ active, onReady, onInteract, ...board }: FloorSample3DProps) {
  const continuous = active && (!board.reducedMotion || board.sway);
  return (
    <Canvas
      frameloop={continuous ? "always" : "demand"}
      dpr={[1, 2]}
      shadows={{ type: THREE.PCFShadowMap }}
      camera={{ position: [0, 1.5, 2.0], fov: 36, near: 0.1, far: 20 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      onPointerDown={onInteract}
      className="!absolute inset-0 cursor-grab active:cursor-grabbing"
      aria-hidden="true"
    >
      <hemisphereLight args={["#ffffff", "#9a9890", 1.1]} />
      <directionalLight
        position={[2.2, 3.6, 1.6]}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-2.5, 1.5, -1]} intensity={0.35} />
      <Board {...board} />
      <ContactShadows position={[0, -0.002, 0]} opacity={0.42} scale={3.2} blur={2.6} far={0.8} resolution={512} color="#231913" />
      <OrbitControls
        makeDefault
        enableZoom={false}
        enablePan={false}
        enableDamping={!board.reducedMotion}
        dampingFactor={0.08}
        rotateSpeed={0.6}
        minPolarAngle={0.3}
        maxPolarAngle={1.2}
        minAzimuthAngle={-0.85}
        maxAzimuthAngle={0.85}
        target={[0, 0.02, 0]}
      />
      <ReadySignal onReady={onReady} />
    </Canvas>
  );
}
