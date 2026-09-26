"use client";

import { ChevronRight, House, Plus, ScrollText } from "lucide-react";
import { useMemo, useState } from "react";
import { berlinDateKey, formatDateKey, MONTH_NAMES, MONTH_SHORT } from "@/lib/business/calendar";
import { PROJECT_STATUSES, SLOT_BOOKED_STATUSES, type ProjectContingent } from "@/lib/business/contingent";
import { labelOf } from "@/lib/werkbank/constants";
import { formatNumber } from "@/lib/werkbank/format";
import type { Tone } from "@/lib/werkbank/types";
import { useWerkbank } from "../context";
import { Badge, Button, cx, EmptyState } from "../ui";

export interface ProjectRowView {
  id: string;
  title: string;
  status: string;
  customerName: string | null;
  floorType: string | null;
  areaM2: number | null;
  city: string | null;
  slotYear: number | null;
  slotMonth: number | null;
  eventCount: number;
  nextEvent: { id: string; title: string; startsAt: Date } | null;
  floorPassId: string | null;
}

const STATUS_TONES: Record<string, Tone> = {
  anfrage: "neutral",
  beratung: "info",
  angebot: "warn",
  gebucht: "ok",
  laufend: "oak",
  abgeschlossen: "ok",
  storniert: "crit",
};

export function ContingentStrip({ contingent }: { contingent: ProjectContingent }) {
  return (
    <div className="rounded-2xl border border-studio-line bg-studio-panel p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">
          Projektplätze {contingent.year}:{" "}
          <span className="tabular-nums">
            {contingent.booked} von {contingent.total}
          </span>{" "}
          vergeben
        </p>
        <p className="text-xs text-studio-muted">
          Website zeigt: <span className="font-medium tabular-nums text-emerald-300">noch {contingent.free} frei</span>
          {contingent.reserved ? ` · ${contingent.reserved} reserviert (Angebot)` : ""}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-12">
        {contingent.months.map((month, index) => (
          <div key={month.month} className="text-center">
            <div
              className={cx(
                "grid h-10 place-items-center rounded-md text-xs font-semibold tabular-nums",
                month.state === "gebucht" && "bg-oak text-ink",
                month.state === "reserviert" && "text-oak-light",
                month.state === "frei" && "border border-dashed border-studio-line text-studio-muted",
              )}
              style={month.state === "reserviert" ? { background: "repeating-linear-gradient(135deg, rgba(196,138,74,0.45) 0 4px, rgba(196,138,74,0.12) 4px 8px)" } : undefined}
              title={`${MONTH_NAMES[index]}: ${month.state}`}
            >
              {month.booked > 1 ? `${month.booked}×` : month.state === "gebucht" ? "✓" : ""}
            </div>
            <span className="mt-0.5 block text-[0.65rem] text-studio-muted">{MONTH_SHORT[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectsView({ projects }: { projects: ProjectRowView[] }) {
  const { open } = useWerkbank();
  const [status, setStatus] = useState("aktiv");
  const filtered = useMemo(
    () =>
      projects.filter((project) =>
        status === "alle" ? true : status === "aktiv" ? !["abgeschlossen", "storniert"].includes(project.status) : project.status === status,
      ),
    [projects, status],
  );

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={House}
        title="Noch keine Projekte"
        className="mt-6"
        action={
          <Button variant="primary" icon={Plus} onClick={() => open({ type: "entityForm", entity: "project" })}>
            Erstes Projekt anlegen
          </Button>
        }
      >
        Ein Projekt mit Projektplatz (Jahr und Monat) und Status „Gebucht“ zählt sofort auf den Zähler der Website. Projekte entstehen meist aus einer
        Anfrage: Öffne sie und klick auf „Projekt anlegen“.
      </EmptyState>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <div role="group" aria-label="Nach Status filtern" className="flex flex-wrap gap-1.5">
        {[{ key: "aktiv", label: "Aktiv" }, { key: "alle", label: "Alle" }, ...PROJECT_STATUSES].map((item) => {
          const count = projects.filter((project) =>
            item.key === "alle" ? true : item.key === "aktiv" ? !["abgeschlossen", "storniert"].includes(project.status) : project.status === item.key,
          ).length;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={status === item.key}
              onClick={() => setStatus(item.key)}
              className={cx(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                status === item.key ? "border-oak/50 bg-oak/15 text-oak-light" : "border-studio-line text-studio-muted hover:text-studio-text",
              )}
            >
              {item.label} <span className="tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </div>
      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-studio-line px-5 py-6 text-sm text-studio-muted">Keine Projekte mit diesem Status.</p>
      ) : (
        <ul className="divide-y divide-studio-line overflow-hidden rounded-2xl border border-studio-line bg-studio-panel" aria-label="Projekte">
          {filtered.map((project) => (
            <li key={project.id}>
              <button
                type="button"
                onClick={() => open({ type: "record", ref: { kind: "project", id: project.id } })}
                className="flex w-full flex-col gap-2 px-4 py-3 text-left transition hover:bg-white/[0.03] sm:flex-row sm:items-center sm:gap-4 sm:px-5"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{project.title}</span>
                    <Badge tone={STATUS_TONES[project.status] ?? "neutral"}>{labelOf(PROJECT_STATUSES, project.status)}</Badge>
                    {project.floorPassId ? (
                      <Badge tone="oak">
                        <ScrollText className="size-3" aria-hidden /> Boden-Pass
                      </Badge>
                    ) : null}
                  </span>
                  <span className="block truncate text-sm text-studio-muted">
                    {[project.customerName ?? "ohne Kunde", project.floorType, project.areaM2 !== null ? `${formatNumber(project.areaM2)} m²` : null, project.city]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-studio-muted sm:w-72 sm:justify-end">
                  {project.slotYear ? (
                    <Badge tone={SLOT_BOOKED_STATUSES.has(project.status) ? "oak" : "neutral"}>
                      Platz {project.slotMonth ? `${MONTH_SHORT[project.slotMonth - 1]} ` : ""}
                      {project.slotYear}
                    </Badge>
                  ) : (
                    <span>kein Projektplatz</span>
                  )}
                  {project.nextEvent ? (
                    <span className="tabular-nums">nächster Termin {formatDateKey(berlinDateKey(project.nextEvent.startsAt), false)}</span>
                  ) : (
                    <span>{project.eventCount} Termine</span>
                  )}
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
