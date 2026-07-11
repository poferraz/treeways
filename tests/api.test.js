import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../src/api.js';

describe('API Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch route details from OSRM', async () => {
    const mockRouteGeoJSON = { type: 'LineString', coordinates: [[-123, 49], [-123.1, 49.1]] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        routes: [{
          geometry: mockRouteGeoJSON,
          distance: 1200,
          duration: 900
        }]
      })
    });

    const route = await api.fetchRoute([
      { lat: 49, lng: -123 },
      { lat: 49.1, lng: -123.1 }
    ]);
    expect(route.distance).toBe(1200);
    expect(route.geometry.type).toBe('LineString');
  });
});
