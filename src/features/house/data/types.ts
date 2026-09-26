import type { ItemType } from "../models/catalog";
import type { MaterialKey, MaterialSlot } from "../models/materials";

export type Level = "ground" | "roof";

/** Axis-aligned rectangle on the ground plane (meters). */
export interface Rect {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
}

export type FloorKind = "herringbone" | "planks" | "stone" | "deck";

export interface RoomItem {
  id: string;
  type: ItemType;
  /** German label shown in the room panel. */
  label: string;
  /** World position [x, z] or [x, z, yOffset]; yOffset is relative to the room's floor level. */
  at: [number, number] | [number, number, number];
  /** Rotation around Y in degrees. At 0° a model's front faces -z (towards the valley). */
  rot?: number;
  /** Material slot overrides, e.g. `{ fabric: "fabricSage" }`. */
  mats?: Partial<Record<MaterialSlot, MaterialKey>>;
}

export interface Room {
  id: string;
  name: string;
  level: Level;
  bounds: Rect;
  floor: FloorKind;
  /** Walk-mode start: [x, z, yaw in degrees]; yaw 0 looks towards -z. */
  spawn: [number, number, number];
  /** Ceiling / ambient light spots that switch on at night: [x, z]. */
  lights: [number, number][];
  items: RoomItem[];
}

export type OpeningKind =
  /** Walkable gap without door leaf. */
  | "passage"
  /** Walkable gap with a door frame. */
  | "door"
  /** Open sliding glass door (walkable). */
  | "slider"
  /** Fixed glazing (blocks). */
  | "glass"
  /** Window with sill (blocks). */
  | "window";

export interface Opening {
  /** Distance from the wall's start point `a` (meters). */
  from: number;
  to: number;
  kind: OpeningKind;
  /** Sill height (default 0). */
  bottom?: number;
  /** Head height (default: door 2.4, glass/slider 2.8, window 2.4). */
  top?: number;
}

export interface Wall {
  id: string;
  /** Start and end point [x, z]; walls are axis-aligned. */
  a: [number, number];
  b: [number, number];
  thickness: number;
  height: number;
  exterior: boolean;
  openings: Opening[];
}

/** Axis-aligned 3D box used for collisions. */
export interface Box3Like {
  min: [number, number, number];
  max: [number, number, number];
}

/** Horizontal walkable surface. */
export interface Surface extends Rect {
  y: number;
}
