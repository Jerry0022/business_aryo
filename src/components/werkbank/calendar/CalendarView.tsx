"use client";

import { ChevronLeft, ChevronRight, Plus, RefreshCw, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatHours } from "@/lib/werkbank/format";
import { CALENDAR_VIEWS, calendarHref, shiftDate, viewTitle } from "@/lib/werkbank/calendar-view";
import { filterEntries, groupByDay, spanDays } from "@/lib/werkbank/calendar-model";
import type { CalendarData } from "@/lib/werkbank/queries";
import { useWerkbank } from "../context";
import { chipStyle, HOLIDAY_STYLE, TYPE_STYLES, VACATION_HATCH } from "../event-style";
import { Banner, Button, buttonClass, cx, PageHeader } from "../ui";
import { AgendaView } from "./AgendaView";
import { CalendarSidebar } from "./CalendarSidebar";
import { MonthView } from "./MonthView";
import { useOpenEntry } from "./shared";
import { WeekView } from "./WeekView";
import { YearView } from "./YearView";

export interface CalendarModel {
  data: CalendarData;
  byDay: ReturnType<typeof groupByDay>;
  holidays: Map<string, string>;
  vacationByDay: ReturnType<typeof spanDays<CalendarData["vacations"][number]>>;
  showHolidays: boolean;
  hiddenTypes: ReadonlySet<string>;
  openEntry: ReturnType<typeof useOpenEntry>;
  quickAdd: (prefill: { date: string; start?: string; end?: string; type?: string }) => void;
}

