import { MONTH_MASK, monthsToMask } from './phenology.js';

export function normalizeTree(record) {
  const latitude = Number(record.latitude ?? record.lat);
  const longitude = Number(record.longitude ?? record.lng);
  if (!String(record.id ?? '').trim()) throw new TypeError('Tree id is required');
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new TypeError('Tree latitude is invalid');
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new TypeError('Tree longitude is invalid');
  const bloomMask = record.bloomMask ?? monthsToMask(record.bloom ?? []);
  const harvestMask = record.harvestMask ?? monthsToMask(record.harvest ?? []);
  if ((bloomMask & ~MONTH_MASK) || (harvestMask & ~MONTH_MASK)) throw new TypeError('Phenology mask must use 12 bits');
  return { id: String(record.id), latitude, longitude, commonName: record.commonName ?? record.name ?? 'Species not recorded', genus: record.genus ?? '', species: record.species ?? '', type: record.type ?? 'municipal', tags: [...(record.tags ?? [])], bloomMask, harvestMask, heightM: numberOrNull(record.heightM ?? record.height), diameterCm: numberOrNull(record.diameterCm ?? record.diameter), address: record.address ?? null, source: record.source ?? null, curated: record.curated ?? true, usefulness: record.usefulness ?? null };
}

function numberOrNull(value) { return value == null || value === '' ? null : Number(value); }

export function toFeature(tree) {
  return { type: 'Feature', id: tree.id, properties: { id: tree.id, commonName: tree.commonName, genus: tree.genus, species: tree.species, type: tree.type, curated: tree.curated, bloomMask: tree.bloomMask, harvestMask: tree.harvestMask }, geometry: { type: 'Point', coordinates: [tree.longitude, tree.latitude] } };
}
