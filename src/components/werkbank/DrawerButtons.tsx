"use client";

import type { RecordKind } from "@/lib/werkbank/types";
import { useWerkbank, type DrawerView } from "./context";
import { buttonClass, cx } from "./ui";

// Client leaves that let server-rendered pages open records and forms in the drawer.
// Icons are passed as rendered children (component references cannot cross the server boundary).

export function OpenRecord({
  kind,
  id,
  children,
  className,
  label,
}: {
  kind: RecordKind;
  id: string;
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  const { open } = useWerkbank();
  return (
    <button type="button" aria-label={label} onClick={() => open({ type: "record", ref: { kind, id } })} className={className}>
      {children}
    </button>
  );
}

export function OpenDrawer({
  view,
  children,
  variant = "secondary",
  size = "md",
  className,
  plain = false,
}: {
  view: DrawerView;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  className?: string;
  /** Renders without button styling (for list rows). */
  plain?: boolean;
}) {
  const { open } = useWerkbank();
  return (
    <button type="button" onClick={() => open(view)} className={plain ? className : cx(buttonClass(variant, size), className)}>
      {children}
    </button>
  );
}
