"use client";

import { CircleCheck, Info, ListChecks, Plus, TriangleAlert, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EVENT_STATUSES, EVENT_TYPES, todayKey } from "@/lib/business/calendar";
import { loadEventFormContext, saveEvent, type EventFormContext } from "@/lib/werkbank/actions/events";
import { loadRecord } from "@/lib/werkbank/actions/records";
import { defaultTimes, eventWarnings, instantsToTimes, needsConfirmation } from "@/lib/werkbank/event-rules";
import type { EventInput } from "@/lib/werkbank/schemas";
import type { ChecklistItem, SelectOption, Warning } from "@/lib/werkbank/types";
import { useWerkbank, type EventPrefill } from "../context";
import { typeStyle } from "../event-style";
import { CheckboxField, InputField, SelectField, TextAreaField, inputClass } from "../fields";
import { useAction } from "../hooks";
import { Banner, Button, cx } from "../ui";

// Quick add / edit of a calendar entry with live warnings. Critical conflicts (vacation, holiday,
// overlap) need a second, explicit click ("Trotzdem eintragen") instead of a browser confirm().

interface Draft {
  type: string;
  title: string;
  date: string;
  endDate: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string;
  notes: string;
  status: string;
  checklist: ChecklistItem[];
  customerId: string;
  projectId: string;
  leadId: string;
  toolId: string;
  officeHourId: string;
  subscriptionId: string;
  floorPassId: string;
}

type LinkKey = "customerId" | "projectId" | "leadId" | "toolId" | "officeHourId" | "subscriptionId" | "floorPassId";

function draftFromPrefill(prefill: EventPrefill | undefined): Draft {
  const type = prefill?.type && EVENT_TYPES.some((item) => item.key === prefill.type) ? prefill.type : "erstberatung";
  const [start, end] = defaultTimes(type);
  const date = prefill?.date ?? todayKey();
  return {
    type,
    title: prefill?.title ?? "",
    date,
    endDate: prefill?.endDate ?? date,
    start: prefill?.start ?? start,
    end: prefill?.end ?? end,
    allDay: prefill?.allDay ?? type === "urlaub",
    location: prefill?.location ?? "",
    notes: prefill?.notes ?? "",
    status: "geplant",
    checklist: [],
    customerId: prefill?.customerId ?? "",
    projectId: prefill?.projectId ?? "",
    leadId: prefill?.leadId ?? "",
    toolId: prefill?.toolId ?? "",
    officeHourId: prefill?.officeHourId ?? "",
    subscriptionId: prefill?.subscriptionId ?? "",
    floorPassId: prefill?.floorPassId ?? "",
  };
}

function suggestedTitle(draft: Draft, context: EventFormContext | null): string {
  if (draft.type === "urlaub") return "Urlaub";
  const label = EVENT_TYPES.find((item) => item.key === draft.type)?.label ?? "Termin";
  const customer = context?.options.customers.find((item) => item.id === draft.customerId)?.label;
  const tool = context?.options.tools.find((item) => item.id === draft.toolId)?.label;
  return [label, tool, customer].filter(Boolean).join(" · ");
}

export function EventForm({ eventId, prefill }: { eventId: string | null; prefill?: EventPrefill }) {
  const [loaded, setLoaded] = useState<{ draft: Draft; context: EventFormContext; missing?: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let draft = draftFromPrefill(prefill);
      let missing = false;
      if (eventId) {
        const detail = await loadRecord({ kind: "event", id: eventId });
        const event = detail?.event;
        if (event) {
          const times = instantsToTimes(event);
          draft = {
            ...draft,
            type: event.type,
            title: event.title,
            ...times,
            location: event.location ?? "",
            notes: event.notes ?? "",
            status: event.status,
            checklist: event.checklist,
            customerId: event.customerId ?? "",
            projectId: event.projectId ?? "",
            leadId: event.leadId ?? "",
            toolId: event.toolId ?? "",
            officeHourId: event.officeHourId ?? "",
            subscriptionId: event.subscriptionId ?? "",
            floorPassId: event.floorPassId ?? "",
          };
        } else {
          missing = true;
        }
      }
      const context = await loadEventFormContext(draft.date);
      if (!cancelled) setLoaded({ draft, context, missing });
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [eventId, prefill]);

  if (!loaded) {
    return (
      <div className="space-y-3 p-5" aria-busy="true">
        <div className="h-7 w-1/2 animate-pulse rounded bg-white/10" />
        <div className="h-10 animate-pulse rounded-xl bg-white/[0.06]" />
        <div className="h-10 animate-pulse rounded-xl bg-white/[0.06]" />
        <span className="sr-only">Lade Formular …</span>
      </div>
    );
  }
  if (loaded.missing) {
    return (
      <div className="p-5">
        <h2 data-drawer-title tabIndex={-1} className="font-display text-lg font-semibold outline-none">
          Termin bearbeiten
        </h2>
        <p className="mt-2 text-sm text-studio-muted">Diesen Termin gibt es nicht mehr.</p>
      </div>
    );
  }
  return <EventFormBody eventId={eventId} initial={loaded.draft} context={loaded.context} titleFromUser={Boolean(eventId || prefill?.title)} />;
}

