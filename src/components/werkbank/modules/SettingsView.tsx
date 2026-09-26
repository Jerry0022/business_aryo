"use client";

import { CalendarRange, ChartColumn, ChevronRight, Handshake, LayoutGrid, MapPin, Plus, Save, Sun, Video } from "lucide-react";
import { useState } from "react";
import { formatDateKey, mondayOf, WEEKDAY_LONG, windowHours, type VacationStats } from "@/lib/business/calendar";
import type { FoundingContingent, ProjectContingent } from "@/lib/business/contingent";
import type { Settings } from "@/lib/business/settings";
import { HOURS_PER_SUBSCRIPTION_YEAR } from "@/lib/business/subscriptions";
import { saveSettingsSection } from "@/lib/werkbank/actions/settings";
import { labelOf, PARTNER_STATUSES } from "@/lib/werkbank/constants";
import { formatHours } from "@/lib/werkbank/format";
import { useWerkbank } from "../context";
import { InputField, SelectField, WeekdayPicker } from "../fields";
import { useAction } from "../hooks";
import { Badge, Banner, Button, Card, EmptyState } from "../ui";

interface PartnerView {
  id: string;
  company: string;
  contactName: string | null;
  trade: string | null;
  region: string | null;
  isMasterPartner: boolean;
  status: string;
}

export interface SettingsStats {
  projects: ProjectContingent;
  founding: FoundingContingent;
  subscriptionsUsed: number;
  activePartners: number;
  vacation: VacationStats[];
}

function useSection<K extends keyof Settings>(section: K) {
  const { pending, run } = useAction();
  const [errors, setErrors] = useState<Record<string, string>>({});
  function save(value: Settings[K]) {
    setErrors({});
    run(
      () => saveSettingsSection(section, value),
      undefined,
      (result) => setErrors(result.fieldErrors ?? { form: result.message }),
    );
  }
  return { pending, errors, save };
}

function SaveRow({ pending, onSave, errors }: { pending: boolean; onSave: () => void; errors: Record<string, string> }) {
  const messages = Object.entries(errors);
  return (
    <div className="mt-4 space-y-2">
      {messages.length > 0 ? (
        <Banner tone="crit">
          {messages.map(([key, message]) => (
            <p key={key}>{message}</p>
          ))}
        </Banner>
      ) : null}
      <Button variant="primary" size="sm" icon={Save} pending={pending} onClick={onSave}>
        Speichern
      </Button>
    </div>
  );
}

const num = (text: string, fallback = 0) => {
  const value = Number(text.replace(",", "."));
  return Number.isFinite(value) ? value : fallback;
};

export function SettingsView({ settings, partners, stats }: { settings: Settings; partners: PartnerView[]; stats: SettingsStats }) {
  return (
    <div className="mt-6 grid items-start gap-5 lg:grid-cols-2 2xl:grid-cols-3">
      <ContingentCard value={settings.contingent} stats={stats} />
      <RhythmCard value={settings.rhythm} />
      <div className="space-y-5">
        <VacationCard value={settings.vacationDaysPerYear} stats={stats.vacation} />
        <ServiceAreaCard value={settings.serviceArea} />
      </div>
      <OfficeHoursCard value={settings.officeHours} />
      <PostHogCard value={settings.analytics} />
      <PartnersCard partners={partners} slots={settings.contingent.partnerSlots} />
    </div>
  );
}

