import { describe, expect, it, vi } from 'vitest';
import { OpenRouteServiceProvider } from '../scripts/city/openrouteservice-provider.js';

const anchors = [
  { id: 'a', latitude: 49.25, longitude: -123.12 },
  { id: 'b', latitude: 49.26, longitude: -123.11 }
];

describe('OpenRouteService build-time provider', () => {
  it('keeps the key in the authorization header and normalizes snap, matrix, and directions responses', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(response({
        locations: [
          { location: [-123.12, 49.25], snapped_distance: 4 },
          { location: [-123.11, 49.26], snapped_distance: 7 }
        ]
      }))
      .mockResolvedValueOnce(response({ distances: [[0, 900], [900, 0]] }))
      .mockResolvedValueOnce(response({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [[-123.12, 49.25], [-123.11, 49.26]] },
          properties: { summary: { distance: 900, duration: 700 }, segments: [{ distance: 900 }] }
        }],
        metadata: { attribution: 'openrouteservice.org, OpenStreetMap contributors', engine: { version: '9.9.0', graph_date: '2026-07-01', build_date: '2026-07-02' } }
      }));
    const provider = new OpenRouteServiceProvider({ apiKey: 'secret', fetch, now: () => new Date('2026-07-18T20:00:00.000Z') });

    const snapped = await provider.snap(anchors);
    const matrix = await provider.matrix(snapped);
    const route = await provider.directions(snapped);

    expect(snapped.map(item => item.snappedDistanceM)).toEqual([4, 7]);
    expect(matrix).toEqual([[0, 900], [900, 0]]);
    expect(route).toMatchObject({
      distanceM: 900,
      durationSeconds: 700,
      legDistancesM: [900],
      snappedDistancesM: [4, 7],
      provenance: { provider: 'openrouteservice', profile: 'foot-walking', engineVersion: '9.9.0', graphDate: '2026-07-01', generatedAt: '2026-07-18T20:00:00.000Z' }
    });
    expect(fetch.mock.calls.every(([, options]) => options.headers.Authorization === 'secret')).toBe(true);
    expect(fetch.mock.calls[2][1].headers.Accept).toBe('application/geo+json');
    expect(JSON.parse(fetch.mock.calls[2][1].body).instructions).toBe(true);
    expect(fetch.mock.calls.map(([url]) => url)).toEqual(expect.arrayContaining([
      expect.stringContaining('/v2/snap/foot-walking'),
      expect.stringContaining('/v2/matrix/foot-walking'),
      expect.stringContaining('/v2/directions/foot-walking/geojson')
    ]));
  });

  it('fails fast without a key or when an anchor cannot snap within 40 metres', async () => {
    expect(() => new OpenRouteServiceProvider({ apiKey: '' })).toThrow('API key');
    const provider = new OpenRouteServiceProvider({ apiKey: 'secret', fetch: vi.fn().mockResolvedValue(response({ locations: [null, { location: [-123.11, 49.26], snapped_distance: 2 }] })) });
    await expect(provider.snap(anchors)).rejects.toThrow('could not snap');
  });

  it('surfaces a sanitized ORS error reason without exposing the key', async () => {
    const provider = new OpenRouteServiceProvider({
      apiKey: 'private-key',
      fetch: vi.fn().mockResolvedValue(response({ error: { message: 'Route could not be found' } }, 406))
    });

    await expect(provider.matrix(anchors)).rejects.toThrow('Route could not be found');
    await expect(provider.matrix(anchors)).rejects.not.toThrow('private-key');
  });
});

function response(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
}
