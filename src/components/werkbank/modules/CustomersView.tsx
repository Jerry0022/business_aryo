"use client";

import { CalendarCheck, CalendarPlus, ChevronRight, Plus, ScrollText, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { berlinDateKey, daysBetween, formatDateKey } from "@/lib/business/calendar";
import { CUSTOMER_KINDS, labelOf } from "@/lib/werkbank/constants";
import { formatNumber, relativeDays } from "@/lib/werkbank/format";
import { useWerkbank } from "../context";
import { Badge, Button, Card, cx, EmptyState } from "../ui";

export interface CustomerRowView {
  id: string;
  name: string;
  kind: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  postalCode: string | null;
  projects: number;
  passes: number;
  subscriptions: number;
  upcoming: number;
}

export interface PassRowView {
  id: string;
  title: string;
  customerId: string | null;
  customerName: string | null;
  projectId: string | null;
  projectTitle: string | null;
  wood: string | null;
  surface: string | null;
  areaM2: number | null;
  installedAt: string | null;
  nextCareAt: string | null;
  subscriptionId: string | null;
  plannedCare: { id: string; startsAt: Date } | null;
}

export function CustomersView({ customers, passes, today }: { customers: CustomerRowView[]; passes: PassRowView[]; today: string }) {
  const { open } = useWerkbank();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("alle");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return customers.filter(
      (customer) =>
        (kind === "alle" || customer.kind === kind) &&
        (!needle || [customer.name, customer.email ?? "", customer.city ?? "", customer.postalCode ?? ""].some((text) => text.toLowerCase().includes(needle))),
    );
  }, [customers, query, kind]);

  return (
    <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <Card
        title={`Kunden (${customers.length})`}
        icon={Users}
        bodyClassName=""
        action={
          <Button size="sm" icon={Plus} onClick={() => open({ type: "entityForm", entity: "customer" })}>
            Kunde
          </Button>
        }
      >
        {customers.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={Users} title="Noch keine Kunden">
              Kunden legst du hier an oder übernimmst sie mit einem Klick aus einer Anfrage („Als Kunde übernehmen“). Alles andere hängt sich daran:
              Projekte, Termine, Boden-Pässe und Abos.
            </EmptyState>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-studio-line px-4 py-3">
              <div role="group" aria-label="Nach Art filtern" className="flex gap-1.5">
                {[{ key: "alle", label: "Alle" }, ...CUSTOMER_KINDS].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={kind === item.key}
                    onClick={() => setKind(item.key)}
                    className={cx(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                      kind === item.key ? "border-oak/50 bg-oak/15 text-oak-light" : "border-studio-line text-studio-muted hover:text-studio-text",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <label className="relative ml-auto w-full sm:w-56">
                <span className="sr-only">Kunden durchsuchen</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-studio-muted" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name, E-Mail, Ort …"
                  className="w-full rounded-xl border border-studio-line bg-studio-bg py-1.5 pl-9 pr-3 text-sm outline-none focus:border-oak"
                />
              </label>
            </div>
            {filtered.length === 0 ? (
              <p className="px-5 py-6 text-sm text-studio-muted">Kein Kunde passt zu diesem Filter.</p>
            ) : (
              <ul className="divide-y divide-studio-line" aria-label="Kunden">
                {filtered.map((customer) => (
                  <li key={customer.id}>
                    <button
                      type="button"
                      onClick={() => open({ type: "record", ref: { kind: "customer", id: customer.id } })}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03] sm:px-5"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-oak/15 text-sm font-semibold text-oak-light" aria-hidden>
                        {customer.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-medium">{customer.name}</span>
                          <Badge>{labelOf(CUSTOMER_KINDS, customer.kind)}</Badge>
                        </span>
                        <span className="block truncate text-xs text-studio-muted">
                          {[customer.email, customer.phone, [customer.postalCode, customer.city].filter(Boolean).join(" ")].filter(Boolean).join(" · ") || "keine Kontaktdaten"}
                        </span>
                      </span>
                      <span className="hidden shrink-0 text-right text-xs tabular-nums text-studio-muted sm:block">
                        {customer.projects} Proj. · {customer.passes} Pässe
                        <br />
                        {customer.subscriptions} Abos · {customer.upcoming} Termine
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-studio-muted" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Card>

      <Card
        id="boden-paesse"
        title={`Boden-Pässe (${passes.length})`}
        icon={ScrollText}
        bodyClassName=""
        action={
          <Button size="sm" icon={Plus} onClick={() => open({ type: "entityForm", entity: "floorPass" })}>
            Boden-Pass
          </Button>
        }
      >
        {passes.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={ScrollText} title="Noch keine Boden-Pässe">
              Jeder verlegte Boden bekommt einen Pass mit Holzart, Charge, Oberfläche, Verlegedatum und Pflegeplan. Aus dem Termin für die nächste Pflege
              werden Erinnerungen und wiederkehrende Aufträge.
            </EmptyState>
          </div>
        ) : (
          <ul className="divide-y divide-studio-line" aria-label="Boden-Pässe">
            {passes.map((pass) => {
              const days = pass.nextCareAt ? daysBetween(today, pass.nextCareAt) : null;
              return (
                <li key={pass.id} className="px-4 py-3 sm:px-5">
                  <button type="button" onClick={() => open({ type: "record", ref: { kind: "floorPass", id: pass.id } })} className="block w-full text-left">
                    <span className="block truncate font-medium hover:text-oak-light">{pass.title}</span>
                    <span className="block truncate text-xs text-studio-muted">
                      {[pass.customerName, pass.wood, pass.surface, pass.areaM2 !== null ? `${formatNumber(pass.areaM2)} m²` : null].filter(Boolean).join(" · ")}
                    </span>
                  </button>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {pass.nextCareAt && days !== null ? (
                      <Badge tone={days < 0 ? "crit" : days <= 30 ? "warn" : "neutral"}>
                        Pflege {formatDateKey(pass.nextCareAt)} · {relativeDays(days)}
                      </Badge>
                    ) : (
                      <Badge>kein Pflegetermin hinterlegt</Badge>
                    )}
                    {pass.plannedCare ? (
                      <button
                        type="button"
                        onClick={() => open({ type: "record", ref: { kind: "event", id: pass.plannedCare!.id } })}
                        className="inline-flex items-center gap-1 text-xs text-emerald-300 hover:underline"
                      >
                        <CalendarCheck className="size-3.5" aria-hidden /> geplant am {formatDateKey(berlinDateKey(pass.plannedCare.startsAt))}
                      </button>
                    ) : (
                      <Button
                        size="sm"
                        icon={CalendarPlus}
                        onClick={() =>
                          open({
                            type: "eventForm",
                            prefill: {
                              type: "pflege",
                              date: pass.nextCareAt && pass.nextCareAt >= today ? pass.nextCareAt : today,
                              title: `Pflege · ${pass.customerName ?? pass.title}`,
                              customerId: pass.customerId,
                              projectId: pass.projectId,
                              floorPassId: pass.id,
                              subscriptionId: pass.subscriptionId,
                            },
                          })
                        }
                      >
                        Pflege-Termin planen
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
