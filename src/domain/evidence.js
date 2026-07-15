const CLAIM_KINDS = new Set(['edibility', 'bloom', 'harvest']);
const REVIEW_STATUSES = new Set(['reviewed']);

export const EMPTY_EVIDENCE_REGISTRY = Object.freeze({ schemaVersion: 1, sources: [], records: [] });

export function validateEvidenceRegistry(registry = EMPTY_EVIDENCE_REGISTRY) {
  if (!registry || registry.schemaVersion !== 1 || !Array.isArray(registry.sources) || !Array.isArray(registry.records)) throw new TypeError('Evidence registry must be schema v1 with sources and records');
  const sourceIds = new Set();
  for (const source of registry.sources) {
    if (!source || !id(source.id) || sourceIds.has(source.id)) throw new TypeError('Evidence source requires a unique id');
    sourceIds.add(source.id);
    if (!text(source.publisher) || !text(source.title) || !url(source.canonicalUrl) || !text(source.version) || !text(source.retrievedAt) || !text(source.geographicScope) || !['species', 'cultivar'].includes(source.taxonomicGranularity) || typeof source.cultivarsDistinguished !== 'boolean') throw new TypeError(`Evidence source ${source.id} requires identity, version, scope, and taxonomy metadata`);
    const license = source.license;
    if (!license || !url(license.url) || !text(license.identifier) || !text(license.attribution) || license.allowsReuse !== true || license.allowsRedistribution !== true || license.allowsDerivatives !== true || license.allowsModification !== true) throw new TypeError(`Evidence source ${source.id} requires representable reuse, redistribution, modification, derivation, and attribution terms`);
    if (!Array.isArray(source.supportedClaimKinds) || source.supportedClaimKinds.some(kind => !CLAIM_KINDS.has(kind))) throw new TypeError(`Evidence source ${source.id} has invalid supported claim kinds`);
  }
  const recordIds = new Set();
  for (const record of registry.records) {
    if (!record || !id(record.id) || recordIds.has(record.id)) throw new TypeError('Evidence record requires a unique id');
    recordIds.add(record.id);
    if (!sourceIds.has(record.sourceId) || !text(record.taxonId) || !text(record.scientificName) || !url(record.recordUrl) || !text(record.statement) || !Array.isArray(record.caveats) || !REVIEW_STATUSES.has(record.review?.status) || !text(record.review?.reviewedAt)) throw new TypeError(`Evidence record ${record.id} requires exact taxonomy, source, statement, URL, caveats, and review`);
    if (record.cultivar != null && !text(record.cultivar)) throw new TypeError(`Evidence record ${record.id} has invalid cultivar`);
    if (!Array.isArray(record.claims) || record.claims.length === 0) throw new TypeError(`Evidence record ${record.id} requires claims`);
    const source = registry.sources.find(candidate => candidate.id === record.sourceId);
    for (const claim of record.claims) validateEvidenceClaim(claim, source, record.id);
  }
  assertSorted(registry.sources, 'Evidence sources');
  assertSorted(registry.records, 'Evidence records');
  return registry;
}

export function resolveSpeciesEvidence(species, registry = EMPTY_EVIDENCE_REGISTRY) {
  validateEvidenceRegistry(registry);
  const scientificName = normalizeScientificName(species.genus, species.species);
  if (!scientificName) return unknownMetadata();
  const cultivar = normalizeCultivar(species.cultivar);
  const exact = registry.records.filter(record => normalizeScientificName(record.scientificName) === scientificName && normalizeCultivar(record.cultivar) === cultivar);
  const claims = new Map();
  for (const record of exact) for (const claim of record.claims) {
    const value = { ...claim, evidence: [record.id] };
    const prior = claims.get(claim.kind) ?? [];
    claims.set(claim.kind, [...prior, value]);
  }
  return {
    edibility: resolveClaim(claims.get('edibility'), { status: 'unknown', evidence: [] }),
    bloom: resolveClaim(claims.get('bloom'), null),
    harvest: resolveClaim(claims.get('harvest'), null)
  };
}

export function evidenceRecord(registry, evidenceId) {
  validateEvidenceRegistry(registry);
  const record = registry.records.find(candidate => candidate.id === evidenceId);
  if (!record) throw new TypeError(`Unknown evidence record ${evidenceId}`);
  return record;
}

function resolveClaim(candidates, fallback) {
  if (!candidates?.length) return fallback;
  const comparable = candidates.map(({ evidence, ...claim }) => JSON.stringify(claim));
  if (new Set(comparable).size !== 1) return fallback;
  const { kind, ...claim } = candidates[0];
  return { ...claim, evidence: candidates.map(candidate => candidate.evidence[0]).sort() };
}

function validateEvidenceClaim(claim, source, recordId) {
  if (!claim || !CLAIM_KINDS.has(claim.kind) || !source.supportedClaimKinds.includes(claim.kind)) throw new TypeError(`Evidence record ${recordId} has an unsupported claim`);
  if (claim.kind === 'edibility' && !['reported-edible', 'not-edible'].includes(claim.status)) throw new TypeError(`Evidence record ${recordId} has invalid edibility semantics`);
  if (claim.kind === 'bloom' && (!Number.isInteger(claim.mask) || !text(claim.colour))) throw new TypeError(`Evidence record ${recordId} has invalid bloom semantics`);
  if (claim.kind === 'harvest' && !Number.isInteger(claim.mask)) throw new TypeError(`Evidence record ${recordId} has invalid harvest semantics`);
}

function unknownMetadata() { return { edibility: { status: 'unknown', evidence: [] }, bloom: null, harvest: null }; }
function normalizeScientificName(...parts) { const name = parts.filter(Boolean).join(' '); return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase(); }
function normalizeCultivar(value) { const normalized = String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase(); return normalized || null; }
function text(value) { return typeof value === 'string' && value.trim().length > 0; }
function id(value) { return text(value) && /^[a-z0-9][a-z0-9._-]*$/i.test(value); }
function url(value) { try { return Boolean(new URL(value)); } catch { return false; } }
function assertSorted(values, label) { if (values.some((value, index) => index > 0 && values[index - 1].id.localeCompare(value.id) > 0)) throw new TypeError(`${label} must use deterministic ID ordering`); }
