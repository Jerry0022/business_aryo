"use client";

import { TriangleAlert } from "lucide-react";
import {
  addDays,
  berlinTime,
  formatDateKey,
  isoWeekday,
  mondayOf,
  weekType,
  WEEKDAY_SHORT,
} from "@/lib/business/calendar";
import {
  blockRhythmText,
  halfDayRhythmText,
  minutesToOffset,
  offsetToSlot,
  WINDOW_LABELS,
  windowMinutes,
  windowsByDay,
} from "@/lib/werkbank/calendar-model";
import { layoutDayEvents, minutesOnDay } from "@/lib/werkbank/event-rules";
import { formatHours } from "@/lib/werkbank/format";
import { useWerkbank } from "../context";
import { HOLIDAY_STYLE, typeStyle, VACATION_HATCH } from "../event-style";
import { cx, Meter } from "../ui";
import type { CalendarModel } from "./CalendarView";
import { WeekTypeBadge } from "./MonthView";
import { EntryChip, entryLabel } from "./shared";

const START_HOUR = 6;
const END_HOUR = 21;
const HOUR_PX = 44;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, index) => START_HOUR + index);

export function WeekView({ model }: { model: CalendarModel }) {
  const { data, byDay, holidays, vacationByDay, showHolidays, openEntry, quickAdd, hiddenTypes } = model;
  const { open } = useWerkbank();
  const monday = mondayOf(data.date);
  const days = Array.from({ length: 7 }, (_, offset) => addDays(monday, offset));
  const type = weekType(monday, data.rhythm);
  const hours = data.weekLoads[monday] ?? 0;
  const target = data.rhythm.weeklyHoursTarget;
  const windows = windowsByDay(monday, data.rhythm, holidays);
  const showVacation = !hiddenTypes.has("urlaub");
  const over = hours > target;
  const rhythmText =
    type === "block"
      ? blockRhythmText(data.rhythm)
      : type === "halbtag"
        ? halfDayRhythmText(data.rhythm)
        : `Vorlauf: Der Rhythmus beginnt am ${formatDateKey(data.rhythm.firstBlockWeekMonday)}.`;

  return (
    <div className="overflow-hidden rounded-2xl border border-studio-line bg-studio-panel">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-studio-line px-4 py-3">
        <WeekTypeBadge type={type} />
        <span className="text-sm text-studio-muted">{rhythmText}</span>
        <div className="ml-auto flex min-w-[14rem] items-center gap-3">
          <span className="whitespace-nowrap text-sm">
            geplant <span className={cx("font-mono font-semibold tabular-nums", over && "text-red-300")}>{formatHours(hours)}</span>
            <span className="text-studio-muted"> / {formatHours(target)} h</span>
          </span>
          <Meter value={hours} max={target} target={target} tone={over ? "crit" : "ok"} label="Geplante Stunden dieser Woche" className="flex-1" />
        </div>
        {over ? (
          <span className="flex items-center gap-1 rounded-full bg-red-400/10 px-2 py-0.5 text-xs font-medium text-red-300 ring-1 ring-inset ring-red-400/25">
            <TriangleAlert className="size-3" aria-hidden /> +{formatHours(hours - target)} h über dem Wochenziel
          </span>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[46rem]">
          <div className="grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))] border-b border-studio-line">
            <div />
            {days.map((key) => {
              const window = windows.get(key);
              const holiday = showHolidays ? holidays.get(key) : undefined;
              return (
                <div key={key} className={cx("border-l border-studio-line px-2 py-2", key === data.today && "bg-oak/[0.08]")}>
                  <p className="text-sm">
                    <span className="font-semibold">{WEEKDAY_SHORT[isoWeekday(key) - 1]}</span>{" "}
                    <span className={cx("font-mono tabular-nums", key === data.today ? "text-oak-light" : "text-studio-muted")}>{formatDateKey(key, false)}</span>
                  </p>
                  <p className="truncate text-[0.7rem] text-studio-muted">
                    {holiday ? (
                      <span style={{ color: HOLIDAY_STYLE.color }}>{holiday}</span>
                    ) : window ? (
                      `${WINDOW_LABELS[window.kind]} ${window.start}–${window.end}`
                    ) : (
                      "kein Arbeitsfenster"
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))] border-b border-studio-line">
            <div className="px-1.5 py-2 text-[0.6rem] font-semibold uppercase tracking-wider text-studio-muted">ganzt.</div>
            {days.map((key) => {
              const vacation = showVacation ? vacationByDay.get(key) : undefined;
              const holiday = showHolidays ? holidays.get(key) : undefined;
              const allDay = (byDay.get(key) ?? []).filter((entry) => entry.allDay && (entry.type !== "urlaub" || !showVacation));
              return (
                <div key={key} className="min-h-9 space-y-0.5 border-l border-studio-line p-1" style={vacation ? { background: VACATION_HATCH } : undefined}>
                  {vacation ? (
                    <button
                      type="button"
                      onClick={() => open({ type: "record", ref: { kind: "event", id: vacation.id } })}
                      className="block w-full truncate rounded px-1 text-left text-[0.7rem] font-semibold text-[#F7CD57] hover:underline"
                    >
                      {vacation.title}
                    </button>
                  ) : null}
                  {holiday ? (
                    <span className="block truncate rounded px-1 text-[0.7rem] font-medium" style={{ color: HOLIDAY_STYLE.color, background: `${HOLIDAY_STYLE.color}1a` }}>
                      {holiday}
                    </span>
                  ) : null}
                  {allDay.map((entry) => (
                    <EntryChip key={entry.key} entry={entry} onOpen={openEntry} showTime={false} />
                  ))}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))]">
            <div className="relative" style={{ height: HOURS.length * HOUR_PX }}>
              {HOURS.map((hour) => (
                <span key={hour} className="absolute right-1.5 -translate-y-1/2 font-mono text-[0.65rem] tabular-nums text-studio-muted" style={{ top: (hour - START_HOUR) * HOUR_PX }}>
                  {hour > START_HOUR ? `${String(hour).padStart(2, "0")}:00` : ""}
                </span>
              ))}
            </div>
            {days.map((key) => {
              const window = windows.get(key);
              const vacation = showVacation ? vacationByDay.get(key) : undefined;
              const holiday = showHolidays ? holidays.get(key) : undefined;
              const timed = (byDay.get(key) ?? []).filter((entry) => !entry.allDay);
              const layout = layoutDayEvents(timed.map((entry) => ({ key: entry.key, ...minutesOnDay(entry, key) })));
              return (
                <div
                  key={key}
                  className={cx("relative cursor-copy border-l border-studio-line", isoWeekday(key) >= 6 && "bg-white/[0.015]")}
                  style={{ height: HOURS.length * HOUR_PX }}
                  onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    const slot = offsetToSlot(event.clientY - rect.top, START_HOUR, END_HOUR, HOUR_PX);
                    quickAdd({ date: key, ...slot });
                  }}
                  aria-label={`${WEEKDAY_SHORT[isoWeekday(key) - 1]} ${formatDateKey(key)}: in eine freie Zeit klicken, um einen Termin anzulegen`}
                >
                  {HOURS.map((hour) => (
                    <div key={hour} className="pointer-events-none absolute inset-x-0 border-t border-studio-line/60" style={{ top: (hour - START_HOUR) * HOUR_PX }} aria-hidden />
                  ))}
                  {window ? (
                    <div
                      className="pointer-events-none absolute inset-x-1 rounded-md border border-dashed border-emerald-300/35 bg-emerald-300/[0.07]"
                      style={{
                        top: minutesToOffset(windowMinutes(window).start, START_HOUR, HOUR_PX),
                        height: minutesToOffset(windowMinutes(window).end, START_HOUR, HOUR_PX) - minutesToOffset(windowMinutes(window).start, START_HOUR, HOUR_PX),
                      }}
                      aria-hidden
                    />
                  ) : null}
                  {vacation ? <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: VACATION_HATCH }} aria-hidden /> : null}
                  {holiday ? <div className="pointer-events-none absolute inset-0" style={{ background: `${HOLIDAY_STYLE.color}12` }} aria-hidden /> : null}
                  {key === data.today && data.nowMinutes >= START_HOUR * 60 && data.nowMinutes <= END_HOUR * 60 ? (
                    <div className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-copper" style={{ top: minutesToOffset(data.nowMinutes, START_HOUR, HOUR_PX) }} aria-hidden>
                      <span className="absolute -left-1 -top-[5px] size-2 rounded-full bg-copper" />
                    </div>
                  ) : null}
                  {timed.map((entry) => {
                    const slot = layout.get(entry.key) ?? { column: 0, columns: 1 };
                    const span = minutesOnDay(entry, key);
                    const start = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60 - 15, span.start));
                    const end = Math.max(start + 20, Math.min(END_HOUR * 60, span.end));
                    const top = minutesToOffset(start, START_HOUR, HOUR_PX);
                    const height = Math.max(22, minutesToOffset(end, START_HOUR, HOUR_PX) - top - 2);
                    const style = typeStyle(entry.type);
                    const virtual = entry.source === "virtualOfficeHour";
                    return (
                      <button
                        key={entry.key}
                        type="button"
                        title={entryLabel(entry)}
                        aria-label={entryLabel(entry)}
                        onClick={(event) => {
                          event.stopPropagation();
                          openEntry(entry);
                        }}
                        className={cx(
                          "absolute z-[5] overflow-hidden rounded-md border border-l-[3px] px-1.5 py-1 text-left text-[0.7rem] leading-tight shadow-sm transition hover:z-20 hover:brightness-125",
                          virtual && "border-dashed",
                          entry.conflict && "ring-2 ring-red-400",
                          entry.status === "abgesagt" && "opacity-50",
                        )}
                        style={{
                          top,
                          height,
                          left: `calc(${(slot.column / slot.columns) * 100}% + 2px)`,
                          width: `calc(${100 / slot.columns}% - 4px)`,
                          backgroundColor: `color-mix(in srgb, ${style.color} ${virtual ? 10 : 22}%, #151920)`,
                          borderColor: `${style.color}88`,
                          borderLeftColor: style.color,
                          color: style.color,
                        }}
                      >
                        <span className="block font-mono tabular-nums opacity-90">
                          {berlinTime(entry.startsAt)}–{berlinTime(entry.endsAt)}
                        </span>
                        <span className={cx("block font-semibold text-studio-text", entry.status === "abgesagt" && "line-through")}>{entry.title}</span>
                        {entry.location && height > 70 ? <span className="block truncate text-studio-muted">{entry.location}</span> : null}
                        {entry.conflict ? (
                          <span className="mt-0.5 flex items-center gap-0.5 font-semibold text-red-300">
                            <TriangleAlert className="size-3" aria-hidden /> Konflikt
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="border-t border-studio-line px-4 py-2 text-xs text-studio-muted">
        Klick in eine freie Zeit legt dort einen Termin an. Gestrichelte Flächen sind die Arbeitsfenster laut Rhythmus.
      </p>
    </div>
  );
}
