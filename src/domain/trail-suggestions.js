import { distanceMeters } from '../data/spatial-index.js';
import { classifyGiant } from './giant.js';

export const DISTANCE_BANDS = Object.freeze({
  small: { label: 'Small', maximumKm: 3 },
  medium: { label: 'Medium', maximumKm: 5 },
  large: { label: 'Large', maximumKm: 8 }
});

const DEFINITIONS = [
  {
    id: 'mount-pleasant-prunus', name: 'Mount Pleasant Prunus', neighbourhood: 'Mount Pleasant',
    theme: 'Related species', size: 'small', mode: 'walking', center: point(49.2635, -123.1015), radiusKm: 2.2,
    match: tree => tree.genus === 'PRUNUS',
    description: 'Compare cherries, plums, and their close relatives recorded within the same neighbourhood.'
  },
  {
    id: 'grandview-flowering-families', name: 'Grandview Flowering Families', neighbourhood: 'Grandview-Woodland',
    theme: 'Similar appearance', size: 'small', mode: 'walking', center: point(49.2716, -123.0692), radiusKm: 2,
    match: tree => ['PRUNUS', 'MALUS', 'MAGNOLIA', 'CORNUS'].includes(tree.genus),
    description: 'A comparison walk through tree families known for ornamental flowers; exact bloom timing is not recorded.'
  },
  {
    id: 'west-end-giants', name: 'West End Giants', neighbourhood: 'West End',
    theme: 'Measured giants', size: 'medium', mode: 'walking', center: point(49.286, -123.135), radiusKm: 3.1,
    match: tree => classifyGiant(tree).isGiant,
    description: 'Measured tall trees selected from City records, ordered as a neighbourhood-scale discovery route.'
  },
  {
    id: 'kerrisdale-fruit-tree-families', name: 'Kerrisdale Fruit-Tree Families', neighbourhood: 'Kerrisdale',
    theme: 'Fruit-tree families', size: 'small', mode: 'walking', center: point(49.2347, -123.1553), radiusKm: 2.4,
    match: tree => ['MALUS', 'PYRUS', 'PRUNUS', 'FICUS'].includes(tree.genus),
    description: 'Look at the forms of apple, pear, plum, cherry, and fig relatives. This is a viewing route, not a harvesting guide.'
  },
  {
    id: 'shaughnessy-big-trunks', name: 'Shaughnessy Big Trunks', neighbourhood: 'Shaughnessy',
    theme: 'Large diameter', size: 'medium', mode: 'walking', center: point(49.246, -123.139), radiusKm: 3,
    match: tree => Number(tree.diameterCm) >= 100,
    description: 'Street trees with notably large recorded trunk diameters, drawn from municipal measurements.'
  },
  {
    id: 'kitsilano-kwanzan', name: 'Kitsilano Kwanzan Rows', neighbourhood: 'Kitsilano',
    theme: 'Exact species', size: 'small', mode: 'walking', center: point(49.2682, -123.1648), radiusKm: 2.8,
    match: tree => tree.commonName === 'KWANZAN FLOWERING CHERRY',
    description: 'One named cherry cultivar across nearby streets, useful for learning how the same tree changes block by block.'
  },
  {
    id: 'hastings-maple-cousins', name: 'Hastings Maple Cousins', neighbourhood: 'Hastings-Sunrise',
    theme: 'Related species', size: 'medium', mode: 'walking', center: point(49.2803, -123.0414), radiusKm: 3,
    match: tree => tree.genus === 'ACER',
    description: 'A neighbourhood comparison of maples: related trees with different crowns, leaves, and street presence.'
  },
  {
    id: 'killarney-evergreen-giants', name: 'Killarney Evergreen Giants', neighbourhood: 'Killarney',
    theme: 'Measured giants', size: 'medium', mode: 'walking', center: point(49.2248, -123.042), radiusKm: 3.2,
    match: tree => ['THUJA', 'CEDRUS', 'PSEUDOTSUGA', 'CRYPTOMERIA'].includes(tree.genus) && classifyGiant(tree).isGiant,
    description: 'Tall evergreen relatives chosen from recorded measurements in southeast Vancouver.'
  },
  {
    id: 'prunus-across-vancouver', name: 'Prunus Across Vancouver', neighbourhood: 'East to central Vancouver',
    theme: 'Similar appearance', size: 'large', mode: 'driving', center: point(49.259, -123.085), radiusKm: 5.5,
    match: tree => tree.genus === 'PRUNUS',
    description: 'A wider comparison of cherries and plums for a drive with short stops. Bloom colour and timing need field confirmation.'
  },
  {
    id: 'vancouver-measured-giants', name: 'Vancouver Measured Giants', neighbourhood: 'Central Vancouver',
    theme: 'Measured giants', size: 'large', mode: 'driving', center: point(49.258, -123.115), radiusKm: 5.5,
    match: tree => Number(tree.heightM) >= 25 || Number(tree.diameterCm) >= 150,
    description: 'A cross-neighbourhood sampler of exceptional height or trunk diameter records.'
  }
];

