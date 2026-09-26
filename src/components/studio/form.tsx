import { useId } from "react";

export function StudioField({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        {...props}
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="w-full rounded-xl border border-studio-line bg-studio-bg px-3.5 py-2.5 text-base outline-none transition placeholder:text-studio-muted/60 focus:border-oak focus:ring-2 focus:ring-oak/30"
      />
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-studio-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function PrimaryButton({ pending, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { pending?: boolean }) {
  return (
    <button
      {...props}
      disabled={pending || props.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-copper px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e27f39] disabled:cursor-not-allowed disabled:opacity-60 ${props.className ?? ""}`}
    >
      {pending ? <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-studio-line px-4 py-2.5 text-sm font-medium text-studio-text transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50 ${props.className ?? ""}`}
    />
  );
}

export function Notice({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  const styles =
    tone === "error" ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {children}
    </p>
  );
}
