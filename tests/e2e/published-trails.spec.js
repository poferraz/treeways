import { expect, test } from '@playwright/test';
import { waitForApp } from './helpers.js';

test('renders the approved trail catalogue and route detail on mobile', async ({ page }, testInfo) => {
  const consoleErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await waitForApp(page);
  await page.getByRole('button', { name: 'Explore 3 trails' }).click();
  await expect(page.locator('.trail-card')).toHaveCount(3);
  await page.screenshot({ path: testInfo.outputPath('approved-catalogue.png'), fullPage: true });
  await page.getByRole('button', { name: /Maples in Kitsilano/ }).click();
  await expect(page.getByRole('heading', { name: 'Maples in Kitsilano' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open walking directions' })).toHaveAttribute('href', /travelmode=walking/);
  await expect(page.locator('.vite-error-overlay')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('approved-kitsilano.png'), fullPage: true });
  expect((await page.locator('body').innerText()).trim().length).toBeGreaterThan(100);
  expect(consoleErrors).toEqual([]);
});
