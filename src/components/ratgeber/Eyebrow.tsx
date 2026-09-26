import type { ReactNode } from "react";

/** Mono, letter-spaced label above headings (Aufmaß style). */
export function Eyebrow({
  children,
  tone = "kreide",
  className = "",
}: {
  children: ReactNode;
  tone?: "kreide" | "muted" | "light";
  className?: string;
}) {
  const color = tone === "kreide" ? "text-kreide" : tone === "light" ? "text-kreide-light" : "text-graphit-muted";
  return (
    <p className={`font-mono text-[11px] font-medium uppercase tracking-[0.12em] sm:text-xs ${color} ${className}`}>
      {children}
    </p>
  );
}
