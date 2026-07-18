import { expect, test } from '@playwright/test';
import { selectFirstSearchResult, selectFirstSearchResultByKeyboard, waitForApp } from './helpers.js';

test('loads the city pack and lets visitors search and select a tree', async ({ page }) => {
  await waitForApp(page);
  await expect(page.getByRole('heading', { name: 'Find your way through the trees' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tree highlights near map centre' })).toBeVisible();
  await selectFirstSearchResult(page);
  await expect(page.getByRole('button', { name: 'Add to route' })).toBeVisible();
  await expect(page.locator('.bottom-sheet')).toHaveAttribute('data-state', 'peek');
});

test('starts with tree highlights and exposes only the three human-reviewed trails', async ({ page }) => {
  await waitForApp(page);
  await expect(page.getByRole('button', { name: 'Show all public trees' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tree highlights near map centre' })).toBeVisible();
  await page.getByRole('button', { name: 'Browse neighbourhood trails' }).click();
  await expect(page.getByRole('heading', { name: 'Reviewed neighbourhood walks' })).toBeVisible();
  await expect(page.locator('.trail-card')).toHaveCount(3);
  await page.getByRole('button', { name: /Cherry blossoms in Mount Pleasant/ }).click();
  await expect(page.getByRole('heading', { name: 'Cherry blossoms in Mount Pleasant' })).toBeVisible();
  await expect(page.getByText('6.1 km', { exact: true })).toBeVisible();
  await expect(page.locator('.trail-detail-meta')).toContainText('5tree-rich areas');
  await expect(page.getByText('Loop', { exact: true })).toBeVisible();
  await expect(page.getByText('311 recorded trees across 5 distinct areas. Individual records appear around each area on the map.')).toBeVisible();
});

test('loads the complete public inventory only when requested', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await waitForApp(page);
  await page.getByRole('button', { name: 'Show all public trees' }).click();
  await expect(page.getByText('185307 visible')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('button', { name: 'Show tree highlights' })).toBeVisible();
  await page.getByRole('button', { name: 'Show tree highlights' }).click();
  await expect(page.getByRole('heading', { name: 'Tree highlights near map centre' })).toBeVisible();
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

test('filters change the visible result set and keep a reset path', async ({ page }) => {
  await waitForApp(page);
  await expect(page.getByText('185307 visible')).toHaveCount(0);
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByRole('button', { name: 'Fruit families', exact: true }).click();
  await expect(page.locator('[aria-live="polite"]')).toContainText(/tree records visible.*Filters applied/);
  await expect(page.getByText('185307 visible')).toBeHidden();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByText('185307 visible')).toBeVisible();
});

test('builds an ordered stop list and hands it to external walking directions', async ({ page }) => {
  await waitForApp(page);
  await selectFirstSearchResultByKeyboard(page, 'apple');
  await page.getByRole('button', { name: 'Add to route' }).click();
  await expect(page.getByRole('button', { name: /Route.*1 stop saved/ })).toBeVisible();
  await selectFirstSearchResultByKeyboard(page, 'cherry');
  await page.getByRole('button', { name: 'Add to route' }).click();
  await expect(page.getByRole('button', { name: /Route.*2 stops ready/ })).toBeVisible();
  await page.getByRole('button', { name: /Route.*2 stops ready/ }).click();
  await expect(page.getByRole('heading', { name: 'Your tree walk' })).toBeVisible();
  await expect(page.locator('.route-stop-list > li')).toHaveCount(2);
  await expect(page.getByRole('button', { name: /Move .* earlier/ }).first()).toBeDisabled();
  const directions = page.getByRole('link', { name: 'Open walking directions' });
  await expect(directions).toHaveAttribute('href', /google\.com\/maps\/dir\/\?api=1/);
  await expect(directions).toHaveAttribute('href', /travelmode=walking/);
});
