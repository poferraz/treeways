import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
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