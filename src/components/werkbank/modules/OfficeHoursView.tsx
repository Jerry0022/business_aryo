"use client";

import { CalendarPlus, Check, ChevronDown, Pencil, Plus, Ticket, Trash2, Video, X } from "lucide-react";
import { useState } from "react";
import { berlinDateKey, berlinTime, formatDateKey, formatInstant, isoWeekday, WEEKDAY_SHORT } from "@/lib/business/calendar";
import { voucherChecks } from "@/lib/business/office-hours";
import { formatEuro, grossCents } from "@/lib/business/services";
import { createDefaultOfficeHour, deleteRegistration, issueVoucher, setRegistrationFlag, setVoucherRedeemed } from "@/lib/werkbank/actions/office-hours";
import { labelOf, OFFICE_HOUR_STATUSES } from "@/lib/werkbank/constants";
import type { OfficeHourData } from "@/lib/werkbank/queries";
import { useWerkbank } from "../context";
import { CheckboxField, InputField, SelectField, Toggle } from "../fields";
import { useAction } from "../hooks";
import { Badge, Button, Card, cx, EmptyState } from "../ui";

type Session = OfficeHourData["sessions"][number];
type Registration = Session["registrations"][number];

export function OfficeHoursView({ data }: { data: OfficeHourData }) {
  const { open } = useWerkbank();
  const { pending, run } = useAction();
  const [showPast, setShowPast] = useState(false);
  const nowMs = data.now.getTime();
  const upcoming = data.sessions.filter((session) => session.startsAt.getTime() + session.durationMinutes * 60_000 >= nowMs);
  const past = data.sessions.filter((session) => session.startsAt.getTime() + session.durationMinutes * 60_000 < nowMs).reverse();
  const funnel = data.funnel;
  const steps = [
    { label: "angemeldet", value: funnel.registered },
    { label: "live oder Aufzeichnung", value: funnel.attended },
    { label: "Gutschein ausgestellt", value: funnel.issued },
    { label: "Gutschein eingelöst", value: funnel.redeemed },
  ];
  const voucherValue = data.settings.voucher.valueCents;

  return (
    <div className="mt-6 space-y-5">
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card title="Trichter" icon={Ticket}>
          <ol className="grid gap-3 sm:grid-cols-4">
            {steps.map((step, index) => {
              const previous = index === 0 ? step.value : steps[index - 1]!.value;
              const rate = index === 0 || previous === 0 ? null : Math.round((step.value / previous) * 100);
              return (
                <li key={step.label} className="rounded-xl border border-studio-line bg-white/[0.02] p-3">
                  <p className="font-mono text-2xl font-semibold tabular-nums">{step.value}</p>
                  <p className="text-xs text-studio-muted">{step.label}</p>
                  {rate !== null ? <p className="mt-1 font-mono text-xs tabular-nums text-oak-light">{rate} %</p> : null}
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-xs text-studio-muted">
            Gutschein-Wert:{" "}
            {voucherValue !== null ? (
              <span className="tabular-nums text-studio-text">
                {formatEuro(voucherValue)} netto · {formatEuro(grossCents(voucherValue, data.settings.vatPercent))} brutto
              </span>
            ) : (
              "noch nicht gesetzt (Preise & Leistungen)"
            )}{" "}
            · gültig {data.settings.voucher.validDays} Tage · {data.contingentLabel}
          </p>
        </Card>
        <Card
          title="Vorschläge aus dem Rhythmus"
          icon={CalendarPlus}
          action={
            <Button size="sm" icon={Plus} onClick={() => open({ type: "entityForm", entity: "officeHour" })}>
              Eigener Termin
            </Button>
          }
        >
          <p className="mb-3 text-xs text-studio-muted">
            {data.settings.officeHours.nthWeek}. {["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"][data.settings.officeHours.weekday - 1]} im Monat,{" "}
            {data.settings.officeHours.time} Uhr, {data.settings.officeHours.durationMinutes} min. Auf der Website sind diese Termine schon buchbar.
          </p>
          {data.suggestions.length === 0 ? (
            <p className="text-sm text-studio-muted">Alle kommenden Standardtermine sind angelegt.</p>
          ) : (
            <ul className="space-y-2">
              {data.suggestions.map((slot) => (
                <li key={slot.startsAt.toISOString()} className="flex items-center gap-3 rounded-xl border border-dashed border-studio-line px-3 py-2">
                  <span className="w-24 shrink-0 font-mono text-xs tabular-nums text-studio-muted">
                    {WEEKDAY_SHORT[isoWeekday(berlinDateKey(slot.startsAt)) - 1]} {formatDateKey(berlinDateKey(slot.startsAt), false)}
                    <br />
                    {berlinTime(slot.startsAt)} Uhr
                  </span>
                  <span className="min-w-0 flex-1 text-sm">{slot.topic}</span>
                  <Button size="sm" pending={pending} onClick={() => run(() => createDefaultOfficeHour(slot.startsAt.toISOString()))}>
                    anlegen
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <section aria-label="Kommende Sprechstunden" className="space-y-4">
        <h2 className="text-sm font-semibold">Kommende Sprechstunden</h2>
        {upcoming.length === 0 ? (
          <EmptyState icon={Video} title="Noch keine Sprechstunde angelegt">
            Die Standardtermine oben erscheinen trotzdem auf der Website. Sobald sich jemand anmeldet, wird der Termin hier angelegt. Du kannst ihn auch
            schon vorher anlegen, um Thema oder Uhrzeit zu ändern.
          </EmptyState>
        ) : (
          upcoming.map((session) => <SessionCard key={session.id} session={session} data={data} />)
        )}
      </section>

      {past.length > 0 ? (
        <section aria-label="Vergangene Sprechstunden" className="space-y-4">
          <button type="button" onClick={() => setShowPast((value) => !value)} aria-expanded={showPast} className="flex items-center gap-1.5 text-sm font-semibold">
            <ChevronDown className={cx("size-4 transition", showPast && "rotate-180")} aria-hidden /> Vergangene Sprechstunden ({past.length})
          </button>
          {showPast ? past.map((session) => <SessionCard key={session.id} session={session} data={data} />) : null}
        </section>
      ) : null}
    </div>
  );
}

function SessionCard({ session, data }: { session: Session; data: OfficeHourData }) {
  const { open } = useWerkbank();
  const end = new Date(session.startsAt.getTime() + session.durationMinutes * 60_000);
  const confirmed = session.registrations.filter((registration) => registration.confirmedAt).length;
  return (
    <section id={`oh-${session.id}`} className="scroll-mt-6 overflow-hidden rounded-2xl border border-studio-line bg-studio-panel">
      <header className="flex flex-wrap items-center gap-3 border-b border-studio-line px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-semibold tabular-nums">
            {formatInstant(session.startsAt)}–{berlinTime(end)}
          </p>
          <p className="truncate text-sm text-oak-light">{session.topic}</p>
        </div>
        <Badge tone={session.status === "abgesagt" ? "crit" : session.status === "durchgefuehrt" ? "ok" : "neutral"}>{labelOf(OFFICE_HOUR_STATUSES, session.status)}</Badge>
        <span className="text-xs tabular-nums text-studio-muted">
          {session.registrations.length} Anmeldungen · {confirmed} bestätigt
        </span>
        <Button size="sm" icon={Pencil} onClick={() => open({ type: "entityForm", entity: "officeHour", id: session.id })}>
          Bearbeiten
        </Button>
        <Button size="sm" onClick={() => open({ type: "record", ref: { kind: "officeHour", id: session.id } })}>
          Details
        </Button>
      </header>
      {session.registrations.length === 0 ? (
        <p className="px-5 py-4 text-sm text-studio-muted">Noch keine Anmeldungen. Sie kommen über das Formular auf der Website.</p>
      ) : (
        <ul className="divide-y divide-studio-line">
          {session.registrations.map((registration) => (
            <RegistrationRow key={registration.id} registration={registration} data={data} />
          ))}
        </ul>
      )}
    </section>
  );
}

function RegistrationRow({ registration, data }: { registration: Registration; data: OfficeHourData }) {
  const { pending, run } = useAction();
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [facts, setFacts] = useState({ photosReceived: false, inServiceArea: "", areaM2: "", specialFloor: false });
  const area = facts.areaM2.trim() === "" ? null : Number(facts.areaM2.replace(",", "."));
  const check = voucherChecks(
    {
      attended: registration.attended,
      watchedRecording: registration.watchedRecording,
      floorCheckDone: registration.floorCheckDone,
      photosReceived: facts.photosReceived,
      inServiceArea: facts.inServiceArea === "" ? null : facts.inServiceArea === "ja",
      areaM2: area !== null && Number.isFinite(area) ? area : null,
      specialFloor: facts.specialFloor,
      contingentFree: data.contingentFree,
    },
    data.fullSettings,
  );

  return (
    <li className="px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="min-w-0 flex-1 basis-48">
          <p className="truncate font-medium">{registration.firstName}</p>
          <p className="truncate text-xs text-studio-muted">
            {registration.email}
            {registration.newsletterConsent ? " · Newsletter ja" : ""}
          </p>
        </div>
        <Toggle label="Bestätigt" checked={Boolean(registration.confirmedAt)} disabled={pending} onChange={(value) => run(() => setRegistrationFlag(registration.id, "confirmed", value))} />
        <Toggle label="Live dabei" checked={registration.attended} disabled={pending} onChange={(value) => run(() => setRegistrationFlag(registration.id, "attended", value))} />
        <Toggle label="Aufzeichnung gesehen" checked={registration.watchedRecording} disabled={pending} onChange={(value) => run(() => setRegistrationFlag(registration.id, "watchedRecording", value))} />
        {registration.voucherCode ? (
          <div className="flex items-center gap-2">
            <Badge tone={registration.voucherRedeemedAt ? "ok" : "oak"}>
              <Ticket className="size-3" aria-hidden /> <span className="font-mono">{registration.voucherCode}</span>
            </Badge>
            <Toggle
              label="eingelöst"
              checked={Boolean(registration.voucherRedeemedAt)}
              disabled={pending}
              onChange={(value) => run(() => setVoucherRedeemed(registration.id, value))}
            />
          </div>
        ) : (
          <Button size="sm" icon={Ticket} onClick={() => setVoucherOpen((value) => !value)} aria-expanded={voucherOpen}>
            Gutschein prüfen
          </Button>
        )}
        <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setConfirmDelete(true)} aria-label={`Anmeldung von ${registration.firstName} löschen`} />
      </div>
      {confirmDelete ? (
        <div role="alert" className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          <span className="mr-auto">Anmeldung von {registration.firstName} löschen (z. B. auf Wunsch nach DSGVO)?</span>
          <Button size="sm" variant="danger" pending={pending} onClick={() => run(() => deleteRegistration(registration.id))}>
            Löschen
          </Button>
          <Button size="sm" onClick={() => setConfirmDelete(false)}>
            Abbrechen
          </Button>
        </div>
      ) : null}
      {voucherOpen && !registration.voucherCode ? (
        <div className="mt-3 grid gap-4 rounded-xl border border-studio-line bg-white/[0.02] p-3 sm:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs text-studio-muted">Was die Website nicht wissen kann, trägst du hier ein:</p>
            <CheckboxField label="3 Raumfotos erhalten" checked={facts.photosReceived} onChange={(photosReceived) => setFacts({ ...facts, photosReceived })} />
            <SelectField
              label={`Im Einzugsgebiet (${data.settings.serviceArea.label})`}
              value={facts.inServiceArea}
              onChange={(event) => setFacts({ ...facts, inServiceArea: event.target.value })}
              options={[
                { value: "", label: "unbekannt" },
                { value: "ja", label: "ja" },
                { value: "nein", label: "nein" },
              ]}
            />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Fläche" value={facts.areaM2} onChange={(event) => setFacts({ ...facts, areaM2: event.target.value })} suffix="m²" inputMode="decimal" />
              <CheckboxField className="pt-6" label="Besonderer Boden" checked={facts.specialFloor} onChange={(specialFloor) => setFacts({ ...facts, specialFloor })} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-studio-muted">Bedingungen</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {check.checks.length === 0 ? <li className="text-studio-muted">Keine Bedingungen aktiv (Preise & Leistungen → Gutschein).</li> : null}
              {check.checks.map((item) => (
                <li key={item.key} className="flex items-center gap-2">
                  {item.ok ? <Check className="size-4 text-emerald-300" aria-hidden /> : <X className="size-4 text-red-300" aria-hidden />}
                  <span className={item.ok ? undefined : "text-studio-muted"}>{item.label}</span>
                  <span className="sr-only">{item.ok ? "erfüllt" : "nicht erfüllt"}</span>
                </li>
              ))}
              {!registration.floorCheckDone && data.fullSettings.voucher.conditions.floorCheckAndPhotos ? (
                <li className="text-xs text-studio-muted">Kein Boden-Check mit dieser E-Mail gefunden.</li>
              ) : null}
            </ul>
            <Button
              variant="primary"
              size="sm"
              icon={Ticket}
              className="mt-3"
              disabled={!check.eligible}
              pending={pending}
              onClick={() =>
                run(() =>
                  issueVoucher({
                    registrationId: registration.id,
                    photosReceived: facts.photosReceived,
                    inServiceArea: facts.inServiceArea === "" ? null : facts.inServiceArea === "ja",
                    areaM2: area !== null && Number.isFinite(area) ? area : null,
                    specialFloor: facts.specialFloor,
                  }),
                )
              }
            >
              Code ausstellen
            </Button>
            {!check.eligible ? <p className="mt-1 text-xs text-studio-muted">Erst wenn alle Bedingungen erfüllt sind.</p> : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}
