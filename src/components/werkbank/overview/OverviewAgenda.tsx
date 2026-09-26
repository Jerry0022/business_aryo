"use client";

import { addDays, formatDateKey, isoWeek, isoWeekday, weekType, WEEK_TYPE_LABELS, WEEKDAY_SHORT } from "@/lib/business/calendar";
import { groupByDay, spanDays } from "@/lib/werkbank/calendar-model";
import type { OverviewData } from "@/lib/werkbank/queries";
import { EntryRow, useOpenEntry } from "../calendar/shared";
import { HOLIDAY_STYLE, VACATION_HATCH } from "../event-style";
import { cx } from "../ui";

/** Today and the next 7 days, including holidays, vacation and weekends. */
export function OverviewAgenda({ data }: { data: OverviewData }) {
  const openEntry = useOpenEntry();
  const byDay = groupByDay(data.agenda.entries);
  const holidays = new Map(data.agenda.holidays);
  const vacations = spanDays(data.agenda.vacations);
  const days = Array.from({ length: 8 }, (_, offset) => addDays(data.today, offset));
  return (
    <ol className="divide-y divide-studio-line">
      {days.map((key) => {
        const entries = (byDay.get(key) ?? []).filter((entry) => entry.type !== "urlaub");
        const holiday = holidays.get(key);
        const vacation = vacations.get(key);
        const weekend = isoWeekday(key) >= 6;
        const type = weekType(key, data.settings.rhythm);
        return (
          <li key={key} className="grid gap-1 px-3 py-2 sm:grid-cols-[8.5rem_1fr] sm:gap-3 sm:px-4">
            <div className="px-1 pt-2">
              <p className={cx("text-sm font-semibold tabular-nums", key === data.today && "text-oak-light")}>
                {WEEKDAY_SHORT[isoWeekday(key) - 1]} {formatDateKey(key, false)}
                {key === data.today ? " · heute" : ""}
              </p>
              <p className="text-xs text-studio-muted">
                KW {isoWeek(key).week} · {WEEK_TYPE_LABELS[type].replace("-Woche", "")}
              </p>
            </div>
            <div className="min-w-0">
              {holiday ? (
                <p className="px-2 pt-2 text-sm font-medium" style={{ color: HOLIDAY_STYLE.color }}>
                  {holiday} · Feiertag NRW
                </p>
              ) : null}
              {vacation ? (
                <p className="mt-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#F7CD57]" style={{ background: VACATION_HATCH }}>
                  {vacation.title}
                </p>
              ) : null}
              {entries.length > 0 ? (
                <ul>
                  {entries.map((entry) => (
                    <li key={entry.key}>
                      <EntryRow entry={entry} onOpen={openEntry} />
                    </li>
                  ))}
                </ul>
              ) : !holiday && !vacation ? (
                <p className="px-2 pt-2 text-sm text-studio-muted">{weekend ? "Wochenende, frei" : "Keine Termine"}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
