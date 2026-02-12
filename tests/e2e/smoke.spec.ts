import { expect, test } from '@playwright/test';

test('proactive check-ins smoke: enable -> create -> show -> dismiss is audited', async ({ page, request }) => {
  await page.goto('/account');

  await page.getByLabel('Enable proactive check-ins').check();
  await page.getByLabel('Max suggestions per day').fill('1');
  await page.getByLabel('Inactivity threshold (days)').fill('1');
  await page.getByRole('button', { name: 'Save proactive check-ins' }).click();

  await expect(page.getByText('Saved proactive check-in settings.')).toBeVisible();

  const entryContent = `Need to follow up on planning ${Date.now()}?`;
  await page.goto('/journal');
  await page.getByLabel("Today's journal entry").fill(entryContent);
  await page.getByRole('button', { name: 'Save entry' }).click();
  await expect(page.getByText(entryContent)).toBeVisible();

  const schedulerResponse = await request.post('/api/check-ins/run-daily-job');
  expect(schedulerResponse.ok()).toBeTruthy();

  await page.goto('/journal');
  await expect(page.getByRole('heading', { name: 'Check-in suggestion' })).toBeVisible();
  await expect(page.getByText(/Why this check-in\?/i)).toBeVisible();

  await page.getByRole('button', { name: 'Dismiss' }).click();
  await expect(page.getByRole('heading', { name: 'Check-in suggestion' })).toHaveCount(0);

  const auditResponse = await request.get('/api/check-ins/audit');
  expect(auditResponse.ok()).toBeTruthy();
  const auditJson = (await auditResponse.json()) as { events: Array<{ action: string }> };
  expect(auditJson.events.some((event) => event.action === 'checkin.dismissed')).toBeTruthy();
});
