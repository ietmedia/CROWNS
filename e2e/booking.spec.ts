import { setupClerkTestingToken, clerk } from "@clerk/testing/playwright";
import { test, expect } from "@playwright/test";

test.describe("Booking flow (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/");
    // emailAddress variant creates a sign-in token server-side and waits for
    // window.Clerk.user to be set — no race condition with the redirect flow.
    await clerk.signIn({
      page,
      emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
    });
    await page.waitForLoadState("networkidle");
  });

  test("authenticated user can reach /book", async ({ page }) => {
    await page.goto("/book");
    await expect(page).toHaveURL(/\/book/);
    await expect(page.locator("h2")).toContainText("Choose Your Service");
  });

  test("step 1 → 2: select a service shows stylist step", async ({ page }) => {
    await page.goto("/book");
    await page.waitForSelector("button:has-text('Select')", { timeout: 10000 });
    await page.click("button:has-text('Select'):first-of-type");
    await expect(page.locator("h2")).toContainText("Choose Your Stylist", { timeout: 8000 });
  });

  test("step 2 → 3: select Any Available shows date/time picker", async ({ page }) => {
    await page.goto("/book");
    await page.waitForSelector("button:has-text('Select')", { timeout: 10000 });
    await page.click("button:has-text('Select'):first-of-type");
    await page.waitForSelector("button:has-text('Any Available')", { timeout: 8000 });
    await page.click("button:has-text('Any Available')");
    await expect(page.locator("h2")).toContainText("Pick a Date", { timeout: 8000 });
  });

  test("service filter tabs work", async ({ page }) => {
    await page.goto("/book");
    await page.waitForSelector("h2:has-text('Choose Your Service')", { timeout: 10000 });
    await expect(page.locator("button:has-text('All Services')")).toBeVisible();
    await page.locator("button:has-text('Natural Hair')").click();
    await expect(page.locator("button:has-text('Select')").first()).toBeVisible();
  });
});
