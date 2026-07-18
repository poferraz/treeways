import { describe, expect, it } from 'vitest';
import {
  CLUSTER_DEFAULTS,
  THEMES,
  buildDensityClusters,
  selectTrailClusters
} from '../src/domain/trail-clusters.js';

const tree = (id, latitude, longitude, overrides = {}) => ({
  id,
  latitude,
  longitude,
  commonName: 'KWANZAN FLOWERING CHERRY',
  genus: 'PRUNUS',
  species: 'SERRULATA',
  address: '100 E 10TH AV',
  heightM: 10,
  diameterCm: 30,
  ...overrides
});

describe('density-first trail clusters', () => {
  it('uses the approved cluster thresholds', () => {
    expect(CLUSTER_DEFAULTS).toMatchObject({ radiusM: 70, minimumTrees: 8, minimumThemeTrees: 3 });
  });

  it('creates a stop around a dense area and records every member and theme match', () => {
    const trees = [
      ...Array.from({ length: 8 }, (_, index) => tree(`near-${index}`, 49.2635 + index * 0.00003, -123.1015)),
      tree('outside', 49.27, -123.11)
    ];

    const clusters = buildDensityClusters(trees, { theme: THEMES.cherryBlossoms });

    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toMatchObject({
      totalTreeCount: 8,
      themeTreeCount: 8,
      locationLabel: '100 block of East 10th Avenue'
    });
    expect(clusters[0].memberTreeIds).toHaveLength(8);
    expect(clusters[0].themeTreeIds).toEqual(clusters[0].memberTreeIds);
    expect(clusters[0].anchor.treeId).toBeTruthy();
  });

  it('ranks overall density before theme concentration and rejects sparse themed groups', () => {
    const dense = Array.from({ length: 10 }, (_, index) => tree(`dense-${index}`, 49.2635 + index * 0.00002, -123.1015, {
      genus: index < 3 ? 'PRUNUS' : 'ACER',
      commonName: index < 3 ? 'KWANZAN FLOWERING CHERRY' : 'NORWAY MAPLE'
    }));
    const sparse = Array.from({ length: 7 }, (_, index) => tree(`sparse-${index}`, 49.2655 + index * 0.00002, -123.1015));

    const clusters = buildDensityClusters([...sparse, ...dense], { theme: THEMES.cherryBlossoms });

    expect(clusters).toHaveLength(1);
    expect(clusters[0].totalTreeCount).toBe(10);
    expect(clusters[0].themeTreeCount).toBe(3);
  });

  it('selects three to five non-overlapping cluster stops deterministically', () => {
    const clusters = Array.from({ length: 7 }, (_, index) => ({
      id: `cluster-${index}`,
      anchor: { latitude: 49.25, longitude: -123.18 + index * 0.004 },
      totalTreeCount: 20 - index,
      themeTreeCount: 5,
      diversityCount: 4,
      memberTreeIds: [`tree-${index}`]
    }));

    const selected = selectTrailClusters(clusters);

    expect(selected.length).toBeGreaterThanOrEqual(3);
    expect(selected.length).toBeLessThanOrEqual(5);
    expect(selectTrailClusters([...clusters].reverse()).map(item => item.id)).toEqual(selected.map(item => item.id));
  });

  it('forms a connected dense group instead of joining an isolated high-density stop', () => {
    const cluster = (id, longitude, density) => ({
      id,
      anchor: { latitude: 49.25, longitude },
      totalTreeCount: density,
      themeTreeCount: 5,
      diversityCount: 4,
      memberTreeIds: [`tree-${id}`]
    });
    const clusters = [
      cluster('isolated', -123.2, 100),
      cluster('near-a', -123.14, 90),
      cluster('near-b', -123.13, 80),
      cluster('near-c', -123.12, 70)
    ];

    expect(selectTrailClusters(clusters).map(item => item.id)).toEqual(['near-a', 'near-b', 'near-c']);
  });
});
