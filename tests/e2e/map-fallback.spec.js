import { expect, test } from '@playwright/test';
import { selectFirstSearchResult, waitForApp } from './helpers.js';

test('keeps trees and reviewed trails usable when WebGL2 is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...options) {
      if (type === 'webgl2') return null;
      return original.call(this, type, ...options);
    };
  });

  await waitForApp(page);
  await expect(page.getByText('The map needs WebGL2', { exact: false })).toBeVisible();
  await expect(page.locator('.maplibregl-canvas')).toHaveCount(0);
  await page.getByRole('button', { name: 'Explore 3 trails' }).click();
  await page.getByRole('button', { name: /Maples in Kitsilano/ }).click();
  await expect(page.getByRole('heading', { name: 'Maples in Kitsilano' })).toBeVisible();

  await selectFirstSearchResult(page, 'apple');
  await page.getByRole('button', { name: 'Add to route' }).click();
  await expect(page.getByRole('button', { name: /Route · 1 stop/ })).toBeVisible();
});