function ContingentCard({ value, stats }: { value: Settings["contingent"]; stats: SettingsStats }) {
  const [form, setForm] = useState({
    projectSlotsPerYear: String(value.projectSlotsPerYear),
    slotYear: String(value.slotYear),
    foundingConsultations: String(value.foundingConsultations),
    foundingDeadline: value.foundingDeadline,
    partnerSlots: String(value.partnerSlots),
    subscriptionSlots: String(value.subscriptionSlots),
  });
  const { pending, errors, save } = useSection("contingent");
  const set = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));
  const subscriptionSlots = num(form.subscriptionSlots);
  return (
    <Card title="Kontingente" icon={LayoutGrid} id="kontingente">
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField
          label="Projektplätze pro Jahr"
          type="number"
          min={0}
          max={60}
          value={form.projectSlotsPerYear}
          onChange={(event) => set({ projectSlotsPerYear: event.target.value })}
          hint={`Website: noch ${stats.projects.free} von ${stats.projects.total} frei (${stats.projects.booked} vergeben)`}
        />
        <InputField label="Kontingent-Jahr" type="number" min={2025} max={2100} value={form.slotYear} onChange={(event) => set({ slotYear: event.target.value })} hint="Jahr des Zählers auf der Website" />
        <InputField
          label="Gründungs-Erstberatungen"
          type="number"
          min={0}
          max={100}
          value={form.foundingConsultations}
          onChange={(event) => set({ foundingConsultations: event.target.value })}
          hint={`${stats.founding.used} vergeben · noch ${stats.founding.free} frei`}
        />
        <InputField label="Stichtag Gründungskontingent" type="date" value={form.foundingDeadline} onChange={(event) => set({ foundingDeadline: event.target.value })} />
        <InputField
          label="Partnerplätze"
          type="number"
          min={0}
          max={100}
          value={form.partnerSlots}
          onChange={(event) => set({ partnerSlots: event.target.value })}
          hint={`${stats.activePartners} aktive Partner`}
        />
        <InputField
          label="Abo-Plätze"
          type="number"
          min={0}
          max={500}
          value={form.subscriptionSlots}
          onChange={(event) => set({ subscriptionSlots: event.target.value })}
          hint={`${stats.subscriptionsUsed} belegt · voll ≈ ${formatHours(subscriptionSlots * HOURS_PER_SUBSCRIPTION_YEAR)} h/Jahr`}
        />
      </div>
      <p className="mt-3 text-xs text-studio-muted">Die Zähler auf der Website werden immer aus Projekten, Terminen und Abos berechnet, nie von Hand eingetragen.</p>
      <SaveRow
        pending={pending}
        errors={errors}
        onSave={() =>
          save({
            projectSlotsPerYear: num(form.projectSlotsPerYear),
            slotYear: num(form.slotYear, value.slotYear),
            foundingConsultations: num(form.foundingConsultations),
            foundingDeadline: form.foundingDeadline,
            partnerSlots: num(form.partnerSlots),
            subscriptionSlots: num(form.subscriptionSlots),
          })
        }
      />
    </Card>
  );
}

function RhythmCard({ value }: { value: Settings["rhythm"] }) {
  const [form, setForm] = useState({ ...value, weeklyHoursTarget: String(value.weeklyHoursTarget), blockOfficeDay: value.blockOfficeDay ? String(value.blockOfficeDay) : "" });
  const { pending, errors, save } = useSection("rhythm");
  const set = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));
  const blockHours =
    form.blockDays.filter((day) => String(day) !== form.blockOfficeDay).length * windowHours({ start: form.blockDayStart, end: form.blockDayEnd }) +
    (form.blockOfficeDay ? windowHours({ start: form.halfDayStart, end: form.halfDayEnd }) : 0);
  const halfHours = form.halfDayDays.length * windowHours({ start: form.halfDayStart, end: form.halfDayEnd });
  const target = num(form.weeklyHoursTarget, 20);
  const monday = form.firstBlockWeekMonday ? mondayOf(form.firstBlockWeekMonday) : "";
  return (
    <Card title="Arbeitsrhythmus" icon={CalendarRange} id="rhythmus">
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="Wochenziel" type="number" min={1} max={60} step={0.5} value={form.weeklyHoursTarget} onChange={(event) => set({ weeklyHoursTarget: event.target.value })} suffix="h" />
        <InputField
          label="Erste Block-Woche ab"
          type="date"
          value={form.firstBlockWeekMonday}
          onChange={(event) => set({ firstBlockWeekMonday: event.target.value })}
          hint={monday && monday !== form.firstBlockWeekMonday ? `zählt ab Montag, ${formatDateKey(monday)}` : "Danach wechseln Block- und Halbtags-Wochen."}
        />
      </div>
      <div className="mt-4 space-y-3 rounded-xl border border-studio-line p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-studio-muted">Block-Woche</p>
        <WeekdayPicker label="Verlegetage" value={form.blockDays} onChange={(blockDays) => set({ blockDays })} days={[1, 2, 3, 4, 5, 6]} />
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Verlegetag von" type="time" value={form.blockDayStart} onChange={(event) => set({ blockDayStart: event.target.value })} />
          <InputField label="Verlegetag bis" type="time" value={form.blockDayEnd} onChange={(event) => set({ blockDayEnd: event.target.value })} />
        </div>
        <SelectField
          label="Bürotag (vormittags)"
          value={form.blockOfficeDay}
          onChange={(event) => set({ blockOfficeDay: event.target.value })}
          placeholder="kein Bürotag"
          options={[1, 2, 3, 4, 5, 6].map((day) => ({ value: String(day), label: WEEKDAY_LONG[day - 1]! }))}
        />
      </div>
      <div className="mt-3 space-y-3 rounded-xl border border-studio-line p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-studio-muted">Halbtags-Woche (und Bürozeit)</p>
        <WeekdayPicker label="Tage" value={form.halfDayDays} onChange={(halfDayDays) => set({ halfDayDays })} days={[1, 2, 3, 4, 5, 6]} />
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Halbtag von" type="time" value={form.halfDayStart} onChange={(event) => set({ halfDayStart: event.target.value })} />
          <InputField label="Halbtag bis" type="time" value={form.halfDayEnd} onChange={(event) => set({ halfDayEnd: event.target.value })} />
        </div>
      </div>
      <p className="mt-3 text-xs text-studio-muted">
        Arbeitsfenster: Block-Woche <span className="font-mono tabular-nums text-studio-text">{formatHours(blockHours)} h</span> · Halbtags-Woche{" "}
        <span className="font-mono tabular-nums text-studio-text">{formatHours(halfHours)} h</span> · Ziel {formatHours(target)} h (netto, 30 min Pause ab 6 h)
      </p>
      <SaveRow
        pending={pending}
        errors={errors}
        onSave={() =>
          save({
            ...form,
            firstBlockWeekMonday: monday || form.firstBlockWeekMonday,
            weeklyHoursTarget: target,
            blockOfficeDay: form.blockOfficeDay ? Number(form.blockOfficeDay) : null,
          })
        }
      />
    </Card>
  );
}

