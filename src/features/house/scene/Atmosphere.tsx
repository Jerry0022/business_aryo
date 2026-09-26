"use client";

import { Environment, Sky } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createRandom } from "../engine/random";
import { skyStateAt } from "../engine/sun";
import { frameState, useStudio } from "../ui/store";

const SUN_DISTANCE = 90;
const SHADOW_EXTENT = 36;
const tmpColor = new THREE.Color();

function skyUniformsFor(hour: number) {
  const sky = skyStateAt(hour);
  const [x, y, z] = sky.sunDirection;
  // Keep a hint of twilight glow below the horizon instead of a pitch-black dome.
  return { sunPosition: new THREE.Vector3(x, Math.max(y, -0.12), z), sky };
}

/** Sky dome, stars, moon, sun/moon/hemisphere lights, fog and the reflection environment. */
export function Atmosphere() {
  const quality = useStudio((state) => state.quality);
  const envHour = useStudio((state) => Math.round(state.hour * 4) / 4);
  const scene = useThree((state) => state.scene);
  const gl = useThree((state) => state.gl);

  const sunRef = useRef<THREE.DirectionalLight>(null);
  const moonRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const skyRef = useRef<THREE.Mesh>(null);
  const starsRef = useRef<THREE.Points>(null);
  const moonMeshRef = useRef<THREE.Mesh>(null);

  const fog = useMemo(() => new THREE.FogExp2("#c3d3e2", 0.00032), []);
  useEffect(() => {
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [fog, scene]);

  const stars = useMemo(() => {
    const random = createRandom(404);
    const count = 2600;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = random.range(0, Math.PI * 2);
      const phi = Math.acos(random.range(0.02, 1));
      const radius = 4200;
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.cos(phi) * radius;
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
      sizes[i] = random.next();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: "#dfe8ff",
      size: 1.6,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0,
      fog: false,
      depthWrite: false,
    });
    return { geometry, material };
  }, []);

  useEffect(() => () => {
    stars.geometry.dispose();
    stars.material.dispose();
  }, [stars]);

  const envSky = useMemo(() => skyUniformsFor(envHour), [envHour]);

  useFrame((_, delta) => {
    const hour = useStudio.getState().hour;
    const sky = skyStateAt(hour);
    frameState.sky = sky;
    frameState.time += delta;

    const [sx, sy, sz] = sky.sunDirection;
    const sun = sunRef.current;
    if (sun) {
      sun.position.set(sx * SUN_DISTANCE, Math.max(sy, 0.02) * SUN_DISTANCE, sz * SUN_DISTANCE);
      sun.color.set(sky.sunColor);
      sun.intensity = sky.sunIntensity;
      sun.visible = sky.sunIntensity > 0.01;
    }
    const moon = moonRef.current;
    if (moon) {
      const [mx, my, mz] = sky.moonDirection;
      moon.position.set(mx * SUN_DISTANCE, my * SUN_DISTANCE, mz * SUN_DISTANCE);
      moon.intensity = sky.moonIntensity;
      moon.visible = sky.moonIntensity > 0.01;
    }
    const hemi = hemiRef.current;
    if (hemi) {
      hemi.color.set(sky.hemiSky);
      hemi.groundColor.set(sky.hemiGround);
      hemi.intensity = sky.hemiIntensity;
    }
    const skyMaterial = skyRef.current?.material as THREE.ShaderMaterial | undefined;
    if (skyMaterial?.uniforms?.sunPosition) {
      skyMaterial.uniforms.sunPosition.value.set(sx, Math.max(sy, -0.12), sz);
      skyMaterial.uniforms.rayleigh!.value = THREE.MathUtils.lerp(0.9, 2.4, sky.golden) + (1 - sky.day) * 0.5;
      skyMaterial.uniforms.turbidity!.value = THREE.MathUtils.lerp(2.2, 6, sky.golden);
    }
    if (skyRef.current) skyRef.current.visible = sky.night < 0.985;
    stars.material.opacity = THREE.MathUtils.smoothstep(sky.night, 0.45, 1) * 0.95;
    stars.material.visible = stars.material.opacity > 0.01;
    if (moonMeshRef.current) {
      (moonMeshRef.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.smoothstep(sky.night, 0.3, 1);
      moonMeshRef.current.visible = sky.night > 0.3;
    }
    scene.environmentIntensity = sky.environmentIntensity;
    fog.color.copy(tmpColor.set(sky.fogColor));
    fog.density = THREE.MathUtils.lerp(0.00034, 0.00019, sky.day);
    gl.toneMappingExposure = sky.exposure;
  });

  const shadowSize = quality === "high" ? 4096 : 2048;
  const castShadows = quality !== "low";
  const [mx, my, mz] = skyStateAt(0).moonDirection;

  return (
    <>
      <color attach="background" args={["#0a1020"]} />
      <Sky ref={skyRef as never} distance={4500} mieCoefficient={0.003} mieDirectionalG={0.86} rayleigh={1.2} turbidity={3} />
      <points ref={starsRef} geometry={stars.geometry} material={stars.material} frustumCulled={false} />
      <mesh ref={moonMeshRef} position={[mx * 4000, my * 4000, mz * 4000]}>
        <sphereGeometry args={[70, 24, 16]} />
        <meshBasicMaterial color="#f5f1e6" transparent fog={false} toneMapped={false} />
      </mesh>

      <hemisphereLight ref={hemiRef} args={["#bcd3ec", "#7a6a55", 1]} />
      <directionalLight
        ref={sunRef}
        castShadow={castShadows}
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.00025}
        shadow-normalBias={0.035}
        shadow-camera-left={-SHADOW_EXTENT}
        shadow-camera-right={SHADOW_EXTENT}
        shadow-camera-top={SHADOW_EXTENT}
        shadow-camera-bottom={-SHADOW_EXTENT}
        shadow-camera-near={1}
        shadow-camera-far={220}
      />
      <directionalLight ref={moonRef} color="#9db3ff" />

      <Environment frames={1} resolution={quality === "low" ? 64 : 128} near={1} far={5000} key={envHour}>
        <Sky distance={4000} sunPosition={envSky.sunPosition} mieCoefficient={0.003} mieDirectionalG={0.86} rayleigh={1.2} turbidity={3} />
        <mesh position={[0, -60, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4000, 4000]} />
          <meshBasicMaterial color={envSky.sky.hemiGround} />
        </mesh>
      </Environment>
    </>
  );
}
