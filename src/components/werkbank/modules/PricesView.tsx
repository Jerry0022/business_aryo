"use client";

import { Eye, EyeOff, Info, Plus, RotateCcw, Save, Tag, Ticket, Trash2, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import {
  DEFAULT_SERVICE_IDS,
  defaultServices,
  isServiceShown,
  PRICE_TYPES,
  publicPriceLine,
  SERVICE_GROUPS,
  subscriptionDiscountLine,
  type ServiceItem,
} from "@/lib/business/services";
import type { Settings } from "@/lib/business/settings";
import { MAX_PRIVATE_MIN_TERM_MONTHS, SUBSCRIPTION_PLANS } from "@/lib/business/subscriptions";
import { createService, resetService, saveServices, saveSettingsSection } from "@/lib/werkbank/actions/settings";
import { centsToInput, parseEuroInput } from "@/lib/werkbank/format";
import { CheckboxField, InputField, inputClass, Toggle } from "../fields";
import { useAction } from "../hooks";
import { Badge, Banner, Button, Card, cx } from "../ui";

const DEFAULTS = new Map(defaultServices().map((item) => [item.id, item]));

function differsFromDefault(item: ServiceItem): boolean {
  const base = DEFAULTS.get(item.id);
  if (!base) return true;
  return (
    base.title !== item.title ||
    base.description !== item.description ||
    base.priceType !== item.priceType ||
    base.priceCents !== item.priceCents ||
    base.visible !== item.visible ||
    base.requiresMasterPartner !== item.requiresMasterPartner ||
    base.sortOrder !== item.sortOrder
  );
}

interface Row extends ServiceItem {
  priceText: string;
}

function toRow(item: ServiceItem): Row {
  return { ...item, priceText: centsToInput(item.priceCents) };
}

export function ServiceCatalogEditor({ services, settings, hasMasterPartner }: { services: ServiceItem[]; settings: Settings; hasMasterPartner: boolean }) {
  const { pending, run } = useAction();
  const [rows, setRows] = useState<Row[]>(() => services.map(toRow));
  const [gross, setGross] = useState(true);
  const [previewGroup, setPreviewGroup] = useState<string>(SERVICE_GROUPS[0].key);
  const [newTitles, setNewTitles] = useState<Record<string, string>>({});
  const original = useMemo(() => new Map(services.map((item) => [item.id, item])), [services]);

  const parsed = rows.map((row) => ({ row, cents: parseEuroInput(row.priceText) }));
  const invalid = new Set(parsed.filter((item) => item.cents === undefined).map((item) => item.row.id));
  const current: ServiceItem[] = parsed.map(({ row, cents }) => {
    const { priceText: _ignored, ...item } = row;
    void _ignored;
    return { ...item, priceCents: cents === undefined ? row.priceCents : cents };
  });
  const dirty = current.filter((item) => {
    const before = original.get(item.id);
    return !before || JSON.stringify(before) !== JSON.stringify(item);
  });
  const priceOptions = { vatPercent: settings.pricing.vatPercent, gross };
  const setCount = current.filter((item) => item.priceCents !== null).length;

  const update = (id: string, patch: Partial<Row>) => setRows((list) => list.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  function status(item: ServiceItem): { text: string; tone: "ok" | "neutral" | "warn" } {
    if (!item.visible) return { text: "ausgeblendet", tone: "neutral" };
    if (item.requiresMasterPartner && !hasMasterPartner) return { text: "ausgeblendet: benötigt aktiven Meisterpartner", tone: "warn" };
    const line = publicPriceLine(item, { vatPercent: settings.pricing.vatPercent, gross: true });
    return line ? { text: `sichtbar mit Preis: ${line}`, tone: "ok" } : { text: "sichtbar, ohne Preiszeile", tone: "neutral" };
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-studio-line bg-studio-panel px-4 py-3 text-sm">
          <span className="text-studio-muted">
            Eingabe immer <strong className="text-studio-text">netto</strong>. Privatkunden sehen auf der Website brutto inkl. {settings.pricing.vatPercent} % MwSt.
            (Preisangabenverordnung).
          </span>
          <Badge tone={setCount > 0 ? "oak" : "neutral"} className="ml-auto">
            {setCount} von {current.length} Preisen gesetzt
          </Badge>
        </div>

        {SERVICE_GROUPS.map((group) => {
          const groupRows = rows.filter((row) => row.groupKey === group.key);
          return (
            <Card key={group.key} title={group.label} icon={Tag} bodyClassName="" action={<span className="hidden text-xs text-studio-muted md:inline">{group.lead}</span>}>
              <ul className="divide-y divide-studio-line" aria-label={`Leistungen: ${group.label}`}>
                {groupRows.map((row) => {
                  const item = current.find((entry) => entry.id === row.id)!;
                  const state = status(item);
                  const custom = !DEFAULT_SERVICE_IDS.has(row.id);
                  const canReset = custom || differsFromDefault(original.get(row.id) ?? item);
                  return (
                    <li key={row.id} className="space-y-2 px-4 py-3 sm:px-5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <input
                          value={row.title}
                          onChange={(event) => update(row.id, { title: event.target.value })}
                          aria-label={`Titel der Leistung ${row.title}`}
                          maxLength={160}
                          className="min-w-[14rem] flex-1 rounded-lg border border-transparent bg-transparent px-1.5 py-1 font-medium outline-none hover:border-studio-line focus:border-oak"
                        />
                        {row.requiresMasterPartner ? <Badge tone="warn">benötigt Meisterpartner</Badge> : null}
                        {custom ? <Badge tone="info">eigene Leistung</Badge> : null}
                        {row.id === "verlegung" ? <Badge tone="oak">Abo-Rabatt</Badge> : null}
                      </div>
                      <textarea
                        value={row.description}
                        onChange={(event) => update(row.id, { description: event.target.value })}
                        aria-label={`Beschreibung der Leistung ${row.title}`}
                        rows={2}
                        maxLength={600}
                        className="w-full resize-y rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-sm text-studio-muted outline-none hover:border-studio-line focus:border-oak focus:text-studio-text"
                      />
                      <div className="grid grid-cols-2 items-end gap-3 px-1.5 sm:grid-cols-[10rem_9rem_minmax(0,1fr)]">
                        <label className="text-xs font-medium text-studio-muted">
                          Preisart
                          <select
                            value={row.priceType}
                            onChange={(event) => update(row.id, { priceType: event.target.value as ServiceItem["priceType"] })}
                            aria-label={`Preisart für ${row.title}`}
                            className={cx(inputClass, "mt-1 h-10")}
                          >
                            {PRICE_TYPES.map((type) => (
                              <option key={type.key} value={type.key}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-xs font-medium text-studio-muted">
                          Preis netto
                          <span className="relative mt-1 block">
                            <input
                              value={row.priceText}
                              onChange={(event) => update(row.id, { priceText: event.target.value })}
                              aria-label={`Preis netto für ${row.title}`}
                              aria-invalid={invalid.has(row.id) ? true : undefined}
                              inputMode="decimal"
                              placeholder="–"
                              className={cx(inputClass, "h-10 pr-7 text-right tabular-nums")}
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-2.5 grid place-items-center text-xs">€</span>
                          </span>
                        </label>
                        <p className={cx("col-span-2 pb-2 text-xs sm:col-span-1", state.tone === "ok" ? "text-emerald-300" : state.tone === "warn" ? "text-amber-300" : "text-studio-muted")}>
                          Website: {state.text}
                        </p>
                      </div>
                      {invalid.has(row.id) ? <p className="px-1.5 text-xs text-red-300">Bitte als Betrag eingeben, z. B. 89 oder 38,50.</p> : null}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1.5">
                        <Toggle label="Sichtbar" checked={row.visible} onChange={(visible) => update(row.id, { visible })} />
                        <CheckboxField
                          label="benötigt Meisterpartner"
                          checked={row.requiresMasterPartner}
                          onChange={(requiresMasterPartner) => update(row.id, { requiresMasterPartner })}
                        />
                        <label className="flex items-center gap-1.5 text-xs text-studio-muted">
                          Sortierung
                          <input
                            type="number"
                            min={0}
                            value={row.sortOrder}
                            onChange={(event) => update(row.id, { sortOrder: Math.max(0, Number(event.target.value) || 0) })}
                            className="w-16 rounded-lg border border-studio-line bg-studio-bg px-2 py-1 text-xs tabular-nums text-studio-text"
                          />
                        </label>
                        {canReset ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={custom ? Trash2 : RotateCcw}
                            pending={pending}
                            onClick={() => run(() => resetService(row.id))}
                            className={cx("ml-auto", custom && "text-red-300")}
                          >
                            {custom ? "Löschen" : "auf Standard zurücksetzen"}
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <form
                className="flex gap-2 border-t border-studio-line px-4 py-3 sm:px-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  const title = (newTitles[group.key] ?? "").trim();
                  if (!title) return;
                  run(() => createService(group.key, title), () => setNewTitles((current) => ({ ...current, [group.key]: "" })));
                }}
              >
                <input
                  value={newTitles[group.key] ?? ""}
                  onChange={(event) => setNewTitles((current) => ({ ...current, [group.key]: event.target.value }))}
                  placeholder="Eigene Leistung hinzufügen …"
                  aria-label={`Eigene Leistung in ${group.label}`}
                  maxLength={160}
                  className={inputClass}
                />
                <Button type="submit" icon={Plus} disabled={!(newTitles[group.key] ?? "").trim()} pending={pending}>
                  Hinzufügen
                </Button>
              </form>
            </Card>
          );
        })}

        {dirty.length > 0 || invalid.size > 0 ? (
          <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-oak/40 bg-studio-panel/95 px-4 py-3 shadow-2xl backdrop-blur">
            <span className="text-sm">
              <span className="font-mono tabular-nums">{dirty.length}</span> {dirty.length === 1 ? "Leistung geändert" : "Leistungen geändert"}
              {invalid.size > 0 ? <span className="ml-2 text-red-300">· {invalid.size} Preis ungültig</span> : null}
            </span>
            <div className="ml-auto flex gap-2">
              <Button onClick={() => setRows(services.map(toRow))}>Verwerfen</Button>
              <Button
                variant="primary"
                icon={Save}
                pending={pending}
                disabled={invalid.size > 0 || dirty.length === 0}
                onClick={() => run(() => saveServices(dirty))}
              >
                Änderungen speichern
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-5 xl:sticky xl:top-4 xl:self-start">
        <section className="overflow-hidden rounded-2xl border border-studio-line bg-studio-panel" aria-label="Website-Vorschau">
          <header className="flex flex-wrap items-center gap-2 border-b border-studio-line px-4 py-3">
            <h2 className="mr-auto text-sm font-semibold">So sieht&apos;s auf der Website aus</h2>
            <div role="group" aria-label="Preisanzeige" className="inline-flex rounded-lg border border-studio-line p-0.5 text-xs">
              <button type="button" aria-pressed={gross} onClick={() => setGross(true)} className={cx("rounded-md px-2 py-1", gross ? "bg-white/10 text-white" : "text-studio-muted")}>
                Website · brutto
              </button>
              <button type="button" aria-pressed={!gross} onClick={() => setGross(false)} className={cx("rounded-md px-2 py-1", !gross ? "bg-white/10 text-white" : "text-studio-muted")}>
                Partner · netto
              </button>
            </div>
          </header>
          <div className="flex gap-1 overflow-x-auto border-b border-studio-line px-3 py-2">
            {SERVICE_GROUPS.map((group) => (
              <button
                key={group.key}
                type="button"
                aria-pressed={previewGroup === group.key}
                onClick={() => setPreviewGroup(group.key)}
                className={cx("shrink-0 rounded-md px-2.5 py-1 text-xs font-medium", previewGroup === group.key ? "bg-creme text-nuss" : "text-studio-muted hover:text-studio-text")}
              >
                {group.label}
              </button>
            ))}
          </div>
          <div className="bg-creme p-4 text-nuss">
            {(() => {
              const group = SERVICE_GROUPS.find((item) => item.key === previewGroup)!;
              const shown = current.filter((item) => item.groupKey === group.key && isServiceShown(item, hasMasterPartner));
              const hidden = current.filter((item) => item.groupKey === group.key && !isServiceShown(item, hasMasterPartner));
              return (
                <>
                  <p className="font-display text-lg font-semibold">{group.label}</p>
                  <p className="text-sm text-nuss-muted">{group.lead}</p>
                  <ul className="mt-3 divide-y divide-fuge">
                    {shown.map((item) => {
                      const line = publicPriceLine(item, priceOptions);
                      const discount = item.id === "verlegung" ? subscriptionDiscountLine(item, settings.pricing.subscriptionDiscountPercent, priceOptions) : null;
                      return (
                        <li key={item.id} className="py-2.5">
                          <p className="font-semibold">{item.title}</p>
                          <p className="text-sm text-nuss-muted">{item.description}</p>
                          {line ? <p className="mt-1 font-mono text-sm font-semibold text-eiche-deep">{line}</p> : null}
                          {discount ? <p className="font-mono text-sm font-semibold text-kupfer-deep">mit Boden-Pass Plus: {discount}</p> : null}
                          {line ? <p className="text-[0.7rem] text-nuss-muted">{gross ? `inkl. ${settings.pricing.vatPercent} % MwSt.` : "zzgl. MwSt."}</p> : null}
                          {item.requiresMasterPartner ? <p className="text-[0.7rem] text-nuss-muted">über meinen Meisterpartner</p> : null}
                        </li>
                      );
                    })}
                  </ul>
                  {shown.length === 0 ? <p className="mt-2 text-sm text-nuss-muted">In dieser Gruppe erscheint gerade nichts.</p> : null}
                  {hidden.length > 0 ? (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-nuss-muted">
                      <EyeOff className="size-3.5" aria-hidden /> ausgeblendet: {hidden.map((item) => item.title).join(", ")}
                    </p>
                  ) : null}
                </>
              );
            })()}
          </div>
          <div className="space-y-1.5 px-4 py-3 text-xs text-studio-muted">
            <p className="flex gap-1.5">
              <Eye className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Eine Leistung wird immer gezeigt, die Preiszeile nur mit gesetztem Preis. Ohne Preis erscheint keine Preiszeile,
              auch kein „Preis auf Anfrage“.
            </p>
            <p className="flex gap-1.5">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Leistungen mit Meisterpflicht bleiben ausgeblendet, solange kein aktiver Meisterpartner eingetragen ist ({hasMasterPartner ? "aktuell: aktiv" : "aktuell: keiner"}).
            </p>
            <p className="flex gap-1.5">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden /> „mit Boden-Pass Plus“ erscheint nur, wenn Verlegepreis und Abo-Rabatt gesetzt sind.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

// ---- Voucher and subscription conditions ------------------------------------------------------

export function VoucherSettings({ voucher, vatPercent }: { voucher: Settings["voucher"]; vatPercent: number }) {
  const { pending, run } = useAction();
  const [value, setValue] = useState(centsToInput(voucher.valueCents));
  const [validDays, setValidDays] = useState(String(voucher.validDays));
  const [minArea, setMinArea] = useState(String(voucher.minAreaM2));
  const [conditions, setConditions] = useState(voucher.conditions);
  const cents = parseEuroInput(value);
  const labels: [keyof Settings["voucher"]["conditions"], string][] = [
    ["liveOrRecording", "Live in der Sprechstunde oder Aufzeichnung innerhalb von 72 h ganz gesehen"],
    ["floorCheckAndPhotos", "Boden-Check ausgefüllt und 3 Raumfotos"],
    ["inServiceArea", "Projekt im Einzugsgebiet"],
    ["minArea", `Mindestens ${minArea || "?"} m² oder besonderer Boden`],
    ["withinDeadline", `Buchung innerhalb der Frist, solange das Kontingent reicht`],
  ];
  return (
    <Card title="Gutschein für die Erstberatung" icon={Ticket} id="gutschein">
      <p className="text-xs text-studio-muted">Wird in der Sprechstunde ausgestellt und bei Auftrag angerechnet, nur wenn die Bedingungen erfüllt sind.</p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <InputField
          label="Wert netto"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          suffix="€"
          inputMode="decimal"
          placeholder="–"
          error={cents === undefined ? "Ungültiger Betrag" : undefined}
          hint={cents ? `brutto ${centsToInput(Math.round(cents * (1 + vatPercent / 100)))} €` : "leer = kein Gutschein-Hinweis"}
        />
        <InputField label="Frist" type="number" min={1} max={90} value={validDays} onChange={(event) => setValidDays(event.target.value)} suffix="Tage" />
        <InputField label="Mindestfläche" type="number" min={0} max={1000} value={minArea} onChange={(event) => setMinArea(event.target.value)} suffix="m²" />
      </div>
      <fieldset className="mt-4 space-y-2">
        <legend className="mb-1 text-xs font-medium text-studio-muted">Bedingungen (vorab sichtbar auf der Website)</legend>
        {labels.map(([key, label]) => (
          <Toggle key={key} label={label} checked={conditions[key]} onChange={(checked) => setConditions({ ...conditions, [key]: checked })} />
        ))}
      </fieldset>
      <Button
        variant="primary"
        icon={Save}
        className="mt-4"
        pending={pending}
        disabled={cents === undefined}
        onClick={() =>
          run(() =>
            saveSettingsSection("voucher", {
              valueCents: cents ?? null,
              validDays: Number(validDays) || 14,
              minAreaM2: Number(minArea) || 0,
              conditions,
            }),
          )
        }
      >
        Gutschein speichern
      </Button>
    </Card>
  );
}

export function SubscriptionTermsSettings({ pricing, subscriptions }: { pricing: Settings["pricing"]; subscriptions: Settings["subscriptions"] }) {
  const { pending, run } = useAction();
  const [vat, setVat] = useState(String(pricing.vatPercent));
  const [discount, setDiscount] = useState(pricing.subscriptionDiscountPercent === null ? "" : String(pricing.subscriptionDiscountPercent));
  const [repairs, setRepairs] = useState(String(subscriptions.repairsPerYear));
  const [maxSize, setMaxSize] = useState(subscriptions.repairMaxSize);
  const [oiling, setOiling] = useState(String(subscriptions.oilingIntervalYears));
  const [terms, setTerms] = useState<Record<string, string>>(() =>
    Object.fromEntries(SUBSCRIPTION_PLANS.map((plan) => [plan.key, subscriptions.minTermMonths[plan.key] === undefined ? "" : String(subscriptions.minTermMonths[plan.key])])),
  );
  const tooLong = SUBSCRIPTION_PLANS.filter((plan) => plan.private && Number(terms[plan.key]) > MAX_PRIVATE_MIN_TERM_MONTHS);
  return (
    <Card title="Abo-Konditionen und MwSt." icon={Tag} id="abo-konditionen">
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="MwSt." type="number" min={0} max={30} step={0.5} value={vat} onChange={(event) => setVat(event.target.value)} suffix="%" />
        <InputField
          label="Abo-Rabatt auf die Verlegung"
          type="number"
          min={0}
          max={50}
          step={0.5}
          value={discount}
          onChange={(event) => setDiscount(event.target.value)}
          suffix="%"
          placeholder="–"
          hint="mit Boden-Pass Plus zusammen mit dem Projekt"
        />
        <InputField label="Ausbesserungen pro Jahr" type="number" min={0} max={20} value={repairs} onChange={(event) => setRepairs(event.target.value)} />
        <InputField label="Max. Größe je Ausbesserung" value={maxSize} onChange={(event) => setMaxSize(event.target.value)} placeholder="z. B. bis 1 cm²" maxLength={40} />
        <InputField label="Nachölen alle" type="number" min={1} max={10} value={oiling} onChange={(event) => setOiling(event.target.value)} suffix="Jahre" />
      </div>
      <fieldset className="mt-4">
        <legend className="mb-2 text-xs font-medium text-studio-muted">Mindestlaufzeit pro Abo</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <InputField
              key={plan.key}
              label={`${plan.name}${plan.private ? " (privat)" : ""}`}
              type="number"
              min={0}
              max={60}
              value={terms[plan.key] ?? ""}
              onChange={(event) => setTerms({ ...terms, [plan.key]: event.target.value })}
              suffix="Mon."
              error={plan.private && Number(terms[plan.key]) > MAX_PRIVATE_MIN_TERM_MONTHS ? `Privat höchstens ${MAX_PRIVATE_MIN_TERM_MONTHS} Monate` : undefined}
            />
          ))}
        </div>
      </fieldset>
      {tooLong.length > 0 ? (
        <Banner tone="crit" icon={TriangleAlert} className="mt-3">
          Privatkunden: höchstens {MAX_PRIVATE_MIN_TERM_MONTHS} Monate Erstlaufzeit, danach monatlich kündbar (§ 309 Nr. 9 BGB).
        </Banner>
      ) : null}
      <p className="mt-3 text-xs text-studio-muted">
        Privatkunden: Erstlaufzeit höchstens {MAX_PRIVATE_MIN_TERM_MONTHS} Monate, danach monatlich kündbar. Wer online abschließt, braucht einen Kündigungsbutton und hat 14 Tage
        Widerrufsrecht.
      </p>
      <Button
        variant="primary"
        icon={Save}
        className="mt-4"
        pending={pending}
        disabled={tooLong.length > 0}
        onClick={() =>
          run(async () => {
            const first = await saveSettingsSection("pricing", {
              vatPercent: Number(vat) || 0,
              subscriptionDiscountPercent: discount.trim() === "" ? null : Number(discount),
            });
            if (!first.ok) return first;
            return saveSettingsSection("subscriptions", {
              repairsPerYear: Number(repairs) || 0,
              repairMaxSize: maxSize.trim(),
              oilingIntervalYears: Number(oiling) || 2,
              minTermMonths: Object.fromEntries(Object.entries(terms).filter(([, text]) => text.trim() !== "").map(([key, text]) => [key, Number(text)])),
            });
          })
        }
      >
        Konditionen speichern
      </Button>
    </Card>
  );
}
