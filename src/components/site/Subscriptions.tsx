import type { PublicPlan } from "@/lib/business/data";
import type { Settings } from "@/lib/business/settings";
import { countLabel, planFeatures, planTermLine } from "./format";
import { SubscriptionForm } from "./SubscriptionForm";
import { card, CheckIcon, container, eyebrow, SectionHeader } from "./ui";

interface SubscriptionsProps {
  plans: PublicPlan[];
  settings: Settings;
  slots: { total: number; used: number; free: number };
  live: boolean;
}

export function Subscriptions({ plans, settings, slots, live }: SubscriptionsProps) {
  const discount = settings.pricing.subscriptionDiscountPercent;
  return (
    <section id="abos" aria-labelledby="abos-title" className="scroll-mt-16 bg-estrich-deep py-20 sm:py-24 xl:scroll-mt-20">
      <div className={container}>
        <SectionHeader id="abos" label="Abos · Pflege nach Plan" title="Wie die Heizungswartung, nur für deinen Boden.">
          <p>
            Ein Boden hält länger, wenn jemand regelmäßig nach ihm sieht. Das Abo ist ein Pflege- und Wartungsvertrag mit
            festen Terminen, keine Versicherung.
          </p>
        </SectionHeader>

        {live ? (
          <p className="mt-6 inline-flex items-center gap-3 rounded-xs border border-graphit/20 bg-blatt px-4 py-2 text-sm font-semibold text-graphit">
            <span className="size-2 rounded-full bg-kreide" aria-hidden="true" />
            {slots.free > 0
              ? `Noch ${countLabel(slots.free, "Abo-Platz", "Abo-Plätze")} frei`
              : "Alle Abo-Plätze sind gerade vergeben"}
            <span className="font-normal text-graphit-muted">· für Abos mit Terminen vor Ort</span>
          </p>
        ) : null}

        <ul className="mt-10 grid gap-5 lg:grid-cols-3 lg:gap-6">
          {plans.map((plan) => {
            const term = planTermLine(plan);
            const features = planFeatures(plan, settings.subscriptions);
            return (
              <li key={plan.key} className={`${card} flex flex-col gap-4 p-6 sm:p-7`}>
                <p className={`${eyebrow} text-[0.6875rem] text-kreide`}>{plan.private ? "Privat" : "Gewerbe"}</p>
                <div>
                  <h3 className="font-display text-[1.625rem] font-bold leading-tight font-semiwide">{plan.name}</h3>
                  <p className="mt-1 text-sm text-graphit-muted">{plan.audience}</p>
                </div>
                <p className="text-pretty font-medium leading-relaxed text-graphit">{plan.pitch}</p>
                <ul className="flex flex-col gap-2 text-[0.95rem] text-graphit-soft">
                  {features.map((feature) => (
                    <li key={feature} className="flex gap-2.5">
                      <span className="mt-1 text-kreide">
                        <CheckIcon />
                      </span>
                      <span className="text-pretty">{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.key === "boden-pass-plus" ? (
                  <div className="flex flex-col gap-1.5 border-t border-dashed border-strich pt-3 text-sm text-graphit-soft">
                    <p>Gibt es nur zusammen mit einem Projekt.</p>
                    {discount ? (
                      <p>Zusammen mit dem Projekt abgeschlossen: {discount.toLocaleString("de-DE")} % weniger auf die Verlegung.</p>
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-auto flex flex-col gap-1 border-t border-strich pt-4">
                  {plan.priceLine ? <p className="font-mono text-base text-graphit">{plan.priceLine}</p> : null}
                  {term ? <p className="font-mono text-xs uppercase tracking-[0.06em] text-graphit-muted">{term}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 grid gap-8 rounded-xs border border-strich bg-blatt p-6 sm:p-8 lg:grid-cols-[2fr_3fr] lg:gap-12">
          <div className="flex flex-col gap-3">
            <h3 className="font-display text-2xl font-bold font-semiwide">Abo anfragen</h3>
            <p className="text-pretty leading-relaxed text-graphit-soft">
              Schreib mir, um welchen Boden es geht. Ich melde mich mit einem Vorschlag. Abgeschlossen wird erst, wenn du
              alles schwarz auf weiß hast.
            </p>
          </div>
          <SubscriptionForm plans={plans.map((plan) => ({ key: plan.key, name: plan.name }))} />
        </div>
      </div>
    </section>
  );
}
