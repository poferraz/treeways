import { MONTH_MASK, monthsToMask } from './phenology.js';
import { classifyGiant } from './giant.js';
import { treeMarkerCategory } from './tree-categories.js';

export function normalizeTree(record) {
  const latitude = Number(record.latitude ?? record.lat);
  const longitude = Number(record.longitude ?? record.lng);
  if (!String(record.id ?? '').trim()) throw new TypeError('Tree id is required');
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new TypeError('Tree latitude is invalid');
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new TypeError('Tree longitude is invalid');
  const bloom = claimOrNull(record.bloom);
  const harvest = claimOrNull(record.harvest);
  const bloomMask = record.bloomMask ?? bloom?.mask ?? monthsToMask(Array.isArray(record.bloom) ? record.bloom : []);
  const harvestMask = record.harvestMask ?? harvest?.mask ?? monthsToMask(Array.isArray(record.harvest) ? record.harvest : []);
  if ((bloomMask & ~MONTH_MASK) || (harvestMask & ~MONTH_MASK)) throw new TypeError('Phenology mask must use 12 bits');
  const canopySpreadM = numberOrNull(record.canopySpreadM);
  const canopyProvenance = normalizeCanopyProvenance(canopySpreadM, record.canopyProvenance);
  return { id: String(record.id), latitude, longitude, commonName: record.commonName ?? record.name ?? 'Species not recorded', genus: record.genus ?? '', species: record.species ?? '', type: record.type ?? 'municipal', tags: [...(record.tags ?? [])], bloomMask, harvestMask, heightM: numberOrNull(record.heightM ?? record.height), diameterCm: numberOrNull(record.diameterCm ?? record.diameter), canopySpreadM, canopyProvenance, edibility: record.edibility ?? { status: 'unknown', evidence: [] }, bloom, harvest, address: record.address ?? null, source: record.source ?? null, curated: record.curated ?? true, usefulness: record.usefulness ?? null };
}

function numberOrNull(value) { return value == null || value === '' ? null : Number(value); }

function claimOrNull(value) { return value && !Array.isArray(value) && typeof value === 'object' ? value : null; }

function normalizeCanopyProvenance(canopySpreadM, provenance) {
  if (canopySpreadM === null) {
    if (provenance != null) throw new TypeError('Canopy provenance requires a canopy measurement');
    return null;
  }
  if (!provenance || !['measured', 'estimated'].includes(provenance.kind)) throw new TypeError('Canopy measurement requires measured or estimated provenance');
  if (provenance.kind === 'estimated' && !String(provenance.method ?? '').trim()) throw new TypeError('Estimated canopy measurement requires a method');
  return { ...provenance };
}

export function toFeature(tree) {
  const giant = classifyGiant(tree);
  return { type: 'Feature', id: tree.id, properties: { id: tree.id, commonName: tree.commonName, genus: tree.genus, species: tree.species, type: treeMarkerCategory(tree), curated: tree.curated, bloomMask: tree.bloomMask, harvestMask: tree.harvestMask, bloomColour: tree.bloom?.colour ?? null, edibilityStatus: tree.edibility.status, canopySpreadM: tree.canopySpreadM, canopyProvenance: tree.canopyProvenance?.kind ?? null, isGiant: giant.isGiant, giantReasons: giant.reasons }, geometry: { type: 'Point', coordinates: [tree.longitude, tree.latitude] } };
}
