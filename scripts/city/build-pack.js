import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const city = process.argv[2] ?? 'vancouver';
if (city !== 'vancouver') throw new Error(`No adapter configured for ${city}`);
const source = JSON.parse(await readFile(new URL('../../src/data/curated_trees.json', import.meta.url)));
await mkdir(resolve('public/cities/vancouver'), { recursive: true });
await writeFile(resolve('public/cities/vancouver/trees.pack'), JSON.stringify(source));
await writeFile(resolve('public/cities/vancouver/species.json'), JSON.stringify(source.species));
console.log(`Built ${source.trees.length} deterministic records for ${city}`);
