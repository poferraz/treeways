import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { selectFirstSearchResult, waitForApp } from './helpers.js';

test('core map, search, filter, and selected-tree states have no serious Axe violations', async ({ page }) => {
  await waitForApp(page);
  await expect((await new AxeBuilder({ page }).analyze()).violations.filter(({ impact }) => ['critical', 'serious'].includes(impact))).toEqual([]);
  await selectFirstSearchResult(page);
  await expect((await new AxeBuilder({ page }).analyze()).violations.filter(({ impact }) => ['critical', 'serious'].includes(impact))).toEqual([]);
});

test('announces filter changes through the polite status region', async ({ page }) => {
  await waitForApp(page);
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByRole('button', { name: /Fruit families/i }).click();
  await expect(page.locator('[aria-live="polite"]')).toContainText('Filters applied.');
});

test('reviewed trail catalogue and route detail have no serious Axe violations', async ({ page }) => {
  await waitForApp(page);
  await page.getByRole('button', { name: 'Explore 3 trails' }).click();
  await expect((await new AxeBuilder({ page }).analyze()).violations.filter(({ impact }) => ['critical', 'serious'].includes(impact))).toEqual([]);
  await page.getByRole('button', { name: /Maples in Kitsilano/ }).click();
  await expect((await new AxeBuilder({ page }).analyze()).violations.filter(({ impact }) => ['critical', 'serious'].includes(impact))).toEqual([]);
});
