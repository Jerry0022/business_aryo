import type { ReactNode } from "react";

interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}

/** Eyebrow + display headline + optional lead text, shared by all landing sections. */
export function SectionHeading({ id, eyebrow, title, children, tone = "light", className = "" }: SectionHeadingProps) {
  const dark = tone === "dark";
  return (
    <div className={`site-reveal ${className}`}>
      <p
        className={`inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] ${
          dark ? "text-oak-light" : "text-oak-deep"
        }`}
      >
        <span className="h-px w-8 bg-current" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2
        id={id}
        className={`mt-5 text-balance font-display text-[clamp(2.3rem,5.2vw,4.1rem)] font-medium leading-[1.02] tracking-[-0.025em] ${
          dark ? "text-paper" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {children ? (
        <div
          className={`mt-6 max-w-2xl text-pretty text-lg leading-relaxed ${dark ? "text-paper/75" : "text-ink-muted"}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
