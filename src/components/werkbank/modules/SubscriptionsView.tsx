"use client";

import { Check, Plus, Repeat, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { formatDateKey } from "@/lib/business/calendar";
import { formatPriceLine, type ServiceItem } from "@/lib/business/services";
import { HOURS_PER_SUBSCRIPTION_YEAR, MAX_PRIVATE_MIN_TERM_MONTHS, SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUSES } from "@/lib/business/subscriptions";
import { labelOf, WERKBANK_PATH } from "@/lib/werkbank/constants";
import { formatHours } from "@/lib/werkbank/format";
import { useWerkbank } from "../context";
import { Badge, Banner, Button, Card, cx } from "../ui";

export interface SubscriptionRowView {
  id: string;
  plan: string;
  status: string;
  customerName: string | null;
  startedAt: string | null;
  minTermMonths: number | null;
}

export function SubscriptionsView({
  subscriptions,
  services,
  settings,
  used,
}: {
  subscriptions: SubscriptionRowView[];
  services: ServiceItem[];
  settings: {
    subscriptionSlots: number;
    minTermMonths: Record<string, number>;
    vatPercent: number;
    discountPercent: number | null;
    repairsPerYear: number;
    repairMaxSize: string;
    oilingIntervalYears: number;
  };
  used: number;
}) {
  const { open } = useWerkbank();
  const total = settings.subscriptionSlots;
  const active = subscriptions.filter((item) => item.status === "aktiv");
  const plus = active.filter((item) => item.plan === "boden-pass-plus").length;
  const rundum = active.filter((item) => item.plan === "rundum-sorglos").length;
  const scale = Math.max(total, used, 1);

  return (
    <div className="mt-6 space-y-5">
      <Card title="Abo-Plätze (Vor-Ort-Abos)" icon={Repeat} action={<Badge tone={used > total ? "crit" : "neutral"}>{`${used} von ${total}`}</Badge>}>
        <div className="flex h-3 overflow-hidden rounded-full bg-white/[0.07]" role="img" aria-label={`${plus} Boden-Pass Plus, ${rundum} Rundum-sorglos, ${Math.max(0, total - used)} frei`}>
          <div className="h-full bg-emerald-300/85" style={{ width: `${(plus / scale) * 100}%` }} />
          <div className="h-full bg-[#B7AEFF]" style={{ width: `${(rundum / scale) * 100}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-studio-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-emerald-300/85" aria-hidden /> Boden-Pass Plus · {plus}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[#B7AEFF]" aria-hidden /> Rundum-sorglos · {rundum}
          </span>
          <span>frei · {Math.max(0, total - used)}</span>
        </div>
        <p className="mt-3 text-sm text-studio-muted">
          Jedes Vor-Ort-Abo kostet etwa {formatHours(HOURS_PER_SUBSCRIPTION_YEAR)} h pro Jahr (Nachölen alle {settings.oilingIntervalYears} Jahre plus Ausbesserungen und
          Anfahrt). Voll belegt: {total} × {formatHours(HOURS_PER_SUBSCRIPTION_YEAR)} h ≈ {formatHours(total * HOURS_PER_SUBSCRIPTION_YEAR)} h pro Jahr. Aktuell gebunden:{" "}
          <span className="font-mono tabular-nums text-studio-text">≈ {formatHours(used * HOURS_PER_SUBSCRIPTION_YEAR)} h</span>. Pflege- und Nachöltermine gehören in
          Halbtags-Wochen.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const service = services.find((item) => item.id === plan.serviceId);
          const priceLine = service ? formatPriceLine(service.priceCents, service.priceType, { vatPercent: settings.vatPercent, gross: plan.private }) : null;
          const planSubs = subscriptions.filter((item) => item.plan === plan.key);
          const minTerm = settings.minTermMonths[plan.key];
          const termTooLong = plan.private && minTerm !== undefined && minTerm > MAX_PRIVATE_MIN_TERM_MONTHS;
          return (
            <section key={plan.key} className={cx("flex flex-col rounded-2xl border bg-studio-panel p-4", plan.status === "geplant" ? "border-dashed border-studio-line" : "border-studio-line")}>
              <header className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-semibold">{plan.name}</h2>
                  <p className="text-xs text-studio-muted">{plan.audience}</p>
                </div>
                <Badge tone={plan.status === "aktiv" ? "ok" : "warn"}>{plan.status === "aktiv" ? "aktiv" : "geplant"}</Badge>
              </header>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge>{plan.private ? "Privat (B2C)" : "Gewerbe (B2B)"}</Badge>
                {plan.usesSlot ? <Badge tone="oak">zählt auf Abo-Plätze</Badge> : <Badge>remote, kein Abo-Platz</Badge>}
              </div>
              <p className="mt-3 text-sm italic text-studio-muted">„{plan.pitch}“</p>
              <ul className="mt-3 space-y-1 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-300" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>
              {plan.key === "boden-pass-plus" ? (
                <p className="mt-3 text-xs text-studio-muted">
                  {settings.repairsPerYear} Ausbesserungen pro Jahr · max. Größe: {settings.repairMaxSize || "nicht festgelegt"} · Abo-Rabatt auf die Verlegung:{" "}
                  {settings.discountPercent ? `${settings.discountPercent} %` : "nicht gesetzt"}{" "}
                  <Link href={`${WERKBANK_PATH}/preise#abo-konditionen`} className="text-oak-light underline-offset-2 hover:underline">
                    bearbeiten
                  </Link>
                </p>
              ) : null}
              <div className="mt-3 rounded-xl bg-white/[0.03] p-3 text-sm">
                <p>
                  Preis: {priceLine ? <span className="font-mono tabular-nums">{priceLine}</span> : <span className="text-studio-muted">nicht gesetzt, auf der Website ohne Preiszeile</span>}
                  {priceLine ? <span className="text-xs text-studio-muted"> ({plan.private ? "brutto" : "netto"})</span> : null}
                </p>
                <p className="mt-0.5">
                  Mindestlaufzeit: <span className="font-mono tabular-nums">{minTerm !== undefined ? `${minTerm} Monate` : "–"}</span>
                </p>
                {termTooLong ? (
                  <Banner tone="crit" icon={TriangleAlert} className="mt-2">
                    Privatkunden: höchstens {MAX_PRIVATE_MIN_TERM_MONTHS} Monate Erstlaufzeit, danach monatlich kündbar.
                  </Banner>
                ) : null}
              </div>
              <div className="mt-3 flex-1">
                <p className="text-xs font-medium text-studio-muted">
                  {planSubs.length === 0 ? "Noch keine Verträge" : `${planSubs.length} ${planSubs.length === 1 ? "Vertrag" : "Verträge"}`}
                </p>
                {planSubs.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={`Verträge ${plan.name}`}>
                    {planSubs.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => open({ type: "record", ref: { kind: "subscription", id: item.id } })}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-studio-line px-2 py-1 text-xs hover:border-oak/40"
                        >
                          <span className="font-medium">{item.customerName ?? "ohne Kunde"}</span>
                          <span className={item.status === "aktiv" ? "text-emerald-300" : "text-studio-muted"}>
                            {labelOf(SUBSCRIPTION_STATUSES, item.status)}
                            {item.startedAt ? ` · ab ${formatDateKey(item.startedAt, false)}` : ""}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <Button size="sm" icon={Plus} className="mt-4 w-fit" onClick={() => open({ type: "entityForm", entity: "subscription", prefill: { plan: plan.key } })}>
                {plan.name} anlegen
              </Button>
            </section>
          );
        })}
      </div>
      <p className="text-xs text-studio-muted">
        Rechtliches: Für Privatkunden höchstens {MAX_PRIVATE_MIN_TERM_MONTHS} Monate Erstlaufzeit, danach monatlich kündbar. Bei Online-Abschluss sind ein Kündigungsbutton und 14
        Tage Widerrufsrecht Pflicht. Formuliert als Pflege- und Wartungsvertrag, nicht als Versicherung oder Garantie.
      </p>
    </div>
  );
}
