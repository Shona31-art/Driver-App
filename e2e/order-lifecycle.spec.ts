import path from "path";
import { test, expect, type Page } from "@playwright/test";

// Exercises the full order lifecycle end to end, in the order a real user
// would move through it, against the seeded test accounts (see
// supabase/seed.sql -- password "Password123!" for all three):
//   Super Admin creates + assigns an order
//     -> Driver confirms, loads, delivers, logs an expense linked to it
//   -> Super Admin approves the expense and marks the order completed
//
// This creates one real order and one real expense row in whatever
// Supabase project .env.local points at. It's additive only (nothing is
// deleted), matching the seed data's own dev-only fake credentials.
const FIXTURE = path.join(__dirname, "fixtures/test-upload.png");
const PASSWORD = "Password123!";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/(admin|driver)\/dashboard/, { timeout: 90_000 });
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL(/\/login/, { timeout: 90_000 });
}

test("full order lifecycle: create -> assign -> confirm -> load -> deliver -> expense -> review -> complete", async ({
  page,
}) => {
  const customerName = `E2E Customer ${Date.now()}`;
  const consoleErrors: string[] = [];
  page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`console.error: ${msg.text()}`);
  });

  let orderUrl = "";

  await test.step("Super Admin logs in", async () => {
    await login(page, "superadmin@example.com");
  });

  await test.step("Create a new order, assigned to the seeded driver", async () => {
    await page.goto("/admin/orders/new");
    await page.getByLabel("Customer").fill(customerName);
    await page.getByLabel("Pickup address").fill("1 Test Pickup St, Cape Town");
    await page.getByLabel("Delivery address").fill("2 Test Delivery Ave, Johannesburg");
    await page.getByLabel("Pickup date").fill("2026-08-01");
    await page.getByLabel("Delivery date").fill("2026-08-02");
    await page.getByLabel("Weight (tons)").fill("12");
    await page.getByLabel("Horse registration").fill("TEST123GP");
    await page.getByLabel("Assign driver").click();
    await page.getByRole("option", { name: /Sipho Driver/ }).click();
    await page.getByRole("button", { name: "Create order" }).click();
    await page.waitForURL(/\/admin\/orders$/, { timeout: 90_000 });
    await expect(page.getByText(customerName)).toBeVisible();
  });

  await test.step("Open the new order from the list", async () => {
    const row = page.getByRole("row", { name: new RegExp(customerName) });
    await row.getByRole("link").click();
    await page.waitForURL(/\/admin\/orders\/[0-9a-f-]+$/, { timeout: 90_000 });
    orderUrl = page.url();
    // Scoped to the status badge specifically (data-slot="badge") -- the
    // order progress tracker on this same page also renders an "Assigned"
    // stage label, which would otherwise make this match ambiguous.
    await expect(page.locator('[data-slot="badge"]', { hasText: "Assigned" })).toBeVisible();
  });

  await test.step("Sign out and log in as the driver", async () => {
    await logout(page);
    await login(page, "driver@example.com");
  });

  await test.step("Driver confirms the assignment", async () => {
    await page.goto(orderUrl.replace("/admin/orders/", "/driver/orders/"));
    await page.getByRole("button", { name: "Confirm Assignment" }).click();
    await expect(page.getByText(/Assignment confirmed/)).toBeVisible({ timeout: 90_000 });
  });

  await test.step("Driver marks the load as Loaded", async () => {
    // The wizard auto-advances to the "Load" step after confirming, so the
    // form is already visible inline -- no trigger button to open a dialog.
    await page.getByLabel("Begin KM").fill("1000");
    await page.getByLabel("Loading documents (PDF, JPG, or PNG)").setInputFiles(FIXTURE);
    await page.getByRole("button", { name: "Confirm Loaded" }).click();
    await expect(page.getByText(/Marked as loaded/)).toBeVisible({ timeout: 90_000 });
  });

  await test.step("Driver marks the load as Delivered", async () => {
    // Same here -- auto-advanced to the "Deliver" step already.
    await page.getByLabel("End KM").fill("1200");
    await page.getByLabel("Delivery documents (PDF, JPG, or PNG)").setInputFiles(FIXTURE);
    await page.getByLabel("Completed Driver POD").setInputFiles(FIXTURE);
    await page.getByRole("button", { name: "Confirm Delivered" }).click();
    await expect(page.getByText(/Marked as delivered/)).toBeVisible({ timeout: 90_000 });
  });

  await test.step("Driver logs an expense linked to this order", async () => {
    await page.getByRole("link", { name: "Log an expense for this order" }).click();
    await page.waitForURL(/\/driver\/expenses\?orderId=/, { timeout: 90_000 });
    await expect(page.getByRole("dialog", { name: "Submit expense" })).toBeVisible();
    await page.getByLabel("Amount (ZAR)").fill("350");
    await page.getByLabel("Date").fill("2026-08-02");
    await page.getByLabel("Upload slip").setInputFiles(FIXTURE);
    await page.getByRole("button", { name: "Submit expense" }).click();
    await expect(page.getByText(/Expense submitted/)).toBeVisible({ timeout: 90_000 });
  });

  await test.step("Sign out and log back in as Super Admin", async () => {
    await logout(page);
    await login(page, "superadmin@example.com");
  });

  await test.step("Approve the driver's expense", async () => {
    await page.goto("/admin/expenses");
    const row = page.getByRole("row").filter({ hasText: "Sipho Driver" }).filter({ hasText: "350.00" }).first();
    await row.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText(/Expense approved/)).toBeVisible({ timeout: 90_000 });
  });

  await test.step("Mark the order as completed", async () => {
    await page.goto(orderUrl);
    await page.getByRole("button", { name: "Mark Completed" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText(/Order marked as completed/)).toBeVisible({ timeout: 90_000 });
  });

  expect(consoleErrors, `Console/page errors detected:\n${consoleErrors.join("\n")}`).toEqual([]);
});
