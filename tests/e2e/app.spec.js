import { expect, test } from '@playwright/test';
import { selectFirstSearchResult, selectFirstSearchResultByKeyboard, waitForApp } from './helpers.js';

test('loads the city pack and lets visitors search and select a tree', async ({ page }) => {
  await waitForApp(page);
  await expect(page.getByRole('heading', { name: 'Find a tree worth walking to' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Trees near map centre' })).toBeVisible();
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

test('filters change the visible result set and keep a reset path', async ({ page }) => {
  await waitForApp(page);
  await expect(page.getByText('10000 visible')).toBeVisible();
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByRole('button', { name: 'Edible', exact: true }).click();
  await expect(page.locator('[aria-live="polite"]')).toContainText(/curated trees visible.*Filters applied/);
  await expect(page.getByText('10000 visible')).toBeHidden();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByText('10000 visible')).toBeVisible();
});

test('builds and exposes an ordered walking route', async ({ page }) => {
  await waitForApp(page);
  await selectFirstSearchResultByKeyboard(page, 'apple');
  await page.getByRole('button', { name: 'Add to route' }).click();
  await expect(page.getByRole('button', { name: /Route.*1 stop saved/ })).toBeVisible();
  await page.evaluate(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => String(input).includes('/route/v1/foot/')
      ? Promise.resolve(new Response(JSON.stringify({ routes: [{ distance: 1400, duration: 1080, geometry: { type: 'LineString', coordinates: [[-123.18, 49.24], [-123.15, 49.25]] } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      : originalFetch(input, init);
  });
  await selectFirstSearchResultByKeyboard(page, 'cherry');
  await page.getByRole('button', { name: 'Add to route' }).click();
  await expect(page.getByRole('button', { name: /Route.*1.4 km, 18 minutes walking/ })).toBeVisible();
  await page.getByRole('button', { name: /Route.*1.4 km/ }).click();
  await expect(page.getByRole('heading', { name: 'Your tree walk' })).toBeVisible();
  await expect(page.locator('.route-stop-list > li')).toHaveCount(2);
  await expect(page.getByRole('button', { name: /Move .* earlier/ }).first()).toBeDisabled();
});
