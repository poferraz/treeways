import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

test('renders the standalone three-pilot human-review artifact', async ({ page }, testInfo) => {
  const consoleErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  await page.goto(pathToFileURL(resolve('docs/m3-b/review-tool.html')).href);
  await expect(page.getByRole('heading', { name: 'Treeways review' })).toBeVisible();
  await expect(page.locator('.candidate')).toHaveCount(3);
  await expect(page.locator('.candidate').nth(0)).toContainText('6.1 km');
  await expect(page.getByText('loop', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('mount-pleasant-route.png'), fullPage: true });
  await page.locator('.candidate').nth(1).click();
  await expect(page.locator('.candidate[aria-current="true"]')).toContainText('Grandview-Woodland');
  await expect(page.locator('svg circle.member').first()).toBeVisible();
  await expect(page.locator('svg polyline.route')).toBeVisible();
  await expect(page.getByText('3.6 km', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve candidate' })).toBeEnabled();
  await expect(page.locator('#status')).toContainText('Human reviewed by Paulo on 2026-07-18.');
  await page.screenshot({ path: testInfo.outputPath('grandview-route.png'), fullPage: true });
  await page.locator('.candidate').nth(2).click();
  await expect(page.locator('.candidate[aria-current="true"]')).toContainText('Kitsilano');
  await expect(page.getByText('3.3 km', { exact: true })).toBeVisible();
  await expect(page.getByText('point-to-point', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('kitsilano-route.png'), fullPage: true });
  expect(consoleErrors).toEqual([]);
});
