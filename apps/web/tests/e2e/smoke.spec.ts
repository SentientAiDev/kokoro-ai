import { expect, test } from "@playwright/test";

test("homepage renders bootstrap message", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Kokoro Presence" })).toBeVisible();
  await expect(page.getByText("T0 bootstrap complete")).toBeVisible();
});
