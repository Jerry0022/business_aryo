import { CalendarDays, CircleCheck, Clock, Info, Plus, Sun, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { VacationCountdown } from "@/components/werkbank/calendar/CalendarSidebar";
import { WeekTypeBadge } from "@/components/werkbank/calendar/MonthView";
import { OpenDrawer, OpenRecord } from "@/components/werkbank/DrawerButtons";
import { HOLIDAY_STYLE, VACATION_HATCH } from "@/components/werkbank/event-style";
import { OverviewAgenda } from "@/components/werkbank/overview/OverviewAgenda";
import { Badge, ButtonLink, buttonClass, Card, cx, Meter, PageBody, PageHeader, StatLabel } from "@/components/werkbank/ui";
import {
  berlinDateKey,
  berlinTime,
  daysBetween,
  formatDateKey,
  isoWeek,
  isoWeekday,
  MONTH_SHORT,
  parseDateKey,
  weekType,
  WEEK_TYPE_LABELS,
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
} from "@/lib/business/calendar";
import { HOURS_PER_SUBSCRIPTION_YEAR } from "@/lib/business/subscriptions";
import { calendarHref } from "@/lib/werkbank/calendar-view";
import { LEAD_KINDS, WERKBANK_PATH } from "@/lib/werkbank/constants";
import { formatDateRange, formatHours } from "@/lib/werkbank/format";
import { getOverviewData, type OverviewData } from "@/lib/werkbank/queries";
import type { RecordKind } from "@/lib/werkbank/types";

export const metadata: Metadata = { title: "Übersicht" };

const MONTH_LETTERS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export default async function OverviewPage() {
  const data = await getOverviewData(new Date());
  const today = data.today;
  const nextWeek = data.weeks[1];
  return (
    <PageBody wide>
      <PageHeader
        title="Übersicht"
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>
              {WEEKDAY_LONG[isoWeekday(today) - 1]}, {formatDateKey(today)}
            </span>
            <WeekTypeBadge type={weekType(today, data.settings.rhythm)} />
            {nextWeek ? <span>nächste Woche: {WEEK_TYPE_LABELS[nextWeek.type]}</span> : null}
          </span>
        }
        actions={
          <>
            <ButtonLink href={calendarHref("monat", today)} icon={CalendarDays}>
              Kalender
            </ButtonLink>
            <OpenDrawer view={{ type: "eventForm", prefill: { date: today } }} variant="primary">
              <Plus className="size-4" aria-hidden /> Termin
            </OpenDrawer>
          </>
        }
      />

      <section aria-label="Erster Blick" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ProjectSlots data={data} />
        <Founding data={data} />
        <Hours data={data} />
        <NextVacation data={data} />
        <OpenLeads data={data} />
        <NextOfficeHour data={data} />
        <SubscriptionSlots data={data} />
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card
          title="Heute und die nächsten 7 Tage"
          icon={CalendarDays}
          bodyClassName=""
          action={
            <Link href={calendarHref("agenda", today)} className="text-xs font-medium text-oak-light underline-offset-4 hover:underline">
              Agenda öffnen
            </Link>
          }
        >
          <OverviewAgenda data={data} />
        </Card>
        <Attention data={data} />
      </div>

      <YearStrip data={data} />
    </PageBody>
  );
}

function KpiCard({ label, badge, children, className }: { label: string; badge?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cx("flex flex-col rounded-2xl border border-studio-line bg-studio-panel p-4", className)} aria-label={label}>
      <div className="flex items-start justify-between gap-2">
        <StatLabel>{label}</StatLabel>
        {badge}
      </div>
      <div className="mt-2 flex flex-1 flex-col">{children}</div>
    </section>
  );
}

function BigNumber({ value, suffix }: { value: React.ReactNode; suffix: string }) {
  return (
    <p className="flex items-baseline gap-2">
      <span className="font-mono text-3xl font-semibold tabular-nums">{value}</span>
      <span className="text-sm text-studio-muted">{suffix}</span>
    </p>
  );
}

