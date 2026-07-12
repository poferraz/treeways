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
  await page.getByRole('button', { name: /Edible/i }).click();
  await expect(page.locator('[aria-live="polite"]')).toContainText('Filters applied.');
});
