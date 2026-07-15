import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const distDir = 'dist';
const assetsDir = join(distDir, 'assets');

function findWorkerAsset() {
  const files = readdirSync(assetsDir);
  const worker = files.find(name => /^data\.worker-[A-Za-z0-9_-]+\.js$/.test(name));
  if (!worker) {
    console.error('Could not find data.worker-*.js in dist/assets');
    process.exit(1);
  }
  return `/assets/${worker}`;
}

const dataWorkerAsset = findWorkerAsset();

// Assets that make up the app shell. Their combined content hash becomes the
// service-worker version, so each build gets a uniquely-named shell cache while
// the data cache stays stable across releases.
const shellAssets = [
  'index.html',
  'manifest.webmanifest',
  'assets/index.js',
  'assets/index.css',
  'assets/maplibre.js',
  dataWorkerAsset.replace('/assets/', 'assets/')
];

const hash = createHash('sha256');
for (const asset of shellAssets) {
  const path = join(distDir, asset);
  try {
    hash.update(readFileSync(path));
  } catch (error) {
    console.error(`Missing shell asset: ${path}`);
    console.error(error.message);
    process.exit(1);
  }
}
const version = hash.digest('hex').slice(0, 16);

const swPath = join(distDir, 'sw.js');
let sw = readFileSync(swPath, 'utf8');
if (!sw.includes('{{SW_VERSION}}') || !sw.includes('{{DATA_WORKER_ASSET}}')) {
  console.error('dist/sw.js is missing required placeholders');
  process.exit(1);
}
sw = sw.replace(/{{SW_VERSION}}/g, version);
sw = sw.replace(/{{DATA_WORKER_ASSET}}/g, dataWorkerAsset);
if (sw.includes('{{')) {
  console.error('Unresolved placeholders remain in dist/sw.js');
  process.exit(1);
}
writeFileSync(swPath, sw);
console.log(`Injected service-worker version: ${version}`);
console.log(`Data worker asset: ${dataWorkerAsset}`);
