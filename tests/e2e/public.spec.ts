import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { siteConfig } from "../../src/config/site";

// Public landing page against a fresh embedded database (see playwright.config.ts). The spec runs
// on the desktop and the mobile project, so every submitted e-mail address is unique per project.

/** Navigates and waits until React has hydrated the page (client components are interactive). */
async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('header[data-hydrated="true"]')).toBeAttached();
}

/** The server actions treat forms sent faster than 2.5 s after mount as bots. */
async function waitForFillTime(page: Page) {
  await page.waitForTimeout(2_600);
}

const emailFor = (testInfo: TestInfo, form: string) => `${form}-${testInfo.project.name}@example.com`;

const SECTIONS: ReadonlyArray<readonly [id: string, title: string | RegExp]> = [
  ["kontingent", /^Ich verlege nur \d+ Böden im Jahr\. Einen pro Monat\.$/],
  ["haltung", "Man läuft jeden Tag darauf."],
  ["wege", "Wie viel willst du selbst machen?"],
  ["vergleich", "Gleiche Wohnung. Anderer Boden."],
  ["muster", "Böden zum Anfassen"],
  ["boden-check", "In 7 Schritten zu deinem Boden."],
  ["leistungen", "Leistungen"],
  ["abos", "Wie die Heizungswartung, nur für deinen Boden."],
  ["sprechstunde", "Eine Stunde, die dir teure Fehler erspart."],
  ["profis", "Bewerbung statt Anfrage."],
  ["ratgeber", "Worauf es ankommt."],
  ["kontakt", "Kontakt und Notfall"],
];

