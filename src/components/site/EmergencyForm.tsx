"use client";

import { siteConfig } from "@/config/site";
import { submitEmergencyRequest } from "@/lib/business/public-actions";
import { DAMAGE_TYPES } from "./content";
import { PublicForm, SelectField, TextAreaField, TextField } from "./forms";

const PHOTO_MAILTO = `mailto:${siteConfig.email}?subject=${encodeURIComponent("Notfall: Fotos vom Schaden")}`;

export function EmergencyForm() {
  return (
    <PublicForm
      action={submitEmergencyRequest}
      submitLabel="Schaden melden"
      label="Schaden melden"
      successExtra={
        <a href={PHOTO_MAILTO} className="mt-2 inline-flex font-semibold text-kreide underline underline-offset-4">
          Fotos per E-Mail schicken
        </a>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="name" label="Name" required autoComplete="name" />
        <TextField name="email" label="E-Mail" type="email" required autoComplete="email" />
        <TextField name="phone" label="Telefon" type="tel" autoComplete="tel" />
        <TextField name="postalCode" label="PLZ" required inputMode="numeric" maxLength={5} autoComplete="postal-code" />
      </div>
      <SelectField name="damage" label="Was ist passiert?" required options={DAMAGE_TYPES} defaultValue={DAMAGE_TYPES[0]} />
      <TextAreaField
        name="message"
        label="Beschreibung"
        required
        rows={4}
        placeholder="Wo, wie groß, seit wann? Welcher Boden liegt dort?"
      />
    </PublicForm>
  );
}
