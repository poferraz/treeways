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
  it('selects geographic category coverage, density, and measurements without returning the whole inventory', () => {
    const dense = Array.from({ length: 10 }, (_, index) => tree(`dense-${index}`, 49.25 + index * 0.00002, -123.1));
    const sparse = Array.from({ length: 20 }, (_, index) => tree(`sparse-${index}`, 49.2 + index * 0.005, -123.2));
    const measured = tree('measured', 49.22, -123.15, { heightM: 25 });

    const result = selectTreeHighlights([...sparse, measured, ...dense], { maximumDensityAreas: 1 });

    expect(result.method).toBe('geographic-category-coverage-density-and-size');
    expect(result.treeIds).toContain('measured');
    expect(result.treeIds).toEqual(expect.arrayContaining(dense.map(item => item.id)));
    expect(result.treeIds.length).toBeLessThanOrEqual(31);
    expect(selectTreeHighlights([...dense].reverse(), { maximumDensityAreas: 1 }).treeIds).toEqual(
      selectTreeHighlights(dense, { maximumDensityAreas: 1 }).treeIds
    );
  });

  it('represents flowering, fruit, and tall trees in a sparse area even when another area is denser', () => {
    const dense = Array.from({ length: 30 }, (_, index) => tree(`dense-${index}`, 49.25 + index * 0.00001, -123.1));
    const westEnd = [
      tree('west-flower', 49.286, -123.135, { commonName: 'KWANZAN FLOWERING CHERRY', genus: 'PRUNUS' }),
      tree('west-fruit', 49.287, -123.136, { commonName: 'PEAR', genus: 'PYRUS' }),
      tree('west-tall', 49.288, -123.137, { heightM: 18 }),
      tree('west-other', 49.289, -123.138)
    ];

    const result = selectTreeHighlights([...dense, ...westEnd], {
      coverageCellSizeM: 500,
      maximumDensityAreas: 1,
      maximumTrees: 36
    });

    expect(result.treeIds).toEqual(expect.arrayContaining(['west-flower', 'west-fruit', 'west-tall']));
    expect(result.criteria).toMatchObject({ recordedHeightM: 15, coverageCellSizeM: 500 });
  });
});
