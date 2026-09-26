"use client";

import { useEffect, useRef } from "react";

const TEXT_INPUT = /^(INPUT|TEXTAREA|SELECT)$/;

/** Tracks currently pressed keys (KeyboardEvent.code); ignores typing in form fields. */
export function useKeyboard() {
  const pressed = useRef(new Set<string>());

  useEffect(() => {
    const keys = pressed.current;
    const onDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (TEXT_INPUT.test(target.tagName) || target.isContentEditable)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      keys.add(event.code);
      if (event.code.startsWith("Arrow") || event.code === "Space") event.preventDefault();
    };
    const onUp = (event: KeyboardEvent) => keys.delete(event.code);
    const clear = () => keys.clear();
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", clear);
    };
  }, []);

  return pressed;
}

/** -1/0/1 axis from two sets of key codes. */
export function axis(keys: Set<string>, negative: string[], positive: string[]): number {
  const neg = negative.some((code) => keys.has(code)) ? 1 : 0;
  const pos = positive.some((code) => keys.has(code)) ? 1 : 0;
  return pos - neg;
}
