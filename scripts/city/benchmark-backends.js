import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { performance } from 'node:perf_hooks';
import geojsonvt from 'geojson-vt';
import vtpbf from 'vt-pbf';
import { cityArgument, CITY_ROOT, invokedDirectly, PUBLIC_CITY_ROOT, readJson, sha256, writeJson } from './pipeline.js';
import { createPmtiles, decodePmtiles, tileId } from './pmtiles.js';

const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const measure = task => { const startHeap = process.memoryUsage().heapUsed; const start = performance.now(); const value = task(); return { value, ms: performance.now() - start, heap: Math.max(0, process.memoryUsage().heapUsed - startHeap) }; };
const tileCoordinate = (longitude, latitude, z) => { const scale = 2 ** z; return [Math.floor((longitude + 180) / 360 * scale), Math.floor((1 - Math.asinh(Math.tan(latitude * Math.PI / 180)) / Math.PI) / 2 * scale)]; };

export function toEligibleGeoJsonFeatures(trees, predicate) {
  return trees.filter(predicate).map(([id, latitude, longitude]) => ({ type: 'Feature', properties: { id }, geometry: { type: 'Point', coordinates: [longitude, latitude] } }));
}

export function verifyFilterCorrectClustering(trees, predicate) {
  const features = toEligibleGeoJsonFeatures(trees, predicate);
  const ids = features.map(feature => String(feature.properties.id));
  if (new Set(ids).size !== ids.length) throw new Error('Eligible clustering source contains duplicate IDs');
  return { eligibleTreeCount: ids.length, jsonClusterSourceCount: features.length, pmtilesTileNativeCountsDisplayed: false, pmtilesClusterCountSource: 'worker-eligible-ids' };
}

export function createPmtilesCandidate(features, bounds, maxZoom = 12) {
  const index = geojsonvt({ type: 'FeatureCollection', features }, { maxZoom, indexMaxZoom: maxZoom, indexMaxPoints: 0 });
  const keys = new Map();
  for (let z = 0; z <= maxZoom; z++) for (const feature of features) {
    const [x, y] = tileCoordinate(feature.geometry.coordinates[0], feature.geometry.coordinates[1], z);
    keys.set(`${z}/${x}/${y}`, [z, x, y]);
  }
  const tiles = [...keys.values()].map(([z, x, y]) => {
    const tile = index.getTile(z, x, y);
    if (!tile) throw new Error(`geojson-vt did not create expected tile ${z}/${x}/${y}`);
    return { z, x, y, id: tileId(z, x, y), data: Buffer.from(vtpbf.fromGeojsonVt({ trees: tile })) };
  });
  return { archive: createPmtiles(tiles, bounds), tiles };
}

export function validateBenchmarkReport(report, { artifactPath, artifactBytes, trees, foodSites }) {
  if (report?.artifact?.path !== artifactPath || report.artifact.sha256 !== sha256(artifactBytes) || report.artifact.trees !== trees.length || report.artifact.foodSites !== foodSites.length) throw new Error('Benchmark report drift: it does not identify this exact generated artifact');
  if (report.runs !== 3 || report.decision !== 'approved-gate-a2' || report.pmtiles?.transferEncoding !== 'range-safe archive bytes plus gzip lookup') throw new Error('Benchmark report is incomplete or uses an unsupported transfer methodology');
  return true;
}

