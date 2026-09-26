import { devices, expect, test, type Page } from "@playwright/test";
import { addDays, holidayMap, isoWeekday, parseDateKey, todayKey } from "../../src/lib/business/calendar";

// The admin area ("Werkbank") against the same fresh database as studio.spec.ts. Runs once, on the
// desktop project, in order, with one shared session: sign-in is rate limited (5 per minute) and
// studio.spec.ts signs in several times right before. The admin may already exist.

const ADMIN = { email: "aryo.kontakt@gmail.com", password: "Traumhaus-E2E-2026" };
const SETUP_TOKEN = "e2e-setup-token";
const TIMEOUT = 60_000;

test.describe.configure({ mode: "serial" });

let page: Page;

test.beforeAll(async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The Werkbank flow runs once on desktop.");
  testInfo.setTimeout(240_000);
  const context = await browser.newContext({ ...devices["Desktop Chrome"], baseURL: testInfo.project.use.baseURL });
  await context.addInitScript(() => window.localStorage.setItem("dream-house-quality", "low"));
  page = await context.newPage();
  await signIn(page);
});

test.afterAll(async () => {
  await page?.context().close();
});

async function signIn(target: Page) {
  await target.goto("/einrichten");
  if (new URL(target.url()).pathname === "/einrichten") {
    // The admin address is never prefilled: /einrichten is reachable without login.
    await target.getByLabel("E-Mail").fill(ADMIN.email);
    await target.getByLabel("Passwort", { exact: true }).fill(ADMIN.password);
    await target.getByLabel("Passwort wiederholen").fill(ADMIN.password);
    await target.getByLabel("Einrichtungscode").fill(SETUP_TOKEN);
    await target.getByRole("button", { name: /Konto anlegen/ }).click();
  } else {
    await target.goto("/login");
    await target.getByLabel("E-Mail").fill(ADMIN.email);
    await target.getByLabel("Passwort").fill(ADMIN.password);
    await target.getByRole("button", { name: "Anmelden" }).click();
    const limited = target.getByText("Zu viele Versuche");
    const signedIn = target.getByRole("link", { name: "Werkbank" });
    await expect(limited.or(signedIn)).toBeVisible({ timeout: TIMEOUT });
    if (await limited.isVisible()) {
      // Wait for the rate-limit window of the earlier specs to pass, then try once more.
      await target.waitForTimeout(61_000);
      await target.getByRole("button", { name: "Anmelden" }).click();
    }
  }
  await expect(target.getByRole("link", { name: "Werkbank" })).toBeVisible({ timeout: TIMEOUT });
}

async function openWerkbank(target: Page, path = "") {
  await target.goto(`/studio/werkbank${path}`);
  await expect(target.getByRole("navigation", { name: "Werkbank" })).toBeVisible({ timeout: TIMEOUT });
}

/** Next Tuesday (inside the work window in both week types) that is not a holiday. */
function nextWorkingTuesday(): string {
  let key = addDays(todayKey(), 1);
  const holidays = holidayMap([parseDateKey(key).year, parseDateKey(key).year + 1]);
  while (isoWeekday(key) !== 2 || holidays.has(key)) key = addDays(key, 1);
  return key;
}

