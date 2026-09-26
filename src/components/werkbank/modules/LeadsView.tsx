"use client";

import { ChevronRight, Inbox, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { berlinDateKey, formatDateKey } from "@/lib/business/calendar";
import { LEAD_KINDS, LEAD_STATUSES, labelOf, OPEN_LEAD_STATUSES } from "@/lib/werkbank/constants";
import type { LeadListItem } from "@/lib/werkbank/queries";
import type { Tone } from "@/lib/werkbank/types";
import { useWerkbank } from "../context";
import { Badge, cx, EmptyState } from "../ui";

const KIND_TONES: Record<string, Tone> = { notfall: "crit", projekt: "oak", partner: "info", "boden-check": "ok", abo: "neutral" };
const STATUS_TONES: Record<string, Tone> = { neu: "warn", "in-arbeit": "info", erledigt: "ok", abgelehnt: "neutral" };

export function LeadsView({ leads, initialKind, initialStatus }: { leads: LeadListItem[]; initialKind: string; initialStatus: string }) {
  const { open } = useWerkbank();
  const [kind, setKind] = useState(initialKind);
  const [status, setStatus] = useState(initialStatus);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads.filter(
      (lead) =>
        (kind === "alle" || lead.kind === kind) &&
        (status === "alle" || (status === "offen" ? OPEN_LEAD_STATUSES.has(lead.status) : lead.status === status)) &&
        (!needle || [lead.name, lead.email, lead.postalCode ?? "", lead.summary, lead.message ?? ""].some((text) => text.toLowerCase().includes(needle))),
    );
  }, [leads, kind, status, query]);

  const countKind = (key: string) => leads.filter((lead) => (key === "alle" || lead.kind === key) && (status === "alle" || (status === "offen" ? OPEN_LEAD_STATUSES.has(lead.status) : lead.status === status))).length;

  if (leads.length === 0) {
    return (
      <EmptyState icon={Inbox} title="Noch keine Anfragen" className="mt-6">
        Sobald jemand auf der Website den Boden-Check abschickt, sich als Projekt oder Partner bewirbt, einen Notfall meldet oder nach einem Abo fragt, landet es hier.
        Du kannst dann mit einem Klick einen Kunden, ein Projekt oder eine Erstberatung daraus machen.
      </EmptyState>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Nach Art filtern" className="flex flex-wrap gap-1.5">
          {[{ key: "alle", label: "Alle" }, ...LEAD_KINDS].map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={kind === item.key}
              onClick={() => setKind(item.key)}
              className={cx(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                kind === item.key ? "border-oak/50 bg-oak/15 text-oak-light" : "border-studio-line text-studio-muted hover:text-studio-text",
              )}
            >
              {item.label} <span className="tabular-nums opacity-70">{countKind(item.key)}</span>
            </button>
          ))}
        </div>
        <label className="ml-auto text-xs text-studio-muted">
          <span className="sr-only">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Nach Status filtern"
            className="rounded-xl border border-studio-line bg-studio-bg px-3 py-1.5 text-sm text-studio-text"
          >
            <option value="offen">Offen (neu + in Arbeit)</option>
            <option value="alle">Alle Status</option>
            {LEAD_STATUSES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="relative w-full sm:w-60">
          <span className="sr-only">Anfragen durchsuchen</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-studio-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, E-Mail, PLZ …"
            className="w-full rounded-xl border border-studio-line bg-studio-bg py-1.5 pl-9 pr-3 text-sm outline-none focus:border-oak"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Inbox} title="Keine Anfragen für diesen Filter">
          Wähl „Alle Status“ oder eine andere Art, um erledigte und abgelehnte Anfragen zu sehen.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-studio-line overflow-hidden rounded-2xl border border-studio-line bg-studio-panel" aria-label="Anfragen">
          {filtered.map((lead) => (
            <li key={lead.id}>
              <button
                type="button"
                onClick={() => open({ type: "record", ref: { kind: "lead", id: lead.id } })}
                className="flex w-full flex-col gap-2 px-4 py-3 text-left transition hover:bg-white/[0.03] sm:flex-row sm:items-center sm:gap-4 sm:px-5"
              >
                <span className="flex shrink-0 items-center gap-2 sm:w-44">
                  <Badge tone={KIND_TONES[lead.kind] ?? "neutral"}>{labelOf(LEAD_KINDS, lead.kind)}</Badge>
                  <Badge tone={STATUS_TONES[lead.status] ?? "neutral"}>{labelOf(LEAD_STATUSES, lead.status)}</Badge>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {lead.name}
                    {lead.customerName ? <span className="ml-2 text-xs font-normal text-emerald-300">Kunde: {lead.customerName}</span> : null}
                  </span>
                  <span className="block truncate text-sm text-studio-muted">
                    {[lead.email, lead.postalCode, lead.summary].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2 font-mono text-xs tabular-nums text-studio-muted">
                  {formatDateKey(berlinDateKey(lead.createdAt))}
                  <ChevronRight className="size-4" aria-hidden />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
