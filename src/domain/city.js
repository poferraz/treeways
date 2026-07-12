export const REQUIRED_MANIFEST_FIELDS = ['id', 'name', 'locale', 'timezone', 'bounds', 'data', 'attribution', 'capabilities'];

export function validateCityManifest(manifest) {
  for (const field of REQUIRED_MANIFEST_FIELDS) if (manifest?.[field] == null) throw new TypeError(`City manifest requires ${field}`);
  if (!/^[a-z0-9-]+$/.test(manifest.id)) throw new TypeError('City id must be lowercase kebab-case');
  if (!Array.isArray(manifest.bounds) || manifest.bounds.length !== 4) throw new TypeError('City bounds must be [west, south, east, north]');
  if (!manifest.attribution.name || !manifest.attribution.license) throw new TypeError('City attribution is required');
  return manifest;
}
