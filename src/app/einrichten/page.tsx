import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AuthShell } from "@/components/auth/AuthShell";
import { SetupForm } from "@/components/auth/SetupForm";
import { getAdminEmails } from "@/lib/admin-config";
import { hasAdminAccount } from "@/lib/users";

export const metadata: Metadata = {
  title: "Studio einrichten",
  robots: { index: false, follow: false },
};

export default async function SetupPage() {
  // Always evaluated per request (reads the database).
  await connection();
  if (await hasAdminAccount()) redirect("/login");

  return (
    <AuthShell
      eyebrow="Ersteinrichtung"
      title="Studio einrichten"
      footer={
        <>
          Bereits eingerichtet?{" "}
          <Link href="/login" className="font-medium text-oak-light underline-offset-4 hover:underline">
            Anmelden
          </Link>
        </>
      }
    >
      <p className="mb-6 text-sm leading-relaxed text-studio-muted">
        Legen Sie das Administrator-Konto an. Den Einrichtungscode finden Sie in der Server-Konfiguration
        (<code className="text-studio-text">ADMIN_SETUP_TOKEN</code>).
      </p>
      <SetupForm defaultEmail={getAdminEmails()[0] ?? ""} />
    </AuthShell>
  );
}
