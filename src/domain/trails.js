const HUMAN_REVIEW = 'human-reviewed';
const UNKNOWN = 'unknown';
const MAX_WAYPOINTS = 20;
const MAX_EXPORT_ANCHORS = 5;
const UNSUPPORTED_CLAIM = /\b(accessible|accessibility|safe|safety|walkable|walkability|walking route|pedestrian-safe|permission|edible|bloom|harvest)\b/i;

export const EMPTY_TRAIL_SOURCE = Object.freeze({ schemaVersion: 1, trails: [] });

export function compileReviewedTrails(source = EMPTY_TRAIL_SOURCE, context) {
  validateSourceShape(source, context);
  const trees = new Map(context.trees.map(tuple => [String(tuple[0]), tuple]));
  const compiled = source.trails.map(trail => validateTrail(trail, context, trees)).sort((a, b) => a.id.localeCompare(b.id));
  const trailMembership = {};
  for (const trail of compiled) for (const treeId of trail.waypointTreeIds) (trailMembership[treeId] ??= []).push(trail.id);
  for (const ids of Object.values(trailMembership)) ids.sort();
  return { trails: compiled, trailMembership };
}

export function validateTrailMembership(trails, trailMembership, treeIds, bounds) {
  if (!trailMembership || typeof trailMembership !== 'object' || Array.isArray(trailMembership)) throw new TypeError('Trail membership must be an object');
  const expected = {};
  const source = { schemaVersion: 1, trails };
  const context = { cityId: 'validation', sourceSnapshotSha256: 'validation', trees: [...treeIds].map(id => [id, 0, 0]), bounds };
  // Structural validation is intentionally separate from the city-specific review-source gate.
  for (const trail of trails) {
    if (!trail || !String(trail.id ?? '').trim() || !Array.isArray(trail.waypointTreeIds)) throw new TypeError('Compiled trail is invalid');
    for (const treeId of trail.waypointTreeIds) {
      if (!treeIds.has(String(treeId))) throw new TypeError(`Trail ${trail.id} references missing tree ${treeId}`);
      (expected[String(treeId)] ??= []).push(trail.id);
    }
  }
  for (const ids of Object.values(expected)) ids.sort();
  if (JSON.stringify(expected) !== JSON.stringify(trailMembership)) throw new TypeError('Trail membership does not exactly match compiled trails');
  return source && context && true;
}

function validateSourceShape(source, context) {
  if (!source || source.schemaVersion !== 1 || !Array.isArray(source.trails)) throw new TypeError('Reviewed trail source must be schema v1 with trails');
  if (source.trails.length === 0) return;
  if (source.cityId !== context.cityId || source.sourceSnapshotSha256 !== context.sourceSnapshotSha256 || !String(source.candidateGeneratorVersion ?? '').trim()) throw new TypeError('Reviewed trail source provenance does not match this city snapshot');
  const ids = new Set();
  for (const trail of source.trails) {
    if (!String(trail?.id ?? '').trim() || ids.has(trail.id)) throw new TypeError('Reviewed trails require unique IDs');
    ids.add(trail.id);
  }
}

function validateTrail(trail, context, trees) {
  if (!trail || trail.cityId !== context.cityId || !String(trail.name ?? '').trim() || trail.review?.status !== HUMAN_REVIEW || !String(trail.review?.reviewer ?? '').trim() || !String(trail.review?.reviewedAt ?? '').trim() || /\b(ai|agent|model)\b/i.test(trail.review.reviewer)) throw new TypeError(`Trail ${trail?.id ?? 'unknown'} requires identified human review`);
  if (!Array.isArray(trail.waypointTreeIds) || trail.waypointTreeIds.length < 2 || trail.waypointTreeIds.length > MAX_WAYPOINTS || new Set(trail.waypointTreeIds).size !== trail.waypointTreeIds.length) throw new TypeError(`Trail ${trail.id} has invalid waypoint order`);
  if (!String(trail.candidateId ?? '').trim() || trail.candidateGeneratorVersion !== context.candidateGeneratorVersion || trail.sourceSnapshotSha256 !== context.sourceSnapshotSha256) throw new TypeError(`Trail ${trail.id} provenance no longer matches its reviewed source`);
  if (!String(trail.narrative ?? '').trim() || UNSUPPORTED_CLAIM.test(trail.narrative) || trail.accessibilityNotes !== UNKNOWN || trail.pedestrianPlausibility !== UNKNOWN) throw new TypeError(`Trail ${trail.id} contains unsupported route or access claims`);
  for (const treeId of trail.waypointTreeIds) if (!trees.has(String(treeId))) throw new TypeError(`Trail ${trail.id} references missing tree ${treeId}`);
  if (!Array.isArray(trail.exportAnchors) || trail.exportAnchors.length < 2 || trail.exportAnchors.length > MAX_EXPORT_ANCHORS) throw new TypeError(`Trail ${trail.id} has invalid export anchors`);
  for (const anchor of trail.exportAnchors) {
    const tree = trees.get(String(anchor?.treeId));
    if (!tree || !trail.waypointTreeIds.includes(String(anchor.treeId)) || !inBounds(anchor.longitude, anchor.latitude, context.bounds) || Number(anchor.latitude) !== Number(tree[1]) || Number(anchor.longitude) !== Number(tree[2])) throw new TypeError(`Trail ${trail.id} has malformed export anchor`);
  }
  return { id: trail.id, name: trail.name, waypointTreeIds: [...trail.waypointTreeIds], exportAnchors: trail.exportAnchors.map(anchor => ({ treeId: String(anchor.treeId), latitude: Number(anchor.latitude), longitude: Number(anchor.longitude) })), narrative: trail.narrative, accessibilityNotes: UNKNOWN, pedestrianPlausibility: UNKNOWN, review: { status: HUMAN_REVIEW, reviewer: trail.review.reviewer, reviewedAt: trail.review.reviewedAt }, candidateId: trail.candidateId, candidateGeneratorVersion: trail.candidateGeneratorVersion, sourceSnapshotSha256: trail.sourceSnapshotSha256, caveats: Array.isArray(trail.caveats) ? [...trail.caveats] : [] };
}

function inBounds(longitude, latitude, bounds) { return Number.isFinite(Number(longitude)) && Number.isFinite(Number(latitude)) && longitude >= bounds[0] && longitude <= bounds[2] && latitude >= bounds[1] && latitude <= bounds[3]; }
