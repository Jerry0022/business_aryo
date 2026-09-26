import { expect, test, type Page } from "@playwright/test";

// Stateful flow against a fresh embedded database (see playwright.config.ts → migrate --fresh).
// Runs once, on the desktop project, in order.

const ADMIN = { name: "Aryo Sabouri", email: "aryo.kontakt@gmail.com", password: "Traumhaus-E2E-2026" };
const MEMBER = { name: "Lea Beispiel", email: "lea@example.com", password: "Einladung-2026!" };
const SETUP_TOKEN = "e2e-setup-token";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The account flow runs once on desktop.");
  // Keep the software-rendered WebGL scene light in CI.
  await page.addInitScript(() => window.localStorage.setItem("dream-house-quality", "low"));
});

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-Mail").fill(email);
  await page.getByLabel("Passwort").fill(password);
  await page.getByRole("button", { name: "Anmelden" }).click();
}

// The software-rendered WebGL scene can block the main thread for a while in CI, which delays
// client-side URL updates. Wait for the studio UI itself instead of the address bar.
const STUDIO_TIMEOUT = 60_000;

async function loginAndOpenStudio(page: Page, email: string, password: string) {
  await login(page, email, password);
  await expect(page.getByRole("link", { name: "Traumhaus" })).toBeVisible({ timeout: STUDIO_TIMEOUT });
}

test("the studio requires a login", async ({ page }) => {
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("link", { name: "Studio einrichten" })).toBeVisible();
});

test("the setup rejects a wrong code", async ({ page }) => {
  await page.goto("/einrichten");
  await page.getByLabel("E-Mail").fill(ADMIN.email);
  await page.getByLabel("Passwort", { exact: true }).fill(ADMIN.password);
  await page.getByLabel("Passwort wiederholen").fill(ADMIN.password);
  await page.getByLabel("Einrichtungscode").fill("falsch");
  await page.getByRole("button", { name: /Konto anlegen/ }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Der Einrichtungscode ist ungültig.");
});

test("the admin sets up the studio and lands in the 3D view", async ({ page }) => {
  await page.goto("/einrichten");
  // The admin address is never prefilled: /einrichten is reachable without login.
  await expect(page.getByLabel("E-Mail")).toHaveValue("");
  await page.getByLabel("E-Mail").fill(ADMIN.email);
  await page.getByLabel("Passwort", { exact: true }).fill(ADMIN.password);
  await page.getByLabel("Passwort wiederholen").fill(ADMIN.password);
  await page.getByLabel("Einrichtungscode").fill(SETUP_TOKEN);
  await page.getByRole("button", { name: /Konto anlegen/ }).click();

  await expect(page.getByRole("link", { name: "Nutzer" })).toBeVisible({ timeout: STUDIO_TIMEOUT });
  await expect(page.getByRole("radiogroup", { name: "Ansicht" })).toBeVisible();
  const rooms = page.getByRole("list", { name: "Räume" });
  await expect(rooms.getByRole("button", { name: /Dachterrasse/ })).toContainText("20/20");
  await expect(page.locator("canvas")).toBeAttached({ timeout: 30_000 });

  // Day/night toggle and walk mode.
  await page.getByRole("button", { name: "Nacht", exact: true }).click();
  await expect(page.getByText("22:30")).toBeVisible({ timeout: STUDIO_TIMEOUT });
  await page.getByRole("radio", { name: "Begehen" }).click();
  await expect(page.getByText("Ins Bild klicken, um sich umzusehen")).toBeVisible();
});

test("the setup page is closed once an admin exists", async ({ page }) => {
  await page.goto("/einrichten");
  await expect(page).toHaveURL(/\/login$/);
});

test("a wrong password is rejected", async ({ page }) => {
  await login(page, ADMIN.email, "falsches-passwort");
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("E-Mail oder Passwort ist falsch.");
});

test("the admin invites, bans and unbans a user", async ({ page }) => {
  await loginAndOpenStudio(page, ADMIN.email, ADMIN.password);
  await page.goto("/studio/benutzer");
  await expect(page.getByRole("heading", { name: "Nutzerverwaltung" })).toBeVisible();

  const accounts = page.getByRole("list", { name: "Konten" });
  const adminRow = accounts.getByRole("listitem").filter({ hasText: ADMIN.email });
  await expect(adminRow).toContainText("Haupt-Admin");
  await expect(adminRow.getByRole("button", { name: "Löschen" })).toBeDisabled();

  await page.getByRole("button", { name: "Nutzer anlegen" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(MEMBER.name);
  await dialog.getByLabel("E-Mail").fill(MEMBER.email);
  await dialog.getByLabel("Start-Passwort").fill(MEMBER.password);
  await dialog.getByRole("button", { name: "Anlegen" }).click();
  await expect(page.getByRole("status")).toContainText("Konto wurde angelegt");

  const memberRow = accounts.getByRole("listitem").filter({ hasText: MEMBER.email });
  await expect(memberRow).toContainText("Nutzer");
  await expect(memberRow).toContainText("Aktiv");

  await memberRow.getByRole("button", { name: "Sperren" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Sperren" }).click();
  await expect(memberRow).toContainText("Gesperrt");

  await memberRow.getByRole("button", { name: "Entsperren" }).click();
  await expect(memberRow).toContainText("Aktiv");
});

test("an invited user sees the dream house but not the user management", async ({ page }) => {
  await loginAndOpenStudio(page, MEMBER.email, MEMBER.password);
  await expect(page.getByRole("link", { name: "Traumhaus" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Nutzer" })).toHaveCount(0);
  await page.goto("/studio/benutzer");
  await expect(page).toHaveURL(/\/studio$/, { timeout: STUDIO_TIMEOUT });
});

test("the admin deletes the user", async ({ page }) => {
  await loginAndOpenStudio(page, ADMIN.email, ADMIN.password);
  await page.goto("/studio/benutzer");
  const memberRow = page.getByRole("list", { name: "Konten" }).getByRole("listitem").filter({ hasText: MEMBER.email });
  await memberRow.getByRole("button", { name: "Löschen" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Endgültig löschen" }).click();
  await expect(page.getByRole("status")).toContainText("wurde gelöscht");
  await expect(memberRow).toHaveCount(0);
});

test("signing out returns to the login", async ({ page }) => {
  await loginAndOpenStudio(page, ADMIN.email, ADMIN.password);
  await page.getByRole("button", { name: "Abmelden" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/login$/);
});
