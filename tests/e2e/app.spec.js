import { expect, test } from '@playwright/test';
import { selectFirstSearchResult, selectFirstSearchResultByKeyboard, waitForApp } from './helpers.js';

test('loads the city pack and lets visitors search and select a tree', async ({ page }) => {
  await waitForApp(page);
  await expect(page.getByRole('heading', { name: 'Find your way through the trees' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Trees near map centre' })).toBeVisible();
  await selectFirstSearchResult(page);
  await expect(page.getByRole('button', { name: 'Add to route' })).toBeVisible();
  await expect(page.locator('.bottom-sheet')).toHaveAttribute('data-state', 'peek');
});

test('opens the Treeways catalogue and a neighbourhood route', async ({ page }) => {
  await waitForApp(page);
  await page.getByRole('button', { name: 'Browse neighbourhood trails' }).click();
  await expect(page.getByRole('heading', { name: 'Choose a neighbourhood trail' })).toBeVisible();
  await expect(page.locator('.trail-card')).toHaveCount(10);
  await page.locator('.trail-card').first().click();
  await expect(page.getByRole('heading', { name: 'Mount Pleasant Prunus' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open walking route' })).toHaveAttribute('href', /google\.com\/maps\/dir/);
  await expect(page.getByText(/route order is not human reviewed/i)).toBeVisible();
});

test('resets the trail sheet to its heading on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await waitForApp(page);
  await page.getByRole('button', { name: 'Browse neighbourhood trails' }).click();
  await page.locator('.trail-card').first().click();
  const heading = page.getByRole('heading', { name: 'Mount Pleasant Prunus' });
  await expect(heading).toBeVisible();
  expect((await heading.boundingBox()).y).toBeGreaterThan(400);
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
  await expect(page.getByText('185307 visible')).toBeVisible();
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByRole('button', { name: 'Fruit families', exact: true }).click();
  await expect(page.locator('[aria-live="polite"]')).toContainText(/tree records visible.*Filters applied/);
  await expect(page.getByText('185307 visible')).toBeHidden();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByText('185307 visible')).toBeVisible();
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
