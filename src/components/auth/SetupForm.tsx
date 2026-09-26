"use client";

import { useActionState } from "react";
import { setupAdmin, type SetupState } from "@/app/einrichten/actions";
import { Field, FormError, SubmitButton } from "./AuthShell";

export function SetupForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, formAction, pending] = useActionState<SetupState, FormData>(setupAdmin, {});

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Name" name="name" autoComplete="name" required defaultValue="Aryo Sabouri" />
      <Field label="E-Mail" name="email" type="email" autoComplete="email" required defaultValue={defaultEmail} />
      <Field
        label="Passwort"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={10}
        hint="Mindestens 10 Zeichen."
      />
      <Field label="Passwort wiederholen" name="passwordConfirm" type="password" autoComplete="new-password" required />
      <Field label="Einrichtungscode" name="token" type="password" autoComplete="off" required />
      <FormError message={state.error} />
      <SubmitButton pending={pending}>Konto anlegen &amp; anmelden</SubmitButton>
    </form>
  );
}
