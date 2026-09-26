import { create } from "zustand";
import { normalizeHour, skyStateAt, type SkyState } from "../engine/sun";
import type { Quality } from "../models/materials";

export type ViewMode = "overview" | "walk";

interface StudioState {
  mode: ViewMode;
  /** Current time of day in hours [0, 24). */
  hour: number;
  quality: Quality;
  roofHidden: boolean;
  selectedRoomId: string | null;
  /** Incremented to ask the camera to fly to / spawn in the selected room. */
  focusNonce: number;
  pointerLocked: boolean;
  /** True once walk mode was used (the overview then lifts off from the walker's position). */
  hasWalked: boolean;
  ready: boolean;
  setMode: (mode: ViewMode) => void;
  setHour: (hour: number, animate?: boolean) => void;
  setQuality: (quality: Quality) => void;
  setRoofHidden: (hidden: boolean) => void;
  focusRoom: (roomId: string | null) => void;
  setPointerLocked: (locked: boolean) => void;
  setReady: () => void;
}

const QUALITY_STORAGE_KEY = "dream-house-quality";
const QUALITIES: Quality[] = ["high", "medium", "low"];

let hourTween: number | null = null;

function cancelHourTween() {
  if (hourTween !== null && typeof window !== "undefined") window.cancelAnimationFrame(hourTween);
  hourTween = null;
}

/** Eases the clock along the shorter way around the day (independent of the 3D render loop). */
function tweenHour(from: number, to: number, apply: (hour: number) => void, duration = 1400) {
  let diff = normalizeHour(to) - normalizeHour(from);
  if (diff > 12) diff -= 24;
  if (diff < -12) diff += 24;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    apply(normalizeHour(from + diff * eased));
    hourTween = t < 1 ? window.requestAnimationFrame(step) : null;
  };
  hourTween = window.requestAnimationFrame(step);
}

function detectQuality(): Quality {
  if (typeof window === "undefined") return "medium";
  const fromUrl = new URLSearchParams(window.location.search).get("quality");
  if (fromUrl && QUALITIES.includes(fromUrl as Quality)) return fromUrl as Quality;
  try {
    const stored = window.localStorage.getItem(QUALITY_STORAGE_KEY);
    if (stored && QUALITIES.includes(stored as Quality)) return stored as Quality;
  } catch {
    // Storage can be unavailable (private mode); fall back to detection.
  }
  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const cores = navigator.hardwareConcurrency ?? 4;
  if (coarse || small) return cores >= 8 ? "medium" : "low";
  return cores >= 4 ? "high" : "medium";
}

export const useStudio = create<StudioState>((set, get) => ({
  mode: "overview",
  hour: 18.8,
  quality: detectQuality(),
  roofHidden: false,
  selectedRoomId: null,
  focusNonce: 0,
  pointerLocked: false,
  hasWalked: false,
  ready: false,
  setMode: (mode) =>
    set({ mode, focusNonce: get().focusNonce + 1, ...(mode === "walk" ? { roofHidden: false, hasWalked: true } : {}) }),
  setHour: (hour, animate = false) => {
    cancelHourTween();
    if (animate) tweenHour(get().hour, hour, (value) => set({ hour: value }));
    else set({ hour: normalizeHour(hour) });
  },
  setQuality: (quality) => {
    try {
      window.localStorage.setItem(QUALITY_STORAGE_KEY, quality);
    } catch {
      // Not persisted — the choice still applies to this session.
    }
    set({ quality });
  },
  setRoofHidden: (roofHidden) => set({ roofHidden: get().mode === "walk" ? false : roofHidden }),
  focusRoom: (selectedRoomId) => set({ selectedRoomId, focusNonce: get().focusNonce + 1 }),
  setPointerLocked: (pointerLocked) => set({ pointerLocked }),
  setReady: () => set({ ready: true }),
}));

/** Per-frame values shared by scene components without React re-renders. */
export const frameState: { sky: SkyState; time: number } = {
  sky: skyStateAt(18.8),
  time: 0,
};

/** Movement input from on-screen joysticks / touch look (consumed by the controls). */
export const touchInput = {
  moveX: 0,
  moveY: 0,
  lookDeltaX: 0,
  lookDeltaY: 0,
};
