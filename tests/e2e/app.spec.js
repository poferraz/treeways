import { expect, test } from '@playwright/test';
import { selectFirstSearchResult, selectFirstSearchResultByKeyboard, waitForApp } from './helpers.js';

test('loads the city pack and lets visitors search and select a tree', async ({ page }) => {
  await waitForApp(page);
  await expect(page.getByRole('heading', { name: 'Treeways' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tree highlights near map centre' })).toBeVisible();
  await selectFirstSearchResult(page);
  await expect(page.getByRole('button', { name: 'Add to route' })).toBeVisible();
  await expect(page.locator('.bottom-sheet')).toHaveAttribute('data-state', 'full');
});

test('keeps phone navigation compact and makes map and details explicit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await waitForApp(page);
  const toolbar = page.locator('.toolbar');
  await expect(toolbar).toBeVisible();
  expect((await toolbar.boundingBox()).height).toBeLessThanOrEqual(50);
  await expect(page.getByRole('combobox', { name: 'Search trees' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Filters', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Find trees near my location' })).toBeVisible();

  const sheet = page.locator('.bottom-sheet');
  await page.locator('.maplibregl-canvas').click({ position: { x: 380, y: 100 } });
  await expect(sheet).toHaveAttribute('data-state', 'map');
  await page.getByRole('button', { name: 'Show tree information' }).click();
  await expect(sheet).toHaveAttribute('data-state', 'peek');
  const handle = page.locator('.sheet-handle');
  const handleBox = await handle.boundingBox();
  if (!handleBox) throw new Error('Sheet handle is not visible');
  await handle.evaluate((element, positions) => {
    const dispatchTouch = (type, key, clientY) => {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, key, { value: [{ clientY }] });
      element.dispatchEvent(event);
    };
    dispatchTouch('touchstart', 'touches', positions.start);
    dispatchTouch('touchmove', 'touches', positions.end);
    dispatchTouch('touchend', 'changedTouches', positions.end);
  }, { start: handleBox.y + handleBox.height / 2, end: handleBox.y - 50 });
  await expect(sheet).toHaveAttribute('data-state', 'half');
  await page.waitForTimeout(450);
  await page.getByRole('button', { name: 'Show more tree information' }).click();
  await expect(sheet).toHaveAttribute('data-state', 'full');
  await page.getByRole('button', { name: 'Show full map' }).click();
  await expect(sheet).toHaveAttribute('data-state', 'map');
});

test('starts with tree highlights and exposes only the three human-reviewed trails', async ({ page }) => {
  await waitForApp(page);
  const inventorySwitch = page.getByRole('switch', { name: 'All public trees' });
  await expect(inventorySwitch).toBeVisible();
  await expect(inventorySwitch).toHaveAttribute('aria-checked', 'false');
  await expect(inventorySwitch).toContainText('6,509 highlights shown');
  await expect(page.getByRole('heading', { name: 'Tree highlights near map centre' })).toBeVisible();
  await page.getByRole('button', { name: 'Explore 3 trails' }).click();
  await expect(page.getByRole('heading', { name: 'Reviewed neighbourhood walks' })).toBeVisible();
  await expect(page.locator('.trail-card')).toHaveCount(3);
  await page.getByRole('button', { name: /Cherry blossoms in Mount Pleasant/ }).click();
  await expect(page.getByRole('heading', { name: 'Cherry blossoms in Mount Pleasant' })).toBeVisible();
  await expect(page.getByText('6.1 km', { exact: true })).toBeVisible();
  await expect(page.locator('.trail-detail-meta')).toContainText('5tree-rich areas');
  await expect(page.getByText('Loop', { exact: true })).toBeVisible();
  await expect(page.getByText('311 recorded trees across 5 distinct areas. Individual records appear around each area on the map.')).toBeVisible();
  await page.getByRole('button', { name: 'All trails' }).click();
  await page.getByRole('button', { name: 'Back to nearby trees' }).click();
  await expect(page.getByRole('heading', { name: 'Tree highlights near map centre' })).toBeVisible();
  await expect(inventorySwitch).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('#map')).toHaveAttribute('data-view', 'overview');
});

test('loads the complete public inventory only when requested', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await waitForApp(page);
  const inventorySwitch = page.getByRole('switch', { name: 'All public trees' });
  await inventorySwitch.click();
  await expect(inventorySwitch).toHaveAttribute('aria-checked', 'true', { timeout: 20_000 });
  await expect(inventorySwitch).toContainText('185,307 records shown');
  await inventorySwitch.click();
  await expect(inventorySwitch).toHaveAttribute('aria-checked', 'false');
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
  await expect(page.getByText('185,307 visible')).toHaveCount(0);
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByRole('button', { name: 'Fruit families', exact: true }).click();
  await expect(page.locator('[aria-live="polite"]')).toContainText(/tree records visible.*Filters applied/);
  await expect(page.getByText('185,307 visible')).toBeHidden();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByText('185,307 visible')).toBeVisible();
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
