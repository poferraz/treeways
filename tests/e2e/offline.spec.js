import { expect, test } from '@playwright/test';
import { waitForApp } from './helpers.js';

test('keeps saved tree data available and explains offline routing limits', async ({ page, context }) => {
  await waitForApp(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('combobox', { name: 'Search trees' })).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null);

  const cacheNames = await page.evaluate(() => caches.keys());
  const shellCache = cacheNames.find(name => name.startsWith('urban-canopy-shell-v2-'));
  expect(shellCache).toBeTruthy();
  expect(cacheNames).toContain('urban-canopy-data-v2');

  const shellKeys = await page.evaluate(name => caches.open(name).then(c => c.keys()), shellCache);
  const dataKeys = await page.evaluate(() =>
    caches.open('urban-canopy-data-v2').then(c => c.keys())
  );

  expect(shellKeys.length).toBeGreaterThanOrEqual(6);
  expect(dataKeys.length).toBeGreaterThanOrEqual(2);

  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.getByRole('status')).toContainText('You are offline. Showing saved tree data');
});