export function buildTrailSuggestions(trees) {
  return DEFINITIONS.map(definition => buildSuggestion(definition, trees)).filter(Boolean);
}

function buildSuggestion(definition, trees) {
  const candidates = trees
    .filter(tree => definition.match(tree) && distanceMeters(definition.center, tree) <= definition.radiusKm * 1000)
    .sort((a, b) => distanceMeters(definition.center, a) - distanceMeters(definition.center, b) || a.id.localeCompare(b.id));
  if (candidates.length < 4) return null;
  const waypoints = spreadWaypoints(candidates, definition.center, 6, DISTANCE_BANDS[definition.size].maximumKm);
  const spanKm = pathDistance(waypoints) / 1000;
  return {
    ...definition,
    waypoints,
    spanKm,
    distanceBand: DISTANCE_BANDS[definition.size],
    status: 'suggested',
    provenance: 'Generated from City of Vancouver public-tree records; route order is not human reviewed.'
  };
}

function spreadWaypoints(candidates, center, count, maximumKm) {
  const selected = [candidates[0]];
  while (selected.length < count && selected.length < candidates.length) {
    const pool = candidates.slice(0, Math.min(candidates.length, 900));
    const next = pool
      .filter(tree => !selected.some(item => item.id === tree.id))
      .filter(tree => pathDistance(nearestOrder([...selected, tree])) <= maximumKm * 1000)
      .map(tree => ({ tree, score: Math.min(...selected.map(item => distanceMeters(item, tree))) - distanceMeters(center, tree) * 0.08 }))
      .sort((a, b) => b.score - a.score || a.tree.id.localeCompare(b.tree.id))[0]?.tree;
    if (!next) break;
    selected.push(next);
  }
  return nearestOrder(selected);
}

function nearestOrder(trees) {
  const remaining = [...trees];
  const ordered = [remaining.shift()];
  while (remaining.length) {
    const current = ordered.at(-1);
    remaining.sort((a, b) => distanceMeters(current, a) - distanceMeters(current, b) || a.id.localeCompare(b.id));
    ordered.push(remaining.shift());
  }
  return ordered;
}

function pathDistance(trees) {
  return trees.slice(1).reduce((sum, tree, index) => sum + distanceMeters(trees[index], tree), 0);
}

function point(latitude, longitude) { return { latitude, longitude }; }

export function directionsUrl(trail, mode = trail.mode) {
  const [origin, ...rest] = trail.waypoints;
  const destination = rest.at(-1) ?? origin;
  const middle = rest.slice(0, -1);
  const params = new URLSearchParams({
    api: '1',
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
    travelmode: mode === 'driving' ? 'driving' : 'walking'
  });
  if (middle.length) params.set('waypoints', middle.map(tree => `${tree.latitude},${tree.longitude}`).join('|'));
  return `https://www.google.com/maps/dir/?${params}`;
}

export function trailGeometry(trail) {
  return { type: 'LineString', coordinates: trail.waypoints.map(tree => [tree.longitude, tree.latitude]) };
}
