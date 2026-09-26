"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isMainAdminEmail } from "@/lib/admin-config";
import { getAuth, MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { authErrorMessage } from "@/lib/auth-errors";
import { secureCompare } from "@/lib/secure-compare";
import { hasAdminAccount } from "@/lib/users";

export type SetupState = { error?: string };

const setupSchema = z
  .object({
    name: z.string().trim().min(2, "Bitte geben Sie Ihren Namen ein.").max(80),
    email: z.email("Bitte geben Sie eine gültige E-Mail-Adresse ein.").transform((value) => value.toLowerCase()),
    password: z.string().min(MIN_PASSWORD_LENGTH, `Das Passwort braucht mindestens ${MIN_PASSWORD_LENGTH} Zeichen.`).max(128),
    passwordConfirm: z.string(),
    token: z.string().min(1, "Bitte geben Sie den Einrichtungscode ein."),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Die Passwörter stimmen nicht überein.",
    path: ["passwordConfirm"],
  });

export async function setupAdmin(_previous: SetupState, formData: FormData): Promise<SetupState> {
  const parsed = setupSchema.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "").trim(),
    password: formData.get("password"),
    passwordConfirm: formData.get("passwordConfirm"),
    token: formData.get("token"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  if (await hasAdminAccount()) {
    return { error: "Das Studio ist bereits eingerichtet. Bitte melden Sie sich an." };
  }

  const expectedToken = process.env.ADMIN_SETUP_TOKEN;
  if (!expectedToken) {
    return { error: "Die Einrichtung ist nicht freigeschaltet (ADMIN_SETUP_TOKEN fehlt in der Server-Konfiguration)." };
  }
  if (!secureCompare(parsed.data.token.trim(), expectedToken)) {
    // Slow down guessing; the code is only needed once.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { error: "Der Einrichtungscode ist ungültig." };
  }

  const { name, email, password } = parsed.data;
  if (!isMainAdminEmail(email)) {
    return { error: "Diese E-Mail-Adresse ist nicht als Administrator hinterlegt." };
  }

  const auth = getAuth();
  try {
    // Server-side call without request headers = trusted, bypasses the admin session check.
    await auth.api.createUser({ body: { email, password, name, role: "admin" } });
    await auth.api.signInEmail({ body: { email, password }, headers: await headers() });
  } catch (error) {
    const apiError = error as { body?: { code?: string; message?: string }; status?: number; message?: string };
    return { error: authErrorMessage({ ...apiError.body, status: apiError.status }) };
  }

  redirect("/studio");
}
