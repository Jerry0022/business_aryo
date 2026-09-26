"use client";

import { useState } from "react";
import type { FoundingContingent } from "@/lib/business/contingent";
import type { PublicOfficeHour } from "@/lib/business/office-hours";
import { registerForOfficeHour } from "@/lib/business/public-actions";
import { formatDateKey, officeHourLabel } from "./format";
import { CheckboxField, PublicForm, TextField } from "./forms";
import { card, container, eyebrow, SectionHeader } from "./ui";

interface OfficeHoursProps {
  officeHours: PublicOfficeHour[];
  voucherConditions: string[];
  voucherValue: string | null;
  founding: FoundingContingent;
  live: boolean;
}

export function OfficeHours({ officeHours, voucherConditions, voucherValue, founding, live }: OfficeHoursProps) {
  const [selected, setSelected] = useState(0);
  const current = officeHours[selected] ?? officeHours[0];

  return (
    <section id="sprechstunde" aria-labelledby="sprechstunde-title" className="scroll-mt-16 py-20 sm:py-24 xl:scroll-mt-20">
      <div className={container}>
        <SectionHeader id="sprechstunde" label="Boden-Sprechstunde · live · gratis" title="Eine Stunde, die dir teure Fehler erspart.">
          <p>
            Einmal im Monat erkläre ich live, worauf es bei Böden ankommt. Danach beantworte ich deine Fragen. Du brauchst
            nur einen Browser.
          </p>
        </SectionHeader>

        <div className={`${card} mt-12 grid lg:grid-cols-[5fr_7fr]`}>
          <div className="flex flex-col gap-5 border-b border-strich p-5 sm:p-8 lg:border-b-0 lg:border-r">
            {officeHours.length > 0 ? (
              <fieldset>
                <legend className={`${eyebrow} mb-4 text-graphit-muted`}>Termin wählen</legend>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {officeHours.map((hour, index) => {
                    const label = officeHourLabel(hour.startsAt);
                    return (
                      <label
                        key={hour.startsAt}
                        className="group relative flex cursor-pointer flex-col gap-1 rounded-xs border border-strich bg-white/60 p-4 transition-colors hover:border-graphit has-[:checked]:border-kreide has-[:checked]:bg-kreide/[0.06] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-kreide"
                      >
                        <input
                          type="radio"
                          name="office-hour"
                          value={index}
                          checked={index === selected}
                          onChange={() => setSelected(index)}
                          className="sr-only"
                        />
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="font-display text-[2.25rem] font-extrabold leading-none tracking-[-0.02em] text-kreide font-wide">
                            {label.dayMonth}
                          </span>
                          <span
                            className="flex size-5 shrink-0 items-center justify-center rounded-full border border-strich-dark group-has-[:checked]:border-kreide"
                            aria-hidden="true"
                          >
                            <span className="size-2.5 rounded-full bg-kreide opacity-0 group-has-[:checked]:opacity-100" />
                          </span>
                        </span>
                        <span className="font-semibold text-graphit">
                          {label.weekday} · {label.time} Uhr
                        </span>
                        <span className="text-pretty text-sm leading-snug text-graphit-soft">{hour.topic}</span>
                        <span className="mt-1 font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-graphit-muted">
                          {hour.durationMinutes} Min. + Fragen
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : (
              <p className="text-graphit-soft">Die nächsten Termine stehen gleich wieder hier.</p>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-6 p-5 sm:p-8 lg:px-12">
            <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
              <div className="flex flex-col gap-3">
                {current ? (
                  <h3 className="text-balance font-display text-[1.625rem] font-bold leading-tight font-semiwide sm:text-[1.875rem]">
                    {current.topic}
                  </h3>
                ) : null}
                <p className="text-pretty leading-relaxed text-graphit-soft">
                  Die Kamera zeigt meine Werkbank: Hände, Holz und Werkzeug. Kein Verkaufsgespräch, dafür Antworten auf
                  deine Fragen.
                </p>
              </div>
              <WorkbenchCamera />
            </div>

            {current ? (
              <PublicForm action={registerForOfficeHour} submitLabel="Platz sichern" label="Für die Boden-Sprechstunde anmelden">
                <input type="hidden" name="officeHourId" value={current.id ?? ""} />
                <input type="hidden" name="startsAt" value={current.startsAt} />
                <p className="font-mono text-xs uppercase tracking-[0.08em] text-graphit-muted" aria-live="polite">
                  Gewählt: {officeHourLabel(current.startsAt).long}
                </p>
                <div className="grid gap-4 sm:grid-cols-[2fr_3fr]">
                  <TextField name="firstName" label="Vorname" required autoComplete="given-name" />
                  <TextField name="email" label="E-Mail" type="email" required autoComplete="email" />
                </div>
                <CheckboxField
                  name="newsletter"
                  label="Schick mir auch den Newsletter mit neuen Ratgebern und Terminen. Abmelden geht jederzeit."
                />
                <p className="text-sm leading-relaxed text-graphit-muted">
                  Deine Anmeldung bestätigst du per E-Mail. Den Link zur Sprechstunde bekommst du danach.
                </p>
              </PublicForm>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-dashed border-strich pt-5">
              <h4 className={`${eyebrow} text-kreide`}>Gutschein für die Erstberatung</h4>
              <p className="text-pretty leading-relaxed text-graphit-soft">
                Nach der Sprechstunde bekommst du einen Gutschein für die Erstberatung vor Ort
                {voucherValue ? ` über ${voucherValue}` : ""}.
                {voucherConditions.length > 0 ? " Er gilt nur, wenn" : ""}
              </p>
              {voucherConditions.length > 0 ? (
                <ul className="flex flex-col gap-1.5 text-[0.95rem] text-graphit-soft">
                  {voucherConditions.map((condition, index) => (
                    <li key={condition} className="flex gap-3">
                      <span className="pt-0.5 font-mono text-xs text-kreide" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-pretty">
                        {condition}
                        {index < voucherConditions.length - 1 ? "," : "."}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {live && founding.open ? (
                <p className="font-mono text-xs uppercase leading-relaxed tracking-[0.06em] text-graphit-muted">
                  Gründungskontingent: noch {founding.free} von {founding.total} Erstberatungen bis {formatDateKey(founding.deadline)}.
                  Dafür darf ich Vorher-Nachher-Fotos deines Bodens zeigen.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Illustration of the "Werkbank-Kamera": viewfinder over the workbench, hands stay out of frame. */
function WorkbenchCamera() {
  return (
    <svg
      viewBox="0 0 200 140"
      className="h-auto w-full max-w-[240px] justify-self-start sm:w-[200px]"
      role="img"
      aria-label="Skizze: Blick der Werkbank-Kamera auf Holz, Zollstock und Bleistift"
    >
      <rect x="0" y="0" width="200" height="140" fill="#3a3d43" />
      <g>
        <rect x="10" y="22" width="180" height="26" fill="#b07a42" />
        <rect x="10" y="48" width="180" height="26" fill="#c0894a" />
        <rect x="10" y="74" width="180" height="26" fill="#a8713a" />
        <rect x="10" y="100" width="180" height="26" fill="#c0894a" />
        <path d="M10 48H190M10 74H190M10 100H190" stroke="#6b4526" strokeWidth="0.8" />
        <path
          d="M18 30q40-4 80 0t86 0M22 58q50 5 100 0t60 2M16 84q45-4 90 1t80-2M20 110q60 4 110 0t54 1"
          fill="none"
          stroke="#7a4a22"
          strokeOpacity="0.35"
          strokeWidth="0.7"
        />
      </g>
      <g transform="rotate(-18 100 70)">
        <rect x="34" y="60" width="130" height="12" fill="#f7f7f4" stroke="#22252a" strokeWidth="0.6" />
        <path
          d="M47 60v4M60 60v6M73 60v4M86 60v6M99 60v4M112 60v6M125 60v4M138 60v6M151 60v4"
          stroke="#22252a"
          strokeWidth="0.7"
        />
        <path d="M99 60v12" stroke="#2d5ba8" strokeWidth="1" />
      </g>
      <g transform="rotate(24 140 104)">
        <rect x="104" y="100" width="62" height="6" fill="#22252a" />
        <path d="M166 100l8 3-8 3z" fill="#e4e3de" />
      </g>
      <g stroke="#f7f7f4" strokeWidth="2" fill="none">
        <path d="M8 18V8h10M182 8h10v10M192 122v10h-10M18 132H8v-10" />
      </g>
      <g fontFamily="var(--font-plex-mono), ui-monospace, monospace" fontSize="8" fill="#f7f7f4" letterSpacing="0.8">
        <circle cx="152" cy="17.5" r="3" fill="#e5484d" />
        <text x="159" y="20.5">LIVE</text>
        <text x="24" y="20.5">WERKBANK</text>
      </g>
    </svg>
  );
}
