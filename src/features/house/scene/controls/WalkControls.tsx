"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getRoom, roomFloorY, ROOMS } from "../../data/rooms";
import { buildCollisionWorld, movePlayer, PLAYER, type PlayerState } from "../../engine/collision";
import { touchInput, useStudio } from "../../ui/store";
import { axis, useKeyboard } from "./useKeyboard";

const LOOK_SPEED = 0.0022;
const TOUCH_LOOK_SPEED = 0.0045;
const MAX_PITCH = Math.PI / 2 - 0.05;

function spawnState(roomId: string | null): { player: PlayerState; yaw: number } {
  const room = (roomId && getRoom(roomId)) || getRoom("living")!;
  const [x, z, yawDeg] = room.spawn;
  return {
    player: { x, y: roomFloorY(room), z, vy: 0, grounded: true },
    yaw: (yawDeg * Math.PI) / 180,
  };
}

/** First-person walking: WASD / arrows + mouse look (pointer lock) or touch joystick + drag. */
export function WalkControls() {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const keys = useKeyboard();
  const world = useMemo(() => buildCollisionWorld(ROOMS), []);
  const focusNonce = useStudio((state) => state.focusNonce);
  const setPointerLocked = useStudio((state) => state.setPointerLocked);

  const player = useRef<PlayerState>({ x: 0, y: 0, z: 0, vy: 0, grounded: true });
  const yaw = useRef(0);
  const pitch = useRef(-0.05);
  const eyeY = useRef<number>(PLAYER.eyeHeight);

  // (Re)spawn whenever walk mode starts or a room is picked.
  useEffect(() => {
    const spawn = spawnState(useStudio.getState().selectedRoomId);
    player.current = spawn.player;
    yaw.current = spawn.yaw;
    pitch.current = -0.05;
    eyeY.current = spawn.player.y + PLAYER.eyeHeight;
  }, [focusNonce]);

  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera;
    const previous = { fov: perspective.fov, near: perspective.near };
    perspective.fov = 70;
    perspective.near = 0.05;
    perspective.updateProjectionMatrix();
    return () => {
      perspective.fov = previous.fov;
      perspective.near = previous.near;
      perspective.updateProjectionMatrix();
    };
  }, [camera]);

  useEffect(() => {
    const canvas = gl.domElement;
    let dragging: { id: number; x: number; y: number } | null = null;

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button === 0 && document.pointerLockElement !== canvas) {
        canvas.requestPointerLock?.();
        return;
      }
      if (event.pointerType !== "mouse" && !dragging) {
        dragging = { id: event.pointerId, x: event.clientX, y: event.clientY };
      }
    };
    const onPointerMove = (event: PointerEvent) => {
      if (dragging && event.pointerId === dragging.id) {
        yaw.current -= (event.clientX - dragging.x) * TOUCH_LOOK_SPEED;
        pitch.current = THREE.MathUtils.clamp(pitch.current - (event.clientY - dragging.y) * TOUCH_LOOK_SPEED, -MAX_PITCH, MAX_PITCH);
        dragging.x = event.clientX;
        dragging.y = event.clientY;
      }
    };
    const onPointerUp = (event: PointerEvent) => {
      if (dragging && event.pointerId === dragging.id) dragging = null;
    };
    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      yaw.current -= event.movementX * LOOK_SPEED;
      pitch.current = THREE.MathUtils.clamp(pitch.current - event.movementY * LOOK_SPEED, -MAX_PITCH, MAX_PITCH);
    };
    const onLockChange = () => setPointerLocked(document.pointerLockElement === canvas);

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("pointerlockchange", onLockChange);
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      if (document.pointerLockElement === canvas) document.exitPointerLock?.();
      setPointerLocked(false);
    };
  }, [gl, setPointerLocked]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const pressed = keys.current;

    // Joystick look (right stick on touch devices).
    if (touchInput.lookDeltaX || touchInput.lookDeltaY) {
      yaw.current -= touchInput.lookDeltaX * 2.4 * delta;
      pitch.current = THREE.MathUtils.clamp(pitch.current - touchInput.lookDeltaY * 1.6 * delta, -MAX_PITCH, MAX_PITCH);
    }
    const turn = axis(pressed, ["KeyE"], ["KeyQ"]);
    if (turn) yaw.current += turn * 1.8 * delta;

    let forward = axis(pressed, ["KeyS", "ArrowDown"], ["KeyW", "ArrowUp"]) + touchInput.moveY;
    let strafe = axis(pressed, ["KeyA", "ArrowLeft"], ["KeyD", "ArrowRight"]) + touchInput.moveX;
    const length = Math.hypot(forward, strafe);
    if (length > 1) {
      forward /= length;
      strafe /= length;
    }
    const running = pressed.has("ShiftLeft") || pressed.has("ShiftRight") || Math.hypot(touchInput.moveX, touchInput.moveY) > 0.95;
    const speed = running ? PLAYER.runSpeed : PLAYER.walkSpeed;
    const sin = Math.sin(yaw.current);
    const cos = Math.cos(yaw.current);
    const dx = (-sin * forward + cos * strafe) * speed * delta;
    const dz = (-cos * forward - sin * strafe) * speed * delta;
    player.current = movePlayer(world, player.current, dx, dz, delta);

    const targetEye = player.current.y + PLAYER.eyeHeight;
    eyeY.current = THREE.MathUtils.damp(eyeY.current, targetEye, 14, delta);
    camera.position.set(player.current.x, eyeY.current, player.current.z);
    camera.rotation.set(pitch.current, yaw.current, 0, "YXZ");
  });

  return null;
}
