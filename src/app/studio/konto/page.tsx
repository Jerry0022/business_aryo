import type { Metadata } from "next";
import { AccountSettings } from "@/components/studio/AccountSettings";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Konto" };

export default async function AccountPage() {
  const session = await requireSession();
  return (
    <div className="h-full overflow-y-auto">
      <AccountSettings name={session.user.name} email={session.user.email} role={session.user.role ?? "user"} />
    </div>
  );
}
