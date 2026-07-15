import { readFile } from 'node:fs/promises';
import { cityArgument, CITY_ROOT, readJson, sha256, writeJson, writePinnedSnapshot } from './pipeline.js';
import { getCityAdapter } from './adapters/index.js';

function projectRecord(record, fields) {
  return Object.fromEntries(fields.map(field => [field, record[field] ?? null]));
}

async function fetchOfficialExport(exportUrl) {
  const rawPathIndex = process.argv.indexOf('--raw');
  if (rawPathIndex !== -1) {
    const rawPath = process.argv[rawPathIndex + 1];
    if (!rawPath) throw new Error('--raw requires a downloaded official export path');
    const raw = await readFile(rawPath);
    const records = JSON.parse(raw.toString('utf8'));
    if (!Array.isArray(records)) throw new TypeError('Official bulk export must be a JSON array');
    return { raw, records };
  }
  const response = await fetch(exportUrl);
  if (!response.ok) throw new Error(`Official bulk export failed (${response.status})`);
  const raw = Buffer.from(await response.arrayBuffer());
  const records = JSON.parse(raw.toString('utf8'));
  if (!Array.isArray(records)) throw new TypeError('Official bulk export must be a JSON array');
  return { raw, records };
}

async function refreshSample(manifestPath, apiUrl) {
  const manifest = await readJson(manifestPath);
  const pages = [];
  let offset = 0;
  do {
    const response = await fetch(`${apiUrl}?limit=100&offset=${offset}`);
    if (!response.ok) throw new Error(`Source refresh failed (${response.status})`);
    const page = await response.json();
    pages.push(...(page.results ?? []));
    break;
    offset += 100;
  } while (true);
  const snapshot = { total_count: (await fetch(`${apiUrl}?limit=1`)).then(response => response.json()).then(value => value.total_count), results: pages };
  const snapshotPath = `${CITY_ROOT(city)}/${manifest.snapshot.path}`;
  await writeJson(snapshotPath, snapshot);
  manifest.snapshot.sha256 = sha256(await readFile(snapshotPath));
  manifest.snapshot.retrievedAt = new Date().toISOString();
  await writeJson(manifestPath, manifest);
  return snapshot.results.length;
}

async function refreshFull(manifestPath, adapter) {
  const manifest = await readJson(manifestPath);
  const { raw, records } = await fetchOfficialExport(adapter.source.exportUrl);
  const projected = records.map(record => projectRecord(record, adapter.projectionFields)).sort((a, b) => String(a.asset_id).localeCompare(String(b.asset_id), 'en'));
  const snapshot = { total_count: records.length, results: projected };
  const snapshotPath = `${CITY_ROOT(city)}/snapshots/public-trees-2026-07-12.full.json.gz`;
  const written = await writePinnedSnapshot(snapshotPath, snapshot);
  manifest.snapshot = {
    id: `public-trees-${new Date().toISOString().slice(0, 10)}-full`,
    path: 'snapshots/public-trees-2026-07-12.full.json.gz',
    sha256: written.sha256,
    rawDownloadSha256: sha256(raw),
    rawDownloadBytes: raw.byteLength,
    pinnedBytes: written.bytes,
    pinnedCompressedBytes: written.compressedBytes,
    retrievedAt: new Date().toISOString(),
    transformVersion: 'vancouver-public-trees-v2-full-projection',
    projectionFields: adapter.projectionFields,
    reportedCount: records.length,
    scope: 'Pinned complete City of Vancouver Public trees inventory, projected to required source fields, canonically sorted by stable asset_id, and gzip-compressed with deterministic metadata.'
  };
  await writeJson(manifestPath, manifest);
  return records.length;
}

const city = cityArgument();
const treeAdapter = getCityAdapter(city);
const full = process.argv.includes('--full');
const treeRecords = full
  ? await refreshFull(`${CITY_ROOT(city)}/source-manifest.json`, treeAdapter)
  : await refreshSample(`${CITY_ROOT(city)}/source-manifest.json`, treeAdapter.source.apiUrl);
if (full) console.log(`Refreshed ${city}: ${treeRecords} records from the official whole-dataset export. Re-run city:build and review provenance before committing.`);
else console.log(`Refreshed ${city}: ${treeRecords} pinned tree sample records. Use \`npm run city:refresh -- vancouver --full\` for the official complete export.`);
