import { describe, expect, it } from 'vitest';
import { routePilotCandidate } from '../scripts/city/route-pilots.js';

describe('pilot route compilation', () => {
  it('chooses routed shape and distance while preserving NOT HUMAN REVIEWED status', async () => {
    const candidate = {
      id: 'candidate-test',
      status: 'NOT HUMAN REVIEWED',
      clusterStops: ['a', 'b', 'c'].map((id, index) => ({ id, anchor: { treeId: `tree-${id}`, latitude: 49.25 + index * 0.001, longitude: -123.12 + index * 0.001 } })),
      routing: { status: 'not-routed', requiredProfile: 'foot-walking' }
    };
    const provider = {
      async snap(anchors) { return anchors.map(anchor => ({ ...anchor, snappedLatitude: anchor.latitude, snappedLongitude: anchor.longitude, snappedDistanceM: 3 })); },
      async matrix() { return [[0, 400, 550], [400, 0, 400], [550, 400, 0]]; },
      async directions(ordered) {
        return {
          geometry: { type: 'LineString', coordinates: ordered.map(item => [item.snappedLongitude, item.snappedLatitude]) },
          distanceM: 1350,
          durationSeconds: 1100,
          legDistancesM: [400, 400, 550],
          snappedDistancesM: ordered.map(item => item.snappedDistanceM),
          provenance: { provider: 'openrouteservice', profile: 'foot-walking', engineVersion: '9.9.0', graphDate: '2026-07-01', generatedAt: '2026-07-18T20:00:00.000Z', attribution: '© openrouteservice.org by HeiGIT | Map data © OpenStreetMap contributors', resultLicense: 'CC-BY-4.0' }
        };
      }
    };

    const routed = await routePilotCandidate(candidate, provider);

    expect(routed).toMatchObject({ status: 'NOT HUMAN REVIEWED', shape: 'loop', size: 'small', routing: { status: 'routed' } });
    expect(routed).not.toHaveProperty('review');
    expect(routed.route.anchorOrder[0]).toBe(routed.route.anchorOrder.at(-1));
  });
});
