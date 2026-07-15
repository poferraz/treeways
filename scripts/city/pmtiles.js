import { gzipSync, gunzipSync } from 'node:zlib';
import Pbf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';

const HEADER_BYTES = 127;
const u64 = (buffer, offset, value) => buffer.writeBigUInt64LE(BigInt(value), offset);
const varint = value => { const bytes = []; for (let n = value; ; n = Math.floor(n / 128)) { bytes.push((n % 128) + (n >= 128 ? 128 : 0)); if (n < 128) return Buffer.from(bytes); } };

function hilbert(z, x, y) {
  let index = 0;
  for (let s = 1 << (z - 1); s > 0; s >>= 1) {
    const rx = (x & s) > 0 ? 1 : 0; const ry = (y & s) > 0 ? 1 : 0;
    index += s * s * ((3 * rx) ^ ry);
    if (ry === 0) { if (rx === 1) { x = (1 << z) - 1 - x; y = (1 << z) - 1 - y; } [x, y] = [y, x]; }
  }
  return ((4 ** z - 1) / 3) + index;
}

function directory(entries) {
  const chunks = [varint(entries.length)]; let previous = 0;
  for (const entry of entries) { chunks.push(varint(entry.id - previous)); previous = entry.id; }
  for (const entry of entries) chunks.push(varint(entry.run));
  for (const entry of entries) chunks.push(varint(entry.data.length));
  let next = 0;
  for (const [index, entry] of entries.entries()) { chunks.push(varint(index > 0 && entry.offset === next ? 0 : entry.offset + 1)); next = entry.offset + entry.data.length; }
  return gzipSync(Buffer.concat(chunks), { mtime: 0 });
}

export function createPmtiles(tiles, bounds) {
  if (!Array.isArray(tiles) || tiles.length === 0) throw new TypeError('PMTiles requires at least one tile');
  const entries = tiles.map(tile => {
    if (!Number.isInteger(tile.id) || !Number.isInteger(tile.z) || !Buffer.isBuffer(tile.data)) throw new TypeError('Invalid PMTiles tile');
    return { ...tile, data: gzipSync(tile.data, { mtime: 0 }), run: 1 };
  }).sort((a, b) => a.id - b.id);
  if (entries.some((entry, index) => index > 0 && entry.id === entries[index - 1].id)) throw new TypeError('PMTiles tile IDs must be unique');
  let offset = 0; for (const entry of entries) { entry.offset = offset; offset += entry.data.length; }
  const root = directory(entries);
  const metadata = Buffer.from(JSON.stringify({ name: 'Vancouver public trees benchmark', vector_layers: [{ id: 'trees', fields: { id: 'String' } }] }));
  const header = Buffer.alloc(HEADER_BYTES); header.write('PMTiles', 0); header[7] = 3;
  u64(header, 8, HEADER_BYTES); u64(header, 16, root.length); u64(header, 24, HEADER_BYTES + root.length); u64(header, 32, metadata.length);
  u64(header, 40, HEADER_BYTES + root.length + metadata.length); u64(header, 48, 0); u64(header, 56, HEADER_BYTES + root.length + metadata.length); u64(header, 64, offset);
  u64(header, 72, entries.length); u64(header, 80, entries.length); u64(header, 88, entries.length);
  const minZoom = Math.min(...entries.map(entry => entry.z)); const maxZoom = Math.max(...entries.map(entry => entry.z));
  header[96] = 1; header[97] = 2; header[98] = 2; header[99] = 1; header[100] = minZoom; header[101] = maxZoom;
  header.writeInt32LE(Math.round(bounds[0] * 1e7), 102); header.writeInt32LE(Math.round(bounds[1] * 1e7), 106); header.writeInt32LE(Math.round(bounds[2] * 1e7), 110); header.writeInt32LE(Math.round(bounds[3] * 1e7), 114);
  header[118] = maxZoom; header.writeInt32LE(Math.round(((bounds[0] + bounds[2]) / 2) * 1e7), 119); header.writeInt32LE(Math.round(((bounds[1] + bounds[3]) / 2) * 1e7), 123);
  return Buffer.concat([header, root, metadata, ...entries.map(entry => entry.data)]);
}

export function decodePmtiles(archive) {
  if (!Buffer.isBuffer(archive) || archive.length < HEADER_BYTES || archive.subarray(0, 7).toString() !== 'PMTiles' || archive[7] !== 3) throw new Error('Invalid PMTiles v3 archive');
  const rootOffset = Number(archive.readBigUInt64LE(8)); const rootLength = Number(archive.readBigUInt64LE(16)); const dataOffset = Number(archive.readBigUInt64LE(56));
  if (rootOffset < HEADER_BYTES || rootLength <= 0 || rootOffset + rootLength > archive.length || dataOffset < rootOffset + rootLength || dataOffset > archive.length) throw new Error('Invalid PMTiles v3 header offsets');
  const root = gunzipSync(archive.subarray(rootOffset, rootOffset + rootLength)); let cursor = 0; const read = () => { let value = 0; let shift = 0; while (true) { if (cursor >= root.length || shift > 49) throw new Error('Invalid PMTiles v3 directory'); const byte = root[cursor++]; value += (byte & 127) * (2 ** shift); if (!(byte & 128)) return value; shift += 7; } };
  const count = read(); const ids = []; let previous = 0; for (let i = 0; i < count; i++) { previous += read(); ids.push(previous); } const runs = Array.from({ length: count }, read); const lengths = Array.from({ length: count }, read); const offsets = []; for (let i = 0; i < count; i++) { const value = read(); offsets.push(value === 0 && i > 0 ? offsets[i - 1] + lengths[i - 1] : value - 1); }
  let featureCount = 0; const featureIds = new Set(); for (let i = 0; i < count; i++) { const start = dataOffset + offsets[i]; const end = start + lengths[i]; if (start < dataOffset || end > archive.length) throw new Error(`PMTiles directory points outside tile data at entry ${i}`); const encoded = archive.subarray(start, end); if (encoded[0] !== 31 || encoded[1] !== 139) throw new Error(`PMTiles tile ${i} is not gzip-compressed`); const layer = new VectorTile(new Pbf(gunzipSync(encoded))).layers.trees; featureCount += layer?.length ?? 0; for (let featureIndex = 0; featureIndex < (layer?.length ?? 0); featureIndex++) featureIds.add(String(layer.feature(featureIndex).properties.id)); }
  return { tiles: count, featureCount, featureIds, tileIds: ids, runs };
}

export function tileId(z, x, y) { return hilbert(z, x, y); }
