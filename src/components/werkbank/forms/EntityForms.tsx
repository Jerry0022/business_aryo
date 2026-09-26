"use client";

import { Info, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { berlinDateKey, berlinTime, MONTH_NAMES, parseDateKey, todayKey } from "@/lib/business/calendar";
import { PROJECT_STATUSES, projectContingent, SLOT_BOOKED_STATUSES } from "@/lib/business/contingent";
import { defaultOfficeHourTopic } from "@/lib/business/office-hours";
import { MAX_PRIVATE_MIN_TERM_MONTHS, planByKey, SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUSES } from "@/lib/business/subscriptions";
import { saveCustomer, saveFloorPass, savePartner, saveProject, saveSubscription, saveTool } from "@/lib/werkbank/actions/crm";
import { planRental } from "@/lib/werkbank/actions/events";
import { saveOfficeHour } from "@/lib/werkbank/actions/office-hours";
import { loadEntityForm, type EntityForm, type EntityKind } from "@/lib/werkbank/actions/records";
import { CUSTOMER_KINDS, OFFICE_HOUR_STATUSES, PARTNER_STATUSES, TOOL_STATUSES } from "@/lib/werkbank/constants";
import type { CustomerInput, OfficeHourInput, PartnerInput, ProjectInput, SubscriptionInput, ToolInput } from "@/lib/werkbank/schemas";
import type { ActionResult, RecordRef, Warning } from "@/lib/werkbank/types";
import { useWerkbank, type EntityPrefill } from "../context";
import { CheckboxField, InputField, SelectField, TextAreaField } from "../fields";
import { useAction } from "../hooks";
import { Banner, Button } from "../ui";

// Edit forms for the Werkbank records, shown in the drawer. Each form loads its record and the
// options it needs, validates on the server and then shows the saved record.

function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

/** "64,5" → 64.5, "" → null, invalid → NaN */
export function parseNumber(text: string): number | null {
  const trimmed = text.trim().replace(",", ".");
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : Number.NaN;
}

function numberText(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value).replace(".", ",");
}

const options = (list: readonly { key: string; label: string }[]) => list.map((item) => ({ value: item.key, label: item.label }));

