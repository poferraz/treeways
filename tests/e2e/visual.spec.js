import { test } from '@playwright/test';
import { selectFirstSearchResult, waitForApp } from './helpers.js';

const viewports = [
  { name: 'mobile-320', viewport: { width: 320, height: 568 } },
  { name: 'mobile-390', viewport: { width: 390, height: 844 } },
  { name: 'tablet', viewport: { width: 768, height: 1024 } },
  { name: 'desktop', viewport: { width: 1280, height: 800 } }
];

for (const { name, viewport } of viewports) {
  test(`selected tree layout remains stable at ${name}`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Pixel baselines are captured by the dedicated Chromium visual gate.');
    await page.setViewportSize(viewport);
    await waitForApp(page);
    await selectFirstSearchResult(page);
    await page.locator('#map').evaluate(map => {
      map.style.background = 'oklch(0.91 0.02 160)';
      for (const child of map.children) child.setAttribute('hidden', '');
    });
    await test.expect(page.locator('.app-shell')).toHaveScreenshot(`${name}-selected-tree.png`, {
      animations: 'disabled'
    });
  });
}
