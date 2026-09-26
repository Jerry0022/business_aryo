// Anchors on the landing page that Ratgeber CTAs point to. Keep in sync with the landing page.
export const LINKS = {
  bodenCheck: "/#boden-check",
  sprechstunde: "/#sprechstunde",
  kontakt: "/#kontakt",
  ratgeber: "/ratgeber",
} as const;

export const articlePath = (slug: string) => `/ratgeber/${slug}`;
