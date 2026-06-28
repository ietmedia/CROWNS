import { setupClerkTestingToken, clerk } from "@clerk/testing/playwright";
import { test, expect } from "@playwright/test";

// Use emailAddress variant — creates a sign-in token server-side via CLERK_SECRET_KEY
// and waits for window.Clerk.user to be set before returning.
async function signIn(page: import("@playwright/test").Page) {
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
  });
  await page.waitForLoadState("networkidle");
}

test.describe("Auth flows", () => {
  test("sign-in page renders Clerk UI", async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/sign-in");
    await expect(page.locator("h1")).toContainText("Sign in");
    await expect(page.locator("text=Continue with Google")).toBeVisible();
    await expect(page.locator('input[name="identifier"]')).toBeVisible();
  });

  test("sign-up page renders Clerk UI", async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/sign-up");
    await expect(page.locator("h1")).toContainText("Create your account");
  });

  test("unauthenticated /book redirects to /sign-in", async ({ page }) => {
    await page.goto("/book");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("unauthenticated /my-appointments redirects to /sign-in", async ({ page }) => {
    await page.goto("/my-appointments");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("navbar shows Sign In when signed out", async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto("/");
    await expect(page.locator("header")).toContainText("Sign In");
  });

  test("sign in then sign out", async ({ page }) => {
    await signIn(page);

    // Reload to let ClerkProvider update the navbar
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // UserButton replaces Sign In — the header should not contain "Sign In"
    await expect(page.locator("header")).not.toContainText("Sign In", { timeout: 8000 });

    await clerk.signOut({ page });
    await page.waitForLoadState("networkidle");
    await expect(page.locator("header")).toContainText("Sign In", { timeout: 8000 });
  });
});
