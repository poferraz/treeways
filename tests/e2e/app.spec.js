import { expect, test } from '@playwright/test';
import { selectFirstSearchResult, waitForApp } from './helpers.js';

test('loads the city pack and lets visitors search and select a tree', async ({ page }) => {
  await waitForApp(page);
  await selectFirstSearchResult(page);
  await expect(page.getByRole('button', { name: 'Add to route' })).toBeVisible();
  await expect(page.locator('.bottom-sheet')).toHaveAttribute('data-state', 'peek');
});

test('supports keyboard search selection and returns focus after escape', async ({ page }) => {
  await waitForApp(page);
  const search = page.getByRole('combobox', { name: 'Search trees' });
  await search.fill('apple');
  await expect(page.getByRole('option').first()).toBeVisible();
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page.locator('.inspector-content h1')).toBeVisible();
  await search.press('Escape');
  await expect(search).toHaveAttribute('aria-expanded', 'false');
});