test("the admin opens the Werkbank from the studio navigation", async () => {
  await page.getByRole("link", { name: "Werkbank" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Übersicht" })).toBeVisible({ timeout: TIMEOUT });
  const nav = page.getByRole("navigation", { name: "Werkbank" });
  for (const name of ["Kalender", "Anfragen", "Projekte", "Kunden & Boden-Pässe", "Sprechstunde", "Werkzeug", "Abos", "Preise & Leistungen", "Einstellungen"]) {
    // Leads from the public specs add a badge ("Anfragen 2 neue") when the suite runs as a whole.
    // The labels contain no regex metacharacters.
    const label = new RegExp(`^${name}( \\d+ neue)?$`);
    await expect(nav.getByRole("link", { name: label })).toBeVisible();
  }
  await expect(page.getByText("Der Zähler auf der Website kommt direkt aus diesem Kalender.")).toBeVisible();
  const analytics = page.getByRole("link", { name: /Analytics/ });
  await expect(analytics).toHaveAttribute("href", "/studio/werkbank/einstellungen#posthog");
  await expect(analytics).toContainText("nicht verbunden");
});

test("a net price for the Erstberatung appears on the public page", async () => {
  const priceField = page.getByLabel("Preis netto für Erstberatung vor Ort");
  await openWerkbank(page, "/preise");
  await priceField.fill("89");
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(page.getByText(/Leistung gespeichert/)).toBeVisible();
  const row = page.getByRole("listitem").filter({ has: priceField });
  await expect(row).toContainText("sichtbar mit Preis: 105,91 €");

  await page.goto("/");
  const services = page.locator("section#leistungen");
  await expect(services.getByText(/105,91\s€/).first()).toBeVisible();

  // Remove the price again: the public specs of the mobile project expect a catalog without prices.
  await openWerkbank(page, "/preise");
  await priceField.fill("");
  await page.getByRole("button", { name: "Änderungen speichern" }).click();
  await expect(page.getByText(/Leistung gespeichert/)).toBeVisible();
  await page.goto("/");
  await expect(services).not.toContainText("€");
});

test("an active Meister partner unlocks the Meister services", async () => {
  await openWerkbank(page, "/einstellungen");
  await page.getByRole("button", { name: "Partner hinzufügen" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Betrieb", { exact: true }).fill("Parkett Hartmann GmbH");
  await dialog.getByLabel("Gewerk").fill("Parkettleger");
  await dialog.getByLabel("Status", { exact: true }).selectOption({ label: "Aktiv" });
  await dialog.getByLabel("Parkettleger-Meisterbetrieb").check();
  await dialog.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "Parkett Hartmann GmbH" })).toBeVisible();
  await expect(dialog.getByText("Aktiver Meisterpartner")).toBeVisible();
  await page.getByRole("button", { name: "Schließen" }).click();

  await openWerkbank(page, "/preise");
  const row = page.getByRole("listitem").filter({ has: page.getByLabel("Preis netto für Parkett schleifen und versiegeln") });
  await expect(row).toContainText("Website: sichtbar");

  await page.goto("/");
  await expect(page.locator("section#leistungen").getByText("Parkett schleifen und versiegeln")).toBeVisible();
});

test("a new calendar event shows up in the agenda", async () => {
  const date = nextWorkingTuesday();
  await openWerkbank(page, `/kalender?ansicht=woche&datum=${date}`);
  await page.getByRole("button", { name: "Termin", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Art", { exact: true }).selectOption({ label: "Büro" });
  await dialog.getByLabel("Titel", { exact: true }).fill("E2E Büro-Termin");
  await dialog.getByLabel("Datum", { exact: true }).fill(date);
  await dialog.getByLabel("Beginn", { exact: true }).fill("09:00");
  await dialog.getByLabel("Ende", { exact: true }).fill("11:00");
  await expect(dialog.getByText(/danach 2 von 20 h geplant/)).toBeVisible();
  await dialog.getByRole("button", { name: "Termin anlegen" }).click();
  const confirm = dialog.getByRole("button", { name: "Trotzdem eintragen" });
  if (await confirm.isVisible()) await confirm.click();
  await expect(dialog.getByRole("heading", { name: "E2E Büro-Termin" })).toBeVisible();
  await page.getByRole("button", { name: "Schließen" }).click();

  await openWerkbank(page, `/kalender?ansicht=agenda&datum=${date}`);
  await expect(page.getByRole("button", { name: /E2E Büro-Termin/ }).first()).toBeVisible();
  await page.getByRole("button", { name: /E2E Büro-Termin/ }).first().click();
  await expect(page.getByRole("dialog").getByText("Verknüpft mit")).toBeVisible();
});

test("a booked project with a Projektplatz changes the counter", async () => {
  await openWerkbank(page);
  const label = await page.getByText(/^Projektplätze \d{4}$/).first().textContent();
  const year = label?.match(/\d{4}/)?.[0] ?? "2027";
  const counter = page.getByText(/Auf der Website: noch \d+ frei/);
  const before = Number((await counter.textContent())?.match(/noch (\d+) frei/)?.[1]);
  expect(before).toBeGreaterThan(0);

  await openWerkbank(page, "/projekte");
  await page.getByRole("button", { name: "Neues Projekt" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Titel", { exact: true }).fill("E2E Projekt Eiche");
  await dialog.getByLabel("Status", { exact: true }).selectOption({ label: "Gebucht" });
  await dialog.getByLabel("Platz-Jahr").selectOption(year);
  await dialog.getByLabel("Platz-Monat").selectOption({ label: "März" });
  await expect(dialog.getByText(`noch ${before - 1} von`)).toBeVisible();
  await dialog.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "E2E Projekt Eiche" })).toBeVisible();
  await page.getByRole("button", { name: "Schließen" }).click();

  await openWerkbank(page);
  await expect(page.getByText(`Auf der Website: noch ${before - 1} frei`)).toBeVisible();
});
