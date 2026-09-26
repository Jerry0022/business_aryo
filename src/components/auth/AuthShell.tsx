import Link from "next/link";
import { useId } from "react";

export function AuthShell({
  eyebrow,
  title,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-studio-bg px-4 py-12 text-studio-text">
      <div aria-hidden className="auth-herringbone pointer-events-none absolute inset-0 opacity-[0.07]" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-oak/25 blur-[140px]"
      />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-studio-muted transition hover:text-studio-text">
          <span aria-hidden>←</span> Zur Website
        </Link>
        <div className="rounded-[var(--radius-card)] border border-studio-line bg-studio-panel/90 p-7 shadow-2xl shadow-black/40 backdrop-blur sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-oak-light">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">{title}</h1>
          <div className="mt-7">{children}</div>
        </div>
        {footer ? <div className="mt-6 text-center text-sm text-studio-muted">{footer}</div> : null}
      </div>
    </main>
  );
}

export function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-studio-text">
        {label}
      </label>
      <input
        {...props}
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="w-full rounded-xl border border-studio-line bg-studio-bg/70 px-4 py-3 text-base text-studio-text outline-none transition placeholder:text-studio-muted/60 focus:border-oak focus:ring-2 focus:ring-oak/30"
      />
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-studio-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SubmitButton({ pending, disabled, children }: { pending: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-copper px-5 py-3 text-base font-semibold text-white shadow-lg shadow-copper/20 transition hover:bg-[#e27f39] disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {message}
    </p>
  );
}
