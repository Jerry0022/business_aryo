"use client";

import { submitSubscriptionInquiry } from "@/lib/business/public-actions";
import { PublicForm, SelectField, TextAreaField, TextField } from "./forms";

export function SubscriptionForm({ plans }: { plans: { key: string; name: string }[] }) {
  return (
    <PublicForm action={submitSubscriptionInquiry} submitLabel="Abo anfragen" label="Abo anfragen">
      <SelectField
        name="plan"
        label="Abo"
        required
        options={plans.map((plan) => ({ value: plan.key, label: plan.name }))}
        defaultValue={plans[0]?.key}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="name" label="Name" required autoComplete="name" />
        <TextField name="company" label="Firma" autoComplete="organization" />
        <TextField name="email" label="E-Mail" type="email" required autoComplete="email" />
        <TextField name="phone" label="Telefon" type="tel" autoComplete="tel" />
      </div>
      <TextField name="areaM2" label="Fläche in m²" type="number" inputMode="numeric" min={1} className="sm:max-w-48" />
      <TextAreaField name="message" label="Nachricht" rows={3} placeholder="Welcher Boden, wie alt, wie genutzt?" />
    </PublicForm>
  );
}
