import type { ReactNode } from "react";

// Shared building blocks of the "Werkstatt" design: oiled linen and dark walnut surfaces, copper accent,
// a soft serif for headlines and the Aufmaß details (mono labels, dimension lines). Hook-free (server-safe).

export const container = "mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-12 xl:px-20";

export const buttonPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2.5 rounded-full bg-kupfer text-center px-6 py-3 text-[0.95rem] font-semibold text-creme shadow-[0_10px_24px_-14px_rgb(124_53_18/0.9)] transition-[background-color,transform] hover:-translate-y-px hover:bg-kupfer-deep disabled:cursor-wait disabled:opacity-70";

/** Primary action on walnut surfaces: glowing copper with dark text. */
export const buttonOnDark =
  "inline-flex min-h-11 items-center justify-center gap-2.5 rounded-full bg-kupfer-light text-center px-6 py-3 text-[0.95rem] font-semibold text-nuss shadow-[0_12px_32px_-14px_rgb(233_165_116/0.7)] transition-[background-color,transform] hover:-translate-y-px hover:bg-[#f2b98f] disabled:cursor-wait disabled:opacity-70";

export const buttonSecondary =
  "inline-flex min-h-11 items-center justify-center gap-2.5 rounded-full border border-nuss/30 px-6 py-3 text-[0.95rem] font-semibold text-nuss transition-colors hover:border-nuss hover:bg-creme";

export const textLink =
  "inline-flex items-center gap-2 font-semibold text-kupfer underline decoration-kupfer/35 decoration-1 underline-offset-4 transition-colors hover:text-kupfer-deep hover:decoration-kupfer-deep";

export const eyebrow = "font-mono text-xs uppercase tracking-[0.14em]";

export const card =
  "rounded-2xl border border-fuge/80 bg-creme shadow-[0_1px_0_rgb(255_255_255/0.7)_inset,0_22px_44px_-34px_rgb(35_25_19/0.45)]";

export function ArrowIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

export function CheckIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M3 8.5l3.2 3L13 4.5" />
    </svg>
  );
}

interface DimensionLineProps {
  label: string;
  /** Background behind the label, must match the surface (e.g. "bg-leinen"). */
  labelBg?: string;
  /** Colour of line and label. */
  tone?: string;
  className?: string;
}

/** Bemaßungslinie: extension lines, 45° ticks and a centred measurement label. */
export function DimensionLine({
  label,
  labelBg = "bg-leinen",
  tone = "text-kupfer",
  className = "",
}: DimensionLineProps) {
  return (
    <div className={`relative h-[22px] ${tone} ${className}`}>
      <span className="absolute inset-y-0 left-0 w-px bg-current" aria-hidden="true" />
      <span className="absolute inset-y-0 right-0 w-px bg-current" aria-hidden="true" />
      <span className="absolute -left-[5px] top-1 h-3.5 w-px rotate-45 bg-current" aria-hidden="true" />
      <span className="absolute -right-[5px] top-1 h-3.5 w-px rotate-45 bg-current" aria-hidden="true" />
      <span className="absolute inset-x-0 top-[11px] h-px bg-current" aria-hidden="true" />
      <span
        className={`absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap px-2.5 font-mono text-[0.6875rem] leading-[22px] tracking-[0.1em] sm:text-xs ${labelBg}`}
      >
        {label}
      </span>
    </div>
  );
}

interface SectionHeaderProps {
  /** Section id; the heading gets `${id}-title`. */
  id: string;
  label: string;
  title: ReactNode;
  children?: ReactNode;
  /** Dark surfaces use light text. */
  dark?: boolean;
  className?: string;
  aside?: ReactNode;
}

export function SectionHeader({ id, label, title, children, dark = false, className = "", aside }: SectionHeaderProps) {
  return (
    <div className={`flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between ${className}`}>
      <div className="max-w-3xl">
        <p className={`${eyebrow} flex items-center gap-3 ${dark ? "text-kupfer-light" : "text-kupfer"}`}>
          <span className="h-px w-8 bg-current" aria-hidden="true" />
          {label}
        </p>
        <h2
          id={`${id}-title`}
          className={`mt-4 text-balance font-display text-[clamp(2.25rem,6.5vw,3.5rem)] font-medium leading-[1.02] tracking-[-0.025em] ${
            dark ? "text-creme" : "text-nuss"
          }`}
        >
          {title}
        </h2>
        {children ? (
          <div
            className={`mt-4 max-w-2xl text-pretty text-lg leading-relaxed sm:text-[1.1875rem] ${
              dark ? "text-leinen-deep" : "text-nuss-soft"
            }`}
          >
            {children}
          </div>
        ) : null}
      </div>
      {aside}
    </div>
  );
}

/** Row of a bill of materials: label, dotted leader, value. */
export function LeaderRow({ label, value, className = "" }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={`flex items-baseline gap-2 ${className}`}>
      <span>{label}</span>
      <span className="min-w-4 flex-1 border-b border-dotted border-nuss-muted/70" aria-hidden="true" />
      <span className="shrink-0 text-right">{value}</span>
    </div>
  );
}
