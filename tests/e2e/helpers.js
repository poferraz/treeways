import { expect } from '@playwright/test';

export async function waitForApp(page) {
  await page.goto('/');
  await expect(page.getByRole('combobox', { name: 'Search trees' })).toBeVisible({ timeout: 20_000 });
}

export async function selectFirstSearchResult(page, query = 'apple') {
  const search = page.getByRole('combobox', { name: 'Search trees' });
  await search.fill(query);
  const option = page.getByRole('option').first();
  await expect(option).toBeVisible();
  await option.click();
  await expect(page.getByRole('button', { name: 'Add to route' })).toBeVisible();
}

export async function selectFirstSearchResultByKeyboard(page, query = 'apple') {
  const search = page.getByRole('combobox', { name: 'Search trees' });
  await search.fill(query);
  await expect(page.getByRole('option').first()).toBeVisible();
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page.getByRole('button', { name: 'Add to route' })).toBeVisible();
}
