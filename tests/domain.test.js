import { describe, expect, it } from 'vitest';
import { monthsToMask, maskHasMonth } from '../src/domain/phenology.js';
import { normalizeTree, toFeature } from '../src/domain/tree.js';
import { classifyGiant } from '../src/domain/giant.js';
import { validateSpeciesMetadata } from '../src/domain/forage.js';
import { validateManifest, validateTreePack } from '../src/data/city-schema.js';
import { resolveSpeciesEvidence, validateEvidenceRegistry } from '../src/domain/evidence.js';

const source = {
  id: 'example-source', publisher: 'Example authority', title: 'Reviewed records', canonicalUrl: 'https://example.test/catalog', version: '2026.1', retrievedAt: '2026-07-12', geographicScope: 'Example', taxonomicGranularity: 'cultivar', cultivarsDistinguished: true,
  license: { url: 'https://example.test/license', identifier: 'CC-BY-4.0', attribution: 'Example authority', allowsReuse: true, allowsRedistribution: true, allowsDerivatives: true, allowsModification: true },
  supportedClaimKinds: ['edibility', 'bloom', 'harvest']
};
const registry = records => ({ schemaVersion: 1, sources: [source], records });
const record = (overrides = {}) => ({
  id: 'acer-rubrum', sourceId: 'example-source', taxonId: 'example:acer-rubrum', scientificName: 'Acer rubrum', cultivar: null, recordUrl: 'https://example.test/acer-rubrum', statement: 'The reviewed source supports these exact fields.', caveats: [], review: { status: 'reviewed', reviewedAt: '2026-07-12' },
  claims: [{ kind: 'edibility', status: 'reported-edible', edibleParts: ['fruit'] }, { kind: 'bloom', mask: monthsToMask([4]), colour: 'red' }, { kind: 'harvest', mask: monthsToMask([9]) }], ...overrides
});

