import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSession } from "@/lib/session";
import { hasAdminAccount } from "@/lib/users";

export const metadata: Metadata = {
  title: "Anmelden",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await getSession()) redirect("/studio");
  const setupDone = await hasAdminAccount();

  return (
    <AuthShell
      eyebrow="Studio"
      title="Willkommen zurück"
      footer={
        setupDone ? (
          "Zugang nur auf Einladung."
        ) : (
          <>
            Noch kein Administrator eingerichtet?{" "}
            <Link href="/einrichten" className="font-medium text-oak-light underline-offset-4 hover:underline">
              Studio einrichten
            </Link>
          </>
        )
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
