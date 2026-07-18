import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import fixture from './fixtures/city/vancouver-records.json';
import { vancouverAdapter } from '../scripts/city/adapters/vancouver.js';
import foodSitesFixture from './fixtures/city/vancouver-food-sites.json';
import { vancouverFoodSitesAdapter } from '../scripts/city/adapters/vancouver-food-sites.js';
import { decodeTreePack } from '../src/data/tree-pack.js';
import { composeCityArtifact, composeHighlightArtifact } from '../scripts/city/build-pack.js';
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
    const report = JSON.parse(await readFile(join(process.cwd(), 'data/cities/vancouver/rejection-summary.json'), 'utf8'));
    expect(report).toMatchObject({
      sourceSnapshotSha256: '3eb0140b7e968d21f6e4dd4bc54b33dca7495a284bafda3435ca9bcca9f09764',
      sourceRecords: 185845,
      acceptedRecords: 185307,
      rejectedRecords: 538,
      reasons: { 'invalid-diameter-cm': 531, 'invalid-height-m': 6, 'invalid-coordinate': 1 }
    });
    expect(report.sourceRecords).toBe(report.acceptedRecords + report.rejectedRecords);
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

  it('builds a small startup pack from deterministic highlights and keeps reviewed trail members available', () => {
    const normalized = {
      schemaVersion: 2, sourceSnapshot: { id: 'snapshot' }, evidence: { schemaVersion: 1, sources: [], records: [] },
      species: [{ commonName: 'Test' }],
      trees: [
        ['highlight', 49.2, -123.1, 0, null, null, null, null, 'highlight'],
        ['trail-member', 49.21, -123.11, 0, null, null, null, null, 'trail-member'],
        ['background', 49.22, -123.12, 0, null, null, null, null, 'background']
      ],
      treeMeasurements: {},
      trails: [{ id: 'reviewed', clusterStops: [{ memberTreeIds: ['trail-member'] }] }],
      trailMembership: { 'trail-member': ['reviewed'] }
    };
    const full = composeCityArtifact(normalized, { sourceSnapshot: {}, foodSites: [] }, 'v2.1.0');
    const highlights = composeHighlightArtifact(full, { method: 'density-areas-and-recorded-size', treeIds: ['highlight'], densityAreas: [], criteria: {} });
    expect(highlights.trees.map(tree => tree[0])).toEqual(['highlight', 'trail-member']);
    expect(highlights.trails).toEqual(full.trails);
    expect(highlights.highlightSelection).toMatchObject({ method: 'density-areas-and-recorded-size', treeCount: 2 });
    expect(highlights.trees).toHaveLength(2);
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

  it('keeps generated cluster pilots explicitly separate from reviewed trails', () => {
    const trees = clusterTrees();
    const input = {
      city: 'vancouver',
      sourceArtifact: { city: 'vancouver', sha256: 'artifact', sourceSnapshotSha256: 'snapshot' },
      species: [{ commonName: 'KWANZAN FLOWERING CHERRY', genus: 'PRUNUS', species: 'SERRULATA' }],
      trees
    };
    const first = generateCandidateReviewPacket(input);
    const second = generateCandidateReviewPacket(input);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first).toMatchObject({ schemaVersion: 2, status: 'NOT HUMAN REVIEWED' });
    expect(first.candidates).toHaveLength(1);
    expect(first.candidates.every(candidate => candidate.status === 'NOT HUMAN REVIEWED' && candidate.clusterStops.length >= 3)).toBe(true);
    expect(first.candidates.every(candidate => candidate.review == null)).toBe(true);
  });

  it('compiles only reviewed cluster trails and maps every member tree back to the trail', () => {
    const trees = clusterTrees();
    const context = trailContext(trees);
    const trail = reviewedClusterTrail(trees);
    const source = reviewedSource(trail);
    const compiled = compileReviewedTrails(source, context);
    expect(compiled.trails).toHaveLength(1);
    expect(Object.keys(compiled.trailMembership)).toHaveLength(24);
    expect(compiled.trailMembership['a-0']).toEqual(['mount-pleasant-cherry-blossoms']);
    expect(compiled.trails[0]).toMatchObject({ neighbourhoodName: 'Mount Pleasant', mode: 'walking', shape: 'point-to-point', size: 'small' });
    expect(JSON.stringify(compileReviewedTrails(source, context))).toBe(JSON.stringify(compiled));
    expect(() => validateTrailMembership(compiled.trails, { 'a-0': ['missing'] }, new Set(trees.map(tree => tree[0])), context.bounds)).toThrow('exactly');
  });

  it('rejects unreviewed, unsafe, malformed, non-pedestrian, and orphan cluster trails', () => {
    const trees = clusterTrees();
    const context = trailContext(trees);
    const base = reviewedClusterTrail(trees);
    const source = trail => reviewedSource(trail);
    expect(() => compileReviewedTrails(source({ ...base, review: { ...base.review, reviewer: 'AI Agent' } }), context)).toThrow('human review');
    expect(() => compileReviewedTrails(source({ ...base, narrative: 'A safe walking route.' }), context)).toThrow('unsupported');
    expect(() => compileReviewedTrails(source({ ...base, route: { ...base.route, provenance: { ...base.route.provenance, profile: 'driving-car' } } }), context)).toThrow('foot-walking');
    expect(() => compileReviewedTrails(source({ ...base, clusterStops: [{ ...base.clusterStops[0], memberTreeIds: [...base.clusterStops[0].memberTreeIds.slice(0, -1), 'missing'] }, ...base.clusterStops.slice(1)] }), context)).toThrow('missing tree');
    expect(() => compileReviewedTrails(source({ ...base, clusterStops: [{ ...base.clusterStops[0], anchor: { ...base.clusterStops[0].anchor, latitude: 1 } }, ...base.clusterStops.slice(1)] }), context)).toThrow('anchor');
    expect(() => compileReviewedTrails({ ...source(base), trails: [base, { ...base }] }, context)).toThrow('unique IDs');
    expect(compileReviewedTrails({ schemaVersion: 2, trails: [] }, context)).toEqual({ trails: [], trailMembership: {} });
  });
});