describe('city pack contracts', () => {
  it('encodes a bounded 12-month phenology mask', () => {
    const mask = monthsToMask([3, 4]);
    expect(maskHasMonth(mask, 3)).toBe(true);
    expect(maskHasMonth(mask, 12)).toBe(false);
  });
  it('rejects invalid tree coordinates', () => expect(() => normalizeTree({ id: 'a', lat: 95, lng: 1 })).toThrow('latitude'));
  it('classifies giant trees from reported height or canopy measurements at threshold edges', () => {
    expect(classifyGiant({ heightM: 20, canopySpreadM: null })).toEqual({ isGiant: true, reasons: ['height'] });
    expect(classifyGiant({ heightM: 19.9, canopySpreadM: 20 })).toEqual({ isGiant: true, reasons: ['canopy-spread'] });
    expect(classifyGiant({ heightM: 19.9, canopySpreadM: null })).toEqual({ isGiant: false, reasons: [] });
  });
  it('requires evidence for any claimed species enrichment and exposes giant metadata to map features', () => {
    expect(() => validateSpeciesMetadata({ commonName: 'Apple', edibility: { status: 'reported-edible', evidence: [] } })).toThrow('evidence');
    expect(() => validateSpeciesMetadata({ commonName: 'Apple', edibility: { status: 'unknown', evidence: [], edibleParts: ['fruit'] } })).toThrow('Unknown');
    const evidence = registry([record({ claims: [{ kind: 'bloom', mask: monthsToMask([4, 5]), colour: 'pink' }] })]);
    const bloom = { mask: monthsToMask([4, 5]), colour: 'pink', evidence: ['acer-rubrum'] };
    expect(validateSpeciesMetadata({ commonName: 'Apple', edibility: { status: 'unknown', evidence: [] }, bloom }, evidence)).toBeTruthy();
    const tree = normalizeTree({ id: 'a', lat: 49.2, lng: -123.1, heightM: 22, canopySpreadM: 10, canopyProvenance: { kind: 'measured', source: 'city' }, bloom });
    expect(toFeature(tree).properties).toMatchObject({ isGiant: true, giantReasons: ['height'], canopyProvenance: 'measured', bloomMask: monthsToMask([4, 5]), bloomColour: 'pink', edibilityStatus: 'unknown' });
  });
  it('rejects canopy provenance without a matching measurement or with an orphan pack record', () => {
    expect(() => normalizeTree({ id: 'a', lat: 49.2, lng: -123.1, canopyProvenance: { kind: 'measured' } })).toThrow('Canopy provenance');
    expect(() => validateTreePack({ schemaVersion: 2, species: [{ commonName: 'Apple', edibility: { status: 'unknown', evidence: [] } }], trees: [['a', 49.2, -123.1, 0, null, null, null, null, 'a']], treeMeasurements: { missing: { canopy: { kind: 'measured' } } }, trails: [] })).toThrow('Orphan');
    expect(() => validateTreePack({ schemaVersion: 2, species: [{ commonName: 'Apple', edibility: { status: 'unknown', evidence: [] } }], trees: [['a', 49.2, -123.1, 0, null, null, null, null, 'a']], treeMeasurements: { a: {} }, trails: [] })).toThrow('requires canopy');
  });
  it('requires city attribution', () => expect(() => validateManifest({ id: 'example', name: 'Example', locale: 'en', timezone: 'UTC', bounds: [0, 0, 1, 1], data: {}, attribution: {}, capabilities: {} })).toThrow('attribution'));
  it('requires a separate startup highlight pack before the complete inventory', () => {
    const manifest = { id: 'example', name: 'Example', locale: 'en', timezone: 'UTC', bounds: [0, 0, 1, 1], data: { pack: '/full.json' }, attribution: { name: 'Example', license: 'Example' }, capabilities: {} };
    expect(() => validateManifest(manifest)).toThrow('highlight pack');
    expect(validateManifest({ ...manifest, data: { ...manifest.data, highlightsPack: '/highlights.json' } }).data.highlightsPack).toBe('/highlights.json');
  });
  it('only resolves exactly normalized scientific names and matching cultivars', () => {
    const exact = registry([record(), record({ id: 'acer-rubrum-red-sunset', cultivar: 'Red Sunset', recordUrl: 'https://example.test/red-sunset' })]);
    expect(resolveSpeciesEvidence({ genus: 'Acer', species: 'rubrum', cultivar: null }, exact).edibility.status).toBe('reported-edible');
    expect(resolveSpeciesEvidence({ genus: 'Acer', species: 'rubrum', cultivar: 'Red Sunset' }, exact).edibility.status).toBe('reported-edible');
    expect(resolveSpeciesEvidence({ genus: 'Acer', species: 'rubrum', cultivar: 'October Glory' }, exact).edibility.status).toBe('unknown');
    expect(resolveSpeciesEvidence({ genus: 'Acer', species: 'rubra', cultivar: null, commonName: 'Red maple' }, exact).edibility.status).toBe('unknown');
    expect(resolveSpeciesEvidence({ genus: 'Acer', species: '', cultivar: null }, exact).edibility.status).toBe('unknown');
  });
  it('requires exact reviewed evidence for every factual claim and rejects unsupported semantics', () => {
    const evidence = registry([record()]);
    expect(() => validateSpeciesMetadata({ commonName: 'Red maple', edibility: { status: 'reported-edible', edibleParts: ['fruit', 'bark'], evidence: ['acer-rubrum'] } }, evidence)).toThrow('does not support');
    expect(() => validateSpeciesMetadata({ commonName: 'Red maple', edibility: { status: 'reported-edible', edibleParts: ['fruit'], evidence: ['missing'] } }, evidence)).toThrow('Unknown evidence');
    expect(() => validateSpeciesMetadata({ commonName: 'Red maple', edibility: { status: 'unknown', evidence: [] }, bloom: { mask: 0, colour: 'red', evidence: ['acer-rubrum'] } }, evidence)).toThrow('valid mask');
    expect(() => validateSpeciesMetadata({ commonName: 'Red maple', edibility: { status: 'unknown', evidence: [] }, bloom: { mask: monthsToMask([4]), colour: 'blue', evidence: ['acer-rubrum'] } }, evidence)).toThrow('semantic colour');
    expect(() => validateSpeciesMetadata({ commonName: 'Red maple', edibility: { status: 'unknown', evidence: [] }, harvest: { mask: monthsToMask([8]), evidence: ['acer-rubrum'] } }, evidence)).toThrow('does not support');
  });
  it('rejects unlicensed or unreviewed source records and resolves conflicts to unknown', () => {
    expect(() => validateEvidenceRegistry({ ...registry([]), sources: [{ ...source, license: { ...source.license, allowsDerivatives: false } }] })).toThrow('reuse');
    expect(() => validateEvidenceRegistry(registry([record({ review: { status: 'draft', reviewedAt: '2026-07-12' } })]))).toThrow('review');
    expect(() => validateEvidenceRegistry(registry([record({ statement: '' })]))).toThrow('statement');
    expect(() => validateEvidenceRegistry(registry([record({ id: 'z' }), record({ id: 'a', recordUrl: 'https://example.test/a' })]))).toThrow('deterministic');
    const conflict = registry([record({ id: 'a' }), record({ id: 'conflict', recordUrl: 'https://example.test/conflict', claims: [{ kind: 'edibility', status: 'not-edible' }] })]);
    expect(resolveSpeciesEvidence({ genus: 'Acer', species: 'rubrum', cultivar: null }, conflict).edibility).toEqual({ status: 'unknown', evidence: [] });
  });
  it('keeps species claims separate from food-site access and canopy provenance', () => {
    const evidence = registry([record()]);
    const metadata = resolveSpeciesEvidence({ genus: 'Acer', species: 'rubrum', cultivar: null }, evidence);
    expect(metadata).not.toHaveProperty('access');
    expect(metadata).not.toHaveProperty('harvestingPermission');
    expect(() => normalizeTree({ id: 'a', lat: 49.2, lng: -123.1, canopySpreadM: 12, canopyProvenance: { kind: 'estimated' } })).toThrow('method');
  });
  it('keeps ambiguous harvest claims unknown', () => {
    const conflictingHarvest = registry([record({ id: 'a', claims: [{ kind: 'harvest', mask: monthsToMask([8]) }] }), record({ id: 'b', recordUrl: 'https://example.test/b', claims: [{ kind: 'harvest', mask: monthsToMask([9]) }] })]);
    expect(resolveSpeciesEvidence({ genus: 'Acer', species: 'rubrum', cultivar: null }, conflictingHarvest).harvest).toBeNull();
  });
});
