import { describe, expect, it, vi } from 'vitest';
import { setRouteData } from '../src/map/route-layers.js';

describe('trail route map data', () => {
  it('draws the routed geometry but marks only semantic cluster stops', () => {
    const routeSource = { setData: vi.fn() };
    const stopSource = { setData: vi.fn() };
    const map = { getSource: id => id === 'route' ? routeSource : stopSource };
    const geometry = { type: 'LineString', coordinates: [[-123.12, 49.25], [-123.115, 49.255], [-123.11, 49.26]] };
    const stops = [
      { id: 'area-a', anchor: { longitude: -123.12, latitude: 49.25 } },
      { id: 'area-b', anchor: { longitude: -123.11, latitude: 49.26 } }
    ];

    setRouteData(map, { geometry, stops });

    expect(routeSource.setData).toHaveBeenCalledWith({ type: 'Feature', properties: {}, geometry });
    const stopData = stopSource.setData.mock.calls[0][0];
    expect(stopData.features).toHaveLength(2);
    expect(stopData.features.map(feature => feature.properties)).toEqual([
      { id: 'area-a', index: 1 },
      { id: 'area-b', index: 2 }
    ]);
  });
});
