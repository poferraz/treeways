import { describe, expect, it } from 'vitest';
import { createSearchIndex, search } from '../src/data/search-index.js';
import { createSpatialIndex, nearest, queryBounds } from '../src/data/spatial-index.js';

const trees = [{ id: '1', commonName: 'Apple', genus: 'Malus', species: 'domestica', longitude: -123.1, latitude: 49.2 }, { id: '2', commonName: 'Cherry', genus: 'Prunus', species: 'serrulata', longitude: -123.2, latitude: 49.3 }];
describe('data indexes', () => {
  it('finds species names without returning whole collections', () => expect(search(createSearchIndex(trees), 'malus')).toEqual([trees[0]]));
  it('queries nearest and bounding-box results', () => { expect(nearest(createSpatialIndex(trees), { longitude: -123.11, latitude: 49.21 }).tree.id).toBe('1'); expect(queryBounds(trees, [-123.15, 49.15, -123.05, 49.25])).toEqual([trees[0]]); });
});
