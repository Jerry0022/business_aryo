// Central business data. Everything marked `null` must be filled in before go-live
// (Impressum requires a full postal address — see docs/GO-LIVE.md).
// Brand, tone and business rules follow docs/konzept/markenkonzept.md.
export const siteConfig = {
  /** Brand name (working title, will be renamed later — see the concept, chapter 11). */
  name: "Maximilian Parkett",
  /** Legal owner of the sole proprietorship; shown in the Impressum. */
  owner: "Aryo Sabouri",
  /** Registered trade. Bodenleger is not a Meister trade: never claim "Parkettleger" or "Meisterbetrieb". */
  trade: "Bodenleger",
  claim: "Da stehst du drauf.",
  tagline: "Böden aus Naturmaterial: geplant, geliefert, verlegt. In NRW.",
  title: "Maximilian Parkett — Böden aus Naturmaterial in NRW",
  description:
    "Parkett, Laminat und Vinyl in NRW: geplant, geliefert, verlegt. Boden-Check in 7 Schritten, ehrliche Beratung und für Selbermacher Material, Profi-Werkzeug und Einweisung.",
  email: "aryo.kontakt@gmail.com",
  /** E.164 format, e.g. "+491701234567". Shown as call button when set. */
  phone: null as string | null,
  /** Displayed service area. */
  serviceArea: "NRW und angrenzend" as string | null,
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
