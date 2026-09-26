"use client";

import { CameraControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getRoom, roomFloorY } from "../../data/rooms";
import { terrainHeight } from "../../engine/terrain";
import { touchInput, useStudio } from "../../ui/store";
import { axis, useKeyboard } from "./useKeyboard";

/** Hero shot: over the roof terrace, down to the city in the valley. */
export const HERO_VIEW = { position: [17, 21, 31] as const, target: [-3, -9, -42] as const };

const target = new THREE.Vector3();
const bounds = new THREE.Box3(new THREE.Vector3(-260, -170, -1200), new THREE.Vector3(260, 120, 260));

export function OverviewControls({ fromWalk }: { fromWalk: boolean }) {
  const controls = useRef<CameraControls>(null);
  const keys = useKeyboard();
  const camera = useThree((state) => state.camera);
  const aspect = useThree((state) => state.size.width / Math.max(1, state.size.height));
  const focusNonce = useStudio((state) => state.focusNonce);
  const selectedRoomId = useStudio((state) => state.selectedRoomId);

  // Portrait screens get a wider vertical field of view so the house still fits.
  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera;
    perspective.fov = aspect < 0.8 ? 62 : 45;
    perspective.updateProjectionMatrix();
  }, [aspect, camera]);

  // Initial framing (or a smooth lift-off when leaving walk mode).
  useEffect(() => {
    const current = controls.current;
    if (!current) return;
    current.setBoundary(bounds);
    if (fromWalk) {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      const lookAt = camera.position.clone().addScaledVector(direction, 4);
      void current.setLookAt(camera.position.x, camera.position.y, camera.position.z, lookAt.x, lookAt.y, lookAt.z, false);
      void current.setLookAt(camera.position.x - direction.x * 14, camera.position.y + 12, camera.position.z - direction.z * 14, lookAt.x, 1, lookAt.z, true);
    } else {
      void current.setLookAt(...HERO_VIEW.position, ...HERO_VIEW.target, false);
    }
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to a room when it is picked in the room list.
  useEffect(() => {
    const current = controls.current;
    if (!current || focusNonce === 0) return;
    const room = selectedRoomId ? getRoom(selectedRoomId) : undefined;
    if (!room) {
      void current.setLookAt(...HERO_VIEW.position, ...HERO_VIEW.target, true);
      return;
    }
    const { x0, z0, x1, z1 } = room.bounds;
    const cx = (x0 + x1) / 2;
    const cz = (z0 + z1) / 2;
    const size = Math.max(x1 - x0, z1 - z0);
    const floor = roomFloorY(room);
    const distance = Math.max(9, size * 1.25);
    void current.setLookAt(cx + distance * 0.35, floor + distance * 0.85, cz - distance * 0.75, cx, floor + 0.6, cz, true);
  }, [focusNonce, selectedRoomId]);

  useFrame((_, rawDelta) => {
    const current = controls.current;
    if (!current) return;
    const delta = Math.min(rawDelta, 0.05);
    const pressed = keys.current;
    const forward = axis(pressed, ["KeyS", "ArrowDown"], ["KeyW", "ArrowUp"]) + touchInput.moveY;
    const strafe = axis(pressed, ["KeyA", "ArrowLeft"], ["KeyD", "ArrowRight"]) + touchInput.moveX;
    const rotate = axis(pressed, ["KeyE"], ["KeyQ"]);
    const zoom = axis(pressed, ["KeyF", "Minus"], ["KeyR", "Equal"]);
    if (forward || strafe) {
      const speed = Math.max(4, current.distance * 0.9) * (pressed.has("ShiftLeft") || pressed.has("ShiftRight") ? 2.2 : 1);
      const azimuth = current.azimuthAngle;
      // Ground-plane movement relative to the view direction.
      const dx = (-Math.sin(azimuth) * forward + Math.cos(azimuth) * strafe) * speed * delta;
      const dz = (-Math.cos(azimuth) * forward - Math.sin(azimuth) * strafe) * speed * delta;
      current.getTarget(target);
      void current.moveTo(target.x + dx, target.y, target.z + dz, false);
    }
    if (rotate) void current.rotate(rotate * 1.4 * delta, 0, false);
    if (zoom) void current.dolly(zoom * current.distance * 1.4 * delta, false);

    // Keep the camera above the mountain.
    const ground = terrainHeight(camera.position.x, camera.position.z) + 1.5;
    if (camera.position.y < ground) {
      current.getTarget(target);
      void current.setLookAt(camera.position.x, ground, camera.position.z, target.x, target.y, target.z, false);
    }
  });

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={2.5}
      maxDistance={260}
      maxPolarAngle={Math.PI * 0.495}
      smoothTime={0.35}
      draggingSmoothTime={0.12}
      dollyToCursor
    />
  );
}
