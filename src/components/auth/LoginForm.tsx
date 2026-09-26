"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { useHydrated } from "@/lib/use-hydrated";
import { Field, FormError, SubmitButton } from "./AuthShell";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hydrated = useHydrated();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const { error: signInError } = await authClient.signIn.email({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });
    if (signInError) {
      setError(authErrorMessage(signInError));
      setPending(false);
      return;
    }
    router.replace("/studio");
  }

  return (
    // method="post": should the form ever submit natively, credentials never end up in the URL.
    <form onSubmit={onSubmit} method="post" className="space-y-5" noValidate>
      <Field label="E-Mail" name="email" type="email" autoComplete="email" required placeholder="name@beispiel.de" />
      <Field label="Passwort" name="password" type="password" autoComplete="current-password" required />
      <FormError message={error} />
      <SubmitButton pending={pending} disabled={!hydrated}>
        Anmelden
      </SubmitButton>
    </form>
  );
}
