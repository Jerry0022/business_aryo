"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { submitPartnerApplication, submitProjectApplication } from "@/lib/business/public-actions";
import { PARTNER_NEEDS, PROJECT_ROLES } from "./content";
import { CheckboxField, CheckboxGroup, PublicForm, SelectField, TextAreaField, TextField } from "./forms";
import { container, eyebrow, SectionHeader } from "./ui";

const TABS = [
  { id: "partner", label: "Als Partnerbetrieb", short: "Handwerksbetriebe" },
  { id: "projekt", label: "Großprojekt", short: "Bauherren, Architektur, Verwaltung" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function Professionals({ partnerSlots }: { partnerSlots: number }) {
  const [tab, setTab] = useState<TabId>("partner");
  const baseId = useId();
  const tabRefs = useRef(new Map<TabId, HTMLButtonElement>());

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = TABS.findIndex((item) => item.id === tab);
    let next: number | null = null;
    if (event.key === "ArrowRight") next = (index + 1) % TABS.length;
    if (event.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = TABS.length - 1;
    if (next === null) return;
    event.preventDefault();
    const id = TABS[next]?.id;
    if (!id) return;
    setTab(id);
    tabRefs.current.get(id)?.focus();
  };

  return (
    <section id="profis" aria-labelledby="profis-title" className="scroll-mt-16 bg-leinen-deep py-20 sm:py-24 xl:scroll-mt-20">
      <div className={container}>
        <SectionHeader id="profis" label="Für Profis und Großprojekte" title="Bewerbung statt Anfrage.">
          <p>
            Bewirb dich. Ich arbeite nur mit Betrieben, die so genau sind wie ich. Das Formular ist kurz, damit wir beide
            schnell wissen, ob es passt.
          </p>
        </SectionHeader>

        <div className="mt-10 rounded-2xl border border-fuge bg-creme">
          <div role="tablist" aria-label="Art der Bewerbung" className="grid grid-cols-2 border-b border-fuge">
            {TABS.map((item) => {
              const selected = item.id === tab;
              return (
                <button
                  key={item.id}
                  ref={(element) => {
                    if (element) tabRefs.current.set(item.id, element);
                    else tabRefs.current.delete(item.id);
                  }}
                  id={`${baseId}-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel-${item.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setTab(item.id)}
                  onKeyDown={onKeyDown}
                  className={`flex flex-col items-start gap-1 border-b-2 px-4 py-4 text-left transition-colors first:border-r first:border-r-fuge sm:px-8 sm:py-5 ${
                    selected ? "border-b-kupfer bg-creme" : "border-b-transparent bg-leinen/50 hover:bg-leinen"
                  }`}
                >
                  <span className={`font-display text-lg font-semibold leading-tight sm:text-xl ${selected ? "text-nuss" : "text-nuss-soft"}`}>
                    {item.label}
                  </span>
                  <span className="hidden font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-nuss-muted sm:block">{item.short}</span>
                </button>
              );
            })}
          </div>

          <div
            id={`${baseId}-panel-partner`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-partner`}
            hidden={tab !== "partner"}
            className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[2fr_3fr] lg:gap-12"
          >
            <div className="flex flex-col gap-4">
              <h3 className="font-display text-2xl font-semibold">Partnerbetrieb werden</h3>
              <ul className="flex flex-col gap-3 text-nuss-soft">
                <li className="border-l-2 border-kupfer pl-3 font-semibold text-nuss">Ich werbe keine Kunden ab.</li>
                <li className="border-l-2 border-fuge pl-3">Auf Wunsch arbeite ich in deinem Namen.</li>
                <li className="border-l-2 border-fuge pl-3">
                  Du bekommst Projekte vermittelt, die ich nicht selbst übernehme, dazu Material und Planung.
                </li>
                <li className="border-l-2 border-fuge pl-3">
                  Ich nehme höchstens {partnerSlots} Partnerbetriebe in NRW auf. Nach der Bewerbung folgt ein kurzes
                  Aufnahmegespräch.
                </li>
              </ul>
            </div>
            <PublicForm action={submitPartnerApplication} submitLabel="Bewerbung abschicken" label="Als Partnerbetrieb bewerben">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name="company" label="Betrieb" required autoComplete="organization" />
                <TextField name="name" label="Name" required autoComplete="name" />
                <TextField name="email" label="E-Mail" type="email" required autoComplete="email" />
                <TextField name="phone" label="Telefon" type="tel" autoComplete="tel" />
                <TextField name="trade" label="Gewerk" required placeholder="z. B. Tischlerei, Maler, Bodenleger" />
                <TextField name="region" label="Region" placeholder="z. B. Köln und Umgebung" />
              </div>
              <CheckboxField name="isMasterBusiness" label="Wir sind ein Parkettleger-Meisterbetrieb." />
              <CheckboxGroup name="needs" legend="Worum geht es dir?" options={PARTNER_NEEDS} />
              <TextAreaField name="message" label="Nachricht" rows={3} placeholder="Volumen, Mitarbeiter, was du suchst" />
            </PublicForm>
          </div>

          <div
            id={`${baseId}-panel-projekt`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-projekt`}
            hidden={tab !== "projekt"}
            className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[2fr_3fr] lg:gap-12"
          >
            <div className="flex flex-col gap-4">
              <h3 className="font-display text-2xl font-semibold">Großprojekt bewerben</h3>
              <p className="text-pretty leading-relaxed text-nuss-soft">
                Für Bauherren, Architektur, Hausverwaltungen und Gewerbe mit Flächen ab etwa 60 m². Du überspringst
                Boden-Check und Sprechstunde und bekommst direkt einen Rückruf.
              </p>
              <p className={`${eyebrow} text-kupfer`}>Rückruf innerhalb von 48 Stunden</p>
            </div>
            <PublicForm action={submitProjectApplication} submitLabel="Projekt bewerben" label="Großprojekt bewerben">
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField name="role" label="Du bist" required options={PROJECT_ROLES} placeholder="Bitte wählen" />
                <TextField name="name" label="Name" required autoComplete="name" />
                <TextField name="email" label="E-Mail" type="email" required autoComplete="email" />
                <TextField name="phone" label="Telefon" type="tel" autoComplete="tel" hint="Für den Rückruf." />
                <TextField name="postalCode" label="PLZ des Projekts" required inputMode="numeric" maxLength={5} autoComplete="postal-code" />
                <TextField name="areaM2" label="Fläche in m²" type="number" inputMode="numeric" min={1} />
                <TextField name="floorWish" label="Bodenwunsch" placeholder="z. B. Eiche Landhausdiele, geölt" />
                <TextField name="timeframe" label="Zeitraum" placeholder="z. B. Frühjahr 2027" />
              </div>
              <TextAreaField name="message" label="Nachricht" rows={3} />
            </PublicForm>
          </div>
        </div>
      </div>
    </section>
  );
}
