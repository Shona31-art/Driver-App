import path from "path";
import fs from "fs";
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

// Playwright runs as a plain Node process (unlike Next.js, which loads
// .env.local automatically) -- read it directly so this test can query
// Supabase's REST API for the offload PIN below.
function loadEnvLocal(): Record<string, string> {
  const envPath = path.join(__dirname, "../.env.local");
  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim();
  }
  return env;
}
const ENV = loadEnvLocal();

// The offload PIN is a random 6-digit code the DB trigger generates the
// moment an order is marked Loaded -- there's no way to predict it, and
// (per the new PIN-confirmation design) it's deliberately not shown to the
// driver in the UI, so this test reads it straight from Supabase using the
// service role key, exactly as an admin relaying it to the customer would
// need to see it, without needing to click through the admin UI for it.
async function getOffloadPin(orderId: string): Promise<string> {
  const res = await fetch(`${ENV.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=offload_pin`, {
    headers: {
      apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  const rows = (await res.json()) as { offload_pin: string | null }[];
  if (!rows[0]?.offload_pin) throw new Error(`No offload_pin found for order ${orderId}`);
  return rows[0].offload_pin;
}

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
    await page.getByLabel("Truck").click();
    await page.getByRole("option", { name: /CA 123-456/ }).click();
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
    // Same here -- auto-advanced to the "Deliver" step already. The offload
    // PIN isn't shown in the driver's UI anymore (that's the point of the
    // new confirmation design), so fetch it the same way an admin relaying
    // it to the customer would need to.
    const orderIdMatch = orderUrl.match(/[0-9a-f-]{36}$/);
    if (!orderIdMatch) throw new Error(`Could not extract order id from ${orderUrl}`);
    const offloadPin = await getOffloadPin(orderIdMatch[0]);

    await page.getByLabel("Offload PIN (from the recipient)").fill(offloadPin);
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
