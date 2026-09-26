import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { DEFAULT_ADMIN_EMAIL, siteConfig } from "../../src/config/site";

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

    // Vinyl: honest note, planks instead of patterns.
    await page.getByRole("radiogroup", { name: "Material" }).getByRole("radio", { name: /^Vinyl/ }).click();
    await expect(page.getByRole("img", { name: "Vorschau: Vinyl-Diele in Nussbaum" })).toBeVisible();
    await expect(patterns).toHaveCount(0);
    await expect(page.locator("section#muster")).toContainText("Vinyl ist kein Naturmaterial");
  });

  test("no herringbone or Tafelparkett is offered anywhere on the page", async ({ page }) => {
    await open(page, "/");
    await expect(page.locator("main")).not.toContainText(/Fischgrät|Chevron|Tafelparkett|Würfelparkett/i);
    await expect(page.locator("section#leistungen")).toContainText("Möbelmontage");
  });

  test("only the public contact address appears on public pages", async ({ request }) => {
    for (const path of ["/", "/ratgeber", "/impressum", "/datenschutz", "/login", "/einrichten", "/gibt-es-nicht"]) {
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
        body: "Geölte Böden pflegst du mit **Holzbodenseife**:\n\n- nebelfeucht wischen\n- ab und zu nachölen",
      });
    });
    await open(page, "/");

    await page.getByRole("button", { name: /Mini-Aryo fragen/ }).click();
    const chat = page.getByRole("dialog", { name: "Mini-Aryo" });
    await expect(chat).toBeVisible();
    await expect(chat).toContainText("KI");
    await expect(chat.getByLabel("Deine Frage an Mini-Aryo")).toBeFocused();

    await chat.getByRole("button", { name: "Wie pflege ich einen geölten Holzboden?" }).click();
    await expect(chat.getByText("Holzbodenseife", { exact: true })).toBeVisible();
    await expect(chat.getByRole("listitem").filter({ hasText: "nebelfeucht wischen" })).toBeVisible();
    expect(sent).toEqual({ messages: [{ role: "user", content: "Wie pflege ich einen geölten Holzboden?" }] });

    await page.keyboard.press("Escape");
    await expect(chat).toBeHidden();
    await expect(page.getByRole("button", { name: /Mini-Aryo fragen/ })).toBeFocused();
  });

  test("Mini-Aryo brings the app hint only after an interaction and a calm moment", async ({ page }) => {
    // Playwright contexts are incognito, where Chromium never offers installing – fake its install event.
    await page.addInitScript(() => {
      window.addEventListener("load", () => {
        const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
          prompt: async () => {
            (window as unknown as { __prompted: boolean }).__prompted = true;
          },
          userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
        });
        window.dispatchEvent(event);
      });
    });
    await open(page, "/");
    const fab = page.getByRole("button", { name: /Mini-Aryo fragen/ });
    const badge = page.locator(".berater-badge");

    await expect(page.getByRole("contentinfo").getByRole("button", { name: "App installieren" })).toBeAttached();
    // Without any interaction nothing happens, not even the usual teaser.
    await page.waitForTimeout(4500);
    await expect(badge).toHaveCount(0);
    await expect(page.getByText(/Ich helfe gern/)).toHaveCount(0);

    // Scrolling counts as interaction; the message follows only after 3 s of calm.
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(1000);
    await expect(badge).toHaveCount(0);
    await expect(badge).toBeVisible();
    await expect(page.getByText(/mich gibt.s jetzt auch als App/)).toBeVisible();
    await expect(fab).toHaveAccessibleName(/1 neue Nachricht/);

    await fab.click();
    const chat = page.getByRole("dialog", { name: "Mini-Aryo" });
    await expect(chat).toContainText("Mich gibt's auch als App!");
    await expect(badge).toHaveCount(0);
    await chat.getByRole("button", { name: "Jetzt installieren" }).click();
    await expect(chat).toContainText("Klasse, die App ist installiert!");
    expect(await page.evaluate(() => (window as unknown as { __prompted?: boolean }).__prompted)).toBe(true);

    // Two weeks of quiet after that.
    await page.reload();
    await expect(page.locator('header[data-hydrated="true"]')).toBeAttached();
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(4500);
    await expect(badge).toHaveCount(0);
  });

  test("the site is an installable app", async ({ request }) => {
    const manifest = await (await request.get("/manifest.webmanifest")).json();
    expect(manifest).toMatchObject({ display: "standalone", start_url: "/", lang: "de" });
    for (const icon of manifest.icons as { src: string; purpose: string }[]) {
      const response = await request.get(icon.src);
      expect(response.headers()["content-type"]).toBe("image/png");
    }
    expect(manifest.icons.map((icon: { purpose: string }) => icon.purpose)).toContain("maskable");

    const worker = await request.get("/sw.js");
    expect(worker.headers()["cache-control"]).toContain("no-cache");
    expect(await worker.text()).toContain("/offline.html");
    const offline = await (await request.get("/offline.html")).text();
    expect(offline).toContain("Gerade keine Verbindung");
    expect(offline).toContain(siteConfig.email);
    expect(offline).toContain(siteConfig.name);
    expect(offline).not.toContain(DEFAULT_ADMIN_EMAIL);
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
    const input = chat.getByLabel("Deine Frage an Mini-Aryo");
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
    await chat.getByLabel("Deine Frage an Mini-Aryo").fill("Parkett auf Fußbodenheizung?");
    await chat.getByLabel("Deine Frage an Mini-Aryo").press("Enter");
    await expect(chat.getByRole("alert")).toContainText("Pause");
    await expect(chat.getByRole("alert").getByRole("link", { name: siteConfig.email })).toBeVisible();
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
    await check.getByRole("button", { name: "Klassisch und zeitlos" }).click();
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
    await expect(recommendations.filter({ hasText: "Schiffsboden" })).toHaveCount(1);
    await expect(check).not.toContainText(/Fischgrät|Chevron|Tafelparkett/);

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
