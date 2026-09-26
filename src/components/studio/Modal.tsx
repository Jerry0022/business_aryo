"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-studio-line bg-studio-panel p-0 text-studio-text shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      {open ? (
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 className="font-display text-xl font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-studio-muted transition hover:bg-white/10 hover:text-white"
              aria-label="Schließen"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