export async function benchmarkCity(city = cityArgument()) {
  const manifest = await readJson(`${PUBLIC_CITY_ROOT(city)}/manifest.json`);
  const artifactPath = `${PUBLIC_CITY_ROOT(city)}/${manifest.data.artifact}`;
  const artifactBytes = await readFile(artifactPath);
  const artifact = JSON.parse(artifactBytes.toString('utf8'));
  const generated = await readJson(`${CITY_ROOT(city)}/reports/generated.json`);
  if (generated.sha256 !== sha256(artifactBytes) || generated.records !== artifact.trees.length || generated.foodSites !== artifact.foodSites.length) throw new Error('Benchmark input drift: generated report does not identify this exact artifact');
  const json = artifactBytes.toString('utf8');
  const lookup = JSON.stringify({ species: artifact.species, foodSites: artifact.foodSites, trees: artifact.trees.map(([id, , , speciesIndex, heightM, diameterCm, canopySpreadM, address, sourceId]) => [id, speciesIndex, heightM, diameterCm, canopySpreadM, address, sourceId]) });
  const features = toEligibleGeoJsonFeatures(artifact.trees, () => true);
  const filterEvidence = verifyFilterCorrectClustering(artifact.trees, tree => tree[4] !== null && tree[4] >= 10);
  const { archive, tiles } = createPmtilesCandidate(features, manifest.bounds);
  const runs = Array.from({ length: 3 }, () => {
    const jsonDecode = measure(() => JSON.parse(json)); const jsonIndex = measure(() => new Map(jsonDecode.value.trees.map(tree => [tree[0], tree]))); const jsonFilter = measure(() => verifyFilterCorrectClustering(jsonDecode.value.trees, tree => tree[4] !== null && tree[4] >= 10));
    const pmtilesDecode = measure(() => decodePmtiles(archive)); const pmtilesIndex = measure(() => new Map(artifact.trees.map(tree => [tree[0], tree]))); const pmtilesFilter = measure(() => verifyFilterCorrectClustering(artifact.trees, tree => tree[4] !== null && tree[4] >= 10));
    return { jsonDecode, jsonIndex, jsonFilter, pmtilesDecode, pmtilesIndex, pmtilesFilter };
  });
  if (runs[0].pmtilesDecode.value.featureIds.size !== artifact.trees.length) throw new Error('PMTiles archive does not contain every generated tree ID');
  const report = { city, artifact: { path: manifest.data.artifact, sha256: sha256(artifactBytes), trees: artifact.trees.length, foodSites: artifact.foodSites.length }, runs: 3, methodology: { environment: `${process.platform}/${process.arch} Node ${process.version}`, json: 'Parse the full schema-v2 tuple artifact and build the worker lookup index.', pmtiles: `Create ${tiles.length} actual PMTiles v3 MVT tiles at z0-z12 with geojson-vt/vt-pbf, deterministic gzip tile and directory payloads, then decode every archive tile through a PMTiles v3 header/directory reader and @mapbox/vector-tile. Archive bytes are measured directly because a range-served PMTiles archive must not depend on whole-response gzip.`, filtering: 'Both candidates retain a worker eligibility index. JSON sends exactly eligible features to one clustered GeoJSON source. PMTiles must hide tile-native cluster counts after a committed filter and use worker-generated eligible IDs/counts, so hidden records never remain in a displayed count.' }, filterCorrectness: filterEvidence, json: { transferGzipBytes: gzipSync(json, { mtime: 0 }).byteLength, workerDecodeMs: median(runs.map(run => run.jsonDecode.ms)), workerIndexMs: median(runs.map(run => run.jsonIndex.ms)), heapBytesAfterDecode: median(runs.map(run => run.jsonDecode.heap + run.jsonIndex.heap)), filterResponseMs: median(runs.map(run => run.jsonFilter.ms)) }, pmtiles: { archiveBytes: archive.byteLength, transferGzipBytes: archive.byteLength + gzipSync(lookup, { mtime: 0 }).byteLength, transferEncoding: 'range-safe archive bytes plus gzip lookup', lookupGzipBytes: gzipSync(lookup, { mtime: 0 }).byteLength, tiles: tiles.length, minZoom: 0, maxZoom: 12, workerDecodeMs: median(runs.map(run => run.pmtilesDecode.ms)), workerIndexMs: median(runs.map(run => run.pmtilesIndex.ms)), heapBytesAfterDecode: median(runs.map(run => run.pmtilesDecode.heap + run.pmtilesIndex.heap)), filterResponseMs: median(runs.map(run => run.pmtilesFilter.ms)), decodedFeatures: runs[0].pmtilesDecode.value.featureCount, decodedUniqueFeatures: runs[0].pmtilesDecode.value.featureIds.size }, decision: 'approved-gate-a2', recommendation: 'Use the approved json-tuple-pack backend. PMTiles is not selected: it still transfers the lookup and needs a parallel filtered source to make cluster counts correct.' };
  validateBenchmarkReport(report, { artifactPath: manifest.data.artifact, artifactBytes, trees: artifact.trees, foodSites: artifact.foodSites });
  await writeJson(`${CITY_ROOT(city)}/reports/backend-benchmark.json`, report);
  return report;
}

if (invokedDirectly(import.meta.url)) console.log(JSON.stringify(await benchmarkCity(), null, 2));
