import { validateRoutedTrail } from './trail-routing.js';

const HUMAN_REVIEW = 'human-reviewed';
const UNKNOWN = 'unknown';
const MINIMUM_CLUSTER_STOPS = 3;
const MAXIMUM_CLUSTER_STOPS = 5;
const MINIMUM_CLUSTER_TREES = 8;
const MINIMUM_THEME_TREES = 3;
const MINIMUM_CLUSTER_RADIUS_M = 60;
const MAXIMUM_CLUSTER_RADIUS_M = 75;
const UNSUPPORTED_CLAIM = /\b(accessible|accessibility|safe|safety|walkable|walkability|walking route|pedestrian-safe|permission|edible|bloom|harvest|open to the public)\b/i;

export const EMPTY_TRAIL_SOURCE = Object.freeze({ schemaVersion: 2, trails: [] });

export function orderedClusterStops(trail) {
  const byId = new Map(trail.clusterStops.map(stop => [stop.id, stop]));
  return trail.route.anchorOrder.map(id => byId.get(id)).filter(Boolean);
}

export function compileReviewedTrails(source = EMPTY_TRAIL_SOURCE, context) {
  validateSourceShape(source, context);
  const trees = new Map(context.trees.map(tuple => [String(tuple[0]), tuple]));
  const compiled = source.trails.map(trail => validateTrail(trail, context, trees)).sort((a, b) => a.id.localeCompare(b.id));
  const trailMembership = {};
  for (const trail of compiled) {
    for (const treeId of trailMemberTreeIds(trail)) (trailMembership[treeId] ??= []).push(trail.id);
  }
  for (const ids of Object.values(trailMembership)) ids.sort();
  return { trails: compiled, trailMembership };
}

export function validateTrailMembership(trails, trailMembership, treeIds, _bounds) {
  void _bounds;
  if (!trailMembership || typeof trailMembership !== 'object' || Array.isArray(trailMembership)) throw new TypeError('Trail membership must be an object');
  const expected = {};
  for (const trail of trails) {
    if (!trail || !String(trail.id ?? '').trim() || !Array.isArray(trail.clusterStops)) throw new TypeError('Compiled cluster trail is invalid');
    for (const treeId of trailMemberTreeIds(trail)) {
      if (!treeIds.has(String(treeId))) throw new TypeError(`Trail ${trail.id} references missing tree ${treeId}`);
      (expected[String(treeId)] ??= []).push(trail.id);
    }
  }
  for (const ids of Object.values(expected)) ids.sort();
  if (JSON.stringify(expected) !== JSON.stringify(trailMembership)) throw new TypeError('Trail membership does not exactly match compiled trails');
  return true;
}

function validateSourceShape(source, context) {
  if (!source || source.schemaVersion !== 2 || !Array.isArray(source.trails)) throw new TypeError('Reviewed trail source must be schema v2 with trails');
  if (source.trails.length === 0) return;
  if (source.cityId !== context.cityId || source.sourceSnapshotSha256 !== context.sourceSnapshotSha256 || source.candidateGeneratorVersion !== context.candidateGeneratorVersion) throw new TypeError('Reviewed trail source provenance does not match this city snapshot');
  const ids = new Set();
  for (const trail of source.trails) {
    if (!String(trail?.id ?? '').trim() || ids.has(trail.id)) throw new TypeError('Reviewed trails require unique IDs');
    ids.add(trail.id);
  }
}

function validateTrail(trail, context, trees) {
  validateHumanReview(trail, context);
  validateEditorialFields(trail);
  const clusterStops = validateClusterStops(trail, context, trees);
  validateAnchorOrder(trail, clusterStops);
  validateRoutedTrail(trail.route, { size: trail.size });
  for (const coordinate of trail.route.geometry.coordinates) {
    if (!inBounds(coordinate[0], coordinate[1], context.bounds)) throw new TypeError(`Trail ${trail.id} route geometry leaves the city bounds`);
  }
  return copyCompiledTrail(trail, clusterStops);
}

function validateHumanReview(trail, context) {
  const reviewer = String(trail?.review?.reviewer ?? '').trim();
  if (!trail || trail.cityId !== context.cityId || trail.review?.status !== HUMAN_REVIEW || !reviewer || /\b(ai|agent|model)\b/i.test(reviewer) || !/^\d{4}-\d{2}-\d{2}$/.test(String(trail.review?.reviewedAt ?? ''))) throw new TypeError(`Trail ${trail?.id ?? 'unknown'} requires identified human review`);
  if (!String(trail.candidateId ?? '').trim() || trail.candidateGeneratorVersion !== context.candidateGeneratorVersion || trail.sourceSnapshotSha256 !== context.sourceSnapshotSha256) throw new TypeError(`Trail ${trail.id} provenance no longer matches its reviewed source`);
}

function validateEditorialFields(trail) {
  if (!String(trail.name ?? '').trim() || !String(trail.neighbourhoodName ?? '').trim() || !String(trail.theme?.id ?? '').trim() || !String(trail.theme?.displayName ?? '').trim()) throw new TypeError(`Trail ${trail.id} requires a name, neighbourhood, and theme`);
  if (trail.mode !== 'walking' || !['loop', 'point-to-point'].includes(trail.shape) || !['small', 'medium', 'large'].includes(trail.size)) throw new TypeError(`Trail ${trail.id} has invalid walking trail semantics`);
  if (!String(trail.narrative ?? '').trim() || UNSUPPORTED_CLAIM.test(trail.narrative)) throw new TypeError(`Trail ${trail.id} contains unsupported route or access claims`);
  for (const field of ['accessibilityNotes', 'pedestrianPlausibility', 'safetyNotes', 'rightOfAccess', 'liveConditions']) {
    if (trail[field] !== UNKNOWN) throw new TypeError(`Trail ${trail.id} must keep ${field} unknown`);
  }
}

