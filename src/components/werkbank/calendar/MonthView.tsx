"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import {
  formatDateKey,
  isoWeek,
  isoWeekday,
  MONTH_NAMES,
  parseDateKey,
  weekType,
  WEEK_TYPE_LABELS,
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
} from "@/lib/business/calendar";
import { monthGrid } from "@/lib/werkbank/calendar-view";
import { formatHours } from "@/lib/werkbank/format";
import { HOLIDAY_STYLE, typeStyle, VACATION_HATCH } from "../event-style";
import { Badge, Button, cx } from "../ui";
import type { CalendarModel } from "./CalendarView";
import { EntryChip, EntryRow } from "./shared";

const MAX_CHIPS = 3;

export function WeekTypeBadge({ type, compact = false }: { type: "block" | "halbtag" | "vorlauf"; compact?: boolean }) {
  const label = compact ? (type === "block" ? "Block" : type === "halbtag" ? "Halbtags" : "Vorlauf") : WEEK_TYPE_LABELS[type];
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
        type === "block" && "bg-emerald-300/85 text-[#0f1612]",
        type === "halbtag" && "bg-emerald-300/15 text-emerald-200 ring-1 ring-inset ring-emerald-300/30",
        type === "vorlauf" && "bg-white/[0.06] text-studio-muted ring-1 ring-inset ring-white/10",
      )}
    >
      {label}
    </span>
  );
}

export function LoadBar({ hours, target, compact = false }: { hours: number; target: number; compact?: boolean }) {
  const over = hours > target;
  const width = Math.min(100, (hours / Math.max(target, 1)) * 100);
  return (
    <div className={compact ? "mt-1" : ""} title={`${formatHours(hours)} von ${formatHours(target)} h geplant`}>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.08]" aria-hidden>
        <div className={cx("h-full rounded-full", over ? "bg-red-400" : "bg-emerald-300/80")} style={{ width: `${width}%` }} />
      </div>
      <p className={cx("mt-0.5 font-mono text-[0.65rem] tabular-nums", over ? "text-red-300" : "text-studio-muted")}>
        {formatHours(hours)}/{formatHours(target)} h
      </p>
    </div>
  );
}

