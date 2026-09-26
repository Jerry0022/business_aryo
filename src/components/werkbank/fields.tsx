"use client";

import { useId } from "react";
import { cx } from "./ui";

// Labelled form controls for the Werkbank forms (controlled inputs).

export const inputClass =
  "w-full rounded-xl border border-studio-line bg-studio-bg px-3 py-2 text-sm [color-scheme:dark] text-studio-text outline-none transition placeholder:text-studio-muted/60 focus:border-oak focus:ring-2 focus:ring-oak/30 disabled:opacity-60 aria-[invalid=true]:border-red-400/60";

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-studio-muted">
      {children}
    </label>
  );
}

function Help({ id, hint, error }: { id: string; hint?: React.ReactNode; error?: string }) {
  if (error) {
    return (
      <p id={`${id}-help`} className="mt-1 text-xs text-red-300">
        {error}
      </p>
    );
  }
  return hint ? (
    <p id={`${id}-help`} className="mt-1 text-xs text-studio-muted">
      {hint}
    </p>
  ) : null;
}

export function InputField({
  label,
  hint,
  error,
  className,
  suffix,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: React.ReactNode; error?: string; suffix?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <input
          {...props}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={hint || error ? `${id}-help` : undefined}
          className={cx(inputClass, suffix && "pr-10", props.type === "number" && "tabular-nums")}
        />
        {suffix ? <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs text-studio-muted">{suffix}</span> : null}
      </div>
      <Help id={id} hint={hint} error={error} />
    </div>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: React.ReactNode; error?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <textarea
        rows={3}
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${id}-help` : undefined}
        className={cx(inputClass, "resize-y")}
      />
      <Help id={id} hint={hint} error={error} />
    </div>
  );
}

export function SelectField({
  label,
  hint,
  error,
  className,
  options,
  placeholder,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <select
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${id}-help` : undefined}
        className={cx(inputClass, "appearance-auto pr-8")}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Help id={id} hint={hint} error={error} />
    </div>
  );
}

export function CheckboxField({
  label,
  hint,
  checked,
  onChange,
  className,
  disabled,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={cx("flex items-start gap-2.5", className)}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-[#d8712c]"
      />
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm">
          {label}
        </label>
        {hint ? <p className="text-xs text-studio-muted">{hint}</p> : null}
      </div>
    </div>
  );
}

/** Switch-style boolean control (role="switch"). */
export function Toggle({
  label,
  checked,
  onChange,
  disabled,
  hideLabel = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  hideLabel?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={hideLabel ? label : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group inline-flex items-center gap-2 text-left text-sm disabled:opacity-50"
    >
      <span
        className={cx(
          "relative inline-flex h-5 w-9 shrink-0 rounded-full border transition",
          checked ? "border-emerald-400/40 bg-emerald-500/60" : "border-studio-line bg-white/[0.08]",
        )}
        aria-hidden
      >
        <span className={cx("absolute top-0.5 size-3.5 rounded-full bg-white shadow transition-all", checked ? "left-[1.15rem]" : "left-0.5")} />
      </span>
      {hideLabel ? null : <span>{label}</span>}
    </button>
  );
}

export function WeekdayPicker({
  label,
  value,
  onChange,
  days = [1, 2, 3, 4, 5, 6, 7],
}: {
  label: string;
  value: number[];
  onChange: (value: number[]) => void;
  days?: number[];
}) {
  const names = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  return (
    <fieldset>
      <legend className="mb-1 text-xs font-medium text-studio-muted">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {days.map((day) => {
          const active = value.includes(day);
          return (
            <button
              key={day}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? value.filter((item) => item !== day) : [...value, day].sort((a, b) => a - b))}
              className={cx(
                "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                active ? "border-oak/50 bg-oak/20 text-oak-light" : "border-studio-line text-studio-muted hover:bg-white/5",
              )}
            >
              {names[day - 1]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
