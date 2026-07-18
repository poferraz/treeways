import { isDeepStrictEqual } from 'node:util';
import { resolve } from 'node:path';
import { compileReviewedTrails } from '../../src/domain/trails.js';
import { CITY_ROOT, PUBLIC_CITY_ROOT, invokedDirectly, readJson, writeJson } from './pipeline.js';

export function normalizeReviewedExport(exported, routedPacket) {
  if (exported?.schemaVersion !== 2 || exported.cityId !== 'vancouver' || !Array.isArray(exported.trails)) throw new TypeError('Reviewed export must be Vancouver schema v2');
  if (exported.sourceSnapshotSha256 !== routedPacket?.sourceArtifact?.sourceSnapshotSha256 || exported.candidateGeneratorVersion !== routedPacket.candidateGeneratorVersion) throw new TypeError('Reviewed export provenance does not match the routed pilot packet');
  const candidates = new Map(routedPacket.candidates.map(candidate => [candidate.id, candidate]));
  const trails = exported.trails.map(trail => canonicalReviewedTrail(trail, candidates.get(trail.candidateId), routedPacket));
  return {
    schemaVersion: 2,
    cityId: exported.cityId,
    sourceSnapshotSha256: exported.sourceSnapshotSha256,
    candidateGeneratorVersion: exported.candidateGeneratorVersion,
    trails
  };
}

export async function importReviewedTrails(sourcePath, city = 'vancouver') {
  if (!sourcePath) throw new TypeError('Path to the reviewed trail export is required');
  const routedPacket = await readJson(`${CITY_ROOT(city)}/trail-pilots-routed.json`);
  const normalized = normalizeReviewedExport(await readJson(resolve(sourcePath)), routedPacket);
  const artifact = await readJson(`${PUBLIC_CITY_ROOT(city)}/${routedPacket.sourceArtifact.artifact}`);
  const manifest = await readJson(`${PUBLIC_CITY_ROOT(city)}/manifest.json`);
  const compiled = compileReviewedTrails(normalized, {
    cityId: city,
    sourceSnapshotSha256: normalized.sourceSnapshotSha256,
    candidateGeneratorVersion: normalized.candidateGeneratorVersion,
    trees: artifact.trees,
    bounds: manifest.bounds
  });
  await writeJson(`${CITY_ROOT(city)}/trails-review.json`, normalized);
  return { trailCount: compiled.trails.length, membershipCount: Object.keys(compiled.trailMembership).length };
}

function canonicalReviewedTrail(trail, candidate, packet) {
  if (!candidate || trail.id !== candidate.id.replace(/^candidate-/, '')) throw new TypeError(`Reviewed trail ${trail?.id ?? 'unknown'} does not match a routed pilot`);
  const exportedClusters = trail.clusterStops?.map(({ memberTrees: _memberTrees, ...cluster }) => cluster);
  const immutableFieldsMatch = isDeepStrictEqual(exportedClusters, candidate.clusterStops)
    && isDeepStrictEqual(trail.route, candidate.route)
    && isDeepStrictEqual(trail.theme, candidate.theme)
    && trail.neighbourhoodId === candidate.neighbourhoodId
    && trail.neighbourhoodName === candidate.neighbourhoodName
    && trail.shape === candidate.shape
    && trail.size === candidate.size
    && trail.mode === candidate.mode;
  if (!immutableFieldsMatch) throw new TypeError(`Reviewed trail ${trail.id} has routed candidate drift`);
  return {
    id: trail.id,
    status: 'human-reviewed',
    cityId: 'vancouver',
    candidateId: candidate.id,
    candidateGeneratorVersion: packet.candidateGeneratorVersion,
    sourceSnapshotSha256: packet.sourceArtifact.sourceSnapshotSha256,
    neighbourhoodName: candidate.neighbourhoodName,
    name: trail.name,
    theme: structuredClone(candidate.theme),
    size: candidate.size,
    mode: candidate.mode,
    shape: candidate.shape,
    clusterStops: structuredClone(candidate.clusterStops),
    route: structuredClone(candidate.route),
    narrative: trail.narrative,
    accessibilityNotes: trail.accessibilityNotes,
    pedestrianPlausibility: trail.pedestrianPlausibility,
    safetyNotes: trail.safetyNotes,
    rightOfAccess: trail.rightOfAccess,
    liveConditions: trail.liveConditions,
    review: structuredClone(trail.review),
    caveats: Array.isArray(trail.caveats) ? [...trail.caveats] : []
  };
}

if (invokedDirectly(import.meta.url)) {
  const result = await importReviewedTrails(process.argv[2], process.argv[3] ?? 'vancouver');
  console.log(`Imported ${result.trailCount} reviewed trails covering ${result.membershipCount} public-tree records.`);
}
