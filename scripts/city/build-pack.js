import { cityArgument, CITY_ROOT, PUBLIC_CITY_ROOT, invokedDirectly, jsonBytes, readJson, writeJson, sha256 } from './pipeline.js';
import { normalizeCity } from './normalize.js';
import { normalizeFoodSites } from './food-sites.js';
import { generateCandidateReviewPacket } from './trails.js';
import { validateTreePack } from '../../src/data/city-schema.js';
import { selectTreeHighlights } from '../../src/domain/tree-highlights.js';

export function composeCityArtifact(normalized, foodSites, artifactVersion) {
  return { ...normalized, evidence: normalized.evidence, treeMeasurements: normalized.treeMeasurements ?? {}, foodSiteSourceSnapshot: foodSites.sourceSnapshot, foodSites: foodSites.foodSites, artifactVersion };
}

export function composeHighlightArtifact(artifact, selection) {
  const selectedIds = new Set(selection.treeIds.map(String));
  for (const trail of artifact.trails) {
    for (const stop of trail.clusterStops) for (const treeId of stop.memberTreeIds) selectedIds.add(String(treeId));
  }
  const trees = artifact.trees.filter(tree => selectedIds.has(String(tree[0])));
  const includedIds = new Set(trees.map(tree => String(tree[0])));
  const treeMeasurements = Object.fromEntries(Object.entries(artifact.treeMeasurements ?? {}).filter(([id]) => includedIds.has(id)));
  const trailMembership = Object.fromEntries(Object.entries(artifact.trailMembership ?? {}).filter(([id]) => includedIds.has(id)));
  return {
    ...artifact,
    trees,
    treeMeasurements,
    trailMembership,
    packKind: 'highlights',
    highlightSelection: { ...selection, treeIds: [...selectedIds].sort(), treeCount: trees.length }
  };
}

export async function buildCityPack(city = cityArgument()) {
  await normalizeCity(city);
  await normalizeFoodSites(city);
  const normalized = await readJson(`${CITY_ROOT(city)}/normalized.json`);
  const foodSites = await readJson(`${CITY_ROOT(city)}/food-sites.json`);
  const manifest = await readJson(`${PUBLIC_CITY_ROOT(city)}/manifest.json`);
  const artifact = composeCityArtifact(normalized, foodSites, manifest.data.version);
  const artifactPath = `${PUBLIC_CITY_ROOT(city)}/${manifest.data.artifact}`;
  await writeJson(artifactPath, artifact);
  const treeRecords = validateTreePack(artifact);
  const highlightSelection = selectTreeHighlights(treeRecords);
  const highlightArtifact = composeHighlightArtifact(artifact, highlightSelection);
  const highlightArtifactPath = `${PUBLIC_CITY_ROOT(city)}/${manifest.data.highlightsArtifact}`;
  await writeJson(highlightArtifactPath, highlightArtifact);
  const artifactSha256 = sha256(jsonBytes(artifact));
  const candidates = generateCandidateReviewPacket({ city, sourceArtifact: { city, artifact: manifest.data.artifact, sha256: artifactSha256, sourceSnapshotSha256: artifact.sourceSnapshot.sha256 }, species: artifact.species, trees: artifact.trees });
  await writeJson(`${CITY_ROOT(city)}/reports/trail-candidates.json`, candidates);
  const generated = { city, artifact: manifest.data.artifact, sha256: artifactSha256, records: artifact.trees.length, highlightsArtifact: manifest.data.highlightsArtifact, highlightRecords: highlightArtifact.trees.length, highlightSha256: sha256(jsonBytes(highlightArtifact)), foodSites: artifact.foodSites.length, species: artifact.species.length, trails: artifact.trails.length, trailCandidates: candidates.candidates.length };
  await writeJson(`${CITY_ROOT(city)}/reports/generated.json`, generated);
  return generated;
}

if (invokedDirectly(import.meta.url)) {
  const generated = await buildCityPack();
  console.log(`Built ${generated.records} records into ${generated.artifact} (${generated.sha256}).`);
}
