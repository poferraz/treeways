import { readFile } from 'node:fs/promises';
import { buildCityPack } from './city/build-pack.js';

const artifact = 'public/cities/vancouver/vancouver.v2.1.0.json';
const candidates = 'data/cities/vancouver/reports/trail-candidates.json';
await buildCityPack('vancouver');
const first = await readFile(artifact);
const firstCandidates = await readFile(candidates);
await buildCityPack('vancouver');
const second = await readFile(artifact);
const secondCandidates = await readFile(candidates);
if (!first.equals(second)) throw new Error('City artifact is not byte-identical across two pinned-input builds');
if (!firstCandidates.equals(secondCandidates)) throw new Error('Trail candidate packet is not byte-identical across two pinned-input builds');
console.log(`Deterministic city build and candidate packet verified (${first.length} artifact bytes, identical twice).`);
