import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { Tone } from "@/lib/werkbank/types";

// Building blocks of the Werkbank in the dark studio theme. No hooks here, so server and client
// components can both use them.

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow = "Werkbank",
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-oak-light">{eyebrow}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle ? <div className="mt-1.5 text-sm text-studio-muted">{subtitle}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function PageBody({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={cx("mx-auto w-full px-4 py-6 sm:px-6 lg:py-8", wide ? "max-w-[92rem]" : "max-w-7xl")}>{children}</div>;
}

export function Card({
  title,
  icon: Icon,
  action,
  children,
  className,
  id,
  bodyClassName,
}: {
  title?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
  bodyClassName?: string;
}) {
  return (
    <section id={id} className={cx("scroll-mt-6 rounded-2xl border border-studio-line bg-studio-panel", className)}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-studio-line px-4 py-3 sm:px-5">
          <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
            {Icon ? <Icon className="size-4 shrink-0 text-oak-light" aria-hidden /> : null}
            <span className="truncate">{title}</span>
          </h2>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={bodyClassName ?? "p-4 sm:p-5"}>{children}</div>
    </section>
  );
}

export const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-white/[0.06] text-studio-text ring-white/10",
  oak: "bg-oak/15 text-oak-light ring-oak/25",
  ok: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  warn: "bg-amber-400/10 text-amber-300 ring-amber-400/25",
  crit: "bg-red-400/10 text-red-300 ring-red-400/25",
  info: "bg-kreide-light/10 text-kreide-light ring-kreide-light/25",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", TONE_CLASSES[tone], className)}>
      {children}
    </span>
  );
}

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-copper text-white hover:bg-[#e27f39] border border-transparent",
  secondary: "border border-studio-line bg-white/[0.02] text-studio-text hover:bg-white/[0.07]",
  ghost: "border border-transparent text-studio-muted hover:bg-white/[0.06] hover:text-studio-text",
  danger: "border border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20",
};

const SIZES: Record<Size, string> = {
  sm: "gap-1.5 rounded-lg px-2.5 py-1.5 text-xs",
  md: "gap-2 rounded-xl px-3.5 py-2 text-sm",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", className?: string) {
  return cx(
    "inline-flex shrink-0 items-center justify-center font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = "secondary",
  size = "md",
  icon: Icon,
  pending,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; icon?: LucideIcon; pending?: boolean }) {
  return (
    <button type="button" {...props} disabled={pending || props.disabled} className={buttonClass(variant, size, className)}>
      {pending ? (
        <span className="size-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" aria-hidden />
      ) : Icon ? (
        <Icon className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden />
      ) : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "secondary",
  size = "md",
  icon: Icon,
  children,
  className,
  ...props
}: Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string; variant?: Variant; size?: Size; icon?: LucideIcon }) {
  return (
    <Link href={href} {...props} className={buttonClass(variant, size, className)}>
      {Icon ? <Icon className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden /> : null}
      {children}
    </Link>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col items-center rounded-xl border border-dashed border-studio-line px-5 py-8 text-center", className)}>
      {Icon ? (
        <span className="grid size-10 place-items-center rounded-full bg-oak/10 text-oak-light">
          <Icon className="size-5" aria-hidden />
        </span>
      ) : null}
      <p className="mt-3 font-medium">{title}</p>
      {children ? <div className="mt-1 max-w-md text-sm text-studio-muted">{children}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

const BANNER_TONES = {
  crit: "border-red-400/30 bg-red-500/10 text-red-100",
  warn: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  info: "border-kreide-light/25 bg-kreide/15 text-studio-text",
  ok: "border-emerald-400/25 bg-emerald-400/10 text-emerald-100",
} as const;

export function Banner({
  tone,
  icon: Icon,
  children,
  className,
}: {
  tone: keyof typeof BANNER_TONES;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div role={tone === "crit" ? "alert" : undefined} className={cx("flex gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm", BANNER_TONES[tone], className)}>
      {Icon ? <Icon className="mt-0.5 size-4 shrink-0" aria-hidden /> : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Horizontal bar with an optional target marker. */
export function Meter({
  value,
  max,
  target,
  label,
  tone = "oak",
  className,
}: {
  value: number;
  max: number;
  target?: number;
  label: string;
  tone?: "oak" | "ok" | "crit" | "info";
  className?: string;
}) {
  const scale = Math.max(max, value, target ?? 0, 1);
  const width = Math.min(100, (value / scale) * 100);
  const colors = { oak: "bg-oak", ok: "bg-emerald-400", crit: "bg-red-400", info: "bg-kreide-light" };
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={scale}
      aria-valuenow={Math.round(value * 100) / 100}
      className={cx("relative h-2 overflow-hidden rounded-full bg-white/[0.07]", className)}
    >
      <div className={cx("h-full rounded-full transition-[width]", colors[tone])} style={{ width: `${width}%` }} />
      {target !== undefined ? (
        <div className="absolute inset-y-0 w-0.5 bg-studio-text/80" style={{ left: `calc(${Math.min(100, (target / scale) * 100)}% - 1px)` }} aria-hidden />
      ) : null}
    </div>
  );
}

export function StatLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-studio-muted">{children}</p>;
}

export function KeyValues({ rows }: { rows: { label: string; value: React.ReactNode; mono?: boolean }[] }) {
  return (
    <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-4 gap-y-1.5 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-studio-muted">{row.label}</dt>
          <dd className={cx("min-w-0 whitespace-pre-line break-words", row.mono && "font-mono tabular-nums")}>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
