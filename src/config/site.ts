// Central business data. Everything marked `null` must be filled in before go-live
// (Impressum requires a full postal address — see docs/GO-LIVE.md).
export const siteConfig = {
  name: "Aryo Sabouri",
  trade: "Parkett & Boden",
  title: "Aryo Sabouri — Parkett & Boden",
  description:
    "Parkett verlegen, schleifen, versiegeln und aufarbeiten: präzise Handarbeit für Böden mit Charakter. Kostenloses Angebot bei Aryo Sabouri anfragen.",
  email: "aryo.kontakt@gmail.com",
  /** E.164 format, e.g. "+491701234567". Shown as call button when set. */
  phone: null as string | null,
  /** Displayed service area, e.g. "Hamburg & Umgebung". */
  serviceArea: null as string | null,
  address: {
    street: "Florusstraße 9" as string | null,
    postalCode: "53225" as string | null,
    city: "Bonn" as string | null,
    country: "Deutschland",
  },
  /** Umsatzsteuer-ID (optional, only if available). */
  vatId: null as string | null,
  /** Canonical origin: explicit override, else the Vercel production domain, else local dev. */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
} as const;

export const DEFAULT_ADMIN_EMAIL = siteConfig.email;
