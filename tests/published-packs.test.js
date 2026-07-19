import { describe, expect, it } from 'vitest';
import { validatePublishedTrailPacks } from '../scripts/city/publish-reviewed-trails.js';
import pack from '../public/cities/vancouver/vancouver.highlights.v2.1.0.json';

describe('published Vancouver trail packs', () => {
  it('match the approved source and deterministic highlight selection', async () => {
    await expect(validatePublishedTrailPacks('vancouver')).resolves.toMatchObject({ trails: 3, memberships: 1034, highlightRecords: 6509 });
  });

  it('keeps flowering-family, fruit-family, and large recorded highlights in the West End and Downtown', () => {
    const flowering = new Set(['PRUNUS', 'MALUS', 'MAGNOLIA', 'CORNUS']);
    const fruit = new Set(['MALUS', 'PYRUS', 'PRUNUS', 'FICUS']);
    const neighbourhoods = [
      { name: 'West End', bounds: [49.275, 49.3, -123.15, -123.12], minimums: [300, 120, 90, 120] },
      { name: 'Downtown', bounds: [49.272, 49.29, -123.12, -123.095], minimums: [125, 50, 35, 35] }
    ];
    for (const { name, bounds: [minLat, maxLat, minLng, maxLng], minimums } of neighbourhoods) {
      const trees = pack.trees.filter(tree => tree[1] >= minLat && tree[1] <= maxLat && tree[2] >= minLng && tree[2] <= maxLng);
      const decoded = trees.map(tree => ({ genus: pack.species[tree[3]].genus, heightM: tree[4], diameterCm: tree[5] }));
      const counts = [
        trees.length,
        decoded.filter(tree => flowering.has(tree.genus)).length,
        decoded.filter(tree => fruit.has(tree.genus)).length,
        decoded.filter(tree => Number(tree.heightM) >= 15 || Number(tree.diameterCm) >= 100).length
      ];
      counts.forEach((count, index) => expect(count, `${name} category ${index}`).toBeGreaterThanOrEqual(minimums[index]));
    }
  });
});