function EventFormBody({
  eventId,
  initial,
  context,
  titleFromUser,
}: {
  eventId: string | null;
  initial: Draft;
  context: EventFormContext;
  titleFromUser: boolean;
}) {
  const { showSaved, back, close, stack } = useWerkbank();
  const { pending, run } = useAction();
  const [draft, setDraft] = useState<Draft>(initial);
  const [titleTouched, setTitleTouched] = useState(titleFromUser);
  const [timesTouched, setTimesTouched] = useState(Boolean(eventId));
  const [confirming, setConfirming] = useState(false);
  const [serverWarnings, setServerWarnings] = useState<Warning[] | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [newItem, setNewItem] = useState("");

  const title = titleTouched ? draft.title : suggestedTitle(draft, context);
  const warnings = useMemo(
    () =>
      eventWarnings(
        { id: eventId, type: draft.type, date: draft.date, endDate: draft.allDay ? draft.endDate : draft.date, start: draft.start, end: draft.end, allDay: draft.allDay, status: draft.status },
        { events: context.events, rhythm: context.rhythm },
      ),
    [draft, context, eventId],
  );
  const critical = needsConfirmation(warnings) || Boolean(serverWarnings && needsConfirmation(serverWarnings));

  function update(patch: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setConfirming(false);
    setServerWarnings(null);
  }

  function changeType(type: string) {
    const patch: Partial<Draft> = { type };
    if (!timesTouched) {
      const [start, end] = defaultTimes(type);
      patch.start = start;
      patch.end = end;
      patch.allDay = type === "urlaub";
    }
    update(patch);
  }

  function changeLink(key: LinkKey, value: string, options: SelectOption[]) {
    const option = options.find((item) => item.id === value);
    const patch: Partial<Draft> = { [key]: value };
    if (option?.customerId && !draft.customerId) patch.customerId = option.customerId;
    if (option?.projectId && !draft.projectId) patch.projectId = option.projectId;
    update(patch);
  }

  function submit(confirmed: boolean) {
    if (critical && !confirmed) {
      setConfirming(true);
      return;
    }
    setErrors({});
    setMessage(null);
    run(
      () =>
        saveEvent({
          id: eventId,
          type: draft.type as EventInput["type"],
          title: title.trim(),
          date: draft.date,
          endDate: draft.allDay ? draft.endDate : draft.date,
          start: draft.start,
          end: draft.end,
          allDay: draft.allDay,
          location: draft.location,
          notes: draft.notes,
          status: draft.status as EventInput["status"],
          checklist: draft.checklist,
          customerId: draft.customerId || null,
          projectId: draft.projectId || null,
          leadId: draft.leadId || null,
          toolId: draft.toolId || null,
          officeHourId: draft.officeHourId || null,
          subscriptionId: draft.subscriptionId || null,
          floorPassId: draft.floorPassId || null,
          confirmed,
        }),
      (result) => {
        if (result.data) showSaved({ kind: "event", id: result.data.id });
      },
      (result) => {
        if (result.needsConfirm) {
          setServerWarnings(result.warnings ?? []);
          setConfirming(true);
          return;
        }
        setErrors(result.fieldErrors ?? {});
        setMessage(result.message);
      },
    );
  }

  const style = typeStyle(draft.type);
  const shownWarnings = serverWarnings ?? warnings;
  const typeOptions = EVENT_TYPES.map((item) => ({ value: item.key, label: item.label }));
  const linkSelect = (key: LinkKey, label: string, options: SelectOption[]) => (
    <SelectField
      label={label}
      value={draft[key]}
      onChange={(event) => changeLink(key, event.target.value, options)}
      placeholder="– ohne –"
      options={options.map((option) => ({ value: option.id, label: option.meta ? `${option.label} (${option.meta})` : option.label }))}
    />
  );

  return (
    <form
      className="flex min-h-full flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        submit(false);
      }}
      noValidate
    >
      <div className="flex-1 space-y-4 p-5">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: style.color }}>
            <style.icon className="size-3.5" aria-hidden /> {eventId ? "Termin bearbeiten" : "Neuer Termin"}
          </span>
          <h2 data-drawer-title tabIndex={-1} className="mt-1 font-display text-xl font-semibold outline-none">
            {eventId ? "Termin bearbeiten" : "Termin anlegen"}
          </h2>
        </div>

        {message ? <Banner tone="crit" icon={TriangleAlert}>{message}</Banner> : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Art" value={draft.type} onChange={(event) => changeType(event.target.value)} options={typeOptions} />
          <SelectField
            label="Status"
            value={draft.status}
            onChange={(event) => update({ status: event.target.value })}
            options={EVENT_STATUSES.map((item) => ({ value: item.key, label: item.label }))}
          />
        </div>
        <InputField
          label="Titel"
          value={title}
          maxLength={160}
          onChange={(event) => {
            setTitleTouched(true);
            update({ title: event.target.value });
          }}
          error={errors.title}
          required
        />
        <CheckboxField
          label="Ganztägig"
          hint={draft.type === "urlaub" ? "Urlaub zählt in Werktagen (Mo–Fr ohne Feiertage)." : "Ganztägige Einträge zählen nicht in die Wochenstunden."}
          checked={draft.allDay}
          onChange={(allDay) => {
            setTimesTouched(true);
            update({ allDay, endDate: draft.endDate < draft.date ? draft.date : draft.endDate });
          }}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <InputField
            label="Datum"
            type="date"
            value={draft.date}
            onChange={(event) => {
              const date = event.target.value;
              update({ date, endDate: draft.endDate < date ? date : draft.endDate });
            }}
            error={errors.date}
            required
            className="col-span-2 sm:col-span-1"
          />
          {draft.allDay ? (
            <InputField
              label="Bis"
              type="date"
              value={draft.endDate}
              min={draft.date}
              onChange={(event) => update({ endDate: event.target.value })}
              error={errors.endDate}
              className="col-span-2"
            />
          ) : (
            <>
              <InputField
                label="Beginn"
                type="time"
                step={900}
                value={draft.start}
                onChange={(event) => {
                  setTimesTouched(true);
                  update({ start: event.target.value });
                }}
                error={errors.start}
                required
              />
              <InputField
                label="Ende"
                type="time"
                step={900}
                value={draft.end}
                onChange={(event) => {
                  setTimesTouched(true);
                  update({ end: event.target.value });
                }}
                error={errors.end}
                required
              />
            </>
          )}
        </div>
        <InputField label="Ort" value={draft.location} maxLength={200} placeholder="z. B. Werkstatt oder Adresse" onChange={(event) => update({ location: event.target.value })} />

        {shownWarnings.length > 0 ? (
          <ul className="space-y-2" aria-label="Hinweise zum Termin" aria-live="polite">
            {shownWarnings.map((warning) => (
              <li key={`${warning.code}-${warning.message}`}>
                <Banner
                  tone={warning.level === "ok" ? "ok" : warning.level}
                  icon={warning.level === "ok" ? CircleCheck : warning.level === "info" ? Info : TriangleAlert}
                >
                  {warning.message}
                </Banner>
              </li>
            ))}
          </ul>
        ) : null}

        <fieldset className="space-y-3 rounded-xl border border-studio-line p-3">
          <legend className="px-1 text-xs font-medium text-studio-muted">Verknüpfungen</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {linkSelect("customerId", "Kunde", context.options.customers)}
            {linkSelect("projectId", "Projekt", context.options.projects)}
            {linkSelect("leadId", "Anfrage", context.options.leads)}
            {linkSelect("toolId", "Werkzeug", context.options.tools)}
            {linkSelect("officeHourId", "Sprechstunde", context.options.officeHours)}
            {linkSelect("subscriptionId", "Abo", context.options.subscriptions)}
            {linkSelect("floorPassId", "Boden-Pass", context.options.floorPasses)}
          </div>
        </fieldset>

        <TextAreaField label="Notiz" value={draft.notes} maxLength={4000} onChange={(event) => update({ notes: event.target.value })} />

        <fieldset className="rounded-xl border border-studio-line p-3">
          <legend className="flex items-center gap-1.5 px-1 text-xs font-medium text-studio-muted">
            <ListChecks className="size-3.5" aria-hidden /> Checkliste
          </legend>
          {draft.checklist.length > 0 ? (
            <ul className="mb-2 space-y-1.5">
              {draft.checklist.map((item, index) => (
                <li key={`${item.text}-${index}`} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    aria-label={`Erledigt: ${item.text}`}
                    checked={item.done}
                    onChange={(event) =>
                      update({ checklist: draft.checklist.map((entry, position) => (position === index ? { ...entry, done: event.target.checked } : entry)) })
                    }
                    className="size-4 accent-[#d8712c]"
                  />
                  <span className={cx("min-w-0 flex-1 truncate", item.done && "text-studio-muted line-through")}>{item.text}</span>
                  <button
                    type="button"
                    onClick={() => update({ checklist: draft.checklist.filter((_, position) => position !== index) })}
                    className="rounded p-1 text-studio-muted hover:bg-white/10 hover:text-white"
                    aria-label={`Punkt entfernen: ${item.text}`}
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex gap-2">
            <input
              value={newItem}
              onChange={(event) => setNewItem(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (newItem.trim()) {
                    update({ checklist: [...draft.checklist, { text: newItem.trim(), done: false }] });
                    setNewItem("");
                  }
                }
              }}
              placeholder="z. B. Feuchtemessgerät einpacken"
              aria-label="Neuer Punkt für die Checkliste"
              maxLength={200}
              className={inputClass}
            />
            <Button
              icon={Plus}
              disabled={!newItem.trim()}
              onClick={() => {
                update({ checklist: [...draft.checklist, { text: newItem.trim(), done: false }] });
                setNewItem("");
              }}
            >
              <span className="sr-only">Punkt hinzufügen</span>
            </Button>
          </div>
        </fieldset>
      </div>

      <div className="sticky bottom-0 space-y-3 border-t border-studio-line bg-studio-panel/95 p-4 backdrop-blur">
        {confirming ? (
          <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
            <p className="font-medium">Trotzdem eintragen?</p>
            <p className="mt-0.5 text-red-100/80">Der Termin kollidiert (siehe Hinweise oben) und wird im Kalender rot markiert.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="danger" pending={pending} onClick={() => submit(true)}>
                Trotzdem eintragen
              </Button>
              <Button onClick={() => setConfirming(false)}>Zurück zum Formular</Button>
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" pending={pending} disabled={confirming}>
            {eventId ? "Speichern" : "Termin anlegen"}
          </Button>
          <Button onClick={() => (stack.length > 1 ? back() : close())}>Abbrechen</Button>
        </div>
      </div>
    </form>
  );
}
