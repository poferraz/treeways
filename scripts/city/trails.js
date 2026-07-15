import { createHash } from 'node:crypto';
import { classifyGiant } from '../../src/domain/giant.js';

export const CANDIDATE_GENERATOR_VERSION = 'm3-a-giant-measurements-v1';
const CELL_SIZE = 0.02;
const MAX_GROUPS = 25;
const MAX_WAYPOINTS = 5;

export function generateCandidateReviewPacket({ city, sourceArtifact, trees }) {
  const groups = new Map();
  for (const tuple of trees) {
    const [id, latitude, longitude, , heightM, diameterCm, canopySpreadM] = tuple;
    const giant = classifyGiant({ heightM, canopySpreadM });
    if (!giant.isGiant) continue;
    const cell = `${Math.floor(Number(latitude) / CELL_SIZE)}:${Math.floor(Number(longitude) / CELL_SIZE)}`;
    const score = measurementScore(heightM, diameterCm, canopySpreadM);
    (groups.get(cell) ?? groups.set(cell, []).get(cell)).push({ id: String(id), latitude: Number(latitude), longitude: Number(longitude), heightM, diameterCm, canopySpreadM, giantReasons: giant.reasons, score });
  }
  const candidates = [...groups.entries()].map(([cell, members]) => candidateForCell(city, sourceArtifact, cell, members)).sort((a, b) => b.valueScore.total - a.valueScore.total || a.id.localeCompare(b.id)).slice(0, MAX_GROUPS).sort((a, b) => a.id.localeCompare(b.id));
  return {
    schemaVersion: 1,
    status: 'NOT HUMAN REVIEWED',
    candidateGeneratorVersion: CANDIDATE_GENERATOR_VERSION,
    sourceArtifact,
    generatedFacts: { candidateTheme: 'giant-measurements', inputFields: ['tree id', 'coordinates', 'heightM', 'diameterCm', 'canopySpreadM'], distance: { method: 'straight-line haversine waypoint distance', unit: 'm', notWalkingDistance: true }, classifier: 'src/domain/giant.js classifyGiant' },
    proposedEditorialContent: { names: 'none', narratives: 'none', accessibility: UNKNOWN, pedestrianPlausibility: UNKNOWN },
    unsupportedFields: ['forage', 'bloom', 'harvest', 'canopy enrichment', 'food access', 'harvesting permission', 'walking-route distance', 'safety', 'accessibility'],
    requiredHumanDecisions: ['Approve or reject a candidate.', 'Supply a human-approved name, reviewed waypoint order, export anchors, waypoint-oriented narrative, reviewer identity/date, and unknown-preserving access and pedestrian notes.'],
    candidates,
    unsupportedThemeCandidates: { season: [], forage: [] }
  };
}

function candidateForCell(city, sourceArtifact, cell, members) {
  const ranked = [...members].sort((a, b) => b.score.total - a.score.total || a.id.localeCompare(b.id)).slice(0, MAX_WAYPOINTS);
  const ordered = nearestOrder(ranked);
  const canonical = JSON.stringify({ city, sourceSnapshotSha256: sourceArtifact.sourceSnapshotSha256, theme: 'giant-measurements', cell, waypointTreeIds: ordered.map(member => member.id) });
  const id = `candidate-${createHash('sha256').update(canonical).digest('hex').slice(0, 16)}`;
  return { id, label: `generated-giant-measurements-${cell}`, theme: 'giant-measurements', season: null, status: 'NOT HUMAN REVIEWED', waypointTreeIds: ordered.map(member => member.id), waypoints: ordered.map(member => ({ treeId: member.id, latitude: member.latitude, longitude: member.longitude, scoreComponents: member.score, giantReasons: member.giantReasons })), proposedOrder: 'deterministic nearest-neighbour order from highest measurement score; not pedestrian routing', distance: { method: 'straight-line haversine waypoint distance', unit: 'm', value: round(distance(ordered)), notWalkingDistance: true }, valueScore: { total: round(ordered.reduce((sum, member) => sum + member.score.total, 0)), components: ordered.map(member => ({ treeId: member.id, ...member.score })) }, unresolved: { accessibility: UNKNOWN, pedestrianPlausibility: UNKNOWN, access: UNKNOWN, permission: UNKNOWN } };
}

function measurementScore(heightM, diameterCm, canopySpreadM) { return { heightM: Number(heightM) || 0, diameterCm: Number(diameterCm) || 0, canopySpreadM: Number(canopySpreadM) || 0, total: round((Number(heightM) || 0) + (Number(diameterCm) || 0) / 100 + (Number(canopySpreadM) || 0) / 10) }; }
function nearestOrder(members) { const remaining = [...members]; const ordered = [remaining.shift()]; while (remaining.length) { const current = ordered.at(-1); remaining.sort((a, b) => haversine(current, a) - haversine(current, b) || a.id.localeCompare(b.id)); ordered.push(remaining.shift()); } return ordered; }
function distance(members) { return members.slice(1).reduce((sum, member, index) => sum + haversine(members[index], member), 0); }
function haversine(a, b) { const radians = value => value * Math.PI / 180; const dLat = radians(b.latitude - a.latitude); const dLng = radians(b.longitude - a.longitude); const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLng / 2) ** 2; return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)); }
function round(value) { return Math.round(value * 100) / 100; }
const UNKNOWN = 'unknown';