function validateClusterStops(trail, context, trees) {
  const stops = trail.clusterStops;
  if (!Array.isArray(stops) || stops.length < MINIMUM_CLUSTER_STOPS || stops.length > MAXIMUM_CLUSTER_STOPS) throw new TypeError(`Trail ${trail.id} requires three to five cluster stops`);
  const stopIds = new Set();
  const usedTreeIds = new Set();
  return stops.map(stop => {
    if (!String(stop?.id ?? '').trim() || stopIds.has(stop.id)) throw new TypeError(`Trail ${trail.id} requires unique cluster stop IDs`);
    stopIds.add(stop.id);
    if (!String(stop.locationLabel ?? '').trim() || !Number.isFinite(stop.radiusM) || stop.radiusM < MINIMUM_CLUSTER_RADIUS_M || stop.radiusM > MAXIMUM_CLUSTER_RADIUS_M) throw new TypeError(`Trail ${trail.id} has malformed cluster metadata`);
    const members = validateClusterMembers(trail, stop, trees, usedTreeIds);
    const anchor = validateClusterAnchor(trail, stop, members, trees, context.bounds);
    return {
      id: stop.id,
      locationLabel: stop.locationLabel,
      radiusM: stop.radiusM,
      anchor,
      memberTreeIds: [...members],
      themeTreeIds: [...stop.themeTreeIds],
      totalTreeCount: stop.totalTreeCount,
      themeTreeCount: stop.themeTreeCount,
      diversityCount: stop.diversityCount
    };
  });
}

function validateClusterMembers(trail, stop, trees, usedTreeIds) {
  const members = stop.memberTreeIds;
  const themes = stop.themeTreeIds;
  if (!Array.isArray(members) || members.length < MINIMUM_CLUSTER_TREES || new Set(members).size !== members.length || stop.totalTreeCount !== members.length) throw new TypeError(`Trail ${trail.id} cluster ${stop.id} has invalid member trees`);
  if (!Array.isArray(themes) || themes.length < MINIMUM_THEME_TREES || new Set(themes).size !== themes.length || stop.themeTreeCount !== themes.length || themes.some(id => !members.includes(id))) throw new TypeError(`Trail ${trail.id} cluster ${stop.id} has invalid theme trees`);
  if (!Number.isInteger(stop.diversityCount) || stop.diversityCount < 1) throw new TypeError(`Trail ${trail.id} cluster ${stop.id} has invalid diversity`);
  for (const treeId of members) {
    if (!trees.has(String(treeId))) throw new TypeError(`Trail ${trail.id} references missing tree ${treeId}`);
    if (usedTreeIds.has(String(treeId))) throw new TypeError(`Trail ${trail.id} repeats tree ${treeId} across clusters`);
    usedTreeIds.add(String(treeId));
  }
  return members.map(String);
}

function validateClusterAnchor(trail, stop, members, trees, bounds) {
  const anchor = stop.anchor;
  const tree = trees.get(String(anchor?.treeId));
  if (!tree || !members.includes(String(anchor.treeId)) || !inBounds(anchor.longitude, anchor.latitude, bounds) || Number(anchor.latitude) !== Number(tree[1]) || Number(anchor.longitude) !== Number(tree[2])) throw new TypeError(`Trail ${trail.id} cluster ${stop.id} has malformed anchor`);
  return { treeId: String(anchor.treeId), latitude: Number(anchor.latitude), longitude: Number(anchor.longitude) };
}

function validateAnchorOrder(trail, stops) {
  const order = trail.route?.anchorOrder;
  const stopIds = stops.map(stop => stop.id);
  if (!Array.isArray(order)) throw new TypeError(`Trail ${trail.id} requires a routed anchor order`);
  const comparedOrder = trail.shape === 'loop' ? order.slice(0, -1) : order;
  const hasLoopClosure = trail.shape !== 'loop' || (order.length === stopIds.length + 1 && order[0] === order.at(-1));
  if (!hasLoopClosure || comparedOrder.length !== stopIds.length || new Set(comparedOrder).size !== stopIds.length || comparedOrder.some(id => !stopIds.includes(id))) throw new TypeError(`Trail ${trail.id} routed anchor order does not match its cluster stops`);
}

function copyCompiledTrail(trail, clusterStops) {
  return {
    id: trail.id,
    name: trail.name,
    neighbourhoodName: trail.neighbourhoodName,
    theme: { id: trail.theme.id, displayName: trail.theme.displayName },
    size: trail.size,
    mode: 'walking',
    shape: trail.shape,
    clusterStops,
    route: structuredClone(trail.route),
    narrative: trail.narrative,
    accessibilityNotes: UNKNOWN,
    pedestrianPlausibility: UNKNOWN,
    safetyNotes: UNKNOWN,
    rightOfAccess: UNKNOWN,
    liveConditions: UNKNOWN,
    review: { status: HUMAN_REVIEW, reviewer: trail.review.reviewer, reviewedAt: trail.review.reviewedAt },
    candidateId: trail.candidateId,
    candidateGeneratorVersion: trail.candidateGeneratorVersion,
    sourceSnapshotSha256: trail.sourceSnapshotSha256,
    caveats: Array.isArray(trail.caveats) ? [...trail.caveats] : []
  };
}

function trailMemberTreeIds(trail) {
  return [...new Set(trail.clusterStops.flatMap(stop => stop.memberTreeIds.map(String)))].sort();
}

function inBounds(longitude, latitude, bounds) {
  return Number.isFinite(Number(longitude)) && Number.isFinite(Number(latitude)) && longitude >= bounds[0] && longitude <= bounds[2] && latitude >= bounds[1] && latitude <= bounds[3];
}
