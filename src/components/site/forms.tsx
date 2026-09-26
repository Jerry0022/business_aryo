"use client";

import Link from "next/link";
import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useId,
  useRef,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { INITIAL_FORM_STATE, type FormState } from "@/lib/business/form-state";
import { buttonPrimary } from "./ui";

// Shared form plumbing for the public server actions (src/lib/business/public-actions.ts):
// honeypot + fill-time field, field errors next to the inputs, status/alert messages.

type PublicAction = (state: FormState, formData: FormData) => Promise<FormState>;

const FieldErrorsContext = createContext<Record<string, string>>({});

function useFieldError(name: string): string | undefined {
  return useContext(FieldErrorsContext)[name];
}

interface PublicFormProps {
  action: PublicAction;
  submitLabel: string;
  pendingLabel?: string;
  children: ReactNode;
  className?: string;
  /** Accessible name of the form. */
  label?: string;
  /** Extra buttons left of the submit button (e.g. "Zurück"). */
  actions?: ReactNode;
  /** Shown below the success message. */
  successExtra?: ReactNode;
  /** Clears the fields after a successful submission (default true). */
  resetOnSuccess?: boolean;
  /** Called after every server response. */
  onResult?: (state: FormState) => void;
}

export function PublicForm({
  action,
  submitLabel,
  pendingLabel = "Wird gesendet …",
  children,
  className = "",
  label,
  actions,
  successExtra,
  resetOnSuccess = true,
  onResult,
}: PublicFormProps) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, INITIAL_FORM_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  const startedAtRef = useRef<HTMLInputElement>(null);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  // Fill-time check: the timestamp is set after mount (never during render) and survives reset().
  useEffect(() => {
    const input = startedAtRef.current;
    if (!input) return;
    const now = String(Date.now());
    input.defaultValue = now;
    input.value = now;
  }, []);

  useEffect(() => {
    if (state.status === "idle") return;
    onResultRef.current?.(state);
    const form = formRef.current;
    if (!form) return;
    if (state.status === "error" && state.fieldErrors) {
      form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
    if (state.status === "success" && resetOnSuccess) form.reset();
  }, [state, resetOnSuccess]);

  // Submitting through a transition keeps the typed values when the server reports field errors
  // (a plain `action` would reset the form). `action` stays for submissions before hydration.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <FieldErrorsContext.Provider value={errors}>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={onSubmit}
        noValidate
        aria-label={label}
        className={`relative ${className}`}
      >
        {/* Honeypot: invisible for people, tempting for bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] top-0 size-px overflow-hidden">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" defaultValue="" />
          </label>
        </div>
        <input ref={startedAtRef} type="hidden" name="startedAt" defaultValue="" />

        <div className="grid gap-4">{children}</div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : <span />}
          <button type="submit" className={buttonPrimary} disabled={pending}>
            {pending ? pendingLabel : submitLabel}
          </button>
        </div>

        {state.status === "success" && state.message ? (
          <div className="mt-5 rounded-lg border-l-4 border-kupfer bg-kupfer/10 px-4 py-3">
            <p role="status" className="font-medium text-nuss">
              {state.message}
            </p>
            {successExtra}
          </div>
        ) : null}
        {state.status === "error" && state.message ? (
          <p role="alert" className="mt-5 rounded-lg border-l-4 border-[#a3261d] bg-[#a3261d]/8 px-4 py-3 font-medium text-[#8c1f17]">
            {state.message}
          </p>
        ) : null}

        <PrivacyNote />
      </form>
    </FieldErrorsContext.Provider>
  );
}

export function PrivacyNote() {
  return (
    <p className="mt-5 text-sm leading-relaxed text-nuss-muted">
      Ich speichere deine Angaben, um deine Anfrage zu bearbeiten. Mehr in der{" "}
      <Link href="/datenschutz" className="underline decoration-1 underline-offset-2 hover:text-nuss">
        Datenschutzerklärung
      </Link>
      .
    </p>
  );
}

// ---- Fields ------------------------------------------------------------------------------------

const labelClass = "text-sm font-medium text-nuss-soft";
const controlClass =
  "w-full rounded-lg border border-fuge-dark bg-milch px-3 text-[0.95rem] text-nuss placeholder:text-nuss-muted/80 aria-[invalid=true]:border-[#a3261d] aria-[invalid=true]:bg-[#fdf6f5]";
const errorClass = "text-sm font-medium text-[#8c1f17]";

function describedBy(...ids: (string | false | undefined)[]): string | undefined {
  const list = ids.filter(Boolean);
  return list.length > 0 ? list.join(" ") : undefined;
}

interface BaseFieldProps {
  name: string;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  className?: string;
}

interface TextFieldProps extends BaseFieldProps {
  type?: "text" | "email" | "tel" | "number";
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "decimal" | "email" | "tel";
  placeholder?: string;
  maxLength?: number;
  min?: number;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function TextField({
  name,
  label,
  required = false,
  hint,
  className = "",
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
  maxLength,
  min,
  value,
  onChange,
}: TextFieldProps) {
  const id = useId();
  const error = useFieldError(name);
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required ? null : <span className="font-normal text-nuss-muted"> (optional)</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        maxLength={maxLength}
        min={min}
        {...(value !== undefined ? { value, onChange } : {})}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hintId, errorId)}
        className={`${controlClass} h-11`}
      />
      {hint ? (
        <p id={hintId} className="text-sm text-nuss-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={errorClass}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface SelectFieldProps extends BaseFieldProps {
  options: readonly (string | { value: string; label: string })[];
  placeholder?: string;
  defaultValue?: string;
}

export function SelectField({
  name,
  label,
  required = false,
  hint,
  className = "",
  options,
  placeholder,
  defaultValue,
}: SelectFieldProps) {
  const id = useId();
  const error = useFieldError(name);
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required ? null : <span className="font-normal text-nuss-muted"> (optional)</span>}
      </label>
      <select
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue ?? (placeholder ? "" : undefined)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hintId, errorId)}
        className={`${controlClass} h-11 appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%2016%2016%27%3E%3Cpath%20d%3D%27M4%206l4%204%204-4%27%20fill%3D%27none%27%20stroke%3D%27%2322252a%27%20stroke-width%3D%271.6%27/%3E%3C/svg%3E")] bg-[length:16px_16px] bg-[right_0.75rem_center] bg-no-repeat pr-10`}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const text = typeof option === "string" ? option : option.label;
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
      </select>
      {hint ? (
        <p id={hintId} className="text-sm text-nuss-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={errorClass}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface TextAreaFieldProps extends BaseFieldProps {
  rows?: number;
  placeholder?: string;
  maxLength?: number;
}

export function TextAreaField({
  name,
  label,
  required = false,
  hint,
  className = "",
  rows = 4,
  placeholder,
  maxLength = 2000,
}: TextAreaFieldProps) {
  const id = useId();
  const error = useFieldError(name);
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={labelClass}>
        {label}
        {required ? null : <span className="font-normal text-nuss-muted"> (optional)</span>}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(hintId, errorId)}
        className={`${controlClass} min-h-28 resize-y py-2.5 leading-relaxed`}
      />
      {hint ? (
        <p id={hintId} className="text-sm text-nuss-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={errorClass}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface CheckboxFieldProps {
  name: string;
  label: ReactNode;
  value?: string;
  className?: string;
}

export function CheckboxField({ name, label, value, className = "" }: CheckboxFieldProps) {
  const id = useId();
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <input
        id={id}
        name={name}
        type="checkbox"
        value={value}
        className="mt-0.5 size-5 shrink-0 cursor-pointer rounded-xs border-fuge-dark accent-kupfer"
      />
      <label htmlFor={id} className="cursor-pointer text-[0.95rem] leading-snug text-nuss-soft">
        {label}
      </label>
    </div>
  );
}

interface CheckboxGroupProps {
  name: string;
  legend: ReactNode;
  options: readonly string[];
  className?: string;
}

export function CheckboxGroup({ name, legend, options, className = "" }: CheckboxGroupProps) {
  const error = useFieldError(name);
  const id = useId();
  return (
    <fieldset className={className} aria-describedby={error ? `${id}-error` : undefined}>
      <legend className={`${labelClass} mb-2`}>{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <CheckboxField key={option} name={name} value={option} label={option} />
        ))}
      </div>
      {error ? (
        <p id={`${id}-error`} className={`${errorClass} mt-2`}>
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
