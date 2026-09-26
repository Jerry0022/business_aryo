"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { Hud } from "./ui/Hud";
import { useStudio } from "./ui/store";

const Scene = dynamic(() => import("./scene/Scene"), { ssr: false });

let webglSupport: boolean | undefined;

function hasWebGL(): boolean {
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

function LoadingOverlay() {
  const ready = useStudio((state) => state.ready);
  return (
    <div
      aria-hidden={ready}
      className={`pointer-events-none absolute inset-0 z-30 grid place-items-center bg-studio-bg transition-opacity duration-700 ${
        ready ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="size-10 animate-spin rounded-full border-2 border-oak/30 border-t-oak" aria-hidden />
        <p className="font-display text-lg">Traumhaus wird gebaut …</p>
        <p className="max-w-xs text-sm text-studio-muted">Berg, Stadt und Räume werden direkt in Ihrem Browser erzeugt.</p>
      </div>
    </div>
  );
}

/** Interactive 3D dream house studio (client only). */
export function DreamHouse() {
  // null during SSR, the real capability on the client.
  const supported = useSyncExternalStore<boolean | null>(subscribeNever, hasWebGL, () => null);
  const quality = useStudio((state) => state.quality);

  if (supported === false) {
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <div className="max-w-md space-y-3">
          <p className="font-display text-2xl">3D wird nicht unterstützt</p>
          <p className="text-sm text-studio-muted">
            Ihr Browser stellt kein WebGL bereit. Bitte aktivieren Sie die Hardwarebeschleunigung oder nutzen Sie einen aktuellen
            Browser (Chrome, Edge, Safari, Firefox).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="dream-house-root" className="relative h-full w-full overflow-hidden bg-studio-bg">
      {supported ? <Scene key={quality} /> : null}
      <Hud />
      <LoadingOverlay />
    </div>
  );
}
