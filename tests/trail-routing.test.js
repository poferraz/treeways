import { describe, expect, it } from 'vitest';
import {
  chooseRouteOrder,
  validateRoutedTrail,
  routedGeometryQuality
} from '../src/domain/trail-routing.js';

const anchors = [
  { id: 'a', latitude: 49.25, longitude: -123.12 },
  { id: 'b', latitude: 49.25, longitude: -123.11 },
  { id: 'c', latitude: 49.26, longitude: -123.11 }
];

describe('pedestrian-routed trail semantics', () => {
  it('chooses a loop when closure adds little routed distance', () => {
    const matrix = [
      [0, 500, 650],
      [500, 0, 500],
      [650, 500, 0]
    ];

    const route = chooseRouteOrder(anchors, matrix);

    expect(route.shape).toBe('loop');
    expect(route.anchorIds[0]).toBe(route.anchorIds.at(-1));
  });

  it('keeps a strong point-to-point route when loop closure is excessive', () => {
    const matrix = [
      [0, 400, 1800],
      [400, 0, 400],
      [1800, 400, 0]
    ];

    const route = chooseRouteOrder(anchors, matrix);

    expect(route).toMatchObject({ shape: 'point-to-point', distanceM: 800 });
    expect(new Set(route.anchorIds)).toEqual(new Set(['a', 'b', 'c']));
  });

  it('uses point-to-point when an otherwise reasonable loop needs an oversized closure leg', () => {
    const matrix = [
      [0, 1500, 2100],
      [1500, 0, 1500],
      [2100, 1500, 0]
    ];

    expect(chooseRouteOrder(anchors, matrix)).toMatchObject({ shape: 'point-to-point', distanceM: 3000 });
  });

  it('accepts only pinned OpenRouteService foot-walking geometry within the actual size band', () => {
    const routed = {
      geometry: { type: 'LineString', coordinates: [[-123.12, 49.25], [-123.115, 49.255], [-123.11, 49.26]] },
      distanceM: 2400,
      durationSeconds: 1800,
      legDistancesM: [1200, 1200],
      snappedDistancesM: [4, 7, 5],
      provenance: {
        provider: 'openrouteservice',
        profile: 'foot-walking',
        engineVersion: '9.9.0',
        graphDate: '2026-07-01',
        generatedAt: '2026-07-18T20:00:00.000Z',
        attribution: '© openrouteservice.org by HeiGIT | Map data © OpenStreetMap contributors',
        resultLicense: 'CC-BY-4.0'
      }
    };

    expect(validateRoutedTrail(routed, { size: 'small' })).toBe(true);
    expect(() => validateRoutedTrail({ ...routed, distanceM: 3001 }, { size: 'small' })).toThrow('routed distance');
    expect(() => validateRoutedTrail({ ...routed, provenance: { ...routed.provenance, profile: 'driving-car' } }, { size: 'small' })).toThrow('foot-walking');
    expect(() => validateRoutedTrail({ ...routed, provenance: { ...routed.provenance, resultLicense: 'unknown' } }, { size: 'small' })).toThrow('licence');
  });

  it('rejects distant snaps, major jumps, and repeated backtracking', () => {
    const backtracking = {
      type: 'LineString',
      coordinates: [[0, 0], [0.001, 0], [0, 0], [0.001, 0], [0.002, 0]]
    };

    expect(routedGeometryQuality(backtracking).repeatedSegmentRatio).toBeGreaterThan(0.2);
    expect(() => validateRoutedTrail({
      geometry: backtracking,
      distanceM: 2000,
      durationSeconds: 1200,
      legDistancesM: [2000],
      snappedDistancesM: [55, 2],
      provenance: {
        provider: 'openrouteservice', profile: 'foot-walking', engineVersion: '9', graphDate: '2026-07-01',
        generatedAt: '2026-07-18T20:00:00.000Z', attribution: '© openrouteservice.org by HeiGIT | Map data © OpenStreetMap contributors', resultLicense: 'CC-BY-4.0'
      }
    }, { size: 'small' })).toThrow(/snap|repeated/i);
  });
});