export function CalendarView({ data }: { data: CalendarData }) {
  const { open } = useWerkbank();
  const openEntry = useOpenEntry();
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const [showHolidays, setShowHolidays] = useState(true);
  const [query, setQuery] = useState("");
  const [syncInfo, setSyncInfo] = useState(false);

  const visible = useMemo(() => filterEntries(data.entries, hidden, query), [data.entries, hidden, query]);
  const byDay = useMemo(() => groupByDay(visible), [visible]);
  const holidays = useMemo(() => new Map(data.holidays), [data.holidays]);
  const vacationByDay = useMemo(() => spanDays(data.vacations), [data.vacations]);
  const model: CalendarModel = {
    data,
    byDay,
    holidays,
    vacationByDay,
    showHolidays,
    hiddenTypes: hidden,
    openEntry,
    quickAdd: (prefill) => open({ type: "eventForm", prefill }),
  };

  const toggle = (key: string) =>
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of data.entries) map.set(entry.type, (map.get(entry.type) ?? 0) + 1);
    return map;
  }, [data.entries]);

  const title = viewTitle(data.view, data.date);
  const quickAddDate = data.view === "monat" || data.view === "jahr" ? (data.date.slice(0, 7) === data.today.slice(0, 7) ? data.today : data.date) : data.date;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kalender"
        subtitle={
          <>
            Block- und Halbtags-Wochen im Wechsel · Wochenziel <span className="tabular-nums">{formatHours(data.rhythm.weeklyHoursTarget)} h</span>
          </>
        }
        actions={
          <>
            <Button icon={RefreshCw} onClick={() => setSyncInfo((value) => !value)} aria-expanded={syncInfo}>
              Google / iCal verbinden
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => model.quickAdd({ date: quickAddDate })}>
              Termin
            </Button>
          </>
        }
      />
      {syncInfo ? (
        <Banner tone="info" icon={RefreshCw}>
          <p className="font-medium">Kommt später.</p>
          <p className="mt-0.5 text-studio-muted">
            Die Synchronisierung mit Google Kalender und iCal ist geplant. Bis dahin ist dieser Kalender die einzige Quelle, und aus ihm kommen
            auch die Zähler auf der Website.
          </p>
        </Banner>
      ) : null}

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link href={calendarHref(data.view, data.today)} className={buttonClass("secondary", "md")}>
            Heute
          </Link>
          <div className="flex">
            <Link href={calendarHref(data.view, shiftDate(data.view, data.date, -1))} aria-label="Zurück" className={buttonClass("secondary", "md", "rounded-r-none px-2.5")}>
              <ChevronLeft className="size-4" aria-hidden />
            </Link>
            <Link href={calendarHref(data.view, shiftDate(data.view, data.date, 1))} aria-label="Weiter" className={buttonClass("secondary", "md", "-ml-px rounded-l-none px-2.5")}>
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
          <h2 className="min-w-0 truncate font-display text-lg font-semibold tabular-nums sm:text-xl" aria-live="polite">
            {title}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label="Ansicht" className="inline-flex rounded-xl border border-studio-line bg-white/[0.02] p-0.5">
            {CALENDAR_VIEWS.map((view) => (
              <Link
                key={view.key}
                href={calendarHref(view.key, data.date)}
                aria-current={data.view === view.key ? "page" : undefined}
                className={cx(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  data.view === view.key ? "bg-white/10 text-white" : "text-studio-muted hover:text-studio-text",
                )}
              >
                {view.label}
              </Link>
            ))}
          </nav>
          <label className="relative block w-full sm:w-64">
            <span className="sr-only">Termine durchsuchen</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-studio-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Suchen: Titel, Ort, Art"
              className="w-full rounded-xl border border-studio-line bg-studio-bg py-2 pl-9 pr-3 text-sm outline-none transition focus:border-oak focus:ring-2 focus:ring-oak/30"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Terminarten filtern">
        {TYPE_STYLES.map((style) => {
          const active = !hidden.has(style.key);
          const Icon = style.icon;
          return (
            <button
              key={style.key}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(style.key)}
              className={cx("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition", !active && "opacity-45 grayscale")}
              style={active ? chipStyle(style.color) : undefined}
            >
              {style.key === "urlaub" ? <span className="size-3 rounded-sm" style={{ background: VACATION_HATCH, boxShadow: `inset 0 0 0 1px ${style.color}88` }} aria-hidden /> : null}
              <Icon className="size-3.5" aria-hidden />
              {style.label}
              {counts.get(style.key) ? <span className="tabular-nums opacity-70">{counts.get(style.key)}</span> : null}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={showHolidays}
          onClick={() => setShowHolidays((value) => !value)}
          className={cx("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition", !showHolidays && "opacity-45 grayscale")}
          style={showHolidays ? chipStyle(HOLIDAY_STYLE.color) : undefined}
        >
          <HOLIDAY_STYLE.icon className="size-3.5" aria-hidden /> {HOLIDAY_STYLE.label}
        </button>
        {hidden.size > 0 || query ? (
          <button
            type="button"
            onClick={() => {
              setHidden(new Set());
              setQuery("");
            }}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-studio-muted hover:text-studio-text"
          >
            <X className="size-3.5" aria-hidden /> Filter zurücksetzen
          </button>
        ) : null}
      </div>

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0">
          {data.view === "jahr" ? <YearView key={data.date} model={model} /> : null}
          {data.view === "monat" ? <MonthView key={data.date} model={model} /> : null}
          {data.view === "woche" ? <WeekView key={data.date} model={model} /> : null}
          {data.view === "agenda" ? <AgendaView key={data.date} model={model} query={query} /> : null}
          <Legend />
        </div>
        <CalendarSidebar data={data} />
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-studio-muted">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-5 rounded-sm" style={{ background: VACATION_HATCH }} aria-hidden /> Urlaub
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-5 rounded-sm border border-dashed border-emerald-300/50 bg-emerald-300/10" aria-hidden /> Arbeitsfenster laut Rhythmus
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-5 rounded-sm border border-dashed border-studio-muted/60" aria-hidden /> gestrichelt: Vorschlag (Standard-Sprechstunde)
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-5 rounded-sm ring-1 ring-red-400" aria-hidden /> Konflikt mit Urlaub, Feiertag oder Überschneidung
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-0.5 w-5 rounded" style={{ background: HOLIDAY_STYLE.color }} aria-hidden /> Feiertag NRW
      </span>
    </div>
  );
}
