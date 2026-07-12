import { describe, expect, it } from 'vitest';
import { addRouteStop } from '../src/ui/route-builder.js';
describe('route builder', () => { it('keeps route stops unique', () => { const tree = { id: 'a', commonName: 'Apple', latitude: 49, longitude: -123 }; expect(addRouteStop(addRouteStop([], tree), tree)).toHaveLength(1); }); });