test.describe("public site", () => {
  test("landing renders the claim, all sections and structured data", async ({ page }) => {
    await open(page, "/");

    await expect(page).toHaveTitle(/Maximilian Parkett/);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Da stehst du drauf.");

    for (const [id, title] of SECTIONS) {
      const heading = page.locator(`section#${id} h2#${id}-title`);
      await expect(heading, `section #${id}`).toHaveCount(1);
      await expect(heading).toHaveText(title);
    }

    // Live counters from the (fresh) database, and no invented prices.
    await expect(page.locator("section#kontingent")).toContainText(/Noch \d+ Projektpl/);
    const services = page.locator("section#leistungen");
    await expect(services).not.toContainText("€");
    await expect(services).not.toContainText(/auf Anfrage/i);
    await expect(page.locator("body")).not.toContainText(/Meisterbetrieb Maximilian|Parkettleger Maximilian/);

    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(JSON.parse(jsonLd ?? "{}")).toMatchObject({
      "@type": "HomeAndConstructionBusiness",
      email: siteConfig.email,
    });
  });

  test("desktop navigation jumps to the sections", async ({ page, isMobile }) => {
    test.skip(isMobile, "The desktop navigation is hidden on small screens.");
    await open(page, "/");

    const nav = page.getByRole("navigation", { name: "Hauptnavigation" });
    await expect(nav.getByRole("link", { name: "Ratgeber" })).toHaveAttribute("href", "/ratgeber");

    await nav.getByRole("link", { name: "Sprechstunde" }).click();
    await expect(page).toHaveURL(/#sprechstunde$/);
    await expect(page.locator("#sprechstunde-title")).toBeInViewport();

    await nav.getByRole("link", { name: "Für Profis" }).click();
    await expect(page).toHaveURL(/#profis$/);
    await expect(page.locator("#profis-title")).toBeInViewport();

    await page.getByRole("banner").getByRole("link", { name: "Boden-Check starten" }).click();
    await expect(page).toHaveURL(/#boden-check$/);
    await expect(page.locator("#boden-check-title")).toBeInViewport();

    await expect(page.getByRole("banner").getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
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
    await menu.getByRole("link", { name: /Sprechstunde$/ }).click();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/#sprechstunde$/);
    await expect(page.locator("#sprechstunde-title")).toBeInViewport();
  });

  test("floor explorer switches material, pattern and wood tone", async ({ page }) => {
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

    // Vinyl: honest note, planks instead of patterns.
    await page.getByRole("radiogroup", { name: "Material" }).getByRole("radio", { name: /^Vinyl/ }).click();
    await expect(page.getByRole("img", { name: "Vorschau: Vinyl-Diele in Nussbaum" })).toBeVisible();
    await expect(patterns).toHaveCount(0);
    await expect(page.locator("section#muster")).toContainText("Vinyl ist kein Naturmaterial");
  });

  test("before/after slider works with keyboard and pointer", async ({ page, isMobile }) => {
    await open(page, "/#vergleich");

    const slider = page.getByRole("slider", { name: "Vorher und Nachher vergleichen" });
    await expect(slider).toHaveValue("50");
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await expect(slider).toHaveValue("51");
    await page.keyboard.press("End");
    await expect(slider).toHaveValue("100");

    if (!isMobile) {
      const comparison = slider.locator("..");
      await comparison.scrollIntoViewIfNeeded();
      const box = await comparison.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.6, { steps: 6 });
        await page.mouse.up();
        await expect(slider).toHaveValue("25");
      }
    }

    const section = page.locator("section#vergleich");
    const laminate = section.getByRole("button", { name: /Graues Laminat/ });
    await laminate.click();
    await expect(laminate).toHaveAttribute("aria-pressed", "true");
    await expect(section.getByText("Eiche Landhausdiele, natur", { exact: true })).toBeVisible();
  });

  test("Boden-Check leads to three recommendations and stores the profile", async ({ page }, testInfo) => {
    await open(page, "/#boden-check");
    const check = page.locator("section#boden-check");
    const next = check.getByRole("button", { name: "Weiter" });

    const living = check.getByRole("button", { name: "Wohnzimmer" });
    await living.click();
    await expect(living).toHaveAttribute("aria-pressed", "true");
    await next.click();

    await expect(check.getByRole("heading", { name: "Wer lebt auf dem Boden?" })).toBeVisible();
    await check.getByRole("button", { name: "Hund" }).click();
    await next.click();
    await check.getByRole("button", { name: "Klassisch mit Muster" }).click();
    // Klima, Bestand and Wer macht's stay unanswered (all optional).
    for (let step = 0; step < 4; step += 1) await next.click();

    await expect(check.getByRole("heading", { name: "Wann soll es losgehen?" })).toBeVisible();
    await check.getByRole("button", { name: "So bald wie möglich" }).click();
    await check.getByLabel("Postleitzahl").fill("45130");
    await check.getByRole("button", { name: "Bodenprofil ansehen" }).click();

    await expect(check.getByRole("heading", { name: "Drei Böden, die zu dir passen." })).toBeVisible();
    const recommendations = check.getByRole("list", { name: "Empfehlungen" }).getByRole("listitem");
    await expect(recommendations).toHaveCount(3);
    await expect(recommendations.first()).toContainText("Passt am besten");
    await expect(check.getByText("Verlegung über Meisterpartner")).toBeVisible();

    await check.getByLabel("Name", { exact: true }).fill("Erika Muster");
    await check.getByLabel("E-Mail", { exact: true }).fill(emailFor(testInfo, "boden-check"));
    await expect(check.getByLabel("Postleitzahl")).toHaveValue("45130");
    await waitForFillTime(page);
    await check.getByRole("button", { name: "Bodenprofil per E-Mail schicken" }).click();

    await expect(check.getByRole("status")).toContainText("Dein Bodenprofil ist gespeichert");
    await expect(check.getByRole("link", { name: "Zur Boden-Sprechstunde anmelden" })).toHaveAttribute("href", "#sprechstunde");
  });

  test("office hour registration reserves a seat", async ({ page }, testInfo) => {
    await open(page, "/#sprechstunde");
    const section = page.locator("section#sprechstunde");

    const dates = section.getByRole("radio");
    await expect(dates.first()).toBeChecked();
    expect(await dates.count()).toBeGreaterThanOrEqual(2);
    await expect(section).toContainText("Er gilt nur, wenn");

    await section.getByLabel("Vorname").fill("Erika");
    await section.getByLabel("E-Mail", { exact: true }).fill(emailFor(testInfo, "sprechstunde"));
    await expect(section.getByRole("checkbox", { name: /Newsletter/ })).not.toBeChecked();
    await waitForFillTime(page);
    await section.getByRole("button", { name: "Platz sichern" }).click();

    await expect(section.getByRole("status")).toContainText("Dein Platz ist reserviert");
  });

  test("emergency form reports a missing postal code, then succeeds", async ({ page }, testInfo) => {
    await open(page, "/#kontakt");
    const contact = page.locator("section#kontakt");

    await contact.getByLabel("Name", { exact: true }).fill("Erika Muster");
    await contact.getByLabel("E-Mail", { exact: true }).fill(emailFor(testInfo, "notfall"));
    await contact.getByLabel("Was ist passiert?").selectOption("Kratzer oder Dellen");
    await contact.getByLabel("Beschreibung").fill("Tiefer Kratzer im Flur, etwa 10 cm lang.");
    await waitForFillTime(page);
    await contact.getByRole("button", { name: "Schaden melden" }).click();

    await expect(contact.getByRole("alert")).toContainText("Bitte prüf die markierten Felder.");
    const postalCode = contact.getByLabel("PLZ", { exact: true });
    await expect(postalCode).toHaveAttribute("aria-invalid", "true");
    await expect(contact.getByText("Bitte gib eine fünfstellige Postleitzahl an.")).toBeVisible();
    await expect(contact.getByLabel("Name", { exact: true })).toHaveValue("Erika Muster");

    await postalCode.fill("53225");
    await contact.getByRole("button", { name: "Schaden melden" }).click();
    await expect(contact.getByRole("status")).toContainText("Schick mir jetzt bitte");

    await expect(contact.getByRole("link", { name: "E-Mail schreiben" })).toHaveAttribute("href", `mailto:${siteConfig.email}`);
    await expect(contact.getByRole("link", { name: "Anrufen" })).toHaveCount(siteConfig.phone ? 1 : 0);
  });

  test("guide teasers link to the Ratgeber", async ({ page }) => {
    await open(page, "/");
    const guides = page.locator("section#ratgeber");
    await expect(guides.getByRole("link", { name: "Alle Ratgeber" })).toHaveAttribute("href", "/ratgeber");
    for (const href of ["/ratgeber/hund-kinder-rotwein", "/ratgeber/fussbodenheizung-und-holz", "/ratgeber/kosten-pro-jahr"]) {
      await expect(guides.locator(`a[href="${href}"]`)).toHaveCount(1);
    }
  });

  test("Impressum and Datenschutz are reachable from the footer", async ({ page }) => {
    await open(page, "/");
    const footer = page.getByRole("contentinfo");

    await expect(footer.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
    await expect(footer.getByRole("link", { name: "Als Partner bewerben" })).toHaveAttribute("href", "#profis");

    await footer.getByRole("link", { name: "Impressum" }).click();
    await expect(page).toHaveURL(/\/impressum$/);
    await expect(page.getByRole("heading", { level: 1, name: /Impressum/ })).toBeVisible();

    // Outside the landing page, section links point back to it.
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "Als Partner bewerben" })).toHaveAttribute(
      "href",
      "/#profis",
    );

    await page.getByRole("contentinfo").getByRole("link", { name: "Datenschutz" }).click();
    await expect(page).toHaveURL(/\/datenschutz$/);
    await expect(page.getByRole("heading", { level: 1, name: /Datenschutz/ })).toBeVisible();
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
