import { describe, expect, it } from 'vitest';
import { monthsToMask, maskHasMonth } from '../src/domain/phenology.js';
import { normalizeTree } from '../src/domain/tree.js';
import { validateManifest } from '../src/data/city-schema.js';

describe('city pack contracts', () => {
  it('encodes a bounded 12-month phenology mask', () => {
    const mask = monthsToMask([3, 4]);
    expect(maskHasMonth(mask, 3)).toBe(true);
    expect(maskHasMonth(mask, 12)).toBe(false);
  });
  it('rejects invalid tree coordinates', () => expect(() => normalizeTree({ id: 'a', lat: 95, lng: 1 })).toThrow('latitude'));
  it('requires city attribution', () => expect(() => validateManifest({ id: 'example', name: 'Example', locale: 'en', timezone: 'UTC', bounds: [0, 0, 1, 1], data: {}, attribution: {}, capabilities: {} })).toThrow('attribution'));
});
