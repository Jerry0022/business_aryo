"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { useHydrated } from "@/lib/use-hydrated";
import { Notice, PrimaryButton, StudioField } from "./form";

export function AccountSettings({ name, email, role }: { name: string; email: string; role: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const hydrated = useHydrated();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const newPassword = String(form.get("newPassword") ?? "");
    if (newPassword !== String(form.get("confirmPassword") ?? "")) {
      setError("Die neuen Passwörter stimmen nicht überein.");
      return;
    }
    setPending(true);
    setError(null);
    setSuccess(null);
    const { error: changeError } = await authClient.changePassword({
      currentPassword: String(form.get("currentPassword") ?? ""),
      newPassword,
      revokeOtherSessions: true,
    });
    setPending(false);
    if (changeError) {
      setError(authErrorMessage(changeError));
      return;
    }
    formElement.reset();
    setSuccess("Passwort geändert. Andere Geräte wurden abgemeldet.");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-oak-light">Konto</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">{name}</h1>
      <dl className="mt-6 grid gap-4 rounded-2xl border border-studio-line bg-studio-panel p-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wider text-studio-muted">E-Mail</dt>
          <dd className="mt-1 break-all">{email}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-studio-muted">Rolle</dt>
          <dd className="mt-1">{role === "admin" ? "Administrator" : "Nutzer"}</dd>
        </div>
      </dl>

      <form onSubmit={onSubmit} method="post" className="mt-8 space-y-4 rounded-2xl border border-studio-line bg-studio-panel p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold">Passwort ändern</h2>
        <StudioField label="Aktuelles Passwort" name="currentPassword" type="password" autoComplete="current-password" required />
        <StudioField
          label="Neues Passwort"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          hint="Mindestens 10 Zeichen."
        />
        <StudioField label="Neues Passwort wiederholen" name="confirmPassword" type="password" autoComplete="new-password" required />
        {error ? <Notice tone="error">{error}</Notice> : null}
        {success ? <Notice tone="success">{success}</Notice> : null}
        <PrimaryButton type="submit" pending={pending} disabled={!hydrated}>
          Passwort speichern
        </PrimaryButton>
      </form>
    </div>
  );
}
