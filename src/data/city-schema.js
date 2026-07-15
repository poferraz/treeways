import { validateCityManifest } from '../domain/city.js';
import { normalizeTree } from '../domain/tree.js';
import { validateSpeciesMetadata } from '../domain/forage.js';
import { EMPTY_EVIDENCE_REGISTRY, validateEvidenceRegistry } from '../domain/evidence.js';
import { validateTrailMembership } from '../domain/trails.js';
export const validateManifest = validateCityManifest;
export function validateTreePack(pack) {
  if (!pack || pack.schemaVersion !== 2 || !Array.isArray(pack.species) || !Array.isArray(pack.trees) || !Array.isArray(pack.trails)) throw new TypeError('Tree pack must be schema v2 with species, trees, and trails');
  const treeMeasurements = pack.treeMeasurements ?? {};
  const evidence = pack.evidence ?? EMPTY_EVIDENCE_REGISTRY;
  if (typeof treeMeasurements !== 'object' || Array.isArray(treeMeasurements)) throw new TypeError('Tree measurements must be an object');
  validateEvidenceRegistry(evidence);
  pack.species.forEach(species => validateSpeciesMetadata(species, evidence));
  const ids = new Set();
  const trees = pack.trees.map(tuple => {
    if (!Array.isArray(tuple) || tuple.length !== 9) throw new TypeError('Tree tuple must have 9 fields');
    const [id, latitude, longitude, speciesIndex, heightM, diameterCm, canopySpreadM, address, sourceId] = tuple;
    if (ids.has(String(id))) throw new TypeError(`Duplicate tree id ${id}`);
    ids.add(String(id));
    const species = pack.species[speciesIndex];
    if (!species) throw new TypeError(`Unknown species index ${speciesIndex}`);
    validateMeasurement(heightM, 'heightM', 150);
    validateMeasurement(diameterCm, 'diameterCm', 500);
    validateMeasurement(canopySpreadM, 'canopySpreadM', 150);
    const canopyProvenance = treeMeasurements[String(id)]?.canopy;
    return normalizeTree({ id, latitude, longitude, commonName: species.commonName, genus: species.genus, species: species.species, heightM, diameterCm, canopySpreadM, canopyProvenance, edibility: species.edibility, bloom: species.bloom, harvest: species.harvest, address, source: { label: 'City of Vancouver Open Data', id: sourceId }, curated: false });
  });
  for (const [id, measurement] of Object.entries(treeMeasurements)) {
    if (!ids.has(id)) throw new TypeError(`Orphan tree measurement ${id}`);
    if (!measurement || typeof measurement !== 'object' || Array.isArray(measurement) || !measurement.canopy) throw new TypeError(`Tree measurement ${id} requires canopy provenance`);
  }
  validateTrailMembership(pack.trails, pack.trailMembership ?? {}, ids, [-180, -90, 180, 90]);
  return trees;
}

function validateMeasurement(value, label, maximum) {
  if (value == null) return;
  if (!Number.isFinite(Number(value)) || Number(value) <= 0 || Number(value) > maximum) throw new TypeError(`Invalid ${label}`);
}
