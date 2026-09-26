"use client";

import { KeyRound, Search, ShieldCheck, ShieldOff, Trash2, UserPlus, UserRoundCheck, UserRoundX } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { GhostButton, Notice, PrimaryButton, StudioField } from "./form";
import { Modal } from "./Modal";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  banned?: boolean | null;
  createdAt: Date | string;
};

type Dialog =
  | { kind: "create" }
  | { kind: "password"; user: ManagedUser }
  | { kind: "delete"; user: ManagedUser }
  | { kind: "ban"; user: ManagedUser }
  | null;

const MIN_PASSWORD_LENGTH = 10;
const dateFormat = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" });

export function UserManagement({ currentUserId, mainAdminEmails }: { currentUserId: string; mainAdminEmails: string[] }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    const { data, error: listError } = await authClient.admin.listUsers({
      query: {
        limit: 200,
        sortBy: "createdAt",
        sortDirection: "desc",
        ...(query ? { searchValue: query, searchField: "email" as const, searchOperator: "contains" as const } : {}),
      },
    });
    if (listError) {
      setError(authErrorMessage(listError));
    } else if (data) {
      setUsers(data.users as ManagedUser[]);
      setTotal(data.total);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => void load(search.trim()), search ? 250 : 0);
    return () => clearTimeout(handle);
  }, [load, search]);

  const isProtected = useCallback(
    (user: ManagedUser) => user.id === currentUserId || mainAdminEmails.includes(user.email.toLowerCase()),
    [currentUserId, mainAdminEmails],
  );

  async function run(action: () => Promise<{ error: { code?: string; message?: string; status?: number } | null }>, success: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    const { error: actionError } = await action();
    setBusy(false);
    if (actionError) {
      setError(authErrorMessage(actionError));
      return false;
    }
    setNotice(success);
    setDialog(null);
    await load(search.trim());
    return true;
  }

  const stats = useMemo(
    () => ({
      admins: users.filter((user) => user.role === "admin").length,
      banned: users.filter((user) => user.banned).length,
    }),
    [users],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-oak-light">Administration</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Nutzerverwaltung</h1>
          <p className="mt-2 text-sm text-studio-muted">
            {total} {total === 1 ? "Konto" : "Konten"} · {stats.admins} Admin · {stats.banned} gesperrt
          </p>
        </div>
        <PrimaryButton type="button" onClick={() => setDialog({ kind: "create" })}>
          <UserPlus className="size-4" aria-hidden /> Nutzer anlegen
        </PrimaryButton>
      </div>

      <div className="mt-6 space-y-3">
        <label className="relative block">
          <span className="sr-only">Nach E-Mail suchen</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-studio-muted" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nach E-Mail suchen …"
            className="w-full rounded-xl border border-studio-line bg-studio-panel py-2.5 pl-10 pr-4 text-base outline-none transition focus:border-oak focus:ring-2 focus:ring-oak/30 sm:max-w-sm"
          />
        </label>
        {error ? <Notice tone="error">{error}</Notice> : null}
        {notice ? <Notice tone="success">{notice}</Notice> : null}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-studio-line bg-studio-panel">
        {loading && users.length === 0 ? (
          <p className="p-6 text-sm text-studio-muted">Lade Konten …</p>
        ) : users.length === 0 ? (
          <p className="p-6 text-sm text-studio-muted">Keine Konten gefunden.</p>
        ) : (
          <ul className="divide-y divide-studio-line" aria-label="Konten">
            {users.map((user) => {
              const protectedUser = isProtected(user);
              const isAdmin = user.role === "admin";
              return (
                <li key={user.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      aria-hidden
                      className="grid size-10 shrink-0 place-items-center rounded-full bg-oak/20 font-display font-semibold text-oak-light"
                    >
                      {user.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {user.name}
                        {user.id === currentUserId ? <span className="ml-2 text-xs text-studio-muted">(Sie)</span> : null}
                      </p>
                      <p className="truncate text-sm text-studio-muted">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`rounded-full px-2.5 py-1 font-medium ${isAdmin ? "bg-oak/20 text-oak-light" : "bg-white/5 text-studio-muted"}`}
                    >
                      {mainAdminEmails.includes(user.email.toLowerCase()) ? "Haupt-Admin" : isAdmin ? "Admin" : "Nutzer"}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 font-medium ${
                        user.banned ? "bg-red-500/15 text-red-300" : "bg-emerald-500/10 text-emerald-300"
                      }`}
                    >
                      {user.banned ? "Gesperrt" : "Aktiv"}
                    </span>
                    <span className="text-studio-muted">seit {dateFormat.format(new Date(user.createdAt))}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:justify-end">
                    <IconAction
                      label={isAdmin ? "Admin-Rechte entziehen" : "Zum Admin machen"}
                      disabled={protectedUser || busy}
                      onClick={() =>
                        run(
                          () => authClient.admin.setRole({ userId: user.id, role: isAdmin ? "user" : "admin" }),
                          `${user.name} ist jetzt ${isAdmin ? "Nutzer" : "Admin"}.`,
                        )
                      }
                    >
                      {isAdmin ? <ShieldOff className="size-4" /> : <ShieldCheck className="size-4" />}
                    </IconAction>
                    <IconAction
                      label="Passwort setzen"
                      disabled={protectedUser || busy}
                      onClick={() => setDialog({ kind: "password", user })}
                    >
                      <KeyRound className="size-4" />
                    </IconAction>
                    <IconAction
                      label={user.banned ? "Entsperren" : "Sperren"}
                      disabled={protectedUser || busy}
                      onClick={() =>
                        user.banned
                          ? run(() => authClient.admin.unbanUser({ userId: user.id }), `${user.name} wurde entsperrt.`)
                          : setDialog({ kind: "ban", user })
                      }
                    >
                      {user.banned ? <UserRoundCheck className="size-4" /> : <UserRoundX className="size-4" />}
                    </IconAction>
                    <IconAction
                      label="Löschen"
                      tone="danger"
                      disabled={protectedUser || busy}
                      onClick={() => setDialog({ kind: "delete", user })}
                    >
                      <Trash2 className="size-4" />
                    </IconAction>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal open={dialog?.kind === "create"} title="Nutzer anlegen" onClose={() => setDialog(null)}>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const role = form.get("role") === "admin" ? "admin" : "user";
            void run(
              () =>
                authClient.admin.createUser({
                  name: String(form.get("name") ?? "").trim(),
                  email: String(form.get("email") ?? "").trim().toLowerCase(),
                  password: String(form.get("password") ?? ""),
                  role,
                }),
              "Konto wurde angelegt. Teilen Sie die Zugangsdaten persönlich mit.",
            );
          }}
        >
          <StudioField label="Name" name="name" required minLength={2} autoComplete="off" />
          <StudioField label="E-Mail" name="email" type="email" required autoComplete="off" />
          <StudioField
            label="Start-Passwort"
            name="password"
            type="text"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="off"
            hint="Mindestens 10 Zeichen. Der Nutzer kann es unter „Konto“ ändern."
          />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Rolle</span>
            <select
              name="role"
              defaultValue="user"
              className="w-full rounded-xl border border-studio-line bg-studio-bg px-3.5 py-2.5 text-base outline-none focus:border-oak focus:ring-2 focus:ring-oak/30"
            >
              <option value="user">Nutzer — sieht das Traumhaus</option>
              <option value="admin">Admin — zusätzlich Nutzerverwaltung</option>
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <GhostButton onClick={() => setDialog(null)}>Abbrechen</GhostButton>
            <PrimaryButton type="submit" pending={busy}>
              Anlegen
            </PrimaryButton>
          </div>
        </form>
      </Modal>

      <Modal
        open={dialog?.kind === "password"}
        title={dialog?.kind === "password" ? `Passwort für ${dialog.user.name}` : ""}
        onClose={() => setDialog(null)}
      >
        {dialog?.kind === "password" ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void run(
                () => authClient.admin.setUserPassword({ userId: dialog.user.id, newPassword: String(form.get("password") ?? "") }),
                `Neues Passwort für ${dialog.user.name} gesetzt.`,
              );
            }}
          >
            <StudioField label="Neues Passwort" name="password" type="text" required minLength={MIN_PASSWORD_LENGTH} autoComplete="off" />
            <div className="flex justify-end gap-2 pt-2">
              <GhostButton onClick={() => setDialog(null)}>Abbrechen</GhostButton>
              <PrimaryButton type="submit" pending={busy}>
                Speichern
              </PrimaryButton>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal open={dialog?.kind === "ban"} title="Konto sperren?" onClose={() => setDialog(null)}>
        {dialog?.kind === "ban" ? (
          <div className="space-y-5">
            <p className="text-sm text-studio-muted">
              <strong className="text-studio-text">{dialog.user.name}</strong> wird sofort abgemeldet und kann sich nicht mehr
              anmelden, bis Sie das Konto wieder entsperren.
            </p>
            <div className="flex justify-end gap-2">
              <GhostButton onClick={() => setDialog(null)}>Abbrechen</GhostButton>
              <PrimaryButton
                type="button"
                pending={busy}
                onClick={() =>
                  run(
                    () => authClient.admin.banUser({ userId: dialog.user.id, banReason: "Durch Administrator gesperrt" }),
                    `${dialog.user.name} wurde gesperrt.`,
                  )
                }
              >
                Sperren
              </PrimaryButton>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={dialog?.kind === "delete"} title="Konto löschen?" onClose={() => setDialog(null)}>
        {dialog?.kind === "delete" ? (
          <div className="space-y-5">
            <p className="text-sm text-studio-muted">
              Das Konto von <strong className="text-studio-text">{dialog.user.name}</strong> ({dialog.user.email}) wird
              endgültig gelöscht. Das lässt sich nicht rückgängig machen.
            </p>
            <div className="flex justify-end gap-2">
              <GhostButton onClick={() => setDialog(null)}>Abbrechen</GhostButton>
              <PrimaryButton
                type="button"
                pending={busy}
                className="!bg-red-600 hover:!bg-red-500"
                onClick={() => run(() => authClient.admin.removeUser({ userId: dialog.user.id }), `${dialog.user.name} wurde gelöscht.`)}
              >
                Endgültig löschen
              </PrimaryButton>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function IconAction({
  label,
  tone,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: "danger" }) {
  return (
    <button
      type="button"
      {...props}
      aria-label={label}
      title={label}
      className={`grid size-9 place-items-center rounded-lg text-studio-muted transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent ${
        tone === "danger" ? "hover:text-red-300" : "hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