function VacationCard({ value, stats }: { value: number; stats: VacationStats[] }) {
  const [days, setDays] = useState(String(value));
  const { pending, errors, save } = useSection("vacationDaysPerYear");
  return (
    <Card title="Urlaubskonto" icon={Sun} id="urlaub">
      <InputField label="Urlaubstage pro Jahr" type="number" min={0} max={60} value={days} onChange={(event) => setDays(event.target.value)} hint="Gezählt werden Werktage Mo–Fr ohne Feiertage." />
      <ul className="mt-3 space-y-1 text-xs text-studio-muted">
        {stats.map((item) => (
          <li key={item.year}>
            {item.year}: <span className="tabular-nums">{item.taken}</span> genommen · <span className="tabular-nums">{item.planned}</span> geplant ·{" "}
            <span className={item.left < 0 ? "text-red-300" : "text-emerald-300"}>{item.left} übrig</span>
          </li>
        ))}
      </ul>
      <SaveRow pending={pending} errors={errors} onSave={() => save(num(days))} />
    </Card>
  );
}

function ServiceAreaCard({ value }: { value: Settings["serviceArea"] }) {
  const [form, setForm] = useState({ label: value.label, radiusKm: String(value.radiusKm) });
  const { pending, errors, save } = useSection("serviceArea");
  return (
    <Card title="Einzugsgebiet" icon={MapPin} id="einzugsgebiet">
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <InputField label="Region" value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} maxLength={80} />
        <InputField label="Radius" type="number" min={0} max={1000} value={form.radiusKm} onChange={(event) => setForm({ ...form, radiusKm: event.target.value })} suffix="km" />
      </div>
      <p className="mt-2 text-xs text-studio-muted">Erscheint in den Gutschein-Bedingungen auf der Website.</p>
      <SaveRow pending={pending} errors={errors} onSave={() => save({ label: form.label.trim(), radiusKm: num(form.radiusKm) })} />
    </Card>
  );
}

