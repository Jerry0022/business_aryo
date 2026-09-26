"use client";

import { Check, Plus, Sun } from "lucide-react";
import Link from "next/link";
import { daysBetween, formatDateKey, isoWeekday, mondayOf, weekType, WEEKDAY_SHORT } from "@/lib/business/calendar";
import { blockRhythmText, halfDayRhythmText } from "@/lib/werkbank/calendar-model";
import { addBridgeVacation } from "@/lib/werkbank/actions/events";
import { WERKBANK_PATH } from "@/lib/werkbank/constants";
import { formatDateRange, relativeDays } from "@/lib/werkbank/format";
import type { CalendarData } from "@/lib/werkbank/queries";
import { useWerkbank } from "../context";
import { VACATION_HATCH } from "../event-style";
import { useAction } from "../hooks";
import { Button, Card } from "../ui";
import { WeekTypeBadge } from "./MonthView";

export function VacationCountdown({ inDays, running }: { inDays: number; running?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold text-[#F7CD57] ring-1 ring-inset ring-[#F7CD57]/40" style={{ background: VACATION_HATCH }}>
      <Sun className="size-3.5" aria-hidden />
      {running ? "läuft gerade" : inDays === 0 ? "ab heute" : `in ${inDays} ${inDays === 1 ? "Tag" : "Tagen"}`}
    </span>
  );
}

export function CalendarSidebar({ data }: { data: CalendarData }) {
  const { open } = useWerkbank();
  const { pending, run } = useAction();
  const account = data.account;
  const allowance = Math.max(account.allowance, account.taken + account.planned, 1);
  const thisWeek = weekType(mondayOf(data.today), data.rhythm);

  return (
    <aside className="grid content-start gap-4 sm:grid-cols-2 2xl:grid-cols-1" aria-label="Urlaub und Rhythmus">
      <Card title={`Urlaubskonto ${account.year}`} icon={Sun} action={<span className="font-mono text-xs tabular-nums text-studio-muted">{account.allowance} Tage</span>}>
        <dl className="grid grid-cols-3 gap-2">
          <div>
            <dt className="text-xs text-studio-muted">genommen</dt>
            <dd className="font-mono text-2xl font-semibold tabular-nums text-[#F7CD57]">{account.taken}</dd>
          </div>
          <div>
            <dt className="text-xs text-studio-muted">geplant</dt>
            <dd className="font-mono text-2xl font-semibold tabular-nums">{account.planned}</dd>
          </div>
          <div>
            <dt className="text-xs text-studio-muted">übrig</dt>
            <dd className={`font-mono text-2xl font-semibold tabular-nums ${account.left < 0 ? "text-red-300" : "text-emerald-300"}`}>{account.left}</dd>
          </div>
        </dl>
        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-white/[0.07]" aria-hidden>
          <div className="h-full bg-[#F7CD57]" style={{ width: `${(account.taken / allowance) * 100}%` }} />
          <div className="h-full" style={{ width: `${(account.planned / allowance) * 100}%`, background: "repeating-linear-gradient(135deg, #F7CD57 0 4px, rgba(247,205,87,0.35) 4px 8px)" }} />
        </div>
        {account.left < 0 ? <p className="mt-2 text-xs text-red-300">Mehr Urlaub eingeplant als im Konto: {-account.left} Tage drüber.</p> : null}
        {data.accountSpans.length > 0 ? (
          <ul className="mt-3 space-y-1 text-sm">
            {data.accountSpans.map((span) => (
              <li key={span.id}>
                <button
                  type="button"
                  onClick={() => open({ type: "record", ref: { kind: "event", id: span.id } })}
                  className="flex w-full items-baseline justify-between gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-white/5"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{span.title}</span>
                    <span className="block font-mono text-xs tabular-nums text-studio-muted">{formatDateRange(span.start, span.end)}</span>
                  </span>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-studio-muted">{span.days} T</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-studio-muted">Noch kein Urlaub für {account.year} eingetragen.</p>
        )}
        <Button size="sm" icon={Plus} className="mt-3" onClick={() => open({ type: "eventForm", prefill: { type: "urlaub", allDay: true, date: data.today, title: "Urlaub" } })}>
          Urlaub eintragen
        </Button>
      </Card>

      <Card title="Nächster Urlaub" icon={Sun} action={data.nextVacation ? <VacationCountdown inDays={data.nextVacation.inDays} running={data.nextVacation.start <= data.today} /> : null}>
        {data.nextVacation ? (
          <div className="text-sm">
            <button type="button" onClick={() => open({ type: "record", ref: { kind: "event", id: data.nextVacation!.id } })} className="font-semibold text-[#F7CD57] hover:underline">
              {data.nextVacation.title}
            </button>
            <p className="font-mono text-xs tabular-nums text-studio-muted">
              {formatDateRange(data.nextVacation.start, data.nextVacation.end)} · {data.nextVacation.days} Urlaubstage
            </p>
            <p className="mt-2 text-xs text-studio-muted">Termine in diesem Zeitraum lösen eine Konfliktwarnung aus.</p>
          </div>
        ) : (
          <p className="text-sm text-studio-muted">Kein Urlaub geplant. Trag ihn früh ein, dann warnt der Kalender bei jedem Termin, der hineinfällt.</p>
        )}
      </Card>

      <Card title="Brückentag-Tipps">
        {data.bridges.length === 0 ? (
          <p className="text-sm text-studio-muted">Keine Brückentage mehr in diesem Zeitraum.</p>
        ) : (
          <ul className="space-y-2">
            {data.bridges.slice(0, 5).map((bridge) => (
              <li key={bridge.date} className="rounded-xl border border-studio-line bg-white/[0.02] p-3">
                <p className="font-mono text-sm font-semibold tabular-nums">
                  {WEEKDAY_SHORT[isoWeekday(bridge.date) - 1]} {formatDateKey(bridge.date)}
                </p>
                <p className="text-xs text-studio-muted">
                  {bridge.reason} · 1 Urlaubstag → 4 Tage frei · {relativeDays(daysBetween(data.today, bridge.date))}
                </p>
                {bridge.planned ? (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                    <Check className="size-3" aria-hidden /> eingeplant
                  </span>
                ) : (
                  <Button size="sm" icon={Plus} className="mt-2" pending={pending} onClick={() => run(() => addBridgeVacation(bridge.date, bridge.reason))}>
                    Als Urlaub eintragen
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Arbeitsrhythmus">
        <dl className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <dt className="w-24 shrink-0">
              <WeekTypeBadge type="block" compact />
            </dt>
            <dd className="text-studio-muted">{blockRhythmText(data.rhythm)}</dd>
          </div>
          <div className="flex items-start gap-2">
            <dt className="w-24 shrink-0">
              <WeekTypeBadge type="halbtag" compact />
            </dt>
            <dd className="text-studio-muted">{halfDayRhythmText(data.rhythm)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-studio-muted">
          Diese Woche: <span className="text-studio-text">{thisWeek === "block" ? "Block-Woche" : thisWeek === "halbtag" ? "Halbtags-Woche" : "Vorlauf"}</span>. Start des Wechsels:{" "}
          <span className="font-mono tabular-nums">{formatDateKey(data.rhythm.firstBlockWeekMonday)}</span>.
        </p>
        <Link href={`${WERKBANK_PATH}/einstellungen#rhythmus`} className="mt-2 inline-block text-sm text-oak-light underline-offset-4 hover:underline">
          Rhythmus anpassen
        </Link>
      </Card>
    </aside>
  );
}
