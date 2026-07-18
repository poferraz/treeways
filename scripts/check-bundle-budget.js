import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const baseline = JSON.parse(await readFile('docs/release-gates/bundle-baseline.treeways-build-week.json', 'utf8'));
const assets = await readdir('dist/assets');
const bytes = async file => gzipSync(await readFile(`dist/assets/${file}`)).byteLength;
const resolveAsset = pattern => {
  const match = assets.find(file => new RegExp(`^${pattern.replace('.', '\\.').replace('*', '.*')}$`).test(file));
  if (!match) throw new Error(`Required bundle asset is missing: ${pattern}`);
  return match;
};
const coreAssets = baseline.coreEntry.assets.map(resolveAsset);
const coreBytes = (await Promise.all(coreAssets.map(bytes))).reduce((total, value) => total + value, 0);
const trailAssets = baseline.onDemandTrail.assets.map(resolveAsset);
const trailBytes = (await Promise.all(trailAssets.map(bytes))).reduce((total, value) => total + value, 0);
const cssBytes = await bytes(resolveAsset(baseline.css.asset));
const thirdPartyBytes = await bytes(resolveAsset(baseline.defaultThirdParty.asset));
const cityBytes = gzipSync(await readFile(`public/cities/vancouver/${baseline.cityData.artifact}`)).byteLength;
const fail = (label, value, limit) => { if (value > limit) throw new Error(`${label} is ${value} gzip bytes; limit is ${limit}`); };
const relativeCoreLimit = Math.floor(baseline.coreEntry.gzipBytes * (1 + baseline.coreEntry.maxRelativeGrowth));
fail('Core entry relative growth', coreBytes, relativeCoreLimit);
fail('Core entry absolute cap', coreBytes, baseline.coreEntry.absoluteMaxGzipBytes);
fail('On-demand trail experience', trailBytes, baseline.onDemandTrail.absoluteMaxGzipBytes);
fail('CSS', cssBytes, baseline.css.absoluteMaxGzipBytes);
fail('City data', cityBytes, baseline.cityData.absoluteMaxGzipBytes);
fail('Default third-party', thirdPartyBytes, baseline.defaultThirdParty.absoluteMaxGzipBytes);
console.log(`Core entry ${coreBytes}/${relativeCoreLimit} relative and ${baseline.coreEntry.absoluteMaxGzipBytes} absolute gzip bytes (baseline ${baseline.coreEntry.gzipBytes}, +${((coreBytes / baseline.coreEntry.gzipBytes - 1) * 100).toFixed(2)}%).`);
console.log(`On-demand trail experience ${trailBytes}/${baseline.onDemandTrail.absoluteMaxGzipBytes} gzip bytes (baseline ${baseline.onDemandTrail.gzipBytes}).`);
console.log(`CSS ${cssBytes}; city data ${cityBytes}; default third-party ${thirdPartyBytes} gzip bytes.`);
