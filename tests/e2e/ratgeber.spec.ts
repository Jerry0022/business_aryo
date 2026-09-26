import { expect, test } from "@playwright/test";

const ARTICLES = [
  ["hund-kinder-rotwein", "Was passiert, wenn dein Hund jeden Tag drüber rennt?"],
  ["fussbodenheizung-und-holz", "Fußbodenheizung und Holz: Geht das?"],
  ["kosten-pro-jahr", "Kosten pro Jahr statt pro Quadratmeter"],
  ["welcher-boden-wofuer", "Welcher Boden in welchen Raum?"],
  ["boden-und-raumklima", "Was ein Holzboden fürs Raumklima tut – und was nicht"],
  ["selbst-verlegen", "Klick-Boden selbst verlegen: die häufigsten Fehler"],
  ["geoelt-oder-lackiert", "Geölt oder lackiert? Ein Blick auf die Werkbank"],
] as const;

test.describe("Ratgeber", () => {
  test("index lists all seven articles grouped by the six pillars", async ({ page }) => {
    await page.goto("/ratgeber");
    await expect(page.getByRole("heading", { level: 1, name: "Worauf es ankommt." })).toBeVisible();
    await expect(page).toHaveTitle(/Ratgeber/);

    const main = page.locator("main");
    for (const [slug, title] of ARTICLES) {
      await expect(main.getByRole("link", { name: title, exact: true })).toHaveAttribute("href", `/ratgeber/${slug}`);
    }
    await expect(main.locator("section[id] h2")).toHaveCount(6);

    await expect(main.getByRole("link", { name: "Boden-Check starten" })).toHaveAttribute("href", "/#boden-check");
    await expect(main.getByRole("link", { name: "Platz sichern" })).toHaveAttribute("href", "/#sprechstunde");
  });

  test("an article renders its headline, summary and Article JSON-LD", async ({ page }) => {
    const [slug, title] = ARTICLES[0];
    await page.goto(`/ratgeber/${slug}`);

    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByRole("heading", { name: "Kurz gesagt" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Brotkrümelnavigation" }).getByRole("link", { name: "Ratgeber" })).toHaveAttribute(
      "href",
      "/ratgeber",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/ratgeber/${slug}$`));

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const article = blocks.map((text) => JSON.parse(text) as Record<string, unknown>).find((data) => data["@type"] === "Article");
    expect(article).toMatchObject({ "@type": "Article", headline: title, inLanguage: "de-DE" });

    // Related articles link to other Ratgeber pages.
    const related = page.getByRole("region", { name: "Weiterlesen" }).getByRole("link");
    await expect(related.first()).toHaveAttribute("href", /^\/ratgeber/);
  });

  test("the calculator computes the cost per m² and year from entered values", async ({ page }) => {
    await page.goto("/ratgeber/kosten-pro-jahr");
    const calculator = page.locator('[data-calculator][data-ready="true"]');
    await expect(calculator).toBeAttached();

    const floorA = calculator.getByRole("group", { name: "Boden A" });
    const floorB = calculator.getByRole("group", { name: "Boden B" });
    const priceA = floorA.getByLabel(/Preis pro m²/);

    // Inputs start empty: the owner does not publish prices yet.
    await expect(priceA).toHaveValue("");
    await expect(priceA).toHaveAttribute("inputmode", "decimal");
    await expect(priceA).toHaveAttribute("placeholder", /z\. B\./);

    await priceA.fill("90");
    await floorA.getByLabel(/Lebensdauer/).fill("30");
    await floorA.getByLabel(/Pflege pro m²/).fill("1,5");
    await expect(calculator.locator('[data-floor="a"] [data-total]')).toHaveText(/^4,50\s€$/);

    await floorB.getByLabel(/Bezeichnung/).fill("Laminat");
    await floorB.getByLabel(/Preis pro m²/).fill("45");
    await floorB.getByLabel(/Lebensdauer/).fill("15");
    await expect(calculator.locator('[data-floor="b"] [data-total]')).toHaveText(/^3,00\s€$/);
    await expect(calculator.getByRole("status")).toContainText(/Laminat, 1,50\s€ pro m² weniger als Boden A/);

    await calculator.getByRole("button", { name: "Eingaben löschen" }).click();
    await expect(priceA).toHaveValue("");
  });

  test("unknown articles are a 404", async ({ page }) => {
    const response = await page.goto("/ratgeber/gibt-es-nicht");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Hier fehlt ein Stück." })).toBeVisible();
  });

  test("the sitemap lists the Ratgeber", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    const text = await sitemap.text();
    expect(text).toContain("/ratgeber</loc>");
    expect(text).toContain("/ratgeber/kosten-pro-jahr</loc>");
    for (const [slug] of ARTICLES) expect(text).toContain(`/ratgeber/${slug}</loc>`);
  });
});
