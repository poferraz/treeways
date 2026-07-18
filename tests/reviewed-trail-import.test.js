import { describe, expect, it } from 'vitest';
import { normalizeReviewedExport } from '../scripts/city/import-reviewed-trails.js';

const route = { geometry: { type: 'LineString', coordinates: [[-123.1, 49.2], [-123.09, 49.21]] }, distanceM: 900 };
const clusterStops = [{ id: 'cluster-a', memberTreeIds: ['1'], themeTreeIds: ['1'], anchor: { treeId: '1', latitude: 49.2, longitude: -123.1 } }];
const candidate = {
  id: 'candidate-test', neighbourhoodId: 'test', neighbourhoodName: 'Test', theme: { id: 'maples', displayName: 'Maples' },
  status: 'NOT HUMAN REVIEWED', shape: 'point-to-point', size: 'small', mode: 'walking', route, clusterStops,
  routing: { status: 'routed', provider: 'openrouteservice', profile: 'foot-walking' }
};
const packet = { schemaVersion: 2, status: 'NOT HUMAN REVIEWED', candidateGeneratorVersion: 'generator-v1', sourceArtifact: { sourceSnapshotSha256: 'snapshot' }, candidates: [candidate] };
const exported = {
  schemaVersion: 2, cityId: 'vancouver', sourceSnapshotSha256: 'snapshot', candidateGeneratorVersion: 'generator-v1',
  trails: [{ ...candidate, id: 'test', candidateId: 'candidate-test', status: 'human-reviewed', clusterStops: [{ ...clusterStops[0], memberTrees: [{ id: '1' }] }], name: 'Maples in Test', narrative: 'One recorded area.', accessibilityNotes: 'unknown', pedestrianPlausibility: 'unknown', safetyNotes: 'unknown', rightOfAccess: 'unknown', liveConditions: 'unknown', review: { status: 'human-reviewed', reviewer: 'Paulo', reviewedAt: '2026-07-18' }, caveats: [] }]
};

describe('reviewed trail import', () => {
  it('restores per-trail provenance from the exact routed packet', () => {
    const normalized = normalizeReviewedExport(exported, packet);

    expect(normalized.trails[0]).toMatchObject({
      candidateId: 'candidate-test',
      candidateGeneratorVersion: 'generator-v1',
      sourceSnapshotSha256: 'snapshot',
      review: { status: 'human-reviewed', reviewer: 'Paulo' }
    });
    expect(normalized.trails[0].clusterStops[0]).not.toHaveProperty('memberTrees');
  });

  it('rejects any changed routed or cluster data', () => {
    const changed = structuredClone(exported);
    changed.trails[0].route.distanceM = 901;

    expect(() => normalizeReviewedExport(changed, packet)).toThrow('drift');
  });
});
