import type { ReactNode } from "react";

/** Mono, letter-spaced label above headings (Aufmaß style). */
export function Eyebrow({
  children,
  tone = "kupfer",
  className = "",
}: {
  children: ReactNode;
  tone?: "kupfer" | "muted" | "light";
  className?: string;
}) {
  const color = tone === "kupfer" ? "text-kupfer" : tone === "light" ? "text-kupfer-light" : "text-nuss-muted";
  return (
    <p className={`font-mono text-[11px] font-medium uppercase tracking-[0.12em] sm:text-xs ${color} ${className}`}>
      {children}
    </p>
  );
}
