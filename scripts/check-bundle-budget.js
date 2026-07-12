import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const files = await readdir('dist/assets');
const app = files.find(file => /^index-.*\.js$/.test(file));
const size = gzipSync(await readFile(`dist/assets/${app}`)).byteLength;
if (size > 80 * 1024) throw new Error(`App shell is ${(size / 1024).toFixed(1)} KB gzip; budget is 80 KB`);
console.log(`App shell ${(size / 1024).toFixed(1)} KB gzip (budget: 80 KB)`);
