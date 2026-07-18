import { validateTreePack } from '../../src/data/city-schema.js';
import { isDeepStrictEqual } from 'node:util';
import { compileReviewedTrails, validateTrailMembership } from '../../src/domain/trails.js';
import { selectTreeHighlights } from '../../src/domain/tree-highlights.js';
import { composeHighlightArtifact } from './build-pack.js';
import { CANDIDATE_GENERATOR_VERSION } from './trails.js';
import { CITY_ROOT, PUBLIC_CITY_ROOT, cityArgument, invokedDirectly, jsonBytes, readJson, sha256, writeJson } from './pipeline.js';

export function composeReviewedArtifact(artifact, compiled) {
  return { ...artifact, trails: structuredClone(compiled.trails), trailMembership: structuredClone(compiled.trailMembership) };
}

export async function publishReviewedTrails(city = cityArgument()) {
  const manifest = await readJson(`${PUBLIC_CITY_ROOT(city)}/manifest.json`);
  const baseArtifact = await readJson(`${PUBLIC_CITY_ROOT(city)}/${manifest.data.artifact}`);
  const reviewedSource = await readJson(`${CITY_ROOT(city)}/trails-review.json`);
  if (reviewedSource.sourceSnapshotSha256 !== baseArtifact.sourceSnapshot.sha256 || reviewedSource.candidateGeneratorVersion !== CANDIDATE_GENERATOR_VERSION) throw new TypeError('Reviewed source provenance does not match the committed city artifact');
  const compiled = compileReviewedTrails(reviewedSource, {
    cityId: city,
    sourceSnapshotSha256: baseArtifact.sourceSnapshot.sha256,
    candidateGeneratorVersion: CANDIDATE_GENERATOR_VERSION,
    trees: baseArtifact.trees,
    bounds: manifest.bounds
  });
  const artifact = composeReviewedArtifact(baseArtifact, compiled);
  const treeRecords = validateTreePack(artifact);
  validateTrailMembership(artifact.trails, artifact.trailMembership, new Set(artifact.trees.map(tree => String(tree[0]))), manifest.bounds);
  const highlights = composeHighlightArtifact(artifact, selectTreeHighlights(treeRecords));
  validateTreePack(highlights);
  validateTrailMembership(highlights.trails, highlights.trailMembership, new Set(highlights.trees.map(tree => String(tree[0]))), manifest.bounds);
  await writeJson(`${PUBLIC_CITY_ROOT(city)}/${manifest.data.artifact}`, artifact);
  await writeJson(`${PUBLIC_CITY_ROOT(city)}/${manifest.data.highlightsArtifact}`, highlights);
  return {
    trails: artifact.trails.length,
    memberships: Object.keys(artifact.trailMembership).length,
    artifactSha256: sha256(jsonBytes(artifact)),
    highlightRecords: highlights.trees.length,
    highlightsSha256: sha256(jsonBytes(highlights))
  };
}

export async function validatePublishedTrailPacks(city = 'vancouver') {
  const manifest = await readJson(`${PUBLIC_CITY_ROOT(city)}/manifest.json`);
  const artifact = await readJson(`${PUBLIC_CITY_ROOT(city)}/${manifest.data.artifact}`);
  const highlights = await readJson(`${PUBLIC_CITY_ROOT(city)}/${manifest.data.highlightsArtifact}`);
  const reviewedSource = await readJson(`${CITY_ROOT(city)}/trails-review.json`);
  const compiled = compileReviewedTrails(reviewedSource, {
    cityId: city,
    sourceSnapshotSha256: artifact.sourceSnapshot.sha256,
    candidateGeneratorVersion: CANDIDATE_GENERATOR_VERSION,
    trees: artifact.trees,
    bounds: manifest.bounds
  });
  if (!isDeepStrictEqual(artifact.trails, compiled.trails) || !isDeepStrictEqual(artifact.trailMembership, compiled.trailMembership)) throw new TypeError('Published full pack drifted from the approved trail source');
  const treeRecords = validateTreePack(artifact);
  validateTrailMembership(artifact.trails, artifact.trailMembership, new Set(artifact.trees.map(tree => String(tree[0]))), manifest.bounds);
  const expectedHighlights = composeHighlightArtifact(artifact, selectTreeHighlights(treeRecords));
  if (!isDeepStrictEqual(highlights, expectedHighlights)) throw new TypeError('Published highlight pack drifted from its deterministic selection');
  validateTreePack(highlights);
  validateTrailMembership(highlights.trails, highlights.trailMembership, new Set(highlights.trees.map(tree => String(tree[0]))), manifest.bounds);
  return { trails: artifact.trails.length, memberships: Object.keys(artifact.trailMembership).length, highlightRecords: highlights.trees.length };
}

if (invokedDirectly(import.meta.url)) {
  const result = await publishReviewedTrails();
  console.log(`Published ${result.trails} reviewed trails with ${result.memberships} tree memberships; startup pack now has ${result.highlightRecords} records.`);
}
