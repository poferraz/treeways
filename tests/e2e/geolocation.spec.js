import { expect, test } from '@playwright/test';
import { useTestBasemap, waitForApp } from './helpers.js';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => {
  await useTestBasemap(page);
});

test('locates asynchronously, then uses the current map centre if permission is lost', async ({ page }) => {
  await page.addInitScript(() => {
    let granted = true;
    Object.defineProperty(navigator, 'geolocation', { value: {
      getCurrentPosition(success, failure) {
        if (granted) {
          granted = false;
          // A synthetic point over 100 km south of every tree in the city pack.
          setTimeout(() => success({ coords: { latitude: 48, longitude: -123.12, accuracy: 25 } }), 0);
        } else {
          setTimeout(() => failure({ code: 1, message: 'Permission denied' }), 0);
        }
      }
    } });
  });

  await waitForApp(page);
  const locate = page.getByRole('button', { name: 'Find trees near my location' });
  const marker = page.getByLabel('Your location', { exact: true });
  const firstTree = page.locator('#nearby-results li button').first();
  await page.getByRole('button', { name: /Trees near me/ }).click();
  await expect(locate).toHaveText('Recenter');
  await expect(marker).toBeInViewport();
  await expect(page.getByRole('heading', { name: 'Tree highlights near your location' })).toBeVisible();
  await expect(firstTree).toContainText(/· 1\d\d\.\d km ·/);
  await firstTree.click();
  await expect(page.getByText(/^1\d\d\.\d km from your location$/)).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();

  // Separate the map centre from the last location before testing the fallback.
  const beforePan = await firstTree.textContent();
  const markerY = () => marker.evaluate(element => element.getBoundingClientRect().y);
  const originalY = await markerY();
  await page.locator('.maplibregl-canvas').press('ArrowUp');
  await expect.poll(markerY).toBeGreaterThan(originalY + 40);
  await expect(firstTree).toHaveText(beforePan);
  await locate.click();
  await expect(locate).toHaveText('Near me');
  await expect(locate).toBeEnabled();
  await expect(marker).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Tree highlights near map centre' })).toBeVisible();
  await expect(firstTree).not.toHaveText(beforePan);
  await firstTree.click();
  await expect(page.getByText(/km from map centre$/)).toBeVisible();
});

test('keeps the nearby list available when the browser has no location API', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'geolocation', { value: undefined }));
  await waitForApp(page);
  const firstTree = page.locator('#nearby-results li button').first();
  const original = await firstTree.textContent();
  const locate = page.getByRole('button', { name: 'Find trees near my location' });
  await locate.click();
  await expect(page.locator('p[aria-live="polite"]')).toContainText(/Location is unavailable/i);
  await expect(locate).toBeEnabled();
  await expect(locate).toHaveText('Near me');
  await expect(page.getByRole('heading', { name: 'Tree highlights near map centre' })).toBeVisible();
  await expect(page.getByLabel('Your location', { exact: true })).toHaveCount(0);
  await expect(firstTree).toHaveText(original);
});
