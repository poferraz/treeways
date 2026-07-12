import { expect } from '@playwright/test';

export async function waitForApp(page) {
  await page.goto('/');
  await expect(page.getByRole('combobox', { name: 'Search trees' })).toBeVisible();
}

export async function selectFirstSearchResult(page, query = 'apple') {
  const search = page.getByRole('combobox', { name: 'Search trees' });
  await search.fill(query);
  const option = page.getByRole('option').first();
  await expect(option).toBeVisible();
  await option.click();
  await expect(page.locator('.inspector-content h1')).toBeVisible();
}
