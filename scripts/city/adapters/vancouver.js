import { readSnapshot, sha256 } from '../pipeline.js';
import { resolveSpeciesEvidence } from '../../../src/domain/evidence.js';

const bounds = [-123.3, 49.18, -122.9, 49.35];

function nullableMeasurement(value, label, maximum) {
  if (value == null || value === '') return { value: null };
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0 || number > maximum) return { reject: `invalid-${label}` };
  return { value: number };
}

function coordinate(record) {
  const longitude = Number(record.geo_point_2d?.lon ?? record.geom?.geometry?.coordinates?.[0]);
  const latitude = Number(record.geo_point_2d?.lat ?? record.geom?.geometry?.coordinates?.[1]);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude === 0 || latitude === 0 || longitude < bounds[0] || longitude > bounds[2] || latitude < bounds[1] || latitude > bounds[3]) return null;
  return { longitude, latitude };
}

function speciesKey(record) {
  return [record.genus_name, record.species_name, record.common_name, record.cultivar_name].map(value => String(value ?? '').trim()).join('|');
}

export const vancouverAdapter = {
  id: 'vancouver-public-trees',
  source: {
    datasetId: 'public-trees',
    url: 'https://opendata.vancouver.ca/explore/dataset/public-trees/',
    apiUrl: 'https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/public-trees/records',
    exportUrl: 'https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/public-trees/exports/json',
    license: 'Open Government Licence - Vancouver',
    licenseUrl: 'https://opendata.vancouver.ca/pages/licence/',
    bounds
  },
  projectionFields: ['asset_id', 'address', 'common_name', 'genus_name', 'species_name', 'cultivar_name', 'height_m', 'diameter_cm', 'date_planted', 'geo_point_2d'],
  async readSnapshot(snapshotPath) {
    const snapshot = await readSnapshot(snapshotPath);
    if (!Array.isArray(snapshot.results)) throw new TypeError('Vancouver snapshot must contain results');
    return { records: snapshot.results, sourceCount: Number(snapshot.total_count) || null, checksum: sha256(await (await import('node:fs/promises')).readFile(snapshotPath)) };
  },
  normalize(records, evidence) {
    const accepted = [];
    const rejects = [];
    const ids = new Set();
    const species = [];
    const speciesIndexes = new Map();
    for (const record of records) {
      const sourceId = String(record.asset_id ?? '').trim();
      if (!sourceId) { rejects.push({ sourceId: null, reason: 'missing-id' }); continue; }
      if (ids.has(sourceId)) { rejects.push({ sourceId, reason: 'duplicate-id' }); continue; }
      ids.add(sourceId);
      const point = coordinate(record);
      if (!point) { rejects.push({ sourceId, reason: 'invalid-coordinate' }); continue; }
      const height = nullableMeasurement(record.height_m, 'height-m', 150);
      const diameter = nullableMeasurement(record.diameter_cm, 'diameter-cm', 500);
      if (height.reject || diameter.reject) { rejects.push({ sourceId, reason: height.reject ?? diameter.reject }); continue; }
      const key = speciesKey(record);
      let speciesIndex = speciesIndexes.get(key);
      if (speciesIndex == null) {
        speciesIndex = species.length;
        speciesIndexes.set(key, speciesIndex);
        const taxonomy = { genus: String(record.genus_name ?? '').trim(), species: String(record.species_name ?? '').trim(), cultivar: String(record.cultivar_name ?? '').trim() || null };
        const reviewed = resolveSpeciesEvidence(taxonomy, evidence);
        species.push({
          commonName: String(record.common_name ?? 'Species not recorded').trim() || 'Species not recorded',
          ...taxonomy,
          edibility: reviewed.edibility,
          bloom: reviewed.bloom,
          harvest: reviewed.harvest
        });
      }
      accepted.push([sourceId, point.latitude, point.longitude, speciesIndex, height.value, diameter.value, null, record.address ?? null, sourceId]);
    }
    return { accepted, rejects, species };
  }
};
