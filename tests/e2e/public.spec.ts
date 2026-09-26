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
    await expect(patterns.getByRole("radio")).toHaveCount(2);
    await expect(patterns).not.toContainText(/Fischgrät|Chevron|Tafelparkett/);
    const plank = patterns.getByRole("radio", { name: /Landhausdiele/ });
    const shipDeck = patterns.getByRole("radio", { name: /Schiffsboden/ });

    await expect(plank).toHaveAttribute("aria-checked", "true");
    await expect(shipDeck).toHaveAttribute("aria-checked", "false");

    // Radio-group keyboard semantics: arrows move selection and focus.
    await plank.focus();
    await page.keyboard.press("ArrowDown");
    await expect(shipDeck).toHaveAttribute("aria-checked", "true");
    await expect(shipDeck).toBeFocused();
    await expect(plank).toHaveAttribute("tabindex", "-1");

    await plank.click();
    await expect(plank).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("img", { name: /Vorschau: Landhausdiele/ })).toBeVisible();

    await shipDeck.click();
    const walnut = page.getByRole("radiogroup", { name: "Holzton" }).getByRole("radio", { name: /Nussbaum/ });
    await walnut.click();
    await expect(walnut).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("img", { name: "Vorschau: Schiffsboden in Nussbaum" })).toBeVisible();
  });

  test("no herringbone or Tafelparkett is offered anywhere on the page", async ({ page }) => {
    await open(page, "/");
    await expect(page.locator("main")).not.toContainText(/Fischgrät|Chevron|Tafelparkett|Würfelparkett/i);
    await expect(page.locator("section#leistungen")).toContainText("Möbelmontage");
  });

  test("only the public contact address appears on public pages", async ({ request }) => {
    for (const path of ["/", "/impressum", "/datenschutz", "/login", "/einrichten", "/gibt-es-nicht"]) {
      const html = await (await request.get(path)).text();
      expect(html, path).not.toContain("aryo.kontakt");
    }
    const home = await (await request.get("/")).text();
    expect(home).toContain("Maximilian.Parkett@gmail.com");
  });

  test("Mini-Aryo answers in a streamed chat", async ({ page }) => {
    let sent: unknown;
    await page.route("/api/berater", async (route) => {
      sent = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "text/plain; charset=utf-8",
        body: "Geölte Böden pflegen Sie mit **Holzbodenseife**:\n\n- nebelfeucht wischen\n- ab und zu nachölen",
      });
    });
    await open(page, "/");

    await page.getByRole("button", { name: /Mini-Aryo fragen/ }).click();
    const chat = page.getByRole("dialog", { name: "Mini-Aryo" });
    await expect(chat).toBeVisible();
    await expect(chat).toContainText("KI");
    await expect(chat.getByLabel("Ihre Frage an Mini-Aryo")).toBeFocused();

    await chat.getByRole("button", { name: "Wie pflege ich einen geölten Holzboden?" }).click();
    await expect(chat.getByText("Holzbodenseife", { exact: true })).toBeVisible();
    await expect(chat.getByRole("listitem").filter({ hasText: "nebelfeucht wischen" })).toBeVisible();
    expect(sent).toEqual({ messages: [{ role: "user", content: "Wie pflege ich einen geölten Holzboden?" }] });

    await page.keyboard.press("Escape");
    await expect(chat).toBeHidden();
    await expect(page.getByRole("button", { name: /Mini-Aryo fragen/ })).toBeFocused();
  });

  test("Mini-Aryo shows a live countdown when the hourly limit is reached", async ({ page }) => {
    await page.route("/api/berater", (route) =>
      route.fulfill({
        status: 429,
        contentType: "application/json",
        headers: { "Retry-After": "125" },
        body: JSON.stringify({ error: "rate_limited", retryAfter: 125 }),
      }),
    );
    await open(page, "/");
    await page.getByRole("button", { name: /Mini-Aryo fragen/ }).click();
    const chat = page.getByRole("dialog", { name: "Mini-Aryo" });
    const input = chat.getByLabel("Ihre Frage an Mini-Aryo");
    await input.fill("Wie oft kann ich Parkett schleifen?");
    await input.press("Enter");

    const alert = chat.getByRole("alert");
    await expect(alert).toContainText("10 Fragen pro Stunde");
    const timer = alert.getByRole("timer");
    await expect(timer).toHaveText(/^2:0[0-5]$/);
    const first = await timer.textContent();
    await expect(timer).not.toHaveText(first ?? "", { timeout: 3000 });
    await expect(input).toHaveValue("Wie oft kann ich Parkett schleifen?");
    await expect(chat.getByRole("button", { name: "Frage senden" })).toBeDisabled();
  });

  test("Mini-Aryo falls back to the e-mail address without an API key", async ({ page, request }) => {
    const response = await request.post("/api/berater", {
      data: { messages: [{ role: "user", content: "Hallo" }] },
    });
    expect(response.status()).toBe(503);
    expect(await response.json()).toEqual({ error: "not_configured" });

    await open(page, "/impressum");
    await page.getByRole("button", { name: /Mini-Aryo fragen/ }).click();
    const chat = page.getByRole("dialog", { name: "Mini-Aryo" });
    await chat.getByLabel("Ihre Frage an Mini-Aryo").fill("Parkett auf Fußbodenheizung?");
    await chat.getByLabel("Ihre Frage an Mini-Aryo").press("Enter");
    await expect(chat.getByRole("alert")).toContainText("Pause");
    await expect(chat.getByRole("alert").getByRole("link", { name: siteConfig.email })).toBeVisible();
  });

  test("contact section offers mailto links and a mailto form", async ({ page }) => {
    await open(page, "/");
    const contact = page.locator("section#kontakt");

    await expect(contact.getByRole("link", { name: "E-Mail schreiben" })).toHaveAttribute(
      "href",
      /^mailto:Maximilian\.Parkett@gmail\.com\?subject=/,
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