function OfficeHoursCard({ value }: { value: Settings["officeHours"] }) {
  const [form, setForm] = useState({ weekday: String(value.weekday), nthWeek: String(value.nthWeek), time: value.time, durationMinutes: String(value.durationMinutes) });
  const { pending, errors, save } = useSection("officeHours");
  return (
    <Card title="Sprechstunden-Rhythmus" icon={Video} id="sprechstunde">
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Woche im Monat"
          value={form.nthWeek}
          onChange={(event) => setForm({ ...form, nthWeek: event.target.value })}
          options={[1, 2, 3, 4].map((week) => ({ value: String(week), label: `${week}.` }))}
        />
        <SelectField
          label="Wochentag"
          value={form.weekday}
          onChange={(event) => setForm({ ...form, weekday: event.target.value })}
          options={[1, 2, 3, 4, 5, 6, 7].map((day) => ({ value: String(day), label: WEEKDAY_LONG[day - 1]! }))}
        />
        <InputField label="Uhrzeit" type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} />
        <InputField label="Dauer" type="number" min={15} max={180} step={5} value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })} suffix="min" />
      </div>
      <p className="mt-2 text-xs text-studio-muted">
        Standardtermine: {form.nthWeek}. {WEEKDAY_LONG[num(form.weekday, 4) - 1]} im Monat um {form.time} Uhr. Sie erscheinen auf der Website und im Kalender, bis du sie anlegst oder
        änderst.
      </p>
      <SaveRow
        pending={pending}
        errors={errors}
        onSave={() => save({ weekday: num(form.weekday, 4), nthWeek: num(form.nthWeek, 2), time: form.time, durationMinutes: num(form.durationMinutes, 45) })}
      />
    </Card>
  );
}

function PostHogCard({ value }: { value: Settings["analytics"] }) {
  const [url, setUrl] = useState(value.posthogUrl);
  const { pending, errors, save } = useSection("analytics");
  return (
    <Card title="PostHog" icon={ChartColumn} id="posthog">
      <InputField
        label="Projekt-URL"
        type="url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://eu.posthog.com/project/…"
        hint="EU-Cloud nutzen, Tracking erst nach Einwilligung laden."
      />
      <p className="mt-2 flex items-center gap-2 text-xs text-studio-muted">
        {value.posthogUrl ? <Badge tone="ok">verbunden</Badge> : <Badge tone="warn">nicht verbunden</Badge>}
        Der Link „Analytics“ oben in der Leiste öffnet diese URL.
      </p>
      <SaveRow pending={pending} errors={errors} onSave={() => save({ posthogUrl: url.trim() })} />
    </Card>
  );
}

function PartnersCard({ partners, slots }: { partners: PartnerView[]; slots: number }) {
  const { open } = useWerkbank();
  const activeMaster = partners.some((partner) => partner.isMasterPartner && partner.status === "aktiv");
  return (
    <Card
      title={`Partner (${partners.length} von ${slots} Plätzen)`}
      icon={Handshake}
      id="partner"
      className="lg:col-span-2 2xl:col-span-1"
      action={
        <Button size="sm" icon={Plus} onClick={() => open({ type: "entityForm", entity: "partner" })}>
          Partner hinzufügen
        </Button>
      }
    >
      <Banner tone={activeMaster ? "ok" : "info"} className="mb-3">
        {activeMaster
          ? "Ein aktiver Parkettleger-Meisterbetrieb ist eingetragen: Die Meister-Leistungen sind auf der Website sichtbar."
          : "Ein aktiver Meisterpartner (Parkettleger-Meisterbetrieb) schaltet die Meister-Leistungen auf der Website frei. Bis dahin bleiben sie ausgeblendet."}
      </Banner>
      {partners.length === 0 ? (
        <EmptyState icon={Handshake} title="Noch keine Partner">
          Bewerbungen kommen über „Anfragen“ (Partner-Bewerbung) und lassen sich dort mit einem Klick als Partner anlegen.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-studio-line rounded-xl border border-studio-line" aria-label="Partner">
          {partners.map((partner) => (
            <li key={partner.id}>
              <button
                type="button"
                onClick={() => open({ type: "record", ref: { kind: "partner", id: partner.id } })}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.03]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{partner.company}</span>
                  <span className="block truncate text-xs text-studio-muted">{[partner.contactName, partner.trade, partner.region].filter(Boolean).join(" · ") || "keine Angaben"}</span>
                </span>
                {partner.isMasterPartner ? <Badge tone="oak">Meisterbetrieb</Badge> : null}
                <Badge tone={partner.status === "aktiv" ? "ok" : partner.status === "abgelehnt" ? "crit" : "neutral"}>{labelOf(PARTNER_STATUSES, partner.status)}</Badge>
                <ChevronRight className="size-4 text-studio-muted" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-studio-muted">Versprechen an Partner: keine Kunden abwerben, auf Wunsch Arbeit im Namen des Partners.</p>
    </Card>
  );
}
