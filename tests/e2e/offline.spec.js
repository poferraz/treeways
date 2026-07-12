import { expect, test } from '@playwright/test';
import { waitForApp } from './helpers.js';

test('keeps saved tree data available and explains offline routing limits', async ({ page, context }) => {
  await waitForApp(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('combobox', { name: 'Search trees' })).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);
  await page.waitForFunction(async () => (await (await caches.open('urban-canopy-v2')).keys()).length >= 8);
  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.getByRole('status')).toContainText('You are offline. Showing saved tree data');
});
