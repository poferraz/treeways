import { describe, expect, it } from 'vitest';
import { selectTreeHighlights } from '../src/domain/tree-highlights.js';

const tree = (id, latitude, longitude, overrides = {}) => ({
  id,
  latitude,
  longitude,
  commonName: 'NORWAY MAPLE',
  genus: 'ACER',
  species: 'PLATANOIDES',
  heightM: null,
  diameterCm: null,
  ...overrides
});

describe('initial map highlights', () => {
  it('selects transparent density and measurement highlights without returning the whole inventory', () => {
    const dense = Array.from({ length: 10 }, (_, index) => tree(`dense-${index}`, 49.25 + index * 0.00002, -123.1));
    const sparse = Array.from({ length: 20 }, (_, index) => tree(`sparse-${index}`, 49.2 + index * 0.005, -123.2));
    const measured = tree('measured', 49.22, -123.15, { heightM: 25 });

    const result = selectTreeHighlights([...sparse, measured, ...dense], { maximumDensityAreas: 1 });

    expect(result.method).toBe('density-areas-and-recorded-size');
    expect(result.treeIds).toContain('measured');
    expect(result.treeIds).toEqual(expect.arrayContaining(dense.map(item => item.id)));
    expect(result.treeIds.length).toBeLessThan(31);
    expect(selectTreeHighlights([...dense].reverse(), { maximumDensityAreas: 1 }).treeIds).toEqual(
      selectTreeHighlights(dense, { maximumDensityAreas: 1 }).treeIds
    );
  });
});