function clusterTrees() {
  const origins = [[49.2635, -123.105], [49.2635, -123.101], [49.2635, -123.097]];
  return origins.flatMap(([latitude, longitude], clusterIndex) => Array.from({ length: 8 }, (_, treeIndex) => {
    const id = `${String.fromCharCode(97 + clusterIndex)}-${treeIndex}`;
    return [id, latitude + treeIndex * 0.00001, longitude, 0, 21, 50, null, `${100 + clusterIndex * 100} E 10TH AV`, id];
  }));
}

function trailContext(trees) {
  return { cityId: 'vancouver', sourceSnapshotSha256: 'snapshot', candidateGeneratorVersion: 'treeways-density-clusters-v1', trees, bounds: [-123.3, 49.18, -122.9, 49.35] };
}

function reviewedSource(trail) {
  return { schemaVersion: 2, cityId: 'vancouver', sourceSnapshotSha256: 'snapshot', candidateGeneratorVersion: 'treeways-density-clusters-v1', trails: [trail] };
}

function reviewedClusterTrail(trees) {
  const clusterStops = ['a', 'b', 'c'].map((prefix, clusterIndex) => {
    const members = trees.filter(tree => String(tree[0]).startsWith(`${prefix}-`));
    const anchor = members[0];
    return {
      id: `cluster-${prefix}`,
      locationLabel: `${100 + clusterIndex * 100} block of East 10th Avenue`,
      radiusM: 70,
      anchor: { treeId: anchor[0], latitude: anchor[1], longitude: anchor[2] },
      memberTreeIds: members.map(tree => tree[0]),
      themeTreeIds: members.slice(0, 3).map(tree => tree[0]),
      totalTreeCount: 8,
      themeTreeCount: 3,
      diversityCount: 1
    };
  });
  return {
    id: 'mount-pleasant-cherry-blossoms', cityId: 'vancouver', name: 'Cherry blossoms around East 10th Avenue', neighbourhoodName: 'Mount Pleasant',
    theme: { id: 'cherry-blossoms', displayName: 'Cherry blossoms' }, size: 'small', mode: 'walking', shape: 'point-to-point',
    clusterStops,
    route: {
      anchorOrder: ['cluster-a', 'cluster-b', 'cluster-c'],
      geometry: { type: 'LineString', coordinates: [[-123.12, 49.25], [-123.115, 49.252], [-123.11, 49.254]] },
      distanceM: 1800, durationSeconds: 1300, legDistancesM: [900, 900], snappedDistancesM: [4, 5, 3],
      provenance: { provider: 'openrouteservice', profile: 'foot-walking', engineVersion: '9.9.0', graphDate: '2026-07-01', generatedAt: '2026-07-18T20:00:00.000Z', attribution: '© openrouteservice.org by HeiGIT | Map data © OpenStreetMap contributors', resultLicense: 'CC-BY-4.0' }
    },
    narrative: 'Three tree-rich areas with recorded cherry relatives.', accessibilityNotes: 'unknown', pedestrianPlausibility: 'unknown', safetyNotes: 'unknown', rightOfAccess: 'unknown', liveConditions: 'unknown',
    review: { status: 'human-reviewed', reviewer: 'Alicia', reviewedAt: '2026-07-18' }, candidateId: 'candidate-a', candidateGeneratorVersion: 'treeways-density-clusters-v1', sourceSnapshotSha256: 'snapshot', caveats: []
  };
}
