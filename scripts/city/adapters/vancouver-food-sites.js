import { readJson, sha256 } from '../pipeline.js';

const bounds = [-123.3, 49.18, -122.9, 49.35];

function point(record) {
  const longitude = Number(record.geo_point_2d?.lon ?? record.geom?.geometry?.coordinates?.[0]);
  const latitude = Number(record.geo_point_2d?.lat ?? record.geom?.geometry?.coordinates?.[1]);
  return Number.isFinite(longitude) && Number.isFinite(latitude) && longitude !== 0 && latitude !== 0 && longitude >= bounds[0] && longitude <= bounds[2] && latitude >= bounds[1] && latitude <= bounds[3] ? [longitude, latitude] : null;
}

function countOrNull(value) {
  if (value == null || value === '' || ['Y', 'YES'].includes(String(value).trim().toUpperCase())) return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : undefined;
}

export const vancouverFoodSitesAdapter = {
  async readSnapshot(path) {
    const snapshot = await readJson(path);
    if (!Array.isArray(snapshot.results)) throw new TypeError('Food-site snapshot must contain results');
    return { records: snapshot.results, sourceCount: Number(snapshot.total_count) || null, checksum: sha256(await (await import('node:fs/promises')).readFile(path)) };
  },
  normalize(records) {
    const foodSites = [];
    const rejects = [];
    const ids = new Set();
    for (const record of records) {
      const id = String(record.mapid ?? '').trim();
      if (!id) { rejects.push({ sourceId: null, reason: 'missing-id' }); continue; }
      if (ids.has(id)) { rejects.push({ sourceId: id, reason: 'duplicate-id' }); continue; }
      ids.add(id);
      const coordinates = point(record);
      if (!coordinates) { rejects.push({ sourceId: id, reason: 'invalid-coordinate' }); continue; }
      const reportedFoodTreeCount = countOrNull(record.number_of_food_trees);
      if (reportedFoodTreeCount === undefined) { rejects.push({ sourceId: id, reason: 'invalid-food-tree-count' }); continue; }
      foodSites.push({
        id,
        name: String(record.name ?? 'Food-growing site').trim() || 'Food-growing site',
        coordinates,
        address: record.merged_address ?? null,
        reportedFoodTreeCount,
        reportedFoodTreeVarieties: record.food_tree_varieties ?? null,
        jurisdiction: record.jurisdiction ?? null,
        steward: record.steward_or_managing_organization ?? null,
        website: record.website ?? null,
        access: { status: 'unknown', note: 'This record does not grant access or harvesting permission.' },
        sourceId: id
      });
    }
    return { foodSites, rejects };
  }
};
