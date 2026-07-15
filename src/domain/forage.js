import { MONTH_MASK } from './phenology.js';
import { EMPTY_EVIDENCE_REGISTRY, evidenceRecord } from './evidence.js';

const EDIBILITY_STATUSES = new Set(['unknown', 'reported-edible', 'not-edible']);
const BLOOM_COLOURS = new Set(['white', 'pink', 'red', 'purple', 'yellow', 'orange', 'green', 'mixed']);

export function validateSpeciesMetadata(species, registry = EMPTY_EVIDENCE_REGISTRY) {
  if (!species || typeof species !== 'object' || !String(species.commonName ?? '').trim()) throw new TypeError('Species requires a commonName');
  const edibility = species.edibility ?? { status: 'unknown', evidence: [] };
  if (!EDIBILITY_STATUSES.has(edibility.status) || !Array.isArray(edibility.evidence)) throw new TypeError('Species edibility is invalid');
  if (edibility.status !== 'unknown' && edibility.evidence.length === 0) throw new TypeError('Claimed edibility requires evidence');
  if (edibility.status === 'unknown' && (edibility.edibleParts?.length ?? 0) > 0) throw new TypeError('Unknown edibility cannot list edible parts');
  if (edibility.status !== 'unknown') validateClaimEvidence(edibility, registry, 'edibility');
  validateSeasonalClaim(species.bloom, 'bloom', true, registry);
  validateSeasonalClaim(species.harvest, 'harvest', false, registry);
  return species;
}

function validateSeasonalClaim(claim, label, needsColour, registry) {
  if (claim == null) return;
  if (!Number.isInteger(claim.mask) || claim.mask < 1 || (claim.mask & ~MONTH_MASK) !== 0 || !Array.isArray(claim.evidence) || claim.evidence.length === 0) throw new TypeError(`Species ${label} claim requires a valid mask and evidence`);
  if (needsColour && !BLOOM_COLOURS.has(claim.colour)) throw new TypeError('Species bloom claim requires a semantic colour');
  validateClaimEvidence(claim, registry, label);
}

function validateClaimEvidence(claim, registry, kind) {
  if (!claim.evidence.every(id => typeof id === 'string')) throw new TypeError(`Species ${kind} evidence must use stable record IDs`);
  for (const id of claim.evidence) {
    const record = evidenceRecord(registry, id);
    if (!record.claims.some(candidate => candidate.kind === kind && sameSemantics(candidate, claim))) throw new TypeError(`Evidence record ${id} does not support this ${kind} claim`);
  }
}

function sameSemantics(candidate, claim) {
  if (candidate.kind === 'edibility') return candidate.status === claim.status && (claim.edibleParts ?? []).every(part => candidate.edibleParts?.includes(part));
  return candidate.mask === claim.mask && (candidate.kind !== 'bloom' || candidate.colour === claim.colour);
}
