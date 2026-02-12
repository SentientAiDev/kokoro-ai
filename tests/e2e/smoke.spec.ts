import { expect, test } from '@playwright/test';

test('recall flow smoke: create entry, recall, and delete memory', async ({ page }) => {
  await page.goto('/journal');

  const content = `Plan sprint review ${Date.now()}`;
  await page.getByLabel("Today's journal entry").fill(content);
  await page.getByRole('button', { name: 'Save entry' }).click();

  await expect(page.getByText(content)).toBeVisible();

  await page.goto('/recall');
  await page.getByRole('searchbox', { name: 'Search memories' }).fill('sprint');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByText(/sprint/i).first()).toBeVisible();

  const firstDeleteButton = page.getByRole('button', { name: 'Delete' }).first();
  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });
  await firstDeleteButton.click();

  await expect(page.getByText(content)).toHaveCount(0);
});
