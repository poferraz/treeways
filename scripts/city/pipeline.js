import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync, gunzipSync } from 'node:zlib';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const CITY_ROOT = city => resolve('data/cities', city);
export const PUBLIC_CITY_ROOT = city => resolve('public/cities', city);

export async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, jsonBytes(value));
}

export function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

export async function readSnapshot(path) {
  const bytes = await readFile(path);
  return JSON.parse((path.endsWith('.gz') ? gunzipSync(bytes) : bytes).toString('utf8'));
}

export async function writePinnedSnapshot(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const bytes = Buffer.from(`${JSON.stringify(value)}\n`);
  const output = path.endsWith('.gz') ? gzipSync(bytes, { mtime: 0 }) : bytes;
  await writeFile(path, output);
  return { bytes: bytes.byteLength, compressedBytes: output.byteLength, sha256: sha256(output) };
}

export function sha256(value) {
  return createHash('sha256').update(Buffer.isBuffer(value) || typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
}

export function cityArgument(defaultCity = 'vancouver') {
  return process.argv[2] ?? defaultCity;
}

export function invokedDirectly(metaUrl) {
  return Boolean(process.argv[1]) && metaUrl === pathToFileURL(resolve(process.argv[1])).href;
}
