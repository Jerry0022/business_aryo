"use client";

import { CalendarPlus, Info } from "lucide-react";
import { berlinTime, formatInstant } from "@/lib/business/calendar";
import { createDefaultOfficeHour } from "@/lib/werkbank/actions/office-hours";
import { useWerkbank } from "./context";
import { chipStyle, typeStyle } from "./event-style";
import { useAction } from "./hooks";
import { Banner, Button } from "./ui";

/** Drawer view of a default session from the settings schedule that is not stored yet. */
export function VirtualOfficeHourView({ startsAt, topic, durationMinutes }: { startsAt: string; topic: string; durationMinutes: number }) {
  const { showSaved } = useWerkbank();
  const { pending, run } = useAction();
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const style = typeStyle("sprechstunde");
  const Icon = style.icon;
  return (
    <div className="space-y-5 p-5">
      <div>
        <span className="inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-xs font-medium" style={chipStyle(style.color)}>
          <Icon className="size-3.5" aria-hidden /> Sprechstunde · Vorschlag
        </span>
        <h2 data-drawer-title tabIndex={-1} className="mt-2 font-display text-xl font-semibold outline-none">
          Sprechstunde: {topic}
        </h2>
        <p className="mt-1 text-sm tabular-nums text-studio-muted">
          {formatInstant(start)}–{berlinTime(end)} · {durationMinutes} min
        </p>
      </div>
      <Banner tone="info" icon={Info}>
        Standardtermin aus den Einstellungen (Rhythmus der Sprechstunde). Auf der Website ist er schon buchbar; mit der ersten Anmeldung
        wird er automatisch angelegt. Du kannst ihn auch jetzt anlegen, um Thema oder Uhrzeit zu ändern.
      </Banner>
      <Button
        variant="primary"
        icon={CalendarPlus}
        pending={pending}
        onClick={() => run(() => createDefaultOfficeHour(startsAt), (result) => result.data && showSaved({ kind: "officeHour", id: result.data.id }))}
      >
        Sprechstunde anlegen
      </Button>
    </div>
  );
}
