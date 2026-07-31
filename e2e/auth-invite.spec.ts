import path from "path";
import fs from "fs";
import { test, expect } from "@playwright/test";

// Verifies the invite -> set password -> log in flow end to end. This is
// the exact flow that was silently broken: Supabase's admin-initiated
// invite email uses the implicit flow (#access_token=... in the URL
// fragment), not the PKCE ?code= flow, because there's no browser session
// shared between the admin who sends the invite and the recipient who
// clicks it later to attach a code verifier to. A server Route Handler can
// never see a URL fragment, so the old /api/auth/callback route silently
// failed on every single invite -- see reset-password-form.tsx for the
// client-side fix.
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

async function generateInviteLink(email: string): Promise<string> {
  const res = await fetch(`${ENV.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "invite",
      email,
      options: { redirect_to: "http://localhost:3000/reset-password" },
    }),
  });
  const data = (await res.json()) as { action_link?: string; msg?: string; error_description?: string };
  if (!data.action_link) {
    throw new Error(`generate_link failed: ${data.msg ?? data.error_description ?? JSON.stringify(data)}`);
  }
  return data.action_link;
}

async function deleteTestUser(email: string) {
  const listRes = await fetch(`${ENV.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    headers: { apikey: ENV.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}` },
  });
  const { users } = (await listRes.json()) as { users: { id: string }[] };
  for (const user of users) {
    await fetch(`${ENV.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
      method: "DELETE",
      headers: { apikey: ENV.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}` },
    });
  }
}

test("invited user can set a password via the email link and then log in with it", async ({ page }) => {
  const email = `e2e-invite-${Date.now()}@example.com`;
  const newPassword = "TestPassword456!";

  try {
    await test.step("Generate the real invite link (as Supabase's email would contain)", async () => {
      const actionLink = await generateInviteLink(email);
      await page.goto(actionLink);
    });

    await test.step("Land on the reset-password page with a working session, not an error", async () => {
      await page.waitForURL(/\/reset-password/, { timeout: 30_000 });
      await expect(page.getByText(/expired or already been used/)).not.toBeVisible();
      await expect(page.getByLabel("New password")).toBeVisible({ timeout: 30_000 });
    });

    await test.step("Set a new password", async () => {
      await page.getByLabel("New password").fill(newPassword);
      await page.getByLabel("Confirm password").fill(newPassword);
      await page.getByRole("button", { name: "Set new password" }).click();
      await page.waitForURL(/\/(admin|driver)\/dashboard/, { timeout: 30_000 });
    });

    await test.step("Sign out and log back in with the new password", async () => {
      await page.getByRole("button", { name: "Account menu" }).click();
      await page.getByRole("menuitem", { name: "Sign out" }).click();
      await page.waitForURL(/\/login/, { timeout: 30_000 });

      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(newPassword);
      await page.getByRole("button", { name: "Sign in" }).click();
      await page.waitForURL(/\/(admin|driver)\/dashboard/, { timeout: 30_000 });
    });
  } finally {
    // A brand-new auth user with no role in the `users` table isn't
    // something the app has anywhere else to clean up -- delete it
    // directly so repeat runs don't pile up throwaway accounts.
    await deleteTestUser(email);
  }
});
