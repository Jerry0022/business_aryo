"use client";

import { ArrowUpRight } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { siteConfig } from "@/config/site";
import { quoteRequestHref, SERVICES } from "./content";

const fieldClass =
  "mt-2 block w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-base text-ink shadow-[inset_0_1px_2px_rgb(23_19_15/0.04)] outline-none transition placeholder:text-ink-muted/70 focus:border-oak-deep focus:ring-4 focus:ring-oak/20";
const labelClass = "block text-sm font-semibold text-ink";

/** Composes a mailto: link from the form. Nothing is sent to or stored on a server. */
export function QuoteForm() {
  const id = useId();
  const [opened, setOpened] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const read = (key: string) => String(data.get(key) ?? "").trim();
    const href = quoteRequestHref({
      name: read("name"),
      place: read("place"),
      area: read("area"),
      service: read("service"),
      message: read("message"),
    });
    setOpened(true);
    window.location.href = href;
  };

  return (
    <form
      // Without JavaScript the browser still hands the fields to the mail client — never to this server.
      action={`mailto:${siteConfig.email}?subject=${encodeURIComponent("Angebotsanfrage Parkett")}`}
      method="post"
      encType="text/plain"
      onSubmit={onSubmit}
      className="grid gap-5 sm:grid-cols-2"
      aria-describedby={`${id}-note`}
    >
      <div className="sm:col-span-2">
        <label htmlFor={`${id}-name`} className={labelClass}>
          Name
        </label>
        <input id={`${id}-name`} name="name" type="text" autoComplete="name" required className={fieldClass} />
      </div>
      <div>
        <label htmlFor={`${id}-place`} className={labelClass}>
          Ort / PLZ
        </label>
        <input
          id={`${id}-place`}
          name="place"
          type="text"
          autoComplete="address-level2"
          placeholder="z. B. 12345 Musterstadt"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor={`${id}-area`} className={labelClass}>
          Fläche <span className="font-normal text-ink-muted">(ca. m²)</span>
        </label>
        <input
          id={`${id}-area`}
          name="area"
          type="number"
          inputMode="numeric"
          min={1}
          max={100000}
          step="any"
          placeholder="z. B. 35"
          className={fieldClass}
        />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${id}-service`} className={labelClass}>
          Leistung
        </label>
        <div className="relative">
          <select id={`${id}-service`} name="service" defaultValue="" className={`${fieldClass} appearance-none pr-10`}>
            <option value="">Bitte wählen …</option>
            {SERVICES.map((service) => (
              <option key={service.id} value={service.title}>
                {service.title}
              </option>
            ))}
            <option value="Sonstiges">Sonstiges</option>
          </select>
          <svg
            viewBox="0 0 20 20"
            className="pointer-events-none absolute right-4 top-1/2 mt-1 size-4 -translate-y-1/2 text-ink-muted"
            aria-hidden="true"
          >
            <path
              d="m5 8 5 5 5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${id}-message`} className={labelClass}>
          Nachricht
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={4}
          placeholder="Worum geht es? Zustand des Bodens, Wunschtermin, Fragen …"
          className={`${fieldClass} resize-y`}
        />
      </div>
      <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p id={`${id}-note`} className="max-w-xs text-sm leading-relaxed text-ink-muted">
          Öffnet Ihr E-Mail-Programm mit einer vorbereiteten Nachricht. Es werden keine Daten auf dieser Website
          gespeichert.
        </p>
        <button
          type="submit"
          className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-base font-semibold text-paper transition hover:bg-walnut"
        >
          E-Mail vorbereiten
          <ArrowUpRight
            className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </button>
      </div>
      <p role="status" className="text-sm text-ink-muted sm:col-span-2 empty:hidden">
        {opened
          ? `Ihr E-Mail-Programm sollte sich jetzt öffnen. Falls nicht, schreiben Sie mir direkt an ${siteConfig.email}.`
          : ""}
      </p>
    </form>
  );
}
