import { setupClerkTestingToken, clerk } from "@clerk/testing/playwright";
import { test, expect } from "@playwright/test";

test.describe("Admin flows", () => {
  test("admin login page renders Clerk UI", async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/admin/login");
    await expect(page.locator("h1")).toContainText("Sign in");
    await expect(page.locator("text=Continue with Google")).toBeVisible();
  });

  test("unauthenticated /admin/dashboard redirects to /admin/login", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("Ashley Harris can sign in and reach admin dashboard", async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/");
    await clerk.signIn({
      page,
      emailAddress: "ashleyharris977@gmail.com",
    });
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 8000 });
  });
});
