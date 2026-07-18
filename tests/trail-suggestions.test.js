import { describe, expect, it } from 'vitest';
import { buildTrailSuggestions, directionsUrl, DISTANCE_BANDS, trailGeometry } from '../src/domain/trail-suggestions.js';

const tree = (id, latitude, longitude, overrides = {}) => ({ id, latitude, longitude, commonName: 'KWANZAN FLOWERING CHERRY', genus: 'PRUNUS', species: 'SERRULATA', heightM: 10, diameterCm: 30, ...overrides });

describe('Treeways trail suggestions', () => {
  it('publishes the requested distance ceilings', () => {
    expect(DISTANCE_BANDS.small.maximumKm).toBe(3);
    expect(DISTANCE_BANDS.medium.maximumKm).toBe(5);
    expect(DISTANCE_BANDS.large.maximumKm).toBe(8);
  });

  it('only builds suggestions with enough real tree stops', () => {
    const trees = Array.from({ length: 8 }, (_, index) => tree(String(index), 49.2635 + index * 0.001, -123.1015 + index * 0.001));
    const trails = buildTrailSuggestions(trees);
    expect(trails.length).toBeGreaterThan(0);
    expect(trails.every(trail => trail.waypoints.length >= 4 && trail.status === 'suggested')).toBe(true);
    expect(trails.every(trail => trail.spanKm <= trail.distanceBand.maximumKm)).toBe(true);
  });

  it('creates Google Maps handoffs and a line geometry', () => {
    const trail = { mode: 'walking', waypoints: [tree('1', 49.2, -123.1), tree('2', 49.21, -123.11), tree('3', 49.22, -123.12)] };
    expect(directionsUrl(trail, 'driving')).toContain('travelmode=driving');
    expect(directionsUrl(trail, 'driving')).toContain('waypoints=');
    expect(trailGeometry(trail).coordinates).toEqual([[-123.1, 49.2], [-123.11, 49.21], [-123.12, 49.22]]);
  });
});
