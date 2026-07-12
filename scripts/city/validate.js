import { readFile } from 'node:fs/promises';
import { decodeTreePack } from '../../src/data/tree-pack.js';
const city = process.argv[2] ?? 'vancouver'; const pack = JSON.parse(await readFile(`public/cities/${city}/trees.pack`)); const trees = decodeTreePack(pack); if (trees.length !== 10_000) throw new Error(`Expected 10,000 records, got ${trees.length}`); console.log(`Validated ${trees.length} records`);