export function EntityFormView({ entity, id, prefill }: { entity: EntityKind; id: string | null; prefill?: EntityPrefill }) {
  const [form, setForm] = useState<{ data: EntityForm | null } | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadEntityForm(entity, id)
      .then((data) => {
        if (!cancelled) setForm({ data });
      })
      .catch(() => {
        if (!cancelled) setForm({ data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [entity, id]);

  if (!form) {
    return (
      <div className="space-y-3 p-5" aria-busy="true">
        <div className="h-7 w-1/2 animate-pulse rounded bg-white/10" />
        <div className="h-10 animate-pulse rounded-xl bg-white/[0.06]" />
        <span className="sr-only">Lade Formular …</span>
      </div>
    );
  }
  const data = form.data;
  if (!data) return <p className="p-5 text-sm text-studio-muted">Das Formular konnte nicht geladen werden.</p>;
  const values = prefill ?? {};
  switch (data.entity) {
    case "customer":
      return <CustomerForm data={data} prefill={values} />;
    case "project":
      return <ProjectForm data={data} prefill={values} />;
    case "floorPass":
      return <FloorPassForm data={data} prefill={values} />;
    case "tool":
      return <ToolForm data={data} />;
    case "subscription":
      return <SubscriptionForm data={data} prefill={values} />;
    case "partner":
      return <PartnerForm data={data} />;
    case "officeHour":
      return <OfficeHourForm data={data} prefill={values} />;
    case "rental":
      return <RentalForm data={data} />;
  }
}

function useSave<T extends { id: string }>(kind: RecordRef["kind"]) {
  const { showSaved } = useWerkbank();
  const { pending, run } = useAction();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  function save(action: () => Promise<ActionResult<T>>) {
    setErrors({});
    setMessage(null);
    run(
      action,
      (result) => {
        if (result.data) showSaved({ kind, id: result.data.id });
      },
      (result) => {
        setErrors(result.fieldErrors ?? {});
        setMessage(result.message);
      },
    );
  }
  return { pending, errors, message, save };
}

function FormShell({
  heading,
  eyebrow,
  children,
  onSubmit,
  pending,
  message,
  submitLabel = "Speichern",
  footer,
}: {
  heading: string;
  eyebrow: string;
  children: React.ReactNode;
  onSubmit: () => void;
  pending: boolean;
  message: string | null;
  submitLabel?: string;
  footer?: React.ReactNode;
}) {
  const { back, close, stack } = useWerkbank();
  return (
    <form
      noValidate
      className="flex min-h-full flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex-1 space-y-4 p-5">
        <div>
          <p className="text-xs font-medium text-oak-light">{eyebrow}</p>
          <h2 data-drawer-title tabIndex={-1} className="mt-1 font-display text-xl font-semibold outline-none">
            {heading}
          </h2>
        </div>
        {message ? (
          <Banner tone="crit" icon={TriangleAlert}>
            {message}
          </Banner>
        ) : null}
        {children}
      </div>
      <div className="sticky bottom-0 space-y-3 border-t border-studio-line bg-studio-panel/95 p-4 backdrop-blur">
        {footer}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" pending={pending}>
            {submitLabel}
          </Button>
          <Button onClick={() => (stack.length > 1 ? back() : close())}>Abbrechen</Button>
        </div>
      </div>
    </form>
  );
}

function WarningList({ warnings }: { warnings: Warning[] }) {
  if (warnings.length === 0) return null;
  return (
    <ul className="space-y-2" aria-live="polite">
      {warnings.map((warning) => (
        <li key={warning.message}>
          <Banner tone={warning.level === "ok" ? "ok" : warning.level} icon={warning.level === "info" || warning.level === "ok" ? Info : TriangleAlert}>
            {warning.message}
          </Banner>
        </li>
      ))}
    </ul>
  );
}

// ---- Customer ------------------------------------------------------------------------------------

function CustomerForm({ data, prefill }: { data: Extract<EntityForm, { entity: "customer" }>; prefill: EntityPrefill }) {
  const record = data.record;
  const [values, setValues] = useState({
    name: record?.name ?? str(prefill.name),
    kind: record?.kind ?? (str(prefill.kind) || "privat"),
    email: record?.email ?? str(prefill.email),
    phone: record?.phone ?? str(prefill.phone),
    street: record?.street ?? "",
    postalCode: record?.postalCode ?? str(prefill.postalCode),
    city: record?.city ?? "",
    notes: record?.notes ?? "",
  });
  const { pending, errors, message, save } = useSave<{ id: string }>("customer");
  const set = (patch: Partial<typeof values>) => setValues((current) => ({ ...current, ...patch }));
  return (
    <FormShell
      eyebrow="Kunden"
      heading={record ? "Kunde bearbeiten" : "Kunde anlegen"}
      pending={pending}
      message={message}
      onSubmit={() => save(() => saveCustomer({ id: record?.id ?? null, ...values, kind: values.kind as CustomerInput["kind"] }))}
    >
      <InputField label="Name" value={values.name} onChange={(event) => set({ name: event.target.value })} error={errors.name} required maxLength={120} />
      <SelectField label="Art" value={values.kind} onChange={(event) => set({ kind: event.target.value })} options={options(CUSTOMER_KINDS)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="E-Mail" type="email" value={values.email} onChange={(event) => set({ email: event.target.value })} error={errors.email} />
        <InputField label="Telefon" type="tel" value={values.phone} onChange={(event) => set({ phone: event.target.value })} error={errors.phone} />
      </div>
      <InputField label="Straße und Hausnummer" value={values.street} onChange={(event) => set({ street: event.target.value })} />
      <div className="grid grid-cols-[8rem_1fr] gap-3">
        <InputField label="PLZ" value={values.postalCode} onChange={(event) => set({ postalCode: event.target.value })} error={errors.postalCode} inputMode="numeric" />
        <InputField label="Ort" value={values.city} onChange={(event) => set({ city: event.target.value })} />
      </div>
      <TextAreaField label="Notiz" value={values.notes} onChange={(event) => set({ notes: event.target.value })} />
    </FormShell>
  );
}

// ---- Project -------------------------------------------------------------------------------------

function ProjectForm({ data, prefill }: { data: Extract<EntityForm, { entity: "project" }>; prefill: EntityPrefill }) {
  const record = data.record;
  const [values, setValues] = useState({
    title: record?.title ?? str(prefill.title),
    customerId: record?.customerId ?? str(prefill.customerId),
    status: record?.status ?? (str(prefill.status) || "anfrage"),
    floorType: record?.floorType ?? str(prefill.floorType),
    areaM2: numberText(record?.areaM2 ?? (typeof prefill.areaM2 === "number" ? prefill.areaM2 : null)),
    city: record?.city ?? str(prefill.city),
    slotYear: str(record ? record.slotYear : ""),
    slotMonth: str(record ? record.slotMonth : ""),
    notes: record?.notes ?? str(prefill.notes),
  });
  const { pending, errors, message, save } = useSave<{ id: string }>("project");
  const set = (patch: Partial<typeof values>) => setValues((current) => ({ ...current, ...patch }));

  const baseYear = parseDateKey(todayKey()).year;
  const years = [...new Set([baseYear, baseYear + 1, baseYear + 2, data.slotYear, ...(record?.slotYear ? [record.slotYear] : [])])].sort();

  const warnings = useMemo<Warning[]>(() => {
    const list: Warning[] = [];
    const year = Number(values.slotYear) || null;
    const month = Number(values.slotMonth) || null;
    if (!year) {
      list.push({ level: "info", code: "no-slot", message: "Ohne Projektplatz zählt das Projekt nicht auf das Jahreskontingent." });
      return list;
    }
    const others = data.slots.filter((slot) => slot.id !== record?.id);
    const planned = [...others, { id: "this", title: values.title || "Dieses Projekt", status: values.status, slotYear: year, slotMonth: month }];
    const contingent = projectContingent(planned, year, data.slotTotal);
    if (month) {
      const taken = others.filter((slot) => slot.slotYear === year && slot.slotMonth === month && (SLOT_BOOKED_STATUSES.has(slot.status) || slot.status === "angebot"));
      if (taken.length > 0) {
        list.push({
          level: "warn",
          code: "month-taken",
          message: `${MONTH_NAMES[month - 1]} ${year} ist schon belegt: ${taken.map((slot) => `„${slot.title}“ (${PROJECT_STATUSES.find((item) => item.key === slot.status)?.label ?? slot.status})`).join(", ")}.`,
        });
      }
    }
    const booked = SLOT_BOOKED_STATUSES.has(values.status);
    if (booked && contingent.booked > contingent.total) {
      list.push({ level: "crit", code: "year-full", message: `${year} ist voll: ${contingent.booked} gebuchte Projekte bei ${contingent.total} Projektplätzen.` });
    } else if (booked) {
      list.push({ level: "ok", code: "counter", message: `Auf der Website danach: noch ${contingent.free} von ${contingent.total} Projektplätzen ${year} frei.` });
    } else {
      list.push({
        level: "info",
        code: "not-booked",
        message: `Erst mit Status „Gebucht“, „Laufend“ oder „Abgeschlossen“ zählt der Platz auf der Website. ${values.status === "angebot" ? "Mit „Angebot“ ist er reserviert." : ""}`.trim(),
      });
    }
    return list;
  }, [values, data, record?.id]);

  return (
    <FormShell
      eyebrow="Projekte"
      heading={record ? "Projekt bearbeiten" : "Projekt anlegen"}
      pending={pending}
      message={message}
      onSubmit={() => {
        const area = parseNumber(values.areaM2);
        save(() =>
          saveProject({
            id: record?.id ?? null,
            title: values.title,
            customerId: values.customerId || null,
            status: values.status as ProjectInput["status"],
            floorType: values.floorType,
            areaM2: area === null || Number.isNaN(area) ? null : area,
            city: values.city,
            slotYear: values.slotYear ? Number(values.slotYear) : null,
            slotMonth: values.slotYear && values.slotMonth ? Number(values.slotMonth) : null,
            notes: values.notes,
          }),
        );
      }}
    >
      <InputField label="Titel" value={values.title} onChange={(event) => set({ title: event.target.value })} error={errors.title} required maxLength={160} placeholder="z. B. Wagner · Eiche Landhausdiele" />
      <SelectField
        label="Kunde"
        value={values.customerId}
        onChange={(event) => set({ customerId: event.target.value })}
        placeholder="– ohne –"
        options={data.customers.map((item) => ({ value: item.id, label: item.label }))}
        hint={data.customers.length === 0 ? "Noch keine Kunden angelegt. Du kannst das Projekt auch ohne Kunden anlegen." : undefined}
      />
      <SelectField label="Status" value={values.status} onChange={(event) => set({ status: event.target.value })} options={options(PROJECT_STATUSES)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="Boden" value={values.floorType} onChange={(event) => set({ floorType: event.target.value })} placeholder="z. B. Fertigparkett Eiche" />
        <InputField label="Fläche" value={values.areaM2} onChange={(event) => set({ areaM2: event.target.value })} suffix="m²" inputMode="decimal" error={errors.areaM2} />
      </div>
      <InputField label="Ort" value={values.city} onChange={(event) => set({ city: event.target.value })} />
      <fieldset className="rounded-xl border border-studio-line p-3">
        <legend className="px-1 text-xs font-medium text-studio-muted">Projektplatz</legend>
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Platz-Jahr"
            value={values.slotYear}
            onChange={(event) => set({ slotYear: event.target.value, slotMonth: event.target.value ? values.slotMonth : "" })}
            placeholder="kein Projektplatz"
            options={years.map((year) => ({ value: String(year), label: String(year) }))}
            error={errors.slotYear}
          />
          <SelectField
            label="Platz-Monat"
            value={values.slotMonth}
            disabled={!values.slotYear}
            onChange={(event) => set({ slotMonth: event.target.value })}
            placeholder="– Monat –"
            options={MONTH_NAMES.map((name, index) => ({ value: String(index + 1), label: name }))}
          />
        </div>
      </fieldset>
      <WarningList warnings={warnings} />
      <TextAreaField label="Notiz" value={values.notes} onChange={(event) => set({ notes: event.target.value })} />
    </FormShell>
  );
}

// ---- Floor pass ----------------------------------------------------------------------------------

function FloorPassForm({ data, prefill }: { data: Extract<EntityForm, { entity: "floorPass" }>; prefill: EntityPrefill }) {
  const record = data.record;
  const [values, setValues] = useState({
    title: record?.title ?? str(prefill.title),
    customerId: record?.customerId ?? str(prefill.customerId),
    projectId: record?.projectId ?? str(prefill.projectId),
    wood: record?.wood ?? "",
    surface: record?.surface ?? "",
    batch: record?.batch ?? "",
    areaM2: numberText(record?.areaM2),
    installedAt: record?.installedAt ?? "",
    carePlan: record?.carePlan ?? "",
    nextCareAt: record?.nextCareAt ?? "",
    notes: record?.notes ?? "",
  });
  const { pending, errors, message, save } = useSave<{ id: string }>("floorPass");
  const set = (patch: Partial<typeof values>) => setValues((current) => ({ ...current, ...patch }));
  const projects = values.customerId ? data.projects.filter((project) => !project.customerId || project.customerId === values.customerId) : data.projects;
  return (
    <FormShell
      eyebrow="Boden-Pass"
      heading={record ? "Boden-Pass bearbeiten" : "Boden-Pass anlegen"}
      pending={pending}
      message={message}
      onSubmit={() => {
        const area = parseNumber(values.areaM2);
        save(() =>
          saveFloorPass({
            id: record?.id ?? null,
            ...values,
            customerId: values.customerId || null,
            projectId: values.projectId || null,
            areaM2: area === null || Number.isNaN(area) ? null : area,
          }),
        );
      }}
    >
      <InputField label="Titel" value={values.title} onChange={(event) => set({ title: event.target.value })} error={errors.title} required placeholder="z. B. Wohnen und Essen, EG" />
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Kunde"
          value={values.customerId}
          onChange={(event) => set({ customerId: event.target.value })}
          placeholder="– ohne –"
          options={data.customers.map((item) => ({ value: item.id, label: item.label }))}
        />
        <SelectField
          label="Projekt"
          value={values.projectId}
          onChange={(event) => {
            const project = data.projects.find((item) => item.id === event.target.value);
            set({ projectId: event.target.value, customerId: values.customerId || project?.customerId || "" });
          }}
          placeholder="– ohne –"
          options={projects.map((item) => ({ value: item.id, label: item.label }))}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="Holz / Belag" value={values.wood} onChange={(event) => set({ wood: event.target.value })} placeholder="z. B. Eiche Landhausdiele" />
        <InputField label="Oberfläche" value={values.surface} onChange={(event) => set({ surface: event.target.value })} placeholder="z. B. geölt" />
        <InputField label="Charge" value={values.batch} onChange={(event) => set({ batch: event.target.value })} />
        <InputField label="Fläche" value={values.areaM2} onChange={(event) => set({ areaM2: event.target.value })} suffix="m²" inputMode="decimal" />
        <InputField label="Verlegt am" type="date" value={values.installedAt} onChange={(event) => set({ installedAt: event.target.value })} error={errors.installedAt} />
        <InputField label="Nächste Pflege" type="date" value={values.nextCareAt} onChange={(event) => set({ nextCareAt: event.target.value })} error={errors.nextCareAt} hint="Erscheint 30 Tage vorher in der Übersicht." />
      </div>
      <TextAreaField label="Pflegeplan" value={values.carePlan} onChange={(event) => set({ carePlan: event.target.value })} placeholder="z. B. alle 1–2 Wochen nebelfeucht wischen, alle 2 Jahre nachölen" />
      <TextAreaField label="Notiz" value={values.notes} onChange={(event) => set({ notes: event.target.value })} />
    </FormShell>
  );
}

// ---- Tool ----------------------------------------------------------------------------------------

function ToolForm({ data }: { data: Extract<EntityForm, { entity: "tool" }> }) {
  const record = data.record;
  const [values, setValues] = useState({
    name: record?.name ?? "",
    category: record?.category ?? "",
    status: record?.status ?? "verfuegbar",
    notes: record?.notes ?? "",
    sortOrder: String(record?.sortOrder ?? 0),
  });
  const { pending, errors, message, save } = useSave<{ id: string }>("tool");
  const set = (patch: Partial<typeof values>) => setValues((current) => ({ ...current, ...patch }));
  return (
    <FormShell
      eyebrow="Werkzeug"
      heading={record ? "Werkzeug bearbeiten" : "Werkzeug anlegen"}
      pending={pending}
      message={message}
      onSubmit={() =>
        save(() =>
          saveTool({ id: record?.id ?? null, name: values.name, category: values.category, status: values.status as ToolInput["status"], notes: values.notes, sortOrder: Number(values.sortOrder) || 0 }),
        )
      }
    >
      <InputField label="Name" value={values.name} onChange={(event) => set({ name: event.target.value })} error={errors.name} required placeholder="z. B. Unterschnittsäge" />
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="Kategorie" value={values.category} onChange={(event) => set({ category: event.target.value })} placeholder="z. B. Sägen" />
        <SelectField label="Status" value={values.status} onChange={(event) => set({ status: event.target.value })} options={options(TOOL_STATUSES)} />
      </div>
      <InputField label="Reihenfolge" type="number" min={0} value={values.sortOrder} onChange={(event) => set({ sortOrder: event.target.value })} hint="Kleinere Zahlen stehen weiter oben." />
      <TextAreaField label="Notiz" value={values.notes} onChange={(event) => set({ notes: event.target.value })} placeholder="Zustand, Zubehör, nächste Wartung" />
    </FormShell>
  );
}

// ---- Subscription --------------------------------------------------------------------------------

function SubscriptionForm({ data, prefill }: { data: Extract<EntityForm, { entity: "subscription" }>; prefill: EntityPrefill }) {
  const record = data.record;
  const [values, setValues] = useState({
    plan: record?.plan ?? (str(prefill.plan) || "boden-pass-plus"),
    customerId: record?.customerId ?? str(prefill.customerId),
    status: record?.status ?? "aktiv",
    startedAt: record?.startedAt ?? todayKey(),
    minTermMonths: str(record?.minTermMonths ?? ""),
    areaM2: numberText(record?.areaM2),
    notes: record?.notes ?? "",
  });
  const { pending, errors, message, save } = useSave<{ id: string }>("subscription");
  const set = (patch: Partial<typeof values>) => setValues((current) => ({ ...current, ...patch }));
  const plan = planByKey(values.plan);
  const defaultTerm = data.minTermMonths[values.plan];
  const term = values.minTermMonths ? Number(values.minTermMonths) : defaultTerm ?? null;
  const warnings: Warning[] = [];
  if (plan?.private && term !== null && term > MAX_PRIVATE_MIN_TERM_MONTHS) {
    warnings.push({ level: "crit", code: "term", message: `Für Privatkunden höchstens ${MAX_PRIVATE_MIN_TERM_MONTHS} Monate Erstlaufzeit, danach monatlich kündbar.` });
  }
  if (plan?.usesSlot && values.status === "aktiv") {
    const used = data.slotsUsedByOthers + 1;
    warnings.push(
      used > data.slotsTotal
        ? { level: "warn", code: "slots", message: `Abo-Plätze voll: ${used} von ${data.slotsTotal}. Vor-Ort-Zeit geht vom Projektbudget ab.` }
        : { level: "ok", code: "slots", message: `Belegt danach ${used} von ${data.slotsTotal} Abo-Plätzen.` },
    );
  } else if (plan && !plan.usesSlot) {
    warnings.push({ level: "info", code: "remote", message: "Läuft remote und zählt nicht auf die Abo-Plätze." });
  }
  if (plan?.status === "geplant") warnings.push({ level: "info", code: "planned", message: `${plan.name} ist noch in Planung und nicht auf der Website.` });
  return (
    <FormShell
      eyebrow="Abos"
      heading={record ? "Abo bearbeiten" : "Abo anlegen"}
      pending={pending}
      message={message}
      onSubmit={() => {
        const area = parseNumber(values.areaM2);
        save(() =>
          saveSubscription({
            id: record?.id ?? null,
            plan: values.plan as SubscriptionInput["plan"],
            customerId: values.customerId || null,
            status: values.status as SubscriptionInput["status"],
            startedAt: values.startedAt,
            minTermMonths: values.minTermMonths ? Number(values.minTermMonths) : null,
            areaM2: area === null || Number.isNaN(area) ? null : area,
            notes: values.notes,
          }),
        );
      }}
    >
      <SelectField
        label="Abo"
        value={values.plan}
        onChange={(event) => set({ plan: event.target.value })}
        options={SUBSCRIPTION_PLANS.map((item) => ({ value: item.key, label: `${item.name}${item.status === "geplant" ? " (geplant)" : ""}` }))}
        hint={plan?.audience}
      />
      <SelectField
        label="Kunde"
        value={values.customerId}
        onChange={(event) => set({ customerId: event.target.value })}
        placeholder="– ohne –"
        options={data.customers.map((item) => ({ value: item.id, label: item.label }))}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label="Status" value={values.status} onChange={(event) => set({ status: event.target.value })} options={options(SUBSCRIPTION_STATUSES)} />
        <InputField label="Start" type="date" value={values.startedAt} onChange={(event) => set({ startedAt: event.target.value })} error={errors.startedAt} />
        <InputField
          label="Mindestlaufzeit"
          type="number"
          min={0}
          max={60}
          value={values.minTermMonths}
          onChange={(event) => set({ minTermMonths: event.target.value })}
          suffix="Mon."
          placeholder={defaultTerm !== undefined ? String(defaultTerm) : ""}
          hint={defaultTerm !== undefined ? `Leer = Standard aus den Preisen (${defaultTerm} Monate).` : undefined}
          error={errors.minTermMonths}
        />
        <InputField label="Fläche" value={values.areaM2} onChange={(event) => set({ areaM2: event.target.value })} suffix="m²" inputMode="decimal" />
      </div>
      <WarningList warnings={warnings} />
      <TextAreaField label="Notiz" value={values.notes} onChange={(event) => set({ notes: event.target.value })} />
    </FormShell>
  );
}

// ---- Partner -------------------------------------------------------------------------------------

function PartnerForm({ data }: { data: Extract<EntityForm, { entity: "partner" }> }) {
  const record = data.record;
  const [values, setValues] = useState({
    company: record?.company ?? "",
    contactName: record?.contactName ?? "",
    email: record?.email ?? "",
    phone: record?.phone ?? "",
    trade: record?.trade ?? "",
    region: record?.region ?? "",
    isMasterPartner: record?.isMasterPartner ?? false,
    status: record?.status ?? "bewerbung",
    notes: record?.notes ?? "",
  });
  const { pending, errors, message, save } = useSave<{ id: string }>("partner");
  const set = (patch: Partial<typeof values>) => setValues((current) => ({ ...current, ...patch }));
  return (
    <FormShell
      eyebrow="Partner"
      heading={record ? "Partner bearbeiten" : "Partner anlegen"}
      pending={pending}
      message={message}
      onSubmit={() => save(() => savePartner({ id: record?.id ?? null, ...values, status: values.status as PartnerInput["status"] }))}
    >
      <InputField label="Betrieb" value={values.company} onChange={(event) => set({ company: event.target.value })} error={errors.company} required maxLength={120} />
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="Ansprechpartner" value={values.contactName} onChange={(event) => set({ contactName: event.target.value })} />
        <InputField label="Gewerk" value={values.trade} onChange={(event) => set({ trade: event.target.value })} placeholder="z. B. Parkettleger" />
        <InputField label="E-Mail" type="email" value={values.email} onChange={(event) => set({ email: event.target.value })} error={errors.email} />
        <InputField label="Telefon" type="tel" value={values.phone} onChange={(event) => set({ phone: event.target.value })} />
        <InputField label="Region" value={values.region} onChange={(event) => set({ region: event.target.value })} className="sm:col-span-2" />
      </div>
      <SelectField label="Status" value={values.status} onChange={(event) => set({ status: event.target.value })} options={options(PARTNER_STATUSES)} />
      <CheckboxField
        label="Parkettleger-Meisterbetrieb"
        hint="Ein aktiver Meisterbetrieb schaltet die Leistungen mit Meisterpflicht auf der Website frei."
        checked={values.isMasterPartner}
        onChange={(isMasterPartner) => set({ isMasterPartner })}
      />
      {values.isMasterPartner && values.status === "aktiv" ? (
        <Banner tone="ok" icon={Info}>
          Nach dem Speichern erscheinen „Parkett schleifen und versiegeln“ und „Massiv- und Stabparkett“ auf der Website.
        </Banner>
      ) : null}
      <TextAreaField label="Notiz" value={values.notes} onChange={(event) => set({ notes: event.target.value })} />
    </FormShell>
  );
}

// ---- Office hour ---------------------------------------------------------------------------------

function OfficeHourForm({ data, prefill }: { data: Extract<EntityForm, { entity: "officeHour" }>; prefill: EntityPrefill }) {
  const record = data.record;
  const initialDate = record ? berlinDateKey(record.startsAt) : str(prefill.date) || todayKey();
  const [values, setValues] = useState({
    date: initialDate,
    time: record ? berlinTime(record.startsAt) : str(prefill.time) || data.defaultTime,
    durationMinutes: String(record?.durationMinutes ?? data.defaultDuration),
    topic: record?.topic ?? "",
    status: record?.status ?? "geplant",
  });
  const [topicTouched, setTopicTouched] = useState(Boolean(record));
  const { pending, errors, message, save } = useSave<{ id: string }>("officeHour");
  const set = (patch: Partial<typeof values>) => setValues((current) => ({ ...current, ...patch }));
  const { year, month } = parseDateKey(values.date || todayKey());
  const topic = topicTouched ? values.topic : defaultOfficeHourTopic(year, month);
  return (
    <FormShell
      eyebrow="Sprechstunde"
      heading={record ? "Sprechstunde bearbeiten" : "Sprechstunde anlegen"}
      pending={pending}
      message={message}
      onSubmit={() =>
        save(() =>
          saveOfficeHour({ id: record?.id ?? null, date: values.date, time: values.time, durationMinutes: Number(values.durationMinutes) || 45, topic, status: values.status as OfficeHourInput["status"] }),
        )
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <InputField label="Datum" type="date" value={values.date} onChange={(event) => set({ date: event.target.value })} error={errors.date} className="col-span-2 sm:col-span-1" />
        <InputField label="Uhrzeit" type="time" value={values.time} onChange={(event) => set({ time: event.target.value })} error={errors.time} />
        <InputField label="Dauer" type="number" min={15} max={180} step={5} value={values.durationMinutes} onChange={(event) => set({ durationMinutes: event.target.value })} suffix="min" error={errors.durationMinutes} />
      </div>
      <InputField
        label="Thema"
        value={topic}
        onChange={(event) => {
          setTopicTouched(true);
          set({ topic: event.target.value });
        }}
        error={errors.topic}
        hint={topicTouched ? undefined : "Vorschlag aus dem Sprechstunden-Plan."}
      />
      <SelectField label="Status" value={values.status} onChange={(event) => set({ status: event.target.value })} options={options(OFFICE_HOUR_STATUSES)} />
    </FormShell>
  );
}

// ---- Rental --------------------------------------------------------------------------------------

function RentalForm({ data }: { data: Extract<EntityForm, { entity: "rental" }> }) {
  const { showSaved } = useWerkbank();
  const { pending, run } = useAction();
  const today = todayKey();
  const [values, setValues] = useState({
    toolId: data.toolId ?? data.tools[0]?.id ?? "",
    customerId: "",
    fromDate: today,
    fromTime: "11:00",
    toDate: today,
    toTime: "11:00",
    notes: "",
    handovers: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Warning[] | null>(null);
  const set = (patch: Partial<typeof values>) => {
    setValues((current) => ({ ...current, ...patch }));
    setConflicts(null);
  };
  function submit(confirmed: boolean) {
    setErrors({});
    setMessage(null);
    run(
      () => planRental({ ...values, customerId: values.customerId || null, confirmed }),
      (result) => {
        if (result.data) showSaved({ kind: "event", id: result.data.id });
      },
      (result) => {
        if (result.needsConfirm) {
          setConflicts(result.warnings ?? []);
          return;
        }
        setErrors(result.fieldErrors ?? {});
        setMessage(result.message);
      },
    );
  }
  if (data.tools.length === 0) {
    return (
      <div className="p-5">
        <h2 data-drawer-title tabIndex={-1} className="font-display text-xl font-semibold outline-none">
          Verleih planen
        </h2>
        <p className="mt-2 text-sm text-studio-muted">Leg zuerst ein Werkzeug an, dann kannst du Ausgabe und Rückgabe planen.</p>
      </div>
    );
  }
  return (
    <FormShell
      eyebrow="Werkzeug"
      heading="Ausgabe und Rückgabe planen"
      pending={pending}
      message={message}
      submitLabel="Verleih eintragen"
      onSubmit={() => submit(false)}
      footer={
        conflicts ? (
          <div role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
            <p className="font-medium">Trotzdem eintragen?</p>
            <ul className="mt-1 list-disc pl-5 text-red-100/85">
              {conflicts.map((warning) => (
                <li key={warning.message}>{warning.message}</li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <Button variant="danger" pending={pending} onClick={() => submit(true)}>
                Trotzdem eintragen
              </Button>
              <Button onClick={() => setConflicts(null)}>Zurück</Button>
            </div>
          </div>
        ) : null
      }
    >
      <SelectField label="Werkzeug" value={values.toolId} onChange={(event) => set({ toolId: event.target.value })} options={data.tools.map((item) => ({ value: item.id, label: item.label }))} />
      <SelectField
        label="Kunde"
        value={values.customerId}
        onChange={(event) => set({ customerId: event.target.value })}
        placeholder="– ohne –"
        options={data.customers.map((item) => ({ value: item.id, label: item.label }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Ausgabe am" type="date" value={values.fromDate} onChange={(event) => set({ fromDate: event.target.value, toDate: values.toDate < event.target.value ? event.target.value : values.toDate })} error={errors.fromDate} />
        <InputField label="Ausgabe um" type="time" value={values.fromTime} onChange={(event) => set({ fromTime: event.target.value })} />
        <InputField label="Rückgabe am" type="date" value={values.toDate} min={values.fromDate} onChange={(event) => set({ toDate: event.target.value })} error={errors.toDate} />
        <InputField label="Rückgabe um" type="time" value={values.toTime} onChange={(event) => set({ toTime: event.target.value })} />
      </div>
      <CheckboxField
        label="Übergabe-Termine im Kalender anlegen"
        hint="Legt je 30 Minuten für Ausgabe und Rückgabe an; Konflikte mit Urlaub und Feiertagen werden geprüft."
        checked={values.handovers}
        onChange={(handovers) => set({ handovers })}
      />
      <TextAreaField label="Notiz" value={values.notes} onChange={(event) => set({ notes: event.target.value })} placeholder="Zubehör, Kaution, Einweisung" />
    </FormShell>
  );
}
