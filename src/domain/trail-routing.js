export const ROUTED_DISTANCE_BANDS = Object.freeze({
  small: 3000,
  medium: 5000,
  large: 8000
});

const MAXIMUM_LOOP_OVERHEAD = 1.75;
const MAXIMUM_SNAP_DISTANCE_M = 40;
const MAXIMUM_LEG_DISTANCE_M = 2000;
const MAXIMUM_REPEATED_SEGMENT_RATIO = 0.15;

export function chooseRouteOrder(anchors, distanceMatrix, options = {}) {
  validateMatrix(anchors, distanceMatrix);
  const pointToPoint = shortestPath(anchors, distanceMatrix);
  const loop = shortestLoop(anchors, distanceMatrix);
  const maximumLoopOverhead = options.maximumLoopOverhead ?? MAXIMUM_LOOP_OVERHEAD;
  const maximumLegDistanceM = options.maximumLegDistanceM ?? MAXIMUM_LEG_DISTANCE_M;
  if (pointToPoint.maximumLegDistanceM > maximumLegDistanceM) throw new TypeError('Trail anchors cannot form a connected route within the per-leg limit');
  return loop.maximumLegDistanceM <= maximumLegDistanceM && loop.distanceM <= pointToPoint.distanceM * maximumLoopOverhead ? loop : pointToPoint;
}

export function validateRoutedTrail(route, { size }) {
  if (!route?.geometry || route.geometry.type !== 'LineString' || route.geometry.coordinates.length < 2) throw new TypeError('Trail requires routed LineString geometry');
  const maximumDistance = ROUTED_DISTANCE_BANDS[size];
  if (!maximumDistance || !Number.isFinite(route.distanceM) || route.distanceM <= 0 || route.distanceM > maximumDistance) throw new TypeError(`Trail routed distance exceeds the ${size} band`);
  if (!Number.isFinite(route.durationSeconds) || route.durationSeconds <= 0) throw new TypeError('Trail requires a routed duration');
  if (route.provenance?.provider !== 'openrouteservice' || route.provenance?.profile !== 'foot-walking') throw new TypeError('Trail routing must use the OpenRouteService foot-walking profile');
  for (const field of ['engineVersion', 'graphDate', 'generatedAt', 'attribution']) {
    if (!String(route.provenance?.[field] ?? '').trim()) throw new TypeError(`Trail routing provenance requires ${field}`);
  }
  if (route.provenance.resultLicense !== 'CC-BY-4.0' || !/openrouteservice\.org/i.test(route.provenance.attribution) || !/OpenStreetMap/i.test(route.provenance.attribution)) throw new TypeError('Trail routing provenance requires the OpenRouteService result licence and attribution');
  if (!Array.isArray(route.snappedDistancesM) || route.snappedDistancesM.some(distance => !Number.isFinite(distance) || distance > MAXIMUM_SNAP_DISTANCE_M)) throw new TypeError('Trail anchor snap distance is excessive');
  const invalidLeg = Array.isArray(route.legDistancesM) ? route.legDistancesM.find(distance => !Number.isFinite(distance) || distance <= 0 || distance > MAXIMUM_LEG_DISTANCE_M) : null;
  if (!Array.isArray(route.legDistancesM) || invalidLeg != null) throw new TypeError(`Trail contains a major routed jump${Number.isFinite(invalidLeg) ? ` (${Math.round(invalidLeg)} m)` : ''}`);
  const quality = routedGeometryQuality(route.geometry);
  if (quality.repeatedSegmentRatio > MAXIMUM_REPEATED_SEGMENT_RATIO) throw new TypeError('Trail contains excessive repeated or backtracking segments');
  return true;
}

export function routedGeometryQuality(geometry) {
  const coordinates = geometry?.coordinates ?? [];
  const segments = coordinates.slice(1).map((coordinate, index) => segmentKey(coordinates[index], coordinate));
  const seen = new Set();
  let repeated = 0;
  for (const segment of segments) {
    if (seen.has(segment)) repeated += 1;
    seen.add(segment);
  }
  return { segmentCount: segments.length, repeatedSegmentCount: repeated, repeatedSegmentRatio: segments.length ? repeated / segments.length : 0 };
}

function shortestPath(anchors, matrix) {
  let best;
  for (const order of permutations(anchors.map((_, index) => index))) {
    const candidate = routeResult('point-to-point', order, anchors, matrix);
    if (isBetter(candidate, best)) best = candidate;
  }
  return best;
}

function shortestLoop(anchors, matrix) {
  const start = anchors.map((anchor, index) => ({ id: String(anchor.id), index })).sort((a, b) => a.id.localeCompare(b.id))[0].index;
  const remaining = anchors.map((_, index) => index).filter(index => index !== start);
  let best;
  for (const middle of permutations(remaining)) {
    const candidate = routeResult('loop', [start, ...middle, start], anchors, matrix);
    if (isBetter(candidate, best)) best = candidate;
  }
  return best;
}

function routeResult(shape, order, anchors, matrix) {
  const legDistancesM = order.slice(1).map((index, position) => matrix[order[position]][index]);
  const distanceM = legDistancesM.reduce((total, distance) => total + distance, 0);
  return { shape, anchorIds: order.map(index => String(anchors[index].id)), distanceM, maximumLegDistanceM: Math.max(...legDistancesM) };
}

function isBetter(candidate, current) {
  if (!current) return true;
  return candidate.distanceM < current.distanceM || (candidate.distanceM === current.distanceM && candidate.anchorIds.join('|').localeCompare(current.anchorIds.join('|')) < 0);
}

function permutations(values) {
  if (values.length < 2) return [values];
  return values.flatMap((value, index) => permutations([...values.slice(0, index), ...values.slice(index + 1)]).map(rest => [value, ...rest]));
}

function segmentKey(first, second) {
  const points = [pointKey(first), pointKey(second)].sort();
  return points.join('|');
}

function pointKey(coordinate) {
  return coordinate.map(value => Number(value).toFixed(5)).join(',');
}

function validateMatrix(anchors, matrix) {
  if (!Array.isArray(anchors) || anchors.length < 3 || anchors.length > 5) throw new TypeError('Trail routing requires three to five anchors');
  if (!Array.isArray(matrix) || matrix.length !== anchors.length || matrix.some(row => !Array.isArray(row) || row.length !== anchors.length || row.some(value => !Number.isFinite(value) || value < 0))) throw new TypeError('Trail routing requires a complete distance matrix');
}
