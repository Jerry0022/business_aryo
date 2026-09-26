"use client";

import { useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode, type BloomEffect } from "postprocessing";
import { useRef } from "react";
import type { Quality } from "../models/materials";
import { frameState } from "../ui/store";

/** Filmic post stack. Low quality renders without post-processing (renderer tone mapping only). */
export function Effects({ quality }: { quality: Quality }) {
  const bloom = useRef<BloomEffect>(null);

  useFrame(() => {
    if (bloom.current) bloom.current.intensity = 0.35 + frameState.sky.night * 0.9;
  });

  if (quality === "low") return null;

  return (
    <EffectComposer multisampling={quality === "high" ? 4 : 0}>
      {quality === "high" ? <N8AO aoRadius={1.1} distanceFalloff={0.6} intensity={2.2} halfRes /> : <></>}
      <Bloom ref={bloom} mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.4} />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Vignette offset={0.32} darkness={0.42} />
      {quality === "medium" ? <SMAA /> : <></>}
    </EffectComposer>
  );
}
