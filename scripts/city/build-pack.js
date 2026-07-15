import { cityArgument, CITY_ROOT, PUBLIC_CITY_ROOT, invokedDirectly, jsonBytes, readJson, writeJson, sha256 } from './pipeline.js';
import { normalizeCity } from './normalize.js';
import { normalizeFoodSites } from './food-sites.js';
import { generateCandidateReviewPacket } from './trails.js';

export function composeCityArtifact(normalized, foodSites, artifactVersion) {
  return { ...normalized, evidence: normalized.evidence, treeMeasurements: normalized.treeMeasurements ?? {}, foodSiteSourceSnapshot: foodSites.sourceSnapshot, foodSites: foodSites.foodSites, artifactVersion };
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
  const artifactSha256 = sha256(jsonBytes(artifact));
  const candidates = generateCandidateReviewPacket({ city, sourceArtifact: { city, artifact: manifest.data.artifact, sha256: artifactSha256, sourceSnapshotSha256: artifact.sourceSnapshot.sha256 }, trees: artifact.trees });
  await writeJson(`${CITY_ROOT(city)}/reports/trail-candidates.json`, candidates);
  const generated = { city, artifact: manifest.data.artifact, sha256: artifactSha256, records: artifact.trees.length, foodSites: artifact.foodSites.length, species: artifact.species.length, trails: artifact.trails.length, trailCandidates: candidates.candidates.length };
  await writeJson(`${CITY_ROOT(city)}/reports/generated.json`, generated);
  return generated;
}

if (invokedDirectly(import.meta.url)) {
  const generated = await buildCityPack();
  console.log(`Built ${generated.records} records into ${generated.artifact} (${generated.sha256}).`);
}
