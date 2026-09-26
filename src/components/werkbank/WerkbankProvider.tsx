"use client";

import { ArrowLeft, CircleCheck, TriangleAlert, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EntityKind } from "@/lib/werkbank/actions/records";
import { RECORD_KIND_LABELS, type RecordRef } from "@/lib/werkbank/types";
import { useWerkbank, WerkbankContext, type DrawerView } from "./context";
import { EntityFormView } from "./forms/EntityForms";
import { EventForm } from "./forms/EventForm";
import { RecordView } from "./RecordView";
import { VirtualOfficeHourView } from "./VirtualOfficeHourView";

// Global state of the Werkbank: the side drawer (a stack of record views and forms, so every
// linked record can be opened and left again with "Zurück") and the toast messages.

interface Toast {
  id: number;
  message: string;
  tone: "ok" | "error";
}

const ENTITY_LABELS: Record<EntityKind, string> = {
  customer: "Kunde",
  project: "Projekt",
  floorPass: "Boden-Pass",
  tool: "Werkzeug",
  subscription: "Abo",
  partner: "Partner",
  officeHour: "Sprechstunde",
  rental: "Verleih planen",
};

function crumbLabel(view: DrawerView): string {
  switch (view.type) {
    case "record":
      return RECORD_KIND_LABELS[view.ref.kind];
    case "eventForm":
      return view.eventId ? "Termin bearbeiten" : "Neuer Termin";
    case "entityForm":
      return view.entity === "rental" ? ENTITY_LABELS.rental : `${ENTITY_LABELS[view.entity]} ${view.id ? "bearbeiten" : "anlegen"}`;
    case "virtualOfficeHour":
      return "Sprechstunde (Vorschlag)";
  }
}

function viewKey(view: DrawerView): string {
  switch (view.type) {
    case "record":
      return `record:${view.ref.kind}:${view.ref.id}`;
    case "eventForm":
      return `eventForm:${view.eventId ?? "new"}:${JSON.stringify(view.prefill ?? {})}`;
    case "entityForm":
      return `entityForm:${view.entity}:${view.id ?? "new"}:${JSON.stringify(view.prefill ?? {})}`;
    case "virtualOfficeHour":
      return `virtual:${view.startsAt}`;
  }
}

export function WerkbankProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<DrawerView[]>([]);
  const [version, setVersion] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const returnFocus = useRef<HTMLElement | null>(null);

  const open = useCallback((view: DrawerView) => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) returnFocus.current = document.activeElement;
    setStack([view]);
  }, []);
  const push = useCallback((view: DrawerView) => {
    setStack((current) => {
      const top = current[current.length - 1];
      if (top && viewKey(top) === viewKey(view)) return current;
      return [...current, view].slice(-12);
    });
  }, []);
  const back = useCallback(() => setStack((current) => current.slice(0, -1)), []);
  const close = useCallback(() => {
    setStack([]);
    const target = returnFocus.current;
    // Focus after the re-render: the page is inert until the drawer is gone.
    window.setTimeout(() => {
      if (target && document.body.contains(target)) target.focus({ preventScroll: true });
    }, 0);
  }, []);
  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  const showSaved = useCallback((ref: RecordRef) => {
    setStack((current) => {
      const below = current[current.length - 2];
      if (below?.type === "record" && below.ref.kind === ref.kind && below.ref.id === ref.id) return current.slice(0, -1);
      return [...current.slice(0, -1), { type: "record", ref }];
    });
    setVersion((value) => value + 1);
  }, []);
  const afterDelete = useCallback(() => {
    setStack((current) => current.slice(0, -1));
    setVersion((value) => value + 1);
  }, []);
  const toast = useCallback((message: string, tone: "ok" | "error" = "ok") => {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((current) => [...current.slice(-3), { id, message, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), tone === "error" ? 8000 : 5000);
  }, []);

  const value = useMemo(
    () => ({ stack, version, open, push, back, close, showSaved, afterDelete, refresh, toast }),
    [stack, version, open, push, back, close, showSaved, afterDelete, refresh, toast],
  );

  return (
    <WerkbankContext.Provider value={value}>
      {/* While the drawer is open, the page behind it is inert (no focus, no clicks). */}
      <div className="h-full" inert={stack.length > 0}>
        {children}
      </div>
      <Drawer />
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 sm:items-start sm:pl-6" aria-live="polite">
        {toasts.map((item) => (
          <div
            key={item.id}
            role={item.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex max-w-md items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur ${
              item.tone === "error" ? "border-red-400/30 bg-red-950/90 text-red-100" : "border-emerald-400/25 bg-studio-panel/95 text-studio-text"
            }`}
          >
            {item.tone === "error" ? (
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-300" aria-hidden />
            ) : (
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden />
            )}
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </WerkbankContext.Provider>
  );
}

function Drawer() {
  const { stack, back, close } = useWerkbank();
  const panel = useRef<HTMLElement>(null);
  const top = stack[stack.length - 1];
  const topKey = top ? viewKey(top) : null;

  useEffect(() => {
    if (!topKey) return;
    const heading = panel.current?.querySelector<HTMLElement>("[data-drawer-title]");
    (heading ?? panel.current)?.focus({ preventScroll: true });
  }, [topKey]);

  useEffect(() => {
    if (!topKey) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [topKey, close]);

  if (!top) return null;
  const previous = stack.slice(0, -1);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={close} aria-hidden />
      <section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={crumbLabel(top)}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full flex-col border-l border-studio-line bg-studio-panel shadow-2xl outline-none sm:w-[36rem]"
      >
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-studio-line px-3">
          {previous.length > 0 ? (
            <button type="button" onClick={back} className="rounded-lg p-2 text-studio-muted transition hover:bg-white/10 hover:text-white" aria-label="Zurück">
              <ArrowLeft className="size-4" aria-hidden />
            </button>
          ) : null}
          <nav aria-label="Verlauf" className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden text-xs text-studio-muted">
            {previous.slice(-2).map((view, index) => (
              <span key={`${viewKey(view)}-${index}`} className="flex min-w-0 items-center gap-1.5">
                <span className="truncate">{crumbLabel(view)}</span>
                <span aria-hidden>›</span>
              </span>
            ))}
            <span className="truncate font-medium text-studio-text">{crumbLabel(top)}</span>
          </nav>
          <button type="button" onClick={close} className="rounded-lg p-2 text-studio-muted transition hover:bg-white/10 hover:text-white" aria-label="Schließen">
            <X className="size-4" aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <DrawerBody key={topKey} view={top} />
        </div>
      </section>
    </div>
  );
}

function DrawerBody({ view }: { view: DrawerView }) {
  switch (view.type) {
    case "record":
      return <RecordView refValue={view.ref} />;
    case "eventForm":
      return <EventForm eventId={view.eventId ?? null} prefill={view.prefill} />;
    case "entityForm":
      return <EntityFormView entity={view.entity} id={view.id ?? null} prefill={view.prefill} />;
    case "virtualOfficeHour":
      return <VirtualOfficeHourView startsAt={view.startsAt} topic={view.topic} durationMinutes={view.durationMinutes} />;
  }
}
