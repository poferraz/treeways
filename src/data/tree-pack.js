import { validateTreePack } from './city-schema.js';

export function decodeTreePack(pack) {
  return validateTreePack(pack);
}

export function encodeTreePack(trees) { return JSON.stringify(trees); }
