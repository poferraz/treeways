import { expect, test } from '@playwright/test';
import { useTestBasemap, waitForApp } from './helpers.js';

test.describe('interactive map', () => {
  // Allow the tile-service fixture to intercept every style request.
  test.use({ serviceWorkers: 'block' });

  test('renders source credits, a routed trail line, stop markers and trees', async ({ page }) => {
    await useTestBasemap(page);
    await waitForApp(page);
    const credits = page.locator('.maplibregl-ctrl-attrib');
    await expect(credits.getByRole('link', { name: 'OpenStreetMap' })).toBeVisible();
    await expect(credits.getByRole('link', { name: 'CARTO' })).toBeVisible();
    await page.getByRole('button', { name: 'Explore 3 trails' }).click();
    await page.getByRole('button', { name: /Cherry blossoms in Mount Pleasant/ }).click();
    await expect(page.getByRole('heading', { name: 'Cherry blossoms in Mount Pleasant' })).toBeVisible();

    // On the white fixture style the route, stops and cherry trees have distinct
    // colors. Sample the unobstructed middle of the map, away from UI controls.
    const viewport = page.viewportSize();
    const pane = await page.locator('.bottom-sheet').boundingBox();
    const left = Math.ceil(pane.x + pane.width) + 8;
    const top = Math.round(viewport.height * 0.17);
    const clip = { x: left, y: top, width: viewport.width - left - 12, height: viewport.height - top - 64 };
    await expect(async () => {
      const screenshot = await page.screenshot({ clip, scale: 'css' });
      const marks = await page.evaluate(async png => {
        const image = new Image();
        image.src = 'data:image/png;base64,' + png;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
        let routePixels = 0;
        let stopPixels = 0;
        let treePixels = 0;
        for (let i = 0; i < data.length; i += 4) {
          const red = data[i], green = data[i + 1], blue = data[i + 2];
          if (Math.abs(red - 166) < 4 && Math.abs(green - 110) < 4 && Math.abs(blue - 82) < 4) routePixels++;
          if (Math.abs(red - 154) < 4 && Math.abs(green - 90) < 4 && Math.abs(blue - 58) < 4) stopPixels++;
          if (Math.abs(red - 201) < 4 && Math.abs(green - 95) < 4 && Math.abs(blue - 120) < 4) treePixels++;
        }
        return { routePixels, stopPixels, treePixels };
      }, screenshot.toString('base64'));
      expect(marks.routePixels).toBeGreaterThan(40);
      expect(marks.stopPixels).toBeGreaterThan(40);
      expect(marks.treePixels).toBeGreaterThan(5);
    }).toPass({ timeout: 15_000 });
  });

  test('keeps map credits reachable above the mobile information sheet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await useTestBasemap(page);
    await waitForApp(page);
    const credits = page.locator('.maplibregl-ctrl-attrib');
    const osm = credits.getByRole('link', { name: 'OpenStreetMap', includeHidden: true });
    await expect(osm).toBeAttached();
    if (!(await osm.isVisible())) {
      await credits.locator('summary').click();
    }
    await osm.click({ trial: true });
    await credits.getByRole('link', { name: 'CARTO' }).click({ trial: true });
  });
});

test('reopens saved trees and a visited trail after a disconnected reload', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit offline emulation rejects service-worker navigations (microsoft/playwright#42775)');
  await useTestBasemap(page);
  await waitForApp(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const openTrail = async () => {
    await page.getByRole('button', { name: 'Explore 3 trails' }).click();
    await page.getByRole('button', { name: /Maples in Kitsilano/ }).click();
    await expect(page.getByRole('heading', { name: 'Maples in Kitsilano' })).toBeVisible();
  };
  await openTrail();

  await page.unrouteAll({ behavior: 'wait' });
  await context.setOffline(true);
  const navigation = await page.reload({ waitUntil: 'domcontentloaded' });
  expect(navigation.fromServiceWorker()).toBe(true);
  await expect(page.locator('.offline-notice')).toContainText('Showing saved tree data');
  await expect(page.getByRole('switch', { name: 'All public trees' })).toContainText('6,509 highlights');
  await openTrail();
});
