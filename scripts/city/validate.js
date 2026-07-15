import { readFile } from 'node:fs/promises';
import { cityArgument, CITY_ROOT, invokedDirectly, PUBLIC_CITY_ROOT, readJson, sha256 } from './pipeline.js';
import { validateTreePack } from '../../src/data/city-schema.js';
import { validateBenchmarkReport } from './benchmark-backends.js';
import { validateTrailMembership } from '../../src/domain/trails.js';

export async function validateCity(city = cityArgument()) {
  const normalized = await readJson(`${CITY_ROOT(city)}/normalized.json`);
  const coverage = await readJson(`${CITY_ROOT(city)}/reports/coverage.json`);
  const rejects = await readJson(`${CITY_ROOT(city)}/reports/rejects.json`);
  const foodCoverage = await readJson(`${CITY_ROOT(city)}/reports/food-sites-coverage.json`);
  const foodRejects = await readJson(`${CITY_ROOT(city)}/reports/food-sites-rejects.json`);
  const manifest = await readJson(`${PUBLIC_CITY_ROOT(city)}/manifest.json`);
  const artifactPath = `${PUBLIC_CITY_ROOT(city)}/${manifest.data.artifact}`;
  const artifactBytes = await readFile(artifactPath);
  const artifact = JSON.parse(artifactBytes.toString('utf8'));
  const generated = await readJson(`${CITY_ROOT(city)}/reports/generated.json`);
  const benchmark = await readJson(`${CITY_ROOT(city)}/reports/backend-benchmark.json`);
  validateTreePack(artifact);
  if (artifact.schemaVersion !== 2 || !Array.isArray(artifact.trails)) throw new TypeError('City artifact must be schema v2 with trails');
  if (!Array.isArray(artifact.foodSites) || !artifact.foodSiteSourceSnapshot) throw new TypeError('City artifact must contain foodSites and food-site provenance');
  validateTrailMembership(artifact.trails, artifact.trailMembership ?? {}, new Set(artifact.trees.map(tree => String(tree[0]))), manifest.bounds);
  if (coverage.acceptedRecords + coverage.rejectedRecords !== coverage.snapshotRecords) throw new Error('Coverage does not account for every snapshot record');
  if (rejects.rejects.length !== coverage.rejectedRecords) throw new Error('Reject report does not match coverage');
  if (foodCoverage.acceptedRecords + foodCoverage.rejectedRecords !== foodCoverage.snapshotRecords) throw new Error('Food-site coverage does not account for every snapshot record');
  if (foodRejects.rejects.length !== foodCoverage.rejectedRecords) throw new Error('Food-site reject report does not match coverage');
  if (generated.sha256 !== sha256(artifactBytes) || generated.records !== artifact.trees.length || generated.foodSites !== artifact.foodSites.length) throw new Error('Generated report drift: it does not identify this exact artifact');
  validateBenchmarkReport(benchmark, { artifactPath: manifest.data.artifact, artifactBytes, trees: artifact.trees, foodSites: artifact.foodSites });
  for (const site of artifact.foodSites) if (site.access?.status !== 'unknown') throw new TypeError(`Food site ${site.id} must not claim access permission`);
  const normalizedFoodSites = await readJson(`${CITY_ROOT(city)}/food-sites.json`);
  if (sha256(JSON.stringify(artifact.foodSiteSourceSnapshot)) !== sha256(JSON.stringify(normalizedFoodSites.sourceSnapshot))) throw new Error('Generated artifact drifted from food-site provenance');
  if (sha256(JSON.stringify(normalized)) !== sha256(JSON.stringify({ schemaVersion: artifact.schemaVersion, sourceSnapshot: artifact.sourceSnapshot, evidence: artifact.evidence, species: artifact.species, trees: artifact.trees, treeMeasurements: artifact.treeMeasurements, trails: artifact.trails, trailMembership: artifact.trailMembership }))) throw new Error('Generated artifact drifted from normalized input');
  return coverage;
}

if (invokedDirectly(import.meta.url)) {
  const coverage = await validateCity();
  console.log(`Validated ${coverage.acceptedRecords} accepted records; ${coverage.rejectedRecords} rejects; no arbitrary count gate.`);
}
