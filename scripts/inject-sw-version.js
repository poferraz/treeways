import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const distDir = 'dist';
const builtFiles = readdirSync(join(distDir, 'assets'));

function findWorkerAsset(prefix) {
  const files = builtFiles.filter(name => name.startsWith(prefix) && name.endsWith('.js'));
  if (files.length !== 1) throw new Error(`Expected one built worker matching ${prefix}*.js, found ${files.length}`);
  return `assets/${files[0]}`;
}

// Keep the precache and its version tied to the same production files.
const shellAssets = [
  'index.html',
  'manifest.webmanifest',
  'assets/index.js',
  'assets/index.css',
  'assets/maplibre.js',
  findWorkerAsset('data.worker-'),
  findWorkerAsset('maplibre-gl-worker-')
];

const hash = createHash('sha256');
for (const asset of shellAssets) {
  hash.update(asset).update('\0').update(readFileSync(join(distDir, asset)));
}
const version = hash.digest('hex').slice(0, 16);

const swPath = join(distDir, 'sw.js');
const template = readFileSync(swPath, 'utf8');
const shellPlaceholder = "['{{SHELL_ASSETS}}']";
if (!template.includes('{{SW_VERSION}}') || !template.includes(shellPlaceholder)) {
  throw new Error('dist/sw.js is missing required placeholders');
}
const shellUrls = ['/', ...shellAssets.map(asset => `/${asset}`)];
const sw = template.replace('{{SW_VERSION}}', version).replace(shellPlaceholder, JSON.stringify(shellUrls));
if (sw.includes('{{')) throw new Error('Unresolved placeholders remain in dist/sw.js');
writeFileSync(swPath, sw);
console.log(`Injected service-worker version: ${version}`);