export function MonthView({ model }: { model: CalendarModel }) {
  const { data, byDay, holidays, vacationByDay, showHolidays, openEntry, quickAdd, hiddenTypes } = model;
  const { year, month } = parseDateKey(data.date);
  const weeks = monthGrid(year, month);
  const inMonth = (key: string) => parseDateKey(key).month === month;
  const [selected, setSelected] = useState(() => (inMonth(data.date) ? data.date : weeks[0]?.find(inMonth) ?? data.date));
  const showVacation = !hiddenTypes.has("urlaub");
  const target = data.rhythm.weeklyHoursTarget;

  const selectedEntries = byDay.get(selected) ?? [];
  const selectedHoliday = showHolidays ? holidays.get(selected) : undefined;
  const selectedVacation = showVacation ? vacationByDay.get(selected) : undefined;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-studio-line bg-studio-panel">
        <div className="grid grid-cols-[2.75rem_repeat(7,minmax(0,1fr))] border-b border-studio-line text-[0.7rem] font-semibold uppercase tracking-wider text-studio-muted sm:grid-cols-[4.5rem_repeat(7,minmax(0,1fr))]">
          <div className="px-2 py-2">KW</div>
          {WEEKDAY_SHORT.map((day) => (
            <div key={day} className="border-l border-studio-line px-2 py-2">
              {day}
            </div>
          ))}
        </div>
        {weeks.map((week) => {
          const monday = week[0]!;
          const type = weekType(monday, data.rhythm);
          const hours = data.weekLoads[monday] ?? 0;
          return (
            <div key={monday} className="grid grid-cols-[2.75rem_repeat(7,minmax(0,1fr))] border-b border-studio-line last:border-b-0 sm:grid-cols-[4.5rem_repeat(7,minmax(0,1fr))]">
              <div className="flex flex-col gap-1 px-1.5 py-1.5 sm:px-2">
                <span className="font-mono text-[0.7rem] font-semibold tabular-nums text-studio-muted">KW {isoWeek(monday).week}</span>
                <span className="hidden sm:block">
                  <WeekTypeBadge type={type} compact />
                </span>
                <span className={cx("size-2 rounded-full sm:hidden", type === "block" ? "bg-emerald-300" : type === "halbtag" ? "bg-emerald-300/40" : "bg-white/15")} aria-label={WEEK_TYPE_LABELS[type]} />
                <span className="hidden sm:block">
                  <LoadBar hours={hours} target={target} />
                </span>
              </div>
              {week.map((key) => {
                const entries = (byDay.get(key) ?? []).filter((entry) => entry.type !== "urlaub" || !showVacation);
                const holiday = showHolidays ? holidays.get(key) : undefined;
                const vacation = showVacation ? vacationByDay.get(key) : undefined;
                const isToday = key === data.today;
                const isSelected = key === selected;
                const day = parseDateKey(key).day;
                const label = `${WEEKDAY_LONG[isoWeekday(key) - 1]}, ${day}. ${MONTH_NAMES[parseDateKey(key).month - 1]}`;
                return (
                  <div
                    key={key}
                    onClick={() => setSelected(key)}
                    className={cx(
                      "group relative min-h-[4.25rem] cursor-pointer border-l border-studio-line p-1 transition sm:min-h-[7.5rem] sm:p-1.5",
                      !inMonth(key) && "opacity-45",
                      isoWeekday(key) >= 6 && !vacation && "bg-white/[0.015]",
                      isSelected && "outline outline-2 -outline-offset-2 outline-oak/70",
                    )}
                    style={vacation ? { background: VACATION_HATCH } : undefined}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelected(key);
                        }}
                        aria-pressed={isSelected}
                        aria-label={`${label} auswählen`}
                        className={cx(
                          "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums",
                          isToday ? "bg-oak text-ink" : holiday ? "text-[#F2705F]" : "text-studio-text",
                        )}
                      >
                        {day}
                      </button>
                      {holiday ? (
                        <span className="mt-1 hidden min-w-0 flex-1 truncate text-[0.65rem] font-medium md:block" style={{ color: HOLIDAY_STYLE.color }} title={holiday}>
                          {holiday}
                        </span>
                      ) : vacation && vacation.start === key ? (
                        <span className="mt-1 hidden min-w-0 flex-1 truncate text-[0.65rem] font-semibold text-[#F7CD57] md:block" title={vacation.title}>
                          {vacation.title}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          quickAdd({ date: key });
                        }}
                        aria-label={`Termin am ${formatDateKey(key)} anlegen`}
                        className="hidden size-6 shrink-0 place-items-center rounded-md text-studio-muted opacity-0 transition hover:bg-white/10 hover:text-white focus:opacity-100 group-hover:opacity-100 sm:grid"
                      >
                        <Plus className="size-3.5" aria-hidden />
                      </button>
                    </div>
                    {holiday ? <div className="mt-0.5 h-0.5 rounded md:hidden" style={{ background: HOLIDAY_STYLE.color }} aria-hidden /> : null}
                    <div className="mt-1 hidden space-y-0.5 sm:block">
                      {entries.slice(0, MAX_CHIPS).map((entry) => (
                        <EntryChip key={entry.key} entry={entry} onOpen={openEntry} />
                      ))}
                      {entries.length > MAX_CHIPS ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelected(key);
                          }}
                          className="px-1 text-[0.7rem] text-studio-muted hover:text-studio-text"
                        >
                          +{entries.length - MAX_CHIPS} weitere
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden" aria-hidden>
                      {entries.slice(0, 6).map((entry) => (
                        <span key={entry.key} className={cx("size-1.5 rounded-full", entry.conflict && "ring-1 ring-red-400")} style={{ background: typeStyle(entry.type).color }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <section className="rounded-2xl border border-studio-line bg-studio-panel" aria-label="Ausgewählter Tag">
        <header className="flex flex-wrap items-center gap-2 border-b border-studio-line px-4 py-3 sm:px-5">
          <h3 className="mr-auto text-sm font-semibold">
            {WEEKDAY_LONG[isoWeekday(selected) - 1]}, {formatDateKey(selected)}
          </h3>
          <WeekTypeBadge type={weekType(selected, data.rhythm)} />
          <span className="text-xs tabular-nums text-studio-muted">
            {selectedEntries.length} {selectedEntries.length === 1 ? "Eintrag" : "Einträge"}
          </span>
          <Button size="sm" icon={Plus} onClick={() => quickAdd({ date: selected })}>
            Termin an diesem Tag
          </Button>
        </header>
        <div className="space-y-2 p-3 sm:px-4">
          {selectedHoliday ? <Badge tone="crit">Feiertag NRW: {selectedHoliday}</Badge> : null}
          {selectedVacation ? (
            <div className="rounded-lg px-3 py-2 text-sm font-medium text-[#F7CD57]" style={{ background: VACATION_HATCH }}>
              {selectedVacation.title} · Urlaub bis {formatDateKey(selectedVacation.end)}
            </div>
          ) : null}
          {selectedEntries.length === 0 ? (
            <p className="px-2 py-3 text-sm text-studio-muted">
              {isoWeekday(selected) >= 6 ? "Wochenende, keine Termine." : "Keine Termine. Klick auf „Termin an diesem Tag“, um einen anzulegen."}
            </p>
          ) : (
            <ul>
              {selectedEntries.map((entry) => (
                <li key={entry.key}>
                  <EntryRow entry={entry} onOpen={openEntry} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
