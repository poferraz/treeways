import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import fixture from './fixtures/city/vancouver-records.json';
import { vancouverAdapter } from '../scripts/city/adapters/vancouver.js';
import foodSitesFixture from './fixtures/city/vancouver-food-sites.json';
import { vancouverFoodSitesAdapter } from '../scripts/city/adapters/vancouver-food-sites.js';
import { decodeTreePack } from '../src/data/tree-pack.js';
import { composeCityArtifact } from '../scripts/city/build-pack.js';
import { jsonBytes, sha256, writePinnedSnapshot } from '../scripts/city/pipeline.js';
import { createPmtilesCandidate, toEligibleGeoJsonFeatures, validateBenchmarkReport, verifyFilterCorrectClustering } from '../scripts/city/benchmark-backends.js';
import { decodePmtiles } from '../scripts/city/pmtiles.js';
import { generateCandidateReviewPacket } from '../scripts/city/trails.js';
import { compileReviewedTrails, validateTrailMembership } from '../src/domain/trails.js';

describe('Vancouver city pipeline', () => {
  it('accounts for every record and preserves missing measurements as null', () => {
    const output = vancouverAdapter.normalize(fixture.results);
    expect(output.accepted).toHaveLength(1);
    expect(output.rejects.map(reject => reject.reason)).toEqual(['duplicate-id', 'invalid-height-m', 'invalid-coordinate']);
    expect(output.accepted[0].slice(4, 7)).toEqual([null, null, null]);
    expect(output.species[0].edibility).toEqual({ status: 'unknown', evidence: [] });
    expect(output.accepted.length + output.rejects.length).toBe(fixture.results.length);
  });

  it('retains the full-snapshot rejection accounting in the committed evidence', async () => {
    const report = JSON.parse(await readFile(join(process.cwd(), 'data/cities/vancouver/reports/rejects.json'), 'utf8'));
    const reasons = Object.groupBy(report.rejects, reject => reject.reason);
    expect(report.rejects).toHaveLength(538);
    expect(reasons['invalid-diameter-cm']).toHaveLength(531);
    expect(reasons['invalid-height-m']).toHaveLength(6);
    expect(reasons['invalid-coordinate']).toHaveLength(1);
  });

  it('enforces the v2 tuple contract and empty trails collection', () => {
    const { accepted, species } = vancouverAdapter.normalize([fixture.results[0]]);
    expect(decodeTreePack({ schemaVersion: 2, sourceSnapshot: {}, species, trees: accepted, trails: [] })[0].canopySpreadM).toBeNull();
    expect(() => decodeTreePack({ schemaVersion: 2, species, trees: accepted, trails: null })).toThrow('schema v2');
    const invalidUnit = [...accepted[0]];
    invalidUnit[4] = 0;
    expect(() => decodeTreePack({ schemaVersion: 2, species, trees: [invalidUnit], trails: [] })).toThrow('Invalid heightM');
  });

  it('keeps food-tree records as access-unknown sites, never tree specimens', () => {
    const output = vancouverFoodSitesAdapter.normalize(foodSitesFixture.results);
    expect(output.foodSites).toHaveLength(1);
    expect(output.foodSites[0]).toMatchObject({ id: 'a', reportedFoodTreeCount: null, access: { status: 'unknown' } });
    expect(output.rejects.map(reject => reject.reason)).toEqual(['duplicate-id', 'invalid-coordinate']);
  });

  it('packages the complete schema-v2 shape without folding food sites into tree tuples', () => {
    const normalized = { schemaVersion: 2, sourceSnapshot: { id: 'snapshot' }, evidence: { schemaVersion: 1, sources: [], records: [] }, species: [{ commonName: 'Test' }], trees: [['tree-1', 49.2, -123.1, 0, null, null, null, null, 'tree-1']], trails: [] };
    const foodSites = { sourceSnapshot: { id: 'food-snapshot' }, foodSites: [{ id: 'site-1', access: { status: 'unknown' } }] };
    const artifact = composeCityArtifact(normalized, foodSites, 'v2.1.0');
    expect(artifact).toMatchObject({ artifactVersion: 'v2.1.0', evidence: normalized.evidence, trees: normalized.trees, foodSites: foodSites.foodSites, foodSiteSourceSnapshot: foodSites.sourceSnapshot });
    expect(artifact.trees).toHaveLength(1);
    expect(artifact.foodSites).toHaveLength(1);
  });

  it('writes pinned gzip snapshots and artifact checksums deterministically', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'city-pipeline-'));
    const snapshotPath = join(directory, 'snapshot.json.gz');
    try {
      const first = await writePinnedSnapshot(snapshotPath, { total_count: 1, results: [{ asset_id: '1' }] });
      const firstBytes = await readFile(snapshotPath);
      const second = await writePinnedSnapshot(snapshotPath, { total_count: 1, results: [{ asset_id: '1' }] });
      const secondBytes = await readFile(snapshotPath);
      expect(secondBytes.equals(firstBytes)).toBe(true);
      expect(second.sha256).toBe(first.sha256);
      expect(sha256(firstBytes)).toBe(first.sha256);
      expect(jsonBytes({ id: 'artifact' }).toString()).toBe('{\n  "id": "artifact"\n}\n');
    } finally { await rm(directory, { recursive: true, force: true }); }
  });

  it('creates a decodable multi-zoom PMTiles/MVT candidate with every source feature', () => {
    const trees = [['a', 49.2, -123.1, 0, 12, null, null, null, 'a'], ['b', 49.25, -123.2, 0, 8, null, null, null, 'b']];
    const { archive, tiles } = createPmtilesCandidate(toEligibleGeoJsonFeatures(trees, () => true), [-123.3, 49.18, -122.9, 49.35], 2);
    const decoded = decodePmtiles(archive);
    expect(tiles.some(tile => tile.z === 0)).toBe(true);
    expect(tiles.some(tile => tile.z === 2)).toBe(true);
    expect(decoded.featureIds).toEqual(new Set(['a', 'b']));
    expect(createPmtilesCandidate(toEligibleGeoJsonFeatures(trees, () => true), [-123.3, 49.18, -122.9, 49.35], 2).archive.equals(archive)).toBe(true);
    expect(() => decodePmtiles(Buffer.from('invalid'))).toThrow('Invalid PMTiles v3 archive');
  });

  it('proves filtered clustering only exposes worker-eligible IDs and rejects report drift', () => {
    const trees = [['visible', 49.2, -123.1, 0, 12, null, null, null, 'visible'], ['hidden', 49.2, -123.1, 0, 8, null, null, null, 'hidden']];
    expect(verifyFilterCorrectClustering(trees, tree => tree[4] >= 10)).toMatchObject({ eligibleTreeCount: 1, jsonClusterSourceCount: 1, pmtilesTileNativeCountsDisplayed: false });
    const artifactBytes = jsonBytes({ artifact: 'exact-bytes' });
    const report = { artifact: { path: 'artifact.json', sha256: sha256(artifactBytes), trees: 2, foodSites: 0 }, runs: 3, decision: 'approved-gate-a2', pmtiles: { transferEncoding: 'range-safe archive bytes plus gzip lookup' } };
    expect(validateBenchmarkReport(report, { artifactPath: 'artifact.json', artifactBytes, trees, foodSites: [] })).toBe(true);
    expect(() => validateBenchmarkReport({ ...report, artifact: { ...report.artifact, sha256: 'stale' } }, { artifactPath: 'artifact.json', artifactBytes, trees, foodSites: [] })).toThrow('Benchmark report drift');
  });

  it('generates byte-stable, measurement-only giant candidate packets without seasonal or forage candidates', () => {
    const trees = [['g2', 49.21, -123.11, 0, 21, 50, null, null, 'g2'], ['small', 49.22, -123.12, 0, 10, 50, null, null, 'small'], ['g1', 49.20, -123.10, 0, 24, 20, null, null, 'g1']];
    const input = { city: 'vancouver', sourceArtifact: { city: 'vancouver', sha256: 'artifact', sourceSnapshotSha256: 'snapshot' }, trees };
    const first = generateCandidateReviewPacket(input);
    const second = generateCandidateReviewPacket(input);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first.status).toBe('NOT HUMAN REVIEWED');
    expect(first.unsupportedThemeCandidates).toEqual({ season: [], forage: [] });
    expect(first.candidates).toHaveLength(2);
    expect(first.candidates.every(candidate => candidate.theme === 'giant-measurements' && candidate.proposedOrder.includes('not pedestrian routing') && candidate.distance.notWalkingDistance)).toBe(true);
    expect(first.candidates.flatMap(candidate => candidate.waypointTreeIds).sort()).toEqual(['g1', 'g2']);
    expect(first.candidates[0].valueScore.components[0]).toHaveProperty('heightM');
  });

  it('compiles only human-reviewed, bounded waypoint records and builds exact reverse membership', () => {
    const trees = [['a', 49.2, -123.1, 0, 21, null, null, null, 'a'], ['b', 49.21, -123.11, 0, 22, null, null, null, 'b']];
    const context = { cityId: 'vancouver', sourceSnapshotSha256: 'snapshot', candidateGeneratorVersion: 'm3-a-giant-measurements-v1', trees, bounds: [-123.3, 49.18, -122.9, 49.35] };
    const trail = { id: 'reviewed-waypoints', cityId: 'vancouver', name: 'Approved waypoint sequence', waypointTreeIds: ['a', 'b'], exportAnchors: [{ treeId: 'a', latitude: 49.2, longitude: -123.1 }, { treeId: 'b', latitude: 49.21, longitude: -123.11 }], narrative: 'A reviewed sequence of waypoints.', accessibilityNotes: 'unknown', pedestrianPlausibility: 'unknown', review: { status: 'human-reviewed', reviewer: 'Alicia', reviewedAt: '2026-07-12' }, candidateId: 'candidate-a', candidateGeneratorVersion: 'm3-a-giant-measurements-v1', sourceSnapshotSha256: 'snapshot', caveats: [] };
    const source = { schemaVersion: 1, cityId: 'vancouver', sourceSnapshotSha256: 'snapshot', candidateGeneratorVersion: 'm3-a-giant-measurements-v1', trails: [trail] };
    const compiled = compileReviewedTrails(source, context);
    expect(compiled.trails).toHaveLength(1);
    expect(compiled.trailMembership).toEqual({ a: ['reviewed-waypoints'], b: ['reviewed-waypoints'] });
    expect(JSON.stringify(compileReviewedTrails(source, context))).toBe(JSON.stringify(compiled));
    expect(() => validateTrailMembership(compiled.trails, { a: ['missing'] }, new Set(['a', 'b']), context.bounds)).toThrow('exactly');
  });

  it('rejects candidate-like, self-reviewed, unsafe, malformed, and orphan trail source records', () => {
    const trees = [['a', 49.2, -123.1, 0, 21, null, null, null, 'a'], ['b', 49.21, -123.11, 0, 22, null, null, null, 'b']];
    const context = { cityId: 'vancouver', sourceSnapshotSha256: 'snapshot', candidateGeneratorVersion: 'm3-a-giant-measurements-v1', trees, bounds: [-123.3, 49.18, -122.9, 49.35] };
    const base = { id: 'candidate-raw', cityId: 'vancouver', name: 'Name', waypointTreeIds: ['a', 'b'], exportAnchors: [{ treeId: 'a', latitude: 49.2, longitude: -123.1 }, { treeId: 'b', latitude: 49.21, longitude: -123.11 }], narrative: 'Waypoint sequence.', accessibilityNotes: 'unknown', pedestrianPlausibility: 'unknown', review: { status: 'human-reviewed', reviewer: 'Human', reviewedAt: '2026-07-12' }, candidateId: 'candidate-a', candidateGeneratorVersion: 'm3-a-giant-measurements-v1', sourceSnapshotSha256: 'snapshot', caveats: [] };
    const source = trail => ({ schemaVersion: 1, cityId: 'vancouver', sourceSnapshotSha256: 'snapshot', candidateGeneratorVersion: 'm3-a-giant-measurements-v1', trails: [trail] });
    expect(() => compileReviewedTrails(source({ ...base, review: { ...base.review, reviewer: 'AI Agent' } }), context)).toThrow('human review');
    expect(() => compileReviewedTrails(source({ ...base, narrative: 'A safe walking route.' }), context)).toThrow('unsupported');
    expect(() => compileReviewedTrails(source({ ...base, waypointTreeIds: ['a', 'missing'] }), context)).toThrow('missing tree');
    expect(() => compileReviewedTrails(source({ ...base, exportAnchors: [{ ...base.exportAnchors[0], latitude: 1 }, base.exportAnchors[1]] }), context)).toThrow('malformed');
    expect(() => compileReviewedTrails({ ...source(base), trails: [base, { ...base }] }, context)).toThrow('unique IDs');
    expect(() => compileReviewedTrails(source({ ...base, waypointTreeIds: Array.from({ length: 21 }, (_, index) => `tree-${index}`) }), context)).toThrow('waypoint order');
    const candidate = generateCandidateReviewPacket({ city: 'vancouver', sourceArtifact: { city: 'vancouver', sha256: 'artifact', sourceSnapshotSha256: 'snapshot' }, trees }).candidates[0];
    expect(() => compileReviewedTrails(source(candidate), context)).toThrow('human review');
    expect(compileReviewedTrails({ schemaVersion: 1, trails: [] }, context)).toEqual({ trails: [], trailMembership: {} });
  });
});
