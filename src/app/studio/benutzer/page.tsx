import type { Metadata } from "next";
import { UserManagement } from "@/components/studio/UserManagement";
import { getAdminEmails } from "@/lib/admin-config";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Nutzerverwaltung" };

export default async function UsersPage() {
  const session = await requireAdmin();
  return (
    <div className="h-full overflow-y-auto">
      <UserManagement currentUserId={session.user.id} mainAdminEmails={getAdminEmails()} />
    </div>
  );
}
