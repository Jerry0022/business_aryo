"use client";

import { CalendarPlus, Hammer, Plus, TriangleAlert } from "lucide-react";
import { addDays, berlinTime, daysBetween, formatDateKey, isoWeek } from "@/lib/business/calendar";
import { labelOf, TOOL_STATUSES } from "@/lib/werkbank/constants";
import type { ToolsData } from "@/lib/werkbank/queries";
import { useWerkbank } from "../context";
import { HOLIDAY_STYLE, typeStyle, VACATION_HATCH } from "../event-style";
import { Badge, Banner, Button, EmptyState } from "../ui";

export function ToolsView({ data }: { data: ToolsData }) {
  const { open } = useWerkbank();
  const totalDays = daysBetween(data.start, data.end) + 1;
  const pct = (key: string) => (Math.max(0, Math.min(totalDays, daysBetween(data.start, key))) / totalDays) * 100;
  const weeks = Array.from({ length: Math.ceil(totalDays / 7) }, (_, index) => addDays(data.start, index * 7));
  const color = typeStyle("werkzeug").color;
  const conflicts = data.tools.flatMap((tool) => tool.handovers.filter((handover) => handover.conflict && handover.date >= data.today).map((handover) => ({ tool, handover })));

  if (data.tools.length === 0) {
    return (
      <EmptyState
        icon={Hammer}
        title="Noch kein Werkzeug angelegt"
        className="mt-6"
        action={
          <Button variant="primary" icon={Plus} onClick={() => open({ type: "entityForm", entity: "tool" })}>
            Erstes Werkzeug anlegen
          </Button>
        }
      >
        Leg hier die Geräte für den Verleih an (Unterschnittsäge, Zugeisen, Feuchtemessgerät …). Ausgabe und Rückgabe planst du dann als Termine, die
        Zeitleiste zeigt, wann ein Gerät frei ist.
      </EmptyState>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {conflicts.map(({ tool, handover }) => (
        <Banner key={handover.id} tone="crit" icon={TriangleAlert}>
          <span className="font-medium">Konflikt:</span> {handover.title} am {formatDateKey(handover.date)} ({berlinTime(handover.startsAt)}) fällt auf Urlaub, einen Feiertag oder
          überschneidet sich.{" "}
          <button type="button" className="underline underline-offset-2" onClick={() => open({ type: "record", ref: { kind: "event", id: handover.id } })}>
            Termin öffnen
          </button>
          <span className="sr-only"> ({tool.name})</span>
        </Banner>
      ))}

      <div className="overflow-x-auto rounded-2xl border border-studio-line bg-studio-panel">
        <div className="min-w-[48rem]">
          <div className="grid grid-cols-[15rem_1fr] border-b border-studio-line">
            <div className="px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-wider text-studio-muted">Gerät · Verfügbarkeit</div>
            <div className="relative h-9">
              {weeks.map((monday) => (
                <span key={monday} className="absolute top-2 font-mono text-[0.65rem] tabular-nums text-studio-muted" style={{ left: `calc(${pct(monday)}% + 4px)` }}>
                  KW {isoWeek(monday).week}
                </span>
              ))}
            </div>
          </div>
          <ul className="divide-y divide-studio-line" aria-label="Werkzeuge">
            {data.tools.map((tool) => (
              <li key={tool.id} className="grid grid-cols-[15rem_1fr]">
                <div className="px-4 py-3">
                  <button type="button" onClick={() => open({ type: "record", ref: { kind: "tool", id: tool.id } })} className="text-left font-medium hover:text-oak-light">
                    {tool.name}
                  </button>
                  <p className="text-xs text-studio-muted">{tool.category ?? "ohne Kategorie"}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {tool.current ? (
                      <Badge tone="info">verliehen bis {formatDateKey(tool.current.end, false)}</Badge>
                    ) : (
                      <Badge tone={tool.status === "verfuegbar" ? "ok" : "warn"}>{labelOf(TOOL_STATUSES, tool.status)}</Badge>
                    )}
                  </div>
                  {tool.nextRental ? <p className="mt-1 text-xs text-studio-muted">nächster Verleih {formatDateKey(tool.nextRental.start, false)}</p> : null}
                  <Button size="sm" icon={CalendarPlus} className="mt-2" onClick={() => open({ type: "entityForm", entity: "rental", id: tool.id })}>
                    Ausgabe/Rückgabe planen
                  </Button>
                </div>
                <div className="relative my-3 mr-3 rounded-lg bg-white/[0.03]">
                  {weeks.map((monday) => (
                    <span key={monday} className="absolute inset-y-0 w-px bg-studio-line/70" style={{ left: `${pct(monday)}%` }} aria-hidden />
                  ))}
                  {data.vacations.map((span) => (
                    <span
                      key={span.id}
                      className="absolute inset-y-0"
                      style={{ left: `${pct(span.start)}%`, width: `${pct(addDays(span.end, 1)) - pct(span.start)}%`, background: VACATION_HATCH }}
                      title={`${span.title}: keine Ausgabe oder Rückgabe`}
                      aria-hidden
                    />
                  ))}
                  {data.holidays.map(([key, name]) => (
                    <span key={key} className="absolute inset-y-0 w-px opacity-60" style={{ left: `${pct(key) + 100 / totalDays / 2}%`, background: HOLIDAY_STYLE.color }} title={name} aria-hidden />
                  ))}
                  <span className="absolute -inset-y-1 z-10 w-0.5 rounded bg-studio-text" style={{ left: `${pct(data.today)}%` }} title="Heute" aria-hidden />
                  {tool.rentals
                    .filter((rental) => rental.end >= data.start && rental.start <= data.end)
                    .map((rental) => (
                      <button
                        key={rental.id}
                        type="button"
                        onClick={() => open({ type: "record", ref: { kind: "event", id: rental.id } })}
                        className="absolute top-1/2 z-[5] h-6 -translate-y-1/2 overflow-hidden rounded-md px-1.5 text-left text-[0.7rem] font-semibold text-[#0d0f12] hover:brightness-110"
                        style={{ left: `${pct(rental.start)}%`, width: `max(1.5rem, ${pct(addDays(rental.end, 1)) - pct(rental.start)}%)`, background: color }}
                        title={`${rental.title}: ${formatDateKey(rental.start)}–${formatDateKey(rental.end)}`}
                      >
                        <span className="block truncate">{rental.customerName ?? rental.title}</span>
                      </button>
                    ))}
                  {tool.handovers
                    .filter((handover) => handover.date >= data.start && handover.date <= data.end)
                    .map((handover) => (
                      <button
                        key={handover.id}
                        type="button"
                        onClick={() => open({ type: "record", ref: { kind: "event", id: handover.id } })}
                        className="absolute bottom-0.5 z-[6] size-2.5 -translate-x-1/2 rounded-full border border-studio-bg"
                        style={{ left: `${pct(handover.date) + 100 / totalDays / 2}%`, background: handover.conflict ? "#f87171" : "#e8e6e1" }}
                        title={`${handover.title}, ${formatDateKey(handover.date)} ${berlinTime(handover.startsAt)}`}
                        aria-label={`${handover.title}, ${formatDateKey(handover.date)} ${berlinTime(handover.startsAt)}${handover.conflict ? " (Konflikt)" : ""}`}
                      />
                    ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-studio-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-sm" style={{ background: color }} aria-hidden /> verliehen (Klick öffnet den Verleih)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-studio-text" aria-hidden /> Ausgabe/Rückgabe
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400" aria-hidden /> Übergabe mit Konflikt
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-sm" style={{ background: VACATION_HATCH }} aria-hidden /> Urlaub: keine Übergaben
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-0.5 bg-studio-text" aria-hidden /> heute
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-px opacity-60" style={{ background: HOLIDAY_STYLE.color }} aria-hidden /> Feiertag
        </span>
      </div>
    </div>
  );
}
