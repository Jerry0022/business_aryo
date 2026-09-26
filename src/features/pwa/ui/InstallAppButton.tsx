"use client";

import { Download, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { isInstallable, promptInstall, useInstallState } from "../install-store";
import { isManualInstallPlatform } from "../platform";
import { InstallSteps } from "./InstallSteps";

/**
 * "App installieren" link for the footer. Opens the browser's install dialog directly where one exists
 * (Chrome, Edge, Samsung Internet on Windows, Android, Mac, Linux); elsewhere it shows the steps.
 * Hidden when the site already runs as an app or cannot be installed in this browser.
 */
export function InstallAppButton({ className }: { className?: string }) {
  const install = useInstallState();
  const [guideOpen, setGuideOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (guideOpen && !dialog.open) dialog.showModal();
    if (!guideOpen && dialog.open) dialog.close();
  }, [guideOpen]);

  if (!isInstallable(install)) return null;

  const onClick = async () => {
    if (install.canPrompt && (await promptInstall()) !== "unavailable") return;
    if (isManualInstallPlatform(install.platform)) setGuideOpen(true);
  };

  return (
    <>
      <button type="button" onClick={() => void onClick()} className={className}>
        <Download className="size-3.5" aria-hidden="true" />
        App installieren
      </button>
      {isManualInstallPlatform(install.platform) ? (
        <dialog
          ref={dialogRef}
          aria-labelledby="install-guide-title"
          onClose={() => setGuideOpen(false)}
          onClick={(event) => {
            if (event.target === dialogRef.current) setGuideOpen(false);
          }}
          className="site-light m-auto w-[min(26rem,calc(100vw-2rem))] rounded-[1.5rem] bg-paper p-0 text-ink shadow-2xl ring-1 ring-ink/10 backdrop:bg-ink/60 backdrop:backdrop-blur-sm"
        >
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 id="install-guide-title" className="font-display text-2xl font-medium leading-tight">
                Als App installieren
              </h2>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="-mr-1.5 -mt-1 rounded-full p-1.5 text-ink-muted transition hover:bg-ink/5 hover:text-ink"
                aria-label="Schließen"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Mit einem Tipp auf das App-Symbol sind Sie direkt hier – ohne App-Store, ohne Anmeldung.
            </p>
            <InstallSteps platform={install.platform} className="mt-5 text-[0.95rem] leading-relaxed text-ink-soft" />
          </div>
        </dialog>
      ) : null}
    </>
  );
}
