import { clamp, lerp, smoothstep } from "./random";

export const SUNRISE_HOUR = 6.5;
export const SUNSET_HOUR = 20;
const MAX_ELEVATION = (62 * Math.PI) / 180;

export type Vec3 = [number, number, number];

export interface SkyState {
  /** Normalized direction towards the sun (y < 0 = below horizon). */
  sunDirection: Vec3;
  /** Normalized direction towards the moon. */
  moonDirection: Vec3;
  /** 1 in full daylight, 0 at night. */
  day: number;
  /** 1 at night, 0 in daylight (drives lamps, city lights, stars). */
  night: number;
  /** 0..1, strongest around sunrise/sunset. */
  golden: number;
  sunColor: string;
  sunIntensity: number;
  moonIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  /** Strength of the sky reflection/ambient environment map. */
  environmentIntensity: number;
  fogColor: string;
  exposure: number;
}

/** Wraps any hour value into [0, 24). */
export function normalizeHour(hour: number): number {
  return ((hour % 24) + 24) % 24;
}

export function formatHour(hour: number): string {
  const h = normalizeHour(hour);
  const hours = Math.floor(h);
  const minutes = Math.floor((h - hours) * 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Sun path: rises in the east (+x), culminates over the valley (-z, where the city is) and sets in
 * the west (-x). The house faces the valley, so the facade is sunlit from late morning on.
 */
export function sunDirectionAt(hour: number): Vec3 {
  const t = (normalizeHour(hour) - SUNRISE_HOUR) / (SUNSET_HOUR - SUNRISE_HOUR);
  const elevation = MAX_ELEVATION * Math.sin(Math.PI * t);
  const azimuth = Math.PI * t;
  const horizontal = Math.cos(elevation);
  const x = Math.cos(azimuth) * horizontal;
  const z = -Math.sin(azimuth) * horizontal * 0.85 - 0.15 * horizontal;
  const y = Math.sin(elevation);
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
}

function mixColor(a: string, b: string, t: number): string {
  const pa = Number.parseInt(a.slice(1), 16);
  const pb = Number.parseInt(b.slice(1), 16);
  const channel = (shift: number) => Math.round(lerp((pa >> shift) & 255, (pb >> shift) & 255, clamp(t, 0, 1)));
  return `#${((channel(16) << 16) | (channel(8) << 8) | channel(0)).toString(16).padStart(6, "0")}`;
}

export function skyStateAt(hour: number): SkyState {
  const sunDirection = sunDirectionAt(hour);
  const sunY = sunDirection[1];
  const day = smoothstep(-0.1, 0.12, sunY);
  const night = 1 - day;
  const golden = smoothstep(-0.08, 0.05, sunY) * (1 - smoothstep(0.08, 0.35, sunY));
  const highSun = smoothstep(0.02, 0.55, sunY);

  const sunColor = mixColor("#ff9a55", "#fff3e2", highSun);
  const hemiSky = mixColor(mixColor("#1a2744", "#f0b489", golden), "#bcd3ec", highSun * day);
  const hemiGround = mixColor("#0b0d12", "#7a6a55", day);
  const fogDay = mixColor("#e7b79b", "#c3d3e2", highSun);
  const fogColor = mixColor("#0a1020", fogDay, day);

  return {
    sunDirection,
    moonDirection: [-0.35, 0.62, -0.7],
    day,
    night,
    golden,
    sunColor,
    sunIntensity: day * (1.6 + 1.6 * highSun),
    moonIntensity: night * 0.45,
    hemiSky,
    hemiGround,
    hemiIntensity: lerp(0.3, 0.35, day),
    environmentIntensity: lerp(0.05, 0.42, day),
    fogColor,
    exposure: lerp(1.15, 1, day),
  };
}
