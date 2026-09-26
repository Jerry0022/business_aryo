"use client";

import Link from "next/link";
import { isoWeekday, MONTH_NAMES, parseDateKey, weekType, WEEK_TYPE_LABELS, WEEKDAY_LONG } from "@/lib/business/calendar";
import { calendarHref, monthGrid } from "@/lib/werkbank/calendar-view";
import { HOLIDAY_STYLE, typeStyle, VACATION_HATCH } from "../event-style";
import { cx } from "../ui";
import type { CalendarModel } from "./CalendarView";

const PRIORITY = ["verlegung", "erstberatung", "einweisung", "pflege", "sprechstunde", "werkzeug", "material", "partner", "buero"];
const LETTERS = ["M", "D", "M", "D", "F", "S", "S"];

export function YearView({ model }: { model: CalendarModel }) {
  const { data, byDay, holidays, vacationByDay, showHolidays, hiddenTypes } = model;
  const year = parseDateKey(data.date).year;
  const showVacation = !hiddenTypes.has("urlaub");

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {MONTH_NAMES.map((name, index) => {
        const month = index + 1;
        const weeks = monthGrid(year, month);
        const count = new Set(
          weeks
            .flat()
            .filter((key) => parseDateKey(key).month === month)
            .flatMap((key) => (byDay.get(key) ?? []).filter((entry) => entry.type !== "urlaub").map((entry) => entry.key)),
        ).size;
        return (
          <section key={name} className="rounded-2xl border border-studio-line bg-studio-panel p-3" aria-label={`${name} ${year}`}>
            <header className="mb-2 flex items-baseline justify-between px-1">
              <Link href={calendarHref("monat", `${year}-${String(month).padStart(2, "0")}-01`)} className="text-sm font-semibold hover:text-oak-light">
                {name}
              </Link>
              <span className="font-mono text-[0.65rem] tabular-nums text-studio-muted">
                {count} {count === 1 ? "Termin" : "Termine"}
              </span>
            </header>
            <div className="grid grid-cols-[0.4rem_repeat(7,minmax(0,1fr))] gap-y-0.5 text-center">
              <span />
              {LETTERS.map((letter, position) => (
                <span key={position} className="pb-1 text-[0.6rem] font-semibold text-studio-muted">
                  {letter}
                </span>
              ))}
              {weeks.map((week) => {
                const type = weekType(week[0]!, data.rhythm);
                return (
                  <div key={week[0]} className="contents">
                    <span
                      className={cx("my-0.5 w-1 rounded-full", type === "block" ? "bg-emerald-300" : type === "halbtag" ? "bg-emerald-300/35" : "bg-transparent")}
                      title={WEEK_TYPE_LABELS[type]}
                      aria-hidden
                    />
                    {week.map((key) => {
                      if (parseDateKey(key).month !== month) return <span key={key} />;
                      const entries = (byDay.get(key) ?? []).filter((entry) => entry.type !== "urlaub");
                      const main = PRIORITY.map((type) => entries.find((entry) => entry.type === type)).find(Boolean);
                      const vacation = showVacation ? vacationByDay.get(key) : undefined;
                      const holiday = showHolidays ? holidays.get(key) : undefined;
                      const conflict = entries.some((entry) => entry.conflict);
                      const style = main ? typeStyle(main.type) : null;
                      const solid = main?.type === "verlegung";
                      const title = [
                        `${WEEKDAY_LONG[isoWeekday(key) - 1]}, ${parseDateKey(key).day}. ${name}`,
                        holiday ? `Feiertag: ${holiday}` : null,
                        vacation ? `Urlaub: ${vacation.title}` : null,
                        ...entries.slice(0, 4).map((entry) => entry.title),
                        entries.length > 4 ? `+${entries.length - 4} weitere` : null,
                      ]
                        .filter(Boolean)
                        .join("\n");
                      return (
                        <Link
                          key={key}
                          href={calendarHref("woche", key)}
                          title={title}
                          aria-label={title.replace(/\n/g, ", ")}
                          className={cx(
                            "relative mx-auto grid h-7 w-full place-items-center text-[0.7rem] tabular-nums transition hover:brightness-125",
                            vacation ? "rounded-none" : "rounded-md",
                            key === data.today && "ring-2 ring-oak",
                            conflict && "ring-1 ring-red-400",
                            isoWeekday(key) >= 6 && !main && !vacation && "text-studio-muted",
                          )}
                          style={{
                            background: vacation ? VACATION_HATCH : style ? (solid ? style.color : `${style.color}33`) : undefined,
                            color: solid ? "#17130f" : holiday ? HOLIDAY_STYLE.color : style ? style.color : undefined,
                            fontWeight: main || holiday ? 600 : undefined,
                          }}
                        >
                          {parseDateKey(key).day}
                          {holiday ? <span className="absolute inset-x-1.5 bottom-0.5 h-0.5 rounded" style={{ background: HOLIDAY_STYLE.color }} aria-hidden /> : null}
                          {vacation && main ? <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full" style={{ background: style?.color }} aria-hidden /> : null}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
