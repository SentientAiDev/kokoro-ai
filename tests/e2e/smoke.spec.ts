import { expect, test } from '@playwright/test';

test('home page smoke test', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Kokoro Presence' })).toBeVisible();
});
