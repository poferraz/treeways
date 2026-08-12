// Render public/icon.svg to the PNG sizes Treeways ships.
// Run: node scripts/generate-icons.mjs  (requires `npx playwright install chromium` once)
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svg = await readFile(resolve(root, 'public/icon.svg'), 'utf8');

const targets = [
  ['icon-192.png', 192, 192],
  ['icon-512.png', 512, 512],
  ['apple-touch-icon.png', 180, 180],
];

const browser = await chromium.launch();
try {
  for (const [name, w, h] of targets) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const sized = svg.replace('<svg', `<svg width="${w}" height="${h}"`);
    await page.setContent(
      `<!doctype html><meta charset="utf-8"><body style="margin:0">${sized}</body>`,
      { waitUntil: 'load' },
    );
    const el = await page.$('svg');
    const png = await el.screenshot({ omitBackground: false });
    await writeFile(resolve(root, 'public', name), png);
    await page.close();
    console.log(`wrote public/${name} (${w}x${h})`);
  }
} finally {
  await browser.close();
}