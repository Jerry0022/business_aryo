import { expect, test, type Page } from "@playwright/test";
import { siteConfig } from "../../src/config/site";

/** Navigates and waits until React has hydrated the page (client components are interactive). */
async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('header[data-hydrated="true"]')).toBeAttached();
}

test.describe("public site", () => {
  test("landing renders the headline and all sections", async ({ page }) => {
    await open(page, "/");

    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Parkett mit\s*Handschrift\./);
    await expect(page).toHaveTitle(/Aryo Sabouri/);

    for (const [id, title] of [
      ["leistungen", "Alles für Ihren Holzboden."],
      ["muster", "Finden Sie Ihr Muster."],
      ["ablauf", "In vier Schritten zum neuen Boden."],
      ["ueber-mich", "Holz verzeiht wenig. Deshalb arbeite ich genau."],
      ["kontakt", "Erzählen Sie mir von Ihrem Boden."],
    ] as const) {
      const section = page.locator(`section#${id}`);
      await expect(section).toBeAttached();
      await expect(section.getByRole("heading", { level: 2, name: title })).toBeAttached();
    }

    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    expect(JSON.parse(jsonLd ?? "{}")).toMatchObject({
      "@type": "HomeAndConstructionBusiness",
      email: siteConfig.email,
    });
  });

  test("anchor navigation scrolls to the section", async ({ page, isMobile }) => {
    test.skip(isMobile, "The desktop navigation is hidden on small screens.");
    await open(page, "/");

    const nav = page.getByRole("navigation", { name: "Hauptnavigation" });
    await nav.getByRole("link", { name: "Leistungen" }).click();
    await expect(page).toHaveURL(/#leistungen$/);
    await expect(page.locator("#leistungen-title")).toBeInViewport();

    await nav.getByRole("link", { name: "Kontakt" }).click();
    await expect(page).toHaveURL(/#kontakt$/);
    await expect(page.locator("#kontakt-title")).toBeInViewport();
  });

  test("mobile menu opens and closes via Escape and link click", async ({ page, isMobile }) => {
    test.skip(!isMobile, "The menu button only exists on small screens.");
    await open(page, "/");

    const openButton = page.getByRole("button", { name: "Menü öffnen" });
    const menu = page.getByRole("navigation", { name: "Mobile Navigation" });
    await expect(openButton).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toBeHidden();

    await openButton.click();
    await expect(page.getByRole("button", { name: "Menü schließen" })).toHaveAttribute("aria-expanded", "true");
    await expect(menu).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(openButton).toHaveAttribute("aria-expanded", "false");
    await expect(openButton).toBeFocused();

    await openButton.click();
    await menu.getByRole("link", { name: /Ablauf$/ }).click();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/#ablauf$/);
    await expect(page.locator("#ablauf-title")).toBeInViewport();
  });

  test("pattern explorer switches pattern and wood tone", async ({ page }) => {
    await open(page, "/#muster");

    const patterns = page.getByRole("radiogroup", { name: "Verlegemuster" });
    const herringbone = patterns.getByRole("radio", { name: /^Fischgrät/ });
    const chevron = patterns.getByRole("radio", { name: /Französisches Fischgrät/ });
    const shipDeck = patterns.getByRole("radio", { name: /Schiffsboden/ });

    await expect(herringbone).toHaveAttribute("aria-checked", "true");
    await expect(chevron).toHaveAttribute("aria-checked", "false");

    await chevron.click();
    await expect(chevron).toHaveAttribute("aria-checked", "true");
    await expect(herringbone).toHaveAttribute("aria-checked", "false");
    await expect(page.getByRole("img", { name: /Vorschau: Französisches Fischgrät/ })).toBeVisible();

    // Radio-group keyboard semantics: arrows move selection and focus.
    await chevron.focus();
    await page.keyboard.press("ArrowDown");
    await expect(shipDeck).toHaveAttribute("aria-checked", "true");
    await expect(shipDeck).toBeFocused();
    await expect(chevron).toHaveAttribute("tabindex", "-1");

    const walnut = page.getByRole("radiogroup", { name: "Holzton" }).getByRole("radio", { name: /Nussbaum/ });
    await walnut.click();
    await expect(walnut).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("img", { name: "Vorschau: Schiffsboden in Nussbaum" })).toBeVisible();
  });

  test("contact section offers mailto links and a mailto form", async ({ page }) => {
    await open(page, "/");
    const contact = page.locator("section#kontakt");

    await expect(contact.getByRole("link", { name: "E-Mail schreiben" })).toHaveAttribute(
      "href",
      /^mailto:aryo\.kontakt@gmail\.com\?subject=/,
    );
    await expect(contact.getByRole("link", { name: siteConfig.email })).toHaveAttribute(
      "href",
      `mailto:${siteConfig.email}`,
    );
    await expect(contact.getByRole("link", { name: "Anrufen" })).toHaveCount(siteConfig.phone ? 1 : 0);

    await contact.getByLabel("Name").fill("Erika Muster");
    await contact.getByLabel("Leistung").selectOption("Schleifen & Versiegeln");
    await contact.getByRole("button", { name: "E-Mail vorbereiten" }).click();
    await expect(contact.getByRole("status")).toContainText("E-Mail-Programm");
  });

  test("Impressum and Datenschutz are reachable from the footer", async ({ page }) => {
    await open(page, "/");

    await page.getByRole("contentinfo").getByRole("link", { name: "Impressum" }).click();
    await expect(page).toHaveURL(/\/impressum$/);
    await expect(page.getByRole("heading", { level: 1, name: "Impressum" })).toBeVisible();
    await expect(page).toHaveTitle(/Impressum/);

    await page.getByRole("contentinfo").getByRole("link", { name: "Datenschutz" }).click();
    await expect(page).toHaveURL(/\/datenschutz$/);
    await expect(page.getByRole("heading", { level: 1, name: /Datenschutz\u00AD?erklärung/ })).toBeVisible();

    await expect(page.getByRole("contentinfo").getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
  });

  test("unknown pages show the German 404", async ({ page }) => {
    const response = await page.goto("/diese-seite-gibt-es-nicht");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Hier fehlt ein Stück." })).toBeVisible();
  });

  test("robots.txt and sitemap.xml are served", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBeTruthy();
    const robotsText = await robots.text();
    for (const path of ["/studio", "/login", "/einrichten", "/api"]) {
      expect(robotsText).toContain(`Disallow: ${path}`);
    }

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    const sitemapText = await sitemap.text();
    expect(sitemapText).toContain("/impressum</loc>");
    expect(sitemapText).toContain("/datenschutz</loc>");
  });
});
