import { cityArgument, CITY_ROOT, readJson, writeJson } from './pipeline.js';
import { getCityAdapter } from './adapters/index.js';
import { EMPTY_EVIDENCE_REGISTRY, validateEvidenceRegistry } from '../../src/domain/evidence.js';
import { EMPTY_TRAIL_SOURCE, compileReviewedTrails } from '../../src/domain/trails.js';

export async function normalizeCity(city = cityArgument()) {
  const sourceManifest = await readJson(`${CITY_ROOT(city)}/source-manifest.json`);
  const adapter = getCityAdapter(city);
  const evidence = await readJsonOrDefault(`${CITY_ROOT(city)}/evidence-registry.json`, EMPTY_EVIDENCE_REGISTRY);
  const reviewedTrails = await readJsonOrDefault(`${CITY_ROOT(city)}/trails-review.json`, EMPTY_TRAIL_SOURCE);
  validateEvidenceRegistry(evidence);
  const snapshotPath = `${CITY_ROOT(city)}/${sourceManifest.snapshot.path}`;
  const snapshot = await adapter.readSnapshot(snapshotPath);
  if (snapshot.checksum !== sourceManifest.snapshot.sha256) throw new Error(`Pinned snapshot checksum mismatch for ${city}`);
  const normalized = adapter.normalize(snapshot.records, evidence);
  const compiledTrails = compileReviewedTrails(reviewedTrails, { cityId: city, sourceSnapshotSha256: sourceManifest.snapshot.sha256, candidateGeneratorVersion: 'm3-a-giant-measurements-v1', trees: normalized.accepted, bounds: adapter.source.bounds });
  const coverage = {
    city,
    sourceDataset: sourceManifest.dataset.id,
    sourceRecordsReported: snapshot.sourceCount,
    snapshotRecords: snapshot.records.length,
    acceptedRecords: normalized.accepted.length,
    rejectedRecords: normalized.rejects.length,
    duplicateIds: normalized.rejects.filter(reject => reject.reason === 'duplicate-id').length,
    nullMeasurements: {
      heightM: normalized.accepted.filter(tree => tree[4] === null).length,
      diameterCm: normalized.accepted.filter(tree => tree[5] === null).length,
      canopySpreadM: normalized.accepted.filter(tree => tree[6] === null).length
    },
    scope: sourceManifest.snapshot.scope
  };
  const output = { schemaVersion: 2, sourceSnapshot: sourceManifest.snapshot, evidence, species: normalized.species, trees: normalized.accepted, treeMeasurements: {}, trails: compiledTrails.trails, trailMembership: compiledTrails.trailMembership };
  await writeJson(`${CITY_ROOT(city)}/normalized.json`, output);
  await writeJson(`${CITY_ROOT(city)}/reports/rejects.json`, { city, rejects: normalized.rejects });
  await writeJson(`${CITY_ROOT(city)}/reports/coverage.json`, coverage);
  return { output, coverage, rejects: normalized.rejects };
}

async function readJsonOrDefault(path, fallback) {
  try { return await readJson(path); } catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}
