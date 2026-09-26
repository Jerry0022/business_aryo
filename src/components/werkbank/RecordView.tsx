"use client";

import {
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  ClipboardCheck,
  FolderPlus,
  Handshake,
  Info,
  Pencil,
  Repeat,
  ScrollText,
  Trash2,
  TriangleAlert,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { berlinDateKey, berlinTime, EVENT_STATUSES, formatDateKey, isoWeekday, WEEKDAY_SHORT } from "@/lib/business/calendar";
import { deleteEvent, setEventStatus, toggleChecklistItem } from "@/lib/werkbank/actions/events";
import {
  convertLeadToCustomer,
  createPartnerFromLead,
  deleteCustomer,
  deleteFloorPass,
  deleteLead,
  deletePartner,
  deleteProject,
  deleteSubscription,
  deleteTool,
  setLeadStatus,
} from "@/lib/werkbank/actions/crm";
import { deleteOfficeHour } from "@/lib/werkbank/actions/office-hours";
import { loadRecord } from "@/lib/werkbank/actions/records";
import { LEAD_STATUSES, WERKBANK_PATH } from "@/lib/werkbank/constants";
import { RECORD_KIND_LABELS, type ActionResult, type EventLine, type RecordDetail, type RecordRef } from "@/lib/werkbank/types";
import { useWerkbank, type EventPrefill } from "./context";
import { chipStyle, typeStyle } from "./event-style";
import { useAction } from "./hooks";
import { Badge, Banner, Button, cx, KeyValues } from "./ui";

// Drawer content for one record: data, warnings, the "Verknüpft mit" list (each link opens the
// linked record in the drawer) and the actions that fit the record.

const DELETE: Record<RecordRef["kind"], (id: string) => Promise<ActionResult>> = {
  event: deleteEvent,
  customer: deleteCustomer,
  project: deleteProject,
  lead: deleteLead,
  tool: deleteTool,
  officeHour: deleteOfficeHour,
  subscription: deleteSubscription,
  floorPass: deleteFloorPass,
  partner: deletePartner,
};

const EDITABLE: Partial<Record<RecordRef["kind"], "customer" | "project" | "floorPass" | "tool" | "subscription" | "partner" | "officeHour">> = {
  customer: "customer",
  project: "project",
  floorPass: "floorPass",
  tool: "tool",
  subscription: "subscription",
  partner: "partner",
  officeHour: "officeHour",
};

export function RecordView({ refValue }: { refValue: RecordRef }) {
  const { version } = useWerkbank();
  const key = `${refValue.kind}:${refValue.id}:${version}`;
  const [state, setState] = useState<{ key: string; detail: RecordDetail | null; failed?: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadRecord({ kind: refValue.kind, id: refValue.id })
      .then((detail) => {
        if (!cancelled) setState({ key, detail });
      })
      .catch(() => {
        if (!cancelled) setState({ key, detail: null, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [key, refValue.kind, refValue.id]);

  if (!state) {
    return (
      <div className="space-y-3 p-5" aria-busy="true">
        <div className="h-5 w-24 animate-pulse rounded bg-white/10" />
        <div className="h-7 w-2/3 animate-pulse rounded bg-white/10" />
        <div className="h-24 animate-pulse rounded-xl bg-white/[0.06]" />
        <span className="sr-only">Lade …</span>
      </div>
    );
  }
  if (!state.detail) {
    return (
      <div className="p-5">
        <h2 data-drawer-title tabIndex={-1} className="font-display text-lg font-semibold outline-none">
          {RECORD_KIND_LABELS[refValue.kind]}
        </h2>
        <p className="mt-2 text-sm text-studio-muted">
          {state.failed ? "Der Eintrag konnte nicht geladen werden." : "Diesen Eintrag gibt es nicht mehr. Vielleicht wurde er gerade gelöscht."}
        </p>
      </div>
    );
  }
  return <DetailBody detail={state.detail} stale={state.key !== key} />;
}

function DetailBody({ detail, stale }: { detail: RecordDetail; stale: boolean }) {
  const { push, close, afterDelete, refresh, stack } = useWerkbank();
  const router = useRouter();
  const { pending, run } = useAction();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { ref, context } = detail;
  const style = detail.event ? typeStyle(detail.event.type) : null;
  const TypeIcon = style?.icon;

  const planEvent = (prefill: EventPrefill) => push({ type: "eventForm", prefill });

  return (
    <div className={cx("space-y-5 p-5 transition-opacity", stale && "opacity-60")}>
      <div>
        <div className="flex flex-wrap items-center gap-1.5">
          {style && TypeIcon ? (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium" style={chipStyle(style.color)}>
              <TypeIcon className="size-3.5" aria-hidden />
              {style.label}
            </span>
          ) : (
            <Badge tone="neutral">{RECORD_KIND_LABELS[ref.kind]}</Badge>
          )}
          {detail.badges.slice(style ? 1 : 0).map((badge) => (
            <Badge key={badge.label} tone={badge.tone}>
              {badge.label}
            </Badge>
          ))}
        </div>
        <h2 data-drawer-title tabIndex={-1} className="mt-2 font-display text-xl font-semibold leading-snug outline-none">
          {detail.title}
        </h2>
        {detail.subtitle ? <p className="mt-1 text-sm text-studio-muted tabular-nums">{detail.subtitle}</p> : null}
      </div>

      {detail.banners.length > 0 ? (
        <div className="space-y-2">
          {detail.banners.map((banner) => (
            <Banner key={banner.text} tone={banner.tone} icon={banner.tone === "crit" || banner.tone === "warn" ? TriangleAlert : Info}>
              {banner.text}
            </Banner>
          ))}
        </div>
      ) : null}

      {detail.event ? (
        <EventControls detail={detail} pending={pending} run={run} refresh={refresh} />
      ) : null}

      {detail.lead ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-medium text-studio-muted">
            Status
            <select
              value={detail.lead.status}
              disabled={pending}
              onChange={(event) => run(() => setLeadStatus(ref.id, event.target.value), refresh)}
              className="mt-1 block rounded-xl border border-studio-line bg-studio-bg px-3 py-2 text-sm text-studio-text"
            >
              {LEAD_STATUSES.map((status) => (
                <option key={status.key} value={status.key}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {detail.sections.map((section) =>
        section.rows.length > 0 ? (
          <section key={section.title}>
            <h3 className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-studio-muted">{section.title}</h3>
            <KeyValues rows={section.rows} />
          </section>
        ) : null,
      )}

      {detail.bullets ? (
        <section>
          <h3 className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-studio-muted">{detail.bullets.title}</h3>
          <ul className="space-y-1.5 text-sm">
            {detail.bullets.items.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-oak" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {detail.registrations ? (
        <section>
          <h3 className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-studio-muted">Anmeldungen ({detail.registrations.length})</h3>
          {detail.registrations.length === 0 ? (
            <p className="text-sm text-studio-muted">Noch keine Anmeldungen. Sie kommen über das Formular auf der Website.</p>
          ) : (
            <ul className="divide-y divide-studio-line rounded-xl border border-studio-line text-sm">
              {detail.registrations.map((registration) => (
                <li key={registration.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                  <span className="min-w-0 flex-1 truncate">
                    {registration.firstName} <span className="text-studio-muted">· {registration.email}</span>
                  </span>
                  {registration.confirmed ? <Badge tone="ok">bestätigt</Badge> : <Badge tone="warn">unbestätigt</Badge>}
                  {registration.attended ? <Badge tone="info">live</Badge> : registration.watchedRecording ? <Badge tone="info">Aufzeichnung</Badge> : null}
                  {registration.voucherCode ? <Badge tone={registration.voucherRedeemed ? "ok" : "oak"}>{registration.voucherCode}</Badge> : null}
                </li>
              ))}
            </ul>
          )}
          <Link href={`${WERKBANK_PATH}/sprechstunde#oh-${ref.id}`} onClick={close} className="mt-2 inline-flex items-center gap-1 text-sm text-oak-light underline-offset-4 hover:underline">
            Anmeldungen und Gutscheine verwalten <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        </section>
      ) : null}

      <section>
        <h3 className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-studio-muted">Verknüpft mit</h3>
        {detail.links.length === 0 ? (
          <p className="text-sm text-studio-muted">Noch keine Verknüpfungen.</p>
        ) : (
          <ul className="flex flex-col gap-1.5" aria-label="Verknüpfungen">
            {detail.links.map((link) => (
              <li key={`${link.ref.kind}:${link.ref.id}`}>
                <button
                  type="button"
                  onClick={() => push({ type: "record", ref: link.ref })}
                  className="flex w-full items-center gap-3 rounded-xl border border-studio-line bg-white/[0.02] px-3 py-2 text-left text-sm transition hover:border-oak/40 hover:bg-white/[0.05]"
                >
                  <span className="w-20 shrink-0 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-studio-muted">{RECORD_KIND_LABELS[link.ref.kind]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{link.label}</span>
                    {link.meta ? <span className="block truncate text-xs text-studio-muted">{link.meta}</span> : null}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-studio-muted" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {detail.events.length > 0 ? (
        <section>
          <h3 className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-studio-muted">Termine ({detail.events.length})</h3>
          <ul className="flex flex-col gap-1.5">
            {detail.events.map((event) => (
              <li key={event.id}>
                <EventLineButton event={event} onOpen={() => push({ type: "record", ref: { kind: "event", id: event.id } })} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-studio-line pt-4">
        {ref.kind === "event" ? (
          <>
            <Button icon={Pencil} onClick={() => push({ type: "eventForm", eventId: ref.id })}>
              Bearbeiten
            </Button>
            {detail.calendarHref ? (
              <Button
                icon={CalendarDays}
                onClick={() => {
                  close();
                  router.push(detail.calendarHref!);
                }}
              >
                Im Kalender zeigen
              </Button>
            ) : null}
          </>
        ) : null}
        {EDITABLE[ref.kind] ? (
          <Button icon={Pencil} onClick={() => push({ type: "entityForm", entity: EDITABLE[ref.kind]!, id: ref.id })}>
            Bearbeiten
          </Button>
        ) : null}
        {ref.kind === "lead" && detail.lead ? (
          <>
            {!detail.lead.customerId ? (
              <Button
                icon={UserPlus}
                pending={pending}
                onClick={() =>
                  run(
                    () => convertLeadToCustomer(ref.id),
                    (result) => {
                      refresh();
                      if (result.data) push({ type: "record", ref: { kind: "customer", id: result.data.customerId } });
                    },
                  )
                }
              >
                Als Kunde übernehmen
              </Button>
            ) : null}
            <Button
              icon={FolderPlus}
              pending={pending}
              onClick={() => {
                const openProject = (customerId: string | null) =>
                  push({
                    type: "entityForm",
                    entity: "project",
                    prefill: {
                      customerId,
                      title: context.title ? `Projekt ${context.title}` : "",
                      floorType: context.floorType ?? null,
                      areaM2: context.areaM2 ?? null,
                      notes: context.notes ?? null,
                      status: "anfrage",
                    },
                  });
                if (detail.lead?.customerId) openProject(detail.lead.customerId);
                else
                  run(
                    () => convertLeadToCustomer(ref.id),
                    (result) => {
                      refresh();
                      openProject(result.data?.customerId ?? null);
                    },
                  );
              }}
            >
              Projekt anlegen
            </Button>
            <Button
              icon={ClipboardCheck}
              onClick={() =>
                planEvent({
                  type: "erstberatung",
                  leadId: ref.id,
                  customerId: detail.lead?.customerId ?? null,
                  title: `Erstberatung · ${context.title ?? ""}`.trim(),
                  location: context.location ?? undefined,
                  notes: context.notes ?? undefined,
                })
              }
            >
              Erstberatung planen
            </Button>
            {detail.lead.kind === "partner" && !detail.lead.partnerId ? (
              <Button
                icon={Handshake}
                pending={pending}
                onClick={() =>
                  run(
                    () => createPartnerFromLead(ref.id),
                    (result) => {
                      refresh();
                      if (result.data) push({ type: "record", ref: { kind: "partner", id: result.data.partnerId } });
                    },
                  )
                }
              >
                Als Partner anlegen
              </Button>
            ) : null}
          </>
        ) : null}
        {ref.kind === "customer" ? (
          <>
            <Button icon={FolderPlus} onClick={() => push({ type: "entityForm", entity: "project", prefill: { customerId: ref.id, city: context.location ?? null } })}>
              Projekt anlegen
            </Button>
            <Button icon={CalendarPlus} onClick={() => planEvent({ customerId: ref.id, location: context.location ?? undefined })}>
              Termin planen
            </Button>
            <Button icon={ScrollText} onClick={() => push({ type: "entityForm", entity: "floorPass", prefill: { customerId: ref.id } })}>
              Boden-Pass anlegen
            </Button>
            <Button icon={Repeat} onClick={() => push({ type: "entityForm", entity: "subscription", prefill: { customerId: ref.id } })}>
              Abo anlegen
            </Button>
          </>
        ) : null}
        {ref.kind === "project" ? (
          <>
            <Button icon={CalendarPlus} onClick={() => planEvent({ type: "verlegung", projectId: ref.id, customerId: context.customerId ?? null, title: context.title ?? undefined, location: context.location ?? undefined })}>
              Termin planen
            </Button>
            <Button
              icon={ScrollText}
              onClick={() => push({ type: "entityForm", entity: "floorPass", prefill: { customerId: context.customerId ?? null, projectId: ref.id, title: context.title ?? null } })}
            >
              Boden-Pass anlegen
            </Button>
          </>
        ) : null}
        {ref.kind === "floorPass" || ref.kind === "subscription" ? (
          <Button
            icon={CalendarPlus}
            onClick={() =>
              planEvent({
                type: "pflege",
                date: context.date ?? undefined,
                customerId: context.customerId ?? null,
                projectId: context.projectId ?? null,
                floorPassId: context.floorPassId ?? null,
                subscriptionId: context.subscriptionId ?? null,
                title: `Pflege · ${context.title ?? ""}`.trim(),
              })
            }
          >
            Pflege-Termin planen
          </Button>
        ) : null}
        {ref.kind === "tool" ? (
          <Button icon={CalendarPlus} onClick={() => push({ type: "entityForm", entity: "rental", id: ref.id })}>
            Ausgabe/Rückgabe planen
          </Button>
        ) : null}
        {ref.kind === "officeHour" && detail.calendarHref ? (
          <Button
            icon={CalendarDays}
            onClick={() => {
              close();
              router.push(detail.calendarHref!);
            }}
          >
            Im Kalender zeigen
          </Button>
        ) : null}
        <Button variant="ghost" icon={Trash2} onClick={() => setConfirmDelete(true)} className="ml-auto text-red-300 hover:text-red-200">
          Löschen
        </Button>
      </div>

      {confirmDelete ? (
        <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm">
          <p className="font-medium text-red-100">„{detail.title}“ wirklich löschen?</p>
          <p className="mt-1 text-red-100/80">
            {ref.kind === "officeHour"
              ? "Alle Anmeldungen dieser Sprechstunde werden mit gelöscht."
              : ref.kind === "event"
                ? "Der Termin verschwindet aus dem Kalender."
                : "Verknüpfte Einträge bleiben erhalten, verlieren aber die Verbindung."}
          </p>
          <div className="mt-3 flex gap-2">
            <Button variant="danger" pending={pending} onClick={() => run(() => DELETE[ref.kind](ref.id), () => (stack.length > 1 ? afterDelete() : close()))}>
              Endgültig löschen
            </Button>
            <Button onClick={() => setConfirmDelete(false)}>Abbrechen</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EventControls({
  detail,
  pending,
  run,
  refresh,
}: {
  detail: RecordDetail;
  pending: boolean;
  run: ReturnType<typeof useAction>["run"];
  refresh: () => void;
}) {
  const event = detail.event!;
  return (
    <div className="space-y-4">
      <div role="group" aria-label="Status" className="inline-flex rounded-xl border border-studio-line p-0.5">
        {EVENT_STATUSES.map((status) => (
          <button
            key={status.key}
            type="button"
            aria-pressed={event.status === status.key}
            disabled={pending}
            onClick={() => run(() => setEventStatus(event.id, status.key), refresh)}
            className={cx(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              event.status === status.key ? "bg-white/10 text-white" : "text-studio-muted hover:text-studio-text",
            )}
          >
            {status.label}
          </button>
        ))}
      </div>
      {event.checklist.length > 0 ? (
        <section>
          <h3 className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-studio-muted">
            Checkliste ({event.checklist.filter((item) => item.done).length}/{event.checklist.length})
          </h3>
          <ul className="space-y-1.5">
            {event.checklist.map((item, index) => (
              <li key={`${item.text}-${index}`}>
                <label className="flex items-start gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={item.done}
                    disabled={pending}
                    onChange={(change) => run(() => toggleChecklistItem(event.id, index, change.target.checked), refresh)}
                    className="mt-0.5 size-4 accent-[#d8712c]"
                  />
                  <span className={item.done ? "text-studio-muted line-through" : undefined}>{item.text}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export function EventLineButton({ event, onOpen }: { event: EventLine; onOpen: () => void }) {
  const style = typeStyle(event.type);
  const Icon = style.icon;
  const key = berlinDateKey(event.startsAt);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl border border-studio-line bg-white/[0.02] px-3 py-2 text-left text-sm transition hover:bg-white/[0.05]"
    >
      <span className="w-24 shrink-0 font-mono text-xs tabular-nums text-studio-muted">
        {WEEKDAY_SHORT[isoWeekday(key) - 1]} {formatDateKey(key, false)}
        <br />
        {event.allDay ? "ganztägig" : berlinTime(event.startsAt)}
      </span>
      <span className="grid size-7 shrink-0 place-items-center rounded-lg border" style={chipStyle(style.color)}>
        <Icon className="size-3.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cx("block truncate font-medium", event.status === "abgesagt" && "line-through opacity-60")}>{event.title}</span>
        <span className="block truncate text-xs text-studio-muted">
          {style.label} · {EVENT_STATUSES.find((status) => status.key === event.status)?.label ?? event.status}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-studio-muted" aria-hidden />
    </button>
  );
}
