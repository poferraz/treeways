import { describe, expect, it } from 'vitest';
import { addRouteStop, googleWalkingDirectionsUrl, moveRouteStop } from '../src/ui/route-builder.js';
describe('route builder', () => {
  it('keeps route stops unique', () => {
    const tree = { id: 'a', commonName: 'Apple', latitude: 49, longitude: -123 };
    expect(addRouteStop(addRouteStop([], tree), tree)).toHaveLength(1);
  });

  it('moves stops without mutating the original order', () => {
    const stops = [{ id: 'a' }, { id: 'b' }];
    expect(moveRouteStop(stops, 1, -1).map(stop => stop.id)).toEqual(['b', 'a']);
    expect(stops.map(stop => stop.id)).toEqual(['a', 'b']);
  });

  it('hands ordered stops to an external walking-directions page', () => {
    const url = new URL(googleWalkingDirectionsUrl([
      { latitude: 49.25, longitude: -123.12 },
      { latitude: 49.26, longitude: -123.11 },
      { latitude: 49.27, longitude: -123.1 }
    ]));

    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/dir/');
    expect(url.searchParams.get('api')).toBe('1');
    expect(url.searchParams.get('origin')).toBe('49.25,-123.12');
    expect(url.searchParams.get('waypoints')).toBe('49.26,-123.11');
    expect(url.searchParams.get('destination')).toBe('49.27,-123.1');
    expect(url.searchParams.get('travelmode')).toBe('walking');
  });
});
