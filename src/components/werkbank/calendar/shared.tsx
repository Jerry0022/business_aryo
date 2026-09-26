"use client";

import { TriangleAlert } from "lucide-react";
import { berlinTime } from "@/lib/business/calendar";
import type { CalEntry } from "@/lib/werkbank/types";
import { useWerkbank } from "../context";
import { typeStyle } from "../event-style";
import { cx } from "../ui";

export function useOpenEntry() {
  const { open } = useWerkbank();
  return (entry: CalEntry) => {
    if (entry.source === "event" && entry.id) open({ type: "record", ref: { kind: "event", id: entry.id } });
    else if (entry.source === "officeHour" && entry.id) open({ type: "record", ref: { kind: "officeHour", id: entry.id } });
    else
      open({
        type: "virtualOfficeHour",
        startsAt: entry.startsAt.toISOString(),
        topic: entry.title.replace(/^Sprechstunde: /, ""),
        durationMinutes: Math.round((entry.endsAt.getTime() - entry.startsAt.getTime()) / 60_000),
      });
  };
}

export function entryLabel(entry: CalEntry): string {
  const style = typeStyle(entry.type);
  const time = entry.allDay ? "ganztägig" : `${berlinTime(entry.startsAt)}–${berlinTime(entry.endsAt)}`;
  const flags = [entry.conflict ? "Konflikt" : null, entry.source === "virtualOfficeHour" ? "Vorschlag aus den Einstellungen" : null, entry.status === "abgesagt" ? "abgesagt" : null]
    .filter(Boolean)
    .join(", ");
  const reasons = entry.conflictReasons?.length ? ` ${entry.conflictReasons.join(" ")}` : "";
  return `${style.label}: ${entry.title}, ${time}${entry.location ? `, ${entry.location}` : ""}${flags ? ` (${flags})` : ""}${reasons}`;
}

/** Compact entry used in month cells and the all-day row. */
export function EntryChip({ entry, onOpen, showTime = true, className }: { entry: CalEntry; onOpen: (entry: CalEntry) => void; showTime?: boolean; className?: string }) {
  const style = typeStyle(entry.type);
  const Icon = entry.conflict ? TriangleAlert : style.icon;
  const virtual = entry.source === "virtualOfficeHour";
  return (
    <button
      type="button"
      title={entryLabel(entry)}
      aria-label={entryLabel(entry)}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(entry);
      }}
      className={cx(
        "flex w-full min-w-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-left text-[0.7rem] leading-4 transition hover:brightness-125",
        virtual && "border-dashed opacity-80",
        entry.conflict && "ring-1 ring-red-400/80",
        entry.status === "abgesagt" && "line-through opacity-50",
        className,
      )}
      style={{
        backgroundColor: `${style.color}${virtual ? "10" : "22"}`,
        borderColor: entry.conflict ? "#f87171aa" : `${style.color}${virtual ? "55" : "60"}`,
        color: style.color,
      }}
    >
      <Icon className={cx("size-3 shrink-0", entry.conflict && "text-red-300")} aria-hidden />
      {showTime && !entry.allDay ? <span className="shrink-0 font-mono tabular-nums opacity-80">{berlinTime(entry.startsAt)}</span> : null}
      <span className="min-w-0 truncate font-medium text-studio-text/95">{entry.title}</span>
    </button>
  );
}

/** Row used in agenda lists (overview, calendar agenda, day panel). */
export function EntryRow({ entry, onOpen }: { entry: CalEntry; onOpen: (entry: CalEntry) => void }) {
  const style = typeStyle(entry.type);
  const Icon = style.icon;
  const virtual = entry.source === "virtualOfficeHour";
  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      className={cx(
        "group flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/[0.04]",
        entry.status === "abgesagt" && "opacity-55",
      )}
    >
      <span className="w-[6.5rem] shrink-0 font-mono text-xs tabular-nums text-studio-muted">
        {entry.allDay ? "ganztägig" : `${berlinTime(entry.startsAt)}–${berlinTime(entry.endsAt)}`}
      </span>
      <span
        className={cx("grid size-7 shrink-0 place-items-center rounded-lg border", virtual && "border-dashed")}
        style={{ backgroundColor: `${style.color}1f`, borderColor: `${style.color}66`, color: style.color }}
      >
        <Icon className="size-3.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cx("block truncate text-sm font-medium", entry.status === "abgesagt" && "line-through")}>{entry.title}</span>
        <span className="block truncate text-xs text-studio-muted">
          {style.label}
          {entry.location ? ` · ${entry.location}` : ""}
          {entry.registrations !== undefined ? ` · ${entry.registrations} Anmeldungen` : ""}
          {virtual ? " · Vorschlag, noch nicht angelegt" : ""}
        </span>
      </span>
      {entry.conflict ? (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-400/10 px-2 py-0.5 text-xs font-medium text-red-300 ring-1 ring-inset ring-red-400/25">
          <TriangleAlert className="size-3" aria-hidden /> Konflikt
        </span>
      ) : entry.status === "erledigt" ? (
        <span className="shrink-0 rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-300 ring-1 ring-inset ring-emerald-400/20">erledigt</span>
      ) : null}
    </button>
  );
}
