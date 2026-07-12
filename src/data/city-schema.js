import { validateCityManifest } from '../domain/city.js';
import { normalizeTree } from '../domain/tree.js';
export const validateManifest = validateCityManifest;
export function validateTreePack(records) { if (!Array.isArray(records)) throw new TypeError('Tree pack must be an array'); return records.map(normalizeTree); }
