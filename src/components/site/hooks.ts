"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** true when the visitor asked for less motion (false during SSR). */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

let webglSupport: boolean | undefined;

function detectWebGL(): boolean {
  if (webglSupport === undefined) {
    try {
      const canvas = document.createElement("canvas");
      webglSupport = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

const subscribeNever = () => () => undefined;

/** null during SSR, then whether the browser can render WebGL. */
export function useWebGLSupport(): boolean | null {
  return useSyncExternalStore<boolean | null>(subscribeNever, detectWebGL, () => null);
}

/**
 * Tracks whether an element is within `margin` of the viewport. `once` keeps the first `true`
 * (used to lazy-load heavy parts exactly once).
 */
export function useNearViewport(ref: RefObject<Element | null>, margin = "300px", once = false): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        setNear((previous) => (once && previous ? true : visible));
        if (visible && once) observer.disconnect();
      },
      { rootMargin: margin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, margin, once]);
  return near;
}
