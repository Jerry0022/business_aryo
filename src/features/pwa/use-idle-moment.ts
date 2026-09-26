"use client";

import { useEffect, useRef } from "react";

/** Scrolling, clicking/tapping and typing count as activity; plain mouse movement does not. */
const ACTIVITY_EVENTS = ["scroll", "wheel", "touchstart", "touchmove", "pointerdown", "keydown", "input"] as const;

function isEditing(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false;
  return element.isContentEditable || element.matches("input, textarea, select");
}

/**
 * Calls `onIdle` once, at the first calm moment: the visitor has interacted with the page at least once
 * and has then neither scrolled, clicked nor typed for `quietMs`. It does not fire while the tab is in the
 * background or a form field has focus (someone pausing mid-sentence should not be interrupted).
 */
export function useIdleMoment(enabled: boolean, onIdle: () => void, quietMs = 3000): void {
  const onIdleRef = useRef(onIdle);
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  useEffect(() => {
    if (!enabled) return;
    let interacted = false;
    let timer: number | undefined;

    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(check, quietMs);
    };
    const check = () => {
      if (document.visibilityState !== "visible" || isEditing(document.activeElement)) {
        arm();
        return;
      }
      stop();
      onIdleRef.current();
    };
    const onActivity = () => {
      interacted = true;
      arm();
    };
    const onVisibility = () => {
      if (interacted) arm();
    };
    const options = { capture: true, passive: true } as const;
    const stop = () => {
      window.clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((type) => window.removeEventListener(type, onActivity, options));
      document.removeEventListener("visibilitychange", onVisibility);
    };

    ACTIVITY_EVENTS.forEach((type) => window.addEventListener(type, onActivity, options));
    document.addEventListener("visibilitychange", onVisibility);
    return stop;
  }, [enabled, quietMs]);
}