function ProjectSlots({ data }: { data: OverviewData }) {
  const contingent = data.projects;
  return (
    <KpiCard label={`Projektplätze ${contingent.year}`} badge={<Badge tone={contingent.free > 0 ? "oak" : "crit"}>{contingent.free} frei</Badge>}>
      <BigNumber value={contingent.booked} suffix={`von ${contingent.total} vergeben`} />
      <div className="mt-3 grid grid-cols-12 gap-1" role="list" aria-label="Projektplätze pro Monat">
        {contingent.months.map((month, index) => {
          const titles = data.monthTitles[index] ?? [];
          const state = month.state === "gebucht" ? "gebucht" : month.state === "reserviert" ? "reserviert (Angebot)" : "frei";
          return (
            <div key={month.month} role="listitem" className="text-center" title={`${MONTH_SHORT[index]}: ${state}${titles.length ? ` · ${titles.join(", ")}` : ""}`}>
              <div
                className={cx(
                  "h-9 rounded-[4px]",
                  month.state === "gebucht" && "bg-oak shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)]",
                  month.state === "frei" && "border border-dashed border-studio-line",
                )}
                style={
                  month.state === "reserviert"
                    ? { background: "repeating-linear-gradient(135deg, rgba(196,138,74,0.55) 0 4px, rgba(196,138,74,0.15) 4px 8px)" }
                    : month.state === "gebucht"
                      ? { backgroundImage: "linear-gradient(90deg, transparent 48%, rgba(0,0,0,0.18) 48% 52%, transparent 52%)" }
                      : undefined
                }
              />
              <span className="mt-0.5 block text-[0.6rem] text-studio-muted" aria-label={`${MONTH_SHORT[index]}: ${state}`}>
                {MONTH_LETTERS[index]}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
        <span className="size-1.5 rounded-full bg-emerald-300" aria-hidden />
        Auf der Website: noch {contingent.free} frei
      </p>
      {contingent.reserved > 0 ? <p className="mt-1 text-xs text-studio-muted">{contingent.reserved} reserviert durch offene Angebote</p> : null}
      <p className="mt-2 flex gap-1.5 text-xs text-studio-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Der Zähler auf der Website kommt direkt aus diesem Kalender.
      </p>
    </KpiCard>
  );
}

function Founding({ data }: { data: OverviewData }) {
  const founding = data.founding;
  const cells = Array.from({ length: founding.total }, (_, index) => (index < founding.done ? "done" : index < founding.used ? "planned" : "free"));
  const year = parseDateKey(founding.deadline).year;
  return (
    <KpiCard label={`Gründungs-Erstberatungen ${year}`} badge={<Badge tone={founding.open ? "info" : "neutral"}>bis {formatDateKey(founding.deadline, false)}</Badge>}>
      <BigNumber value={founding.used} suffix={`von ${founding.total} vergeben`} />
      <div className="mt-3 grid grid-cols-12 gap-1" aria-hidden>
        {cells.map((state, index) => (
          <span
            key={index}
            className={cx(
              "h-4 rounded-[4px]",
              state === "done" && "bg-[#54D3C4]",
              state === "planned" && "bg-[#54D3C4]/35 ring-1 ring-inset ring-[#54D3C4]/60",
              state === "free" && "border border-studio-line",
            )}
          />
        ))}
      </div>
      <p className="mt-3 text-xs tabular-nums text-studio-muted">
        {founding.done} durchgeführt · {founding.scheduled} terminiert · noch {founding.free} frei
      </p>
      {!founding.open ? (
        <p className="mt-1 text-xs text-studio-muted">
          {data.today > founding.deadline ? "Das Gründungskontingent ist abgelaufen." : "Das Gründungskontingent ist ausgebucht."}
        </p>
      ) : null}
    </KpiCard>
  );
}

function Hours({ data }: { data: OverviewData }) {
  const labels = ["diese Woche", "nächste Woche"];
  return (
    <KpiCard label="Stunden vs. Wochenziel" badge={<Badge>{formatHours(data.target)} h</Badge>}>
      <div className="space-y-3">
        {data.weeks.map((week, index) => {
          const over = week.hours > data.target;
          return (
            <Link key={week.monday} href={calendarHref("woche", week.monday)} className="block rounded-lg transition hover:bg-white/[0.03]">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {labels[index]} <span className="text-xs text-studio-muted">KW {isoWeek(week.monday).week}</span>
                </span>
                <WeekTypeBadge type={week.type} compact />
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <Meter value={week.hours} max={data.target} target={data.target} tone={over ? "crit" : "ok"} label={`Stunden ${labels[index]}`} className="flex-1" />
                <span className={cx("font-mono text-xs tabular-nums", over ? "text-red-300" : "text-studio-muted")}>
                  {formatHours(week.hours)}/{formatHours(data.target)} h
                </span>
              </div>
              {over ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-300">
                  <TriangleAlert className="size-3" aria-hidden /> {formatHours(week.hours - data.target)} h über dem Ziel
                </p>
              ) : null}
            </Link>
          );
        })}
      </div>
    </KpiCard>
  );
}

function NextVacation({ data }: { data: OverviewData }) {
  const next = data.nextVacation;
  return (
    <KpiCard label="Nächster Urlaub" badge={next ? <VacationCountdown inDays={next.inDays} running={next.start <= data.today} /> : null}>
      {next ? (
        <>
          <p className="text-lg font-semibold text-[#F7CD57]">{next.title}</p>
          <p className="font-mono text-xs tabular-nums text-studio-muted">{formatDateRange(next.start, next.end)}</p>
          <p className="mt-1 text-sm">{next.days} Urlaubstage</p>
          <div className="mt-3 h-2 rounded-full" style={{ background: VACATION_HATCH }} aria-hidden />
        </>
      ) : (
        <>
          <p className="text-sm text-studio-muted">Noch kein Urlaub geplant.</p>
          <OpenDrawer view={{ type: "eventForm", prefill: { type: "urlaub", allDay: true, title: "Urlaub", date: data.today } }} size="sm" className="mt-3 w-fit">
            <Sun className="size-3.5" aria-hidden /> Urlaub eintragen
          </OpenDrawer>
        </>
      )}
      <p className="mt-auto pt-3 text-xs text-studio-muted">
        Urlaubskonto {data.vacationYear}: <span className="font-mono tabular-nums text-studio-text">{data.vacationLeft}</span> von {data.settings.vacationDaysPerYear} übrig
      </p>
    </KpiCard>
  );
}

function OpenLeads({ data }: { data: OverviewData }) {
  const tones: Record<string, "crit" | "oak" | "info" | "ok" | "neutral"> = { notfall: "crit", projekt: "oak", partner: "info", "boden-check": "ok", abo: "neutral" };
  return (
    <KpiCard
      label="Offene Anfragen"
      badge={
        <Link href={`${WERKBANK_PATH}/anfragen`} className="text-xs font-medium text-oak-light underline-offset-4 hover:underline">
          alle
        </Link>
      }
    >
      <BigNumber value={data.leads.open} suffix={data.leads.fresh > 0 ? `offen · ${data.leads.fresh} neu` : "offen"} />
      {data.leads.open === 0 ? (
        <p className="mt-2 text-sm text-studio-muted">Keine offenen Anfragen. Neue kommen über Boden-Check, Bewerbungen und Notfall-Formular.</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {LEAD_KINDS.filter((kind) => data.leads.byKind[kind.key]).map((kind) => (
            <Link key={kind.key} href={`${WERKBANK_PATH}/anfragen?art=${kind.key}`}>
              <Badge tone={tones[kind.key]}>
                <span className="font-mono tabular-nums">{data.leads.byKind[kind.key]}</span> {kind.label}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </KpiCard>
  );
}

function NextOfficeHour({ data }: { data: OverviewData }) {
  const hour = data.nextHour;
  if (!hour) {
    return (
      <KpiCard label="Nächste Sprechstunde">
        <p className="text-sm text-studio-muted">Kein Termin geplant.</p>
      </KpiCard>
    );
  }
  const start = new Date(hour.startsAt);
  const key = berlinDateKey(start);
  const days = daysBetween(data.today, key);
  const view = hour.id
    ? null
    : { type: "virtualOfficeHour" as const, startsAt: hour.startsAt, topic: hour.topic, durationMinutes: hour.durationMinutes };
  const body = (
    <>
      <p className="flex items-baseline gap-2">
        <span className="font-mono text-2xl font-semibold tabular-nums">
          {WEEKDAY_SHORT[isoWeekday(key) - 1]} {formatDateKey(key, false)}
        </span>
        <span className="text-sm text-studio-muted">{berlinTime(start)} Uhr</span>
      </p>
      <p className="mt-1 text-left text-sm text-oak-light">{hour.topic}</p>
    </>
  );
  return (
    <KpiCard label="Nächste Sprechstunde" badge={<Badge tone="info">{days === 0 ? "heute" : `in ${days} Tagen`}</Badge>}>
      {hour.id ? (
        <OpenRecord kind="officeHour" id={hour.id} className="text-left">
          {body}
        </OpenRecord>
      ) : (
        <OpenDrawer view={view!} plain className="text-left">
          {body}
        </OpenDrawer>
      )}
      <p className="mt-auto pt-3 text-xs text-studio-muted">
        {hour.id ? (
          <>
            <span className="font-mono tabular-nums text-studio-text">{hour.registrations}</span> Anmeldungen · {hour.confirmed} bestätigt
          </>
        ) : (
          "Standardtermin: wird mit der ersten Anmeldung angelegt."
        )}
      </p>
    </KpiCard>
  );
}

function SubscriptionSlots({ data }: { data: OverviewData }) {
  const slots = data.subscriptions;
  return (
    <KpiCard label="Abo-Plätze" badge={<Badge tone={slots.used >= slots.total ? "warn" : "neutral"}>{slots.total - slots.used} frei</Badge>}>
      <BigNumber value={slots.used} suffix={`von ${slots.total} belegt`} />
      <Meter value={slots.used} max={slots.total} label="Belegte Abo-Plätze" className="mt-3" tone={slots.used > slots.total ? "crit" : "oak"} />
      <p className="mt-3 text-xs text-studio-muted">
        ≈ <span className="font-mono tabular-nums text-studio-text">{formatHours(slots.hours)} h</span> pro Jahr gebunden ({formatHours(HOURS_PER_SUBSCRIPTION_YEAR)} h je
        Abo, voll ≈ {formatHours(slots.maxHours)} h).
      </p>
    </KpiCard>
  );
}

function Attention({ data }: { data: OverviewData }) {
  return (
    <Card title="Braucht deine Aufmerksamkeit" icon={TriangleAlert} bodyClassName="" action={<Badge tone={data.attention.length ? "warn" : "ok"}>{data.attention.length}</Badge>}>
      {data.attention.length === 0 ? (
        <p className="flex items-center gap-2 px-5 py-6 text-sm text-studio-muted">
          <CircleCheck className="size-4 text-emerald-300" aria-hidden /> Alles im Griff. Gerade braucht nichts deine Aufmerksamkeit.
        </p>
      ) : (
        <ul className="divide-y divide-studio-line">
          {data.attention.map((item, index) => {
            const Icon = item.tone === "info" ? Info : item.tone === "warn" ? Clock : TriangleAlert;
            return (
              <li key={`${item.text}-${index}`} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                <Icon className={cx("mt-0.5 size-4 shrink-0", item.tone === "crit" ? "text-red-300" : item.tone === "warn" ? "text-amber-300" : "text-kreide-light")} aria-hidden />
                <p className="min-w-0 flex-1 text-sm">{item.text}</p>
                {item.ref ? (
                  <OpenRecord kind={item.ref.kind as RecordKind} id={item.ref.id} className={buttonClass("secondary", "sm")}>
                    {item.action ?? "Öffnen"}
                  </OpenRecord>
                ) : item.href ? (
                  <Link href={item.href} className={buttonClass("secondary", "sm")}>
                    {item.action ?? "Öffnen"}
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function YearStrip({ data }: { data: OverviewData }) {
  const target = data.target;
  const year = data.settings.contingent.slotYear;
  return (
    <Card
      title={`Jahr ${year} auf einen Blick`}
      icon={CalendarDays}
      className="mt-6"
      action={<span className="hidden text-xs text-studio-muted sm:inline">eine Zelle pro Woche · Höhe = geplante Stunden · Klick öffnet die Woche</span>}
    >
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-[40rem] items-end gap-[3px]" role="list" aria-label={`Wochen ${year}`}>
          {data.yearStrip.map((week, index) => {
            const height = Math.max(8, Math.min(100, (week.hours / Math.max(target, 1)) * 100));
            const over = week.hours > target;
            const label = `KW ${week.week}: ${WEEK_TYPE_LABELS[week.type]}, ${formatHours(week.hours)} von ${formatHours(target)} h${week.vacationDays ? `, ${week.vacationDays} Urlaubstage` : ""}${week.holidays.length ? `, Feiertag: ${week.holidays.join(", ")}` : ""}`;
            const monthStart = index === 0 || data.yearStrip[index - 1]?.month !== week.month;
            return (
              <div key={week.monday} role="listitem" className="flex min-w-0 flex-1 flex-col items-stretch">
                <Link href={calendarHref("woche", week.monday)} title={label} aria-label={label} className="group relative block h-16 rounded-[3px] bg-white/[0.04] transition hover:bg-white/[0.08]">
                  {week.vacationDays > 0 ? <span className="absolute inset-0 rounded-[3px]" style={{ background: VACATION_HATCH }} aria-hidden /> : null}
                  <span
                    className={cx(
                      "absolute inset-x-0 bottom-0 rounded-[3px]",
                      week.laying ? "bg-oak" : week.type === "block" ? "bg-emerald-300/85" : week.type === "halbtag" ? "bg-emerald-300/35" : "bg-white/15",
                      over && "border-t-2 border-red-400",
                    )}
                    style={{ height: `${week.hours > 0 ? height : 8}%`, opacity: week.hours > 0 ? 1 : 0.55 }}
                    aria-hidden
                  />
                  {week.holidays.length > 0 ? (
                    <span className="absolute left-1/2 top-1 size-1.5 -translate-x-1/2 rounded-full" style={{ background: HOLIDAY_STYLE.color }} aria-hidden />
                  ) : null}
                </Link>
                <span className="mt-1 h-3 text-[0.6rem] text-studio-muted">{monthStart ? MONTH_SHORT[week.month - 1] : ""}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-studio-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-emerald-300/85" aria-hidden /> Block-Woche
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-emerald-300/35" aria-hidden /> Halbtags-Woche
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-oak" aria-hidden /> mit Verlegung
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm" style={{ background: VACATION_HATCH }} aria-hidden /> Urlaub
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: HOLIDAY_STYLE.color }} aria-hidden /> Feiertag
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-3 bg-red-400" aria-hidden /> über {formatHours(target)} h
        </span>
      </div>
    </Card>
  );
}
