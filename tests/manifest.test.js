import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(
  readFileSync(resolve(root, 'public/manifest.webmanifest'), 'utf8'),
);

describe('web app manifest', () => {
  it('is branded Treeways, not the legacy engine name', () => {
    expect(manifest.name).toBe('Treeways');
    expect(manifest.short_name).toBe('Treeways');
    expect(JSON.stringify(manifest)).not.toMatch(/urban canopy/i);
  });
});

describe('manifest icons', () => {
  it('declares 192 and 512 maskable PNGs that exist on disk', () => {
    const sizes = manifest.icons.map((i) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');

    const maskable = manifest.icons.find((i) => i.sizes === '512x512');
    expect(maskable.type).toBe('image/png');
    expect(maskable.purpose).toContain('maskable');

    for (const icon of manifest.icons) {
      const path = resolve(root, 'public', icon.src.replace(/^\//, ''));
      expect(existsSync(path)).toBe(true);
    }
  });
});