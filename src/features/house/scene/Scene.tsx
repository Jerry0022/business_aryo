"use client";

import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { useStudio } from "../ui/store";
import { Atmosphere } from "./Atmosphere";
import { OverviewControls } from "./controls/OverviewControls";
import { WalkControls } from "./controls/WalkControls";
import { Effects } from "./Effects";
import { Furniture, HouseStructure, NightLights } from "./House";
import { City, Landscape } from "./Landscape";
import { MaterialsProvider } from "./MaterialsContext";

function ReadySignal() {
  const setReady = useStudio((state) => state.setReady);
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 3) setReady();
  });
  return null;
}

function Controls() {
  const mode = useStudio((state) => state.mode);
  const hasWalked = useStudio((state) => state.hasWalked);
  return mode === "walk" ? <WalkControls /> : <OverviewControls fromWalk={hasWalked} />;
}

export default function Scene() {
  // The parent remounts the scene when the quality changes, so this initial value is enough.
  const quality = useStudio((state) => state.quality);
  const [dprCap, setDprCap] = useState(quality === "high" ? 2 : quality === "medium" ? 1.5 : 1);

  return (
    <Canvas
      shadows={quality === "low" ? false : { type: THREE.PCFShadowMap }}
      dpr={[1, dprCap]}
      gl={{ antialias: quality === "low", powerPreference: "high-performance", stencil: false }}
      camera={{ fov: 45, near: 0.1, far: 6000, position: [17, 21, 31] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
      }}
      className="touch-none"
      aria-label="3D-Ansicht des Traumhauses"
    >
      <PerformanceMonitor onDecline={() => setDprCap((value) => Math.max(1, value - 0.25))} />
      <AdaptiveDpr pixelated={false} />
      <MaterialsProvider>
        <Atmosphere />
        <Landscape quality={quality} />
        <City quality={quality} />
        <HouseStructure />
        <Furniture />
        <NightLights />
      </MaterialsProvider>
      <Controls />
      <Effects quality={quality} />
      <ReadySignal />
    </Canvas>
  );
}
