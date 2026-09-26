"use client";

import { useRef, useState } from "react";
import { touchInput } from "./store";

const RADIUS = 48;

/** Virtual thumb stick. `target` decides whether it drives movement or looking. */
export function Joystick({ target, label }: { target: "move" | "look"; label: string }) {
  const base = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const write = (x: number, y: number) => {
    if (target === "move") {
      touchInput.moveX = x;
      touchInput.moveY = y;
    } else {
      touchInput.lookDeltaX = x;
      touchInput.lookDeltaY = -y;
    }
  };

  const update = (clientX: number, clientY: number) => {
    const rect = base.current?.getBoundingClientRect();
    if (!rect) return;
    let dx = clientX - (rect.left + rect.width / 2);
    let dy = clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(dx, dy);
    if (distance > RADIUS) {
      dx = (dx / distance) * RADIUS;
      dy = (dy / distance) * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    write(dx / RADIUS, -dy / RADIUS);
  };

  const release = () => {
    pointer.current = null;
    setKnob({ x: 0, y: 0 });
    write(0, 0);
  };

  return (
    <div
      ref={base}
      role="application"
      aria-label={label}
      className="pointer-events-auto relative size-32 touch-none select-none rounded-full border border-white/15 bg-black/30 backdrop-blur-md"
      onPointerDown={(event) => {
        pointer.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        update(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (pointer.current === event.pointerId) update(event.clientX, event.clientY);
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <span className="pointer-events-none absolute inset-0 grid place-items-center text-[10px] font-semibold uppercase tracking-widest text-white/40">
        {label}
      </span>
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 size-14 rounded-full border border-white/40 bg-white/25 shadow-lg"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}
