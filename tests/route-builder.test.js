import { describe, expect, it } from 'vitest';
import { addRouteStop, moveRouteStop } from '../src/ui/route-builder.js';
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
});
