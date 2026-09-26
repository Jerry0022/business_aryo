interface DimensionLineProps {
  /** Short mono label in the middle of the line, e.g. "4 MIN. LESEZEIT". */
  label?: string;
  /** Background class of the surface the line sits on, so the label can cut the line. */
  surface?: string;
  className?: string;
}

/**
 * A dimension line from a technical drawing ("Bemaßung"): end ticks, oblique marks and an
 * optional label. Purely decorative; never put information here that is not also in the text.
 */
export function DimensionLine({ label, surface = "bg-estrich", className = "" }: DimensionLineProps) {
  return (
    <div className={`relative h-[22px] text-kreide ${className}`} aria-hidden="true">
      <span className="absolute inset-y-0 left-0 w-px bg-current" />
      <span className="absolute inset-y-0 right-0 w-px bg-current" />
      <span className="absolute inset-x-0 top-1/2 h-px bg-current" />
      <span className="absolute left-0 top-[4px] h-[14px] w-px -translate-x-1/2 rotate-45 bg-current" />
      <span className="absolute right-0 top-[4px] h-[14px] w-px translate-x-1/2 rotate-45 bg-current" />
      {label ? (
        <span
          className={`absolute left-1/2 top-0 max-w-[calc(100%-2rem)] -translate-x-1/2 truncate px-2.5 font-mono text-[11px] leading-[22px] tracking-[0.1em] sm:text-xs ${surface}`}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
