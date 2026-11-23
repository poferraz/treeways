import { expect } from '@playwright/test';

export async function waitForApp(page) {
  await page.goto('/');
  await expect(page.getByRole('combobox', { name: 'Search trees' })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('switch', { name: 'All public trees' })).toBeVisible();
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

// Keep the real renderer, map worker, city pack and trail geometry. Only the
// remote basemap is replaced so this test can also run without a tile service.
export async function useTestBasemap(page) {
  await page.route('https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', route =>
    route.fulfill({ json: {
      version: 8,
      glyphs: 'https://basemaps.cartocdn.com/test-fonts/{fontstack}/{range}.pbf',
      sources: { basemap: {
        type: 'geojson', data: { type: 'FeatureCollection', features: [] },
        attribution: '<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://carto.com/attributions">CARTO</a>'
      } },
      layers: [
        { id: 'background', type: 'background', paint: { 'background-color': '#fff' } },
        { id: 'basemap', type: 'fill', source: 'basemap' }
      ]
    } })
  );
  await page.route('https://basemaps.cartocdn.com/test-fonts/**', route =>
    route.fulfill({ contentType: 'application/x-protobuf', body: Buffer.alloc(0) })
  );
}
