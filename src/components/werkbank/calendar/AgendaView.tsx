"use client";

import { CalendarRange } from "lucide-react";
import Link from "next/link";
import { addDays, formatDateKey, isoWeek, isoWeekday, mondayOf, weekType, WEEKDAY_LONG } from "@/lib/business/calendar";
import { AGENDA_DAYS, calendarHref } from "@/lib/werkbank/calendar-view";
import { formatHours } from "@/lib/werkbank/format";
import { HOLIDAY_STYLE, VACATION_HATCH } from "../event-style";
import { cx, EmptyState } from "../ui";
import type { CalendarModel } from "./CalendarView";
import { WeekTypeBadge } from "./MonthView";
import { EntryRow } from "./shared";

export function AgendaView({ model, query }: { model: CalendarModel; query: string }) {
  const { data, byDay, holidays, vacationByDay, showHolidays, openEntry, hiddenTypes } = model;
  const showVacation = !hiddenTypes.has("urlaub");
  const days = Array.from({ length: AGENDA_DAYS }, (_, offset) => addDays(data.date, offset));
  const weeks = new Map<string, string[]>();
  for (const key of days) {
    const monday = mondayOf(key);
    weeks.set(monday, [...(weeks.get(monday) ?? []), key]);
  }
  const total = days.reduce((sum, key) => sum + (byDay.get(key)?.length ?? 0), 0);

  if (total === 0 && query) {
    return <EmptyState icon={CalendarRange} title="Nichts gefunden">Kein Termin in diesem Zeitraum passt zu „{query}“. Versuch einen anderen Suchbegriff oder blätter weiter.</EmptyState>;
  }

  return (
    <div className="space-y-4" aria-label="Agenda">
      {[...weeks.entries()].map(([monday, keys]) => {
        const hours = data.weekLoads[monday] ?? 0;
        const over = hours > data.rhythm.weeklyHoursTarget;
        const shown = keys.filter((key) => (byDay.get(key)?.length ?? 0) > 0 || (showHolidays && holidays.has(key)) || (showVacation && vacationByDay.has(key)) || key === data.today);
        return (
          <section key={monday} className="overflow-hidden rounded-2xl border border-studio-line bg-studio-panel">
            <header className="flex flex-wrap items-center gap-2 border-b border-studio-line px-4 py-2.5">
              <Link href={calendarHref("woche", monday)} className="font-mono text-sm font-semibold tabular-nums hover:text-oak-light">
                KW {isoWeek(monday).week}
              </Link>
              <WeekTypeBadge type={weekType(monday, data.rhythm)} />
              <span className="text-xs text-studio-muted">
                {formatDateKey(monday, false)}–{formatDateKey(addDays(monday, 6))}
              </span>
              <span className={cx("ml-auto font-mono text-xs tabular-nums", over ? "text-red-300" : "text-studio-muted")}>
                {formatHours(hours)} / {formatHours(data.rhythm.weeklyHoursTarget)} h
              </span>
            </header>
            {shown.length === 0 ? (
              <p className="px-4 py-3 text-sm text-studio-muted">{query ? "Keine Treffer in dieser Woche." : "Keine Termine in dieser Woche."}</p>
            ) : (
              <ol className="divide-y divide-studio-line">
                {shown.map((key) => {
                  const entries = (byDay.get(key) ?? []).filter((entry) => entry.type !== "urlaub" || !showVacation);
                  const holiday = showHolidays ? holidays.get(key) : undefined;
                  const vacation = showVacation ? vacationByDay.get(key) : undefined;
                  return (
                    <li key={key} className="grid gap-1 px-3 py-2 sm:grid-cols-[9rem_1fr] sm:gap-3">
                      <div className="px-1 pt-2">
                        <p className={cx("text-sm font-semibold", key === data.today && "text-oak-light")}>
                          {WEEKDAY_LONG[isoWeekday(key) - 1]}
                          {key === data.today ? " · heute" : ""}
                        </p>
                        <p className="font-mono text-xs tabular-nums text-studio-muted">{formatDateKey(key)}</p>
                      </div>
                      <div className="min-w-0 space-y-1">
                        {holiday ? (
                          <p className="px-2 pt-2 text-sm font-medium" style={{ color: HOLIDAY_STYLE.color }}>
                            Feiertag NRW: {holiday}
                          </p>
                        ) : null}
                        {vacation ? (
                          <p className="mt-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#F7CD57]" style={{ background: VACATION_HATCH }}>
                            {vacation.title}
                          </p>
                        ) : null}
                        {entries.length === 0 && !holiday && !vacation ? <p className="px-2 pt-2 text-sm text-studio-muted">Keine Termine</p> : null}
                        {entries.length > 0 ? (
                          <ul>
                            {entries.map((entry) => (
                              <li key={entry.key}>
                                <EntryRow entry={entry} onOpen={openEntry} />
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        );
      })}
    </div>
  );
}
