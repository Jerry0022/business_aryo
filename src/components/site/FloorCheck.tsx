"use client";

import { useEffect, useRef, useState } from "react";
import {
  FLOOR_CHECK_STEPS,
  RECOMMENDATION_TAGS,
  recommendFloors,
  type FloorCheckAnswers,
  type FloorCheckStep,
} from "@/lib/business/floor-check";
import type { PublicOfficeHour } from "@/lib/business/office-hours";
import { submitFloorCheck } from "@/lib/business/public-actions";
import { officeHourLabel } from "./format";
import { PublicForm, TextField } from "./forms";
import { ArrowIcon, buttonPrimary, buttonSecondary, CheckIcon, container, eyebrow, SectionHeader, textLink } from "./ui";

// Boden-Check: 7 steps to three honest recommendations (concept chapter 12). The answers are sent
// as JSON with the contact form; the server recomputes the recommendations.

type StepKey = FloorCheckStep["key"];
const TOTAL = FLOOR_CHECK_STEPS.length;

export function FloorCheck({ nextOfficeHour }: { nextOfficeHour: PublicOfficeHour | null }) {
  const [step, setStep] = useState(0);
  const [view, setView] = useState<"questions" | "result">("questions");
  const [answers, setAnswers] = useState<FloorCheckAnswers>({});
  const [postalCode, setPostalCode] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusPending = useRef(false);

  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    headingRef.current?.focus();
  }, [step, view]);

  const current = FLOOR_CHECK_STEPS[step] ?? FLOOR_CHECK_STEPS[0]!;
  const picked = answers[current.key] ?? [];
  const isResult = view === "result";
  const answeredSteps = FLOOR_CHECK_STEPS.filter((item) => (answers[item.key]?.length ?? 0) > 0).length;

  const goTo = (index: number, nextView: "questions" | "result" = "questions") => {
    focusPending.current = true;
    setStep(Math.max(0, Math.min(TOTAL - 1, index)));
    setView(nextView);
  };

  const toggle = (key: StepKey, option: string, multiple: boolean) => {
    setAnswers((previous) => {
      const list = previous[key] ?? [];
      const nextList = list.includes(option)
        ? list.filter((item) => item !== option)
        : multiple
          ? [...list, option]
          : [option];
      const next = { ...previous };
      if (nextList.length > 0) next[key] = nextList;
      else delete next[key];
      return next;
    });
  };

  const restart = () => {
    setAnswers({});
    setPostalCode("");
    goTo(0);
  };

  const recommendations = recommendFloors(answers);
  const next = nextOfficeHour ? officeHourLabel(nextOfficeHour.startsAt) : null;

  return (
    <section id="boden-check" aria-labelledby="boden-check-title" className="scroll-mt-16 bg-estrich-deep py-20 sm:py-24 xl:scroll-mt-20">
      <div className={container}>
        <SectionHeader id="boden-check" label="Boden-Check" title="In 7 Schritten zu deinem Boden.">
          <p>
            Am Ende bekommst du dein Bodenprofil per E-Mail: drei passende Böden, ehrlich mit Vor- und Nachteilen. Kein
            Konto, keine Anmeldung.
          </p>
        </SectionHeader>

        <div className="mt-10 grid overflow-hidden rounded-xs border border-strich bg-blatt lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden flex-col gap-6 border-r border-strich px-5 py-8 lg:flex" aria-label="Schritte">
            <div className="flex flex-col gap-1.5 px-3">
              <p className="font-display text-2xl font-bold font-semiwide">Boden-Check</p>
              <p className={`${eyebrow} text-graphit-muted`}>
                {answeredSteps} von {TOTAL} beantwortet
              </p>
            </div>
            <ol className="flex flex-col gap-1">
              {FLOOR_CHECK_STEPS.map((item, index) => {
                const active = !isResult && index === step;
                const done = (answers[item.key]?.length ?? 0) > 0;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => goTo(index)}
                      aria-current={active ? "step" : undefined}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-xs px-3 py-2 text-left text-[0.95rem] transition-colors ${
                        active ? "bg-kreide font-semibold text-white" : "text-graphit hover:bg-estrich"
                      }`}
                    >
                      <span className={`w-6 font-mono text-xs ${active ? "text-white" : "text-graphit-muted"}`}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {done ? (
                        <span className={active ? "text-white" : "text-kreide"}>
                          <CheckIcon />
                          <span className="sr-only">(beantwortet)</span>
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="mt-auto px-3 text-sm leading-relaxed text-graphit-muted">Kein Konto nötig. Dein Bodenprofil kommt per E-Mail.</p>
          </aside>

          <div className="flex min-w-0 flex-col gap-6 p-5 sm:p-8 lg:px-12 lg:py-9">
            <div className="flex gap-1.5" aria-hidden="true">
              {FLOOR_CHECK_STEPS.map((item, index) => (
                <span key={item.key} className={`h-1 flex-1 ${isResult || index <= step ? "bg-kreide" : "bg-strich"}`} />
              ))}
            </div>

            {!isResult ? (
              <div className="flex flex-1 flex-col gap-5">
                <p className={`${eyebrow} text-graphit-muted`}>
                  Schritt {step + 1} von {TOTAL} · {current.label}
                </p>
                <h3
                  ref={headingRef}
                  tabIndex={-1}
                  id="boden-check-question"
                  className="max-w-2xl scroll-mt-28 text-balance font-display text-[clamp(1.625rem,4vw,2.25rem)] font-bold leading-[1.12] outline-none font-semiwide"
                >
                  {current.question}
                </h3>
                <p className="max-w-2xl text-pretty leading-relaxed text-graphit-muted">{current.hint}</p>
                <div role="group" aria-labelledby="boden-check-question" className="flex flex-wrap gap-2.5">
                  {current.options.map((option, index) => {
                    const pressed = picked.includes(option);
                    const swatch = current.swatches?.[index];
                    return (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={pressed}
                        onClick={() => toggle(current.key, option, current.multiple)}
                        className={`inline-flex min-h-11 items-center gap-2.5 rounded-xs border px-4 py-2.5 text-[0.95rem] font-medium transition-colors ${
                          pressed
                            ? "border-kreide bg-kreide text-white"
                            : "border-strich-dark bg-white text-graphit hover:border-graphit"
                        }`}
                      >
                        {swatch ? (
                          <span
                            className="size-4 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.2)]"
                            style={{ background: swatch }}
                            aria-hidden="true"
                          />
                        ) : null}
                        {option}
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm text-graphit-muted">{current.multiple ? "Mehrfachauswahl möglich." : "Eine Antwort."}</p>

                {current.key === "zeitplan" ? (
                  <div className="max-w-64">
                    <TextField
                      name="check-postal-code"
                      label="Postleitzahl"
                      inputMode="numeric"
                      maxLength={5}
                      autoComplete="postal-code"
                      placeholder="z. B. 45130"
                      value={postalCode}
                      onChange={(event) => setPostalCode(event.target.value)}
                    />
                  </div>
                ) : null}

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-strich pt-5">
                  <button type="button" onClick={() => goTo(step - 1)} disabled={step === 0} className={`${buttonSecondary} disabled:opacity-40`}>
                    Zurück
                  </button>
                  <span className="order-last w-full font-mono text-xs text-graphit-muted sm:order-none sm:w-auto">
                    {picked.length === 0 ? "Nichts gewählt" : picked.length === 1 ? "1 ausgewählt" : `${picked.length} ausgewählt`}
                  </span>
                  <button
                    type="button"
                    onClick={() => (step >= TOTAL - 1 ? goTo(step, "result") : goTo(step + 1))}
                    className={buttonPrimary}
                  >
                    {step >= TOTAL - 1 ? "Bodenprofil ansehen" : "Weiter"}
                    <ArrowIcon />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <p className={`${eyebrow} text-graphit-muted`}>Dein Bodenprofil · Vorschau</p>
                <h3
                  ref={headingRef}
                  tabIndex={-1}
                  className="scroll-mt-28 font-display text-[clamp(1.625rem,4vw,2.125rem)] font-bold leading-[1.12] outline-none font-semiwide"
                >
                  Drei Böden, die zu dir passen.
                </h3>
                <ol className="grid gap-3.5 md:grid-cols-3" aria-label="Empfehlungen">
                  {recommendations.map((item, index) => (
                    <li key={item.name} className="flex flex-col gap-2.5 rounded-xs border border-strich bg-white p-4 sm:p-5">
                      <p className={`${eyebrow} text-[0.6875rem] text-kreide`}>{RECOMMENDATION_TAGS[index]}</p>
                      <h4 className="font-display text-lg font-bold leading-snug">{item.name}</h4>
                      <p className="text-pretty text-sm leading-relaxed text-graphit-soft">{item.why}</p>
                      {item.viaMasterPartner ? (
                        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-graphit-muted">
                          Verlegung über Meisterpartner
                        </p>
                      ) : null}
                      <p className="mt-auto border-t border-dashed border-strich pt-2.5 text-[0.8125rem] leading-snug text-graphit">
                        {item.care}
                      </p>
                    </li>
                  ))}
                </ol>
                <p className="max-w-2xl text-pretty leading-relaxed text-graphit-soft">
                  Das ausführliche Profil mit Vor- und Nachteilen schicke ich dir per E-Mail.
                  {next ? ` Danach lade ich dich zur nächsten Boden-Sprechstunde ein: ${next.long}.` : ""}
                </p>

                <PublicForm
                  action={submitFloorCheck}
                  submitLabel="Bodenprofil per E-Mail schicken"
                  label="Bodenprofil per E-Mail schicken"
                  resetOnSuccess={false}
                  className="border-t border-strich pt-6"
                  actions={
                    <>
                      <button type="button" onClick={() => goTo(TOTAL - 1)} className={buttonSecondary}>
                        Zurück
                      </button>
                      <button type="button" onClick={restart} className="min-h-11 px-3 text-[0.95rem] text-graphit-muted underline underline-offset-4 hover:text-graphit">
                        Neu starten
                      </button>
                    </>
                  }
                  successExtra={
                    <a href="#sprechstunde" className={`${textLink} mt-2`}>
                      Zur Boden-Sprechstunde anmelden
                      <ArrowIcon />
                    </a>
                  }
                >
                  <input type="hidden" name="answers" value={JSON.stringify(answers)} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField name="name" label="Name" required autoComplete="name" />
                    <TextField name="email" label="E-Mail" type="email" required autoComplete="email" />
                    <TextField
                      name="postalCode"
                      label="Postleitzahl"
                      required
                      inputMode="numeric"
                      maxLength={5}
                      autoComplete="postal-code"
                      value={postalCode}
                      onChange={(event) => setPostalCode(event.target.value)}
                      hint="Damit ich sehe, ob du im Einzugsgebiet liegst."
                    />
                    <TextField name="areaM2" label="Fläche in m²" type="number" inputMode="numeric" min={1} />
                  </div>
                </PublicForm>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
