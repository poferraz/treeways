import { distanceMeters } from '../data/spatial-index.js';

export const CLUSTER_DEFAULTS = Object.freeze({
  radiusM: 70,
  minimumTrees: 8,
  minimumThemeTrees: 3,
  minimumStopSeparationM: 160,
  maximumStopConnectionM: 1500,
  minimumStops: 3,
  maximumStops: 5
});

export const THEMES = Object.freeze({
  allTrees: theme('tree-rich-area', 'Tree-rich areas', () => true),
  cherryBlossoms: theme('cherry-blossoms', 'Cherry blossoms', tree => normalized(tree.commonName).includes('CHERRY')),
  maples: theme('maples', 'Maples', tree => normalized(tree.genus) === 'ACER'),
  fruitTreeFamilies: theme('fruit-tree-families', 'Fruit-tree families', tree => ['MALUS', 'PYRUS', 'PRUNUS', 'FICUS'].includes(normalized(tree.genus))),
  recordedSize: theme('recorded-size', 'Recorded-size highlights', tree => Number(tree.heightM) >= 20 || Number(tree.diameterCm) >= 100)
});

export function buildDensityClusters(trees, /** @type {Record<string, any>} */ options = {}) {
  const settings = { ...CLUSTER_DEFAULTS, ...options };
  const selectedTheme = options.theme ?? THEMES.allTrees;
  validateInputs(trees, settings, selectedTheme);
  const sortedTrees = [...trees].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const buckets = createBuckets(sortedTrees, settings.radiusM);
  const candidates = [];

  for (const anchorCandidate of sortedTrees) {
    const members = nearbyTrees(anchorCandidate, buckets, settings.radiusM);
    const themeMembers = members.filter(selectedTheme.matches);
    if (members.length < settings.minimumTrees || themeMembers.length < settings.minimumThemeTrees) continue;
    candidates.push(createCluster(members, themeMembers, selectedTheme, settings.radiusM));
  }

  return suppressOverlappingClusters(candidates, settings.radiusM);
}

export function selectTrailClusters(clusters, /** @type {Record<string, any>} */ options = {}) {
  const settings = { ...CLUSTER_DEFAULTS, ...options };
  const ranked = [...clusters].sort(compareClusters);
  const groups = ranked.map(seed => growConnectedGroup(seed, ranked, settings)).filter(group => group.length >= settings.minimumStops);
  return groups.sort(compareGroups)[0] ?? [];
}

function growConnectedGroup(seed, ranked, settings) {
  const selected = [seed];
  while (selected.length < settings.maximumStops) {
    const next = ranked.find(cluster => !selected.includes(cluster)
      && selected.every(item => distanceMeters(item.anchor, cluster.anchor) >= settings.minimumStopSeparationM)
      && selected.some(item => distanceMeters(item.anchor, cluster.anchor) <= settings.maximumStopConnectionM));
    if (!next) break;
    selected.push(next);
  }
  return selected.sort(compareClusters);
}

function compareGroups(a, b) {
  const score = group => group.reduce((value, cluster) => ({
    density: value.density + cluster.totalTreeCount,
    themes: value.themes + cluster.themeTreeCount,
    diversity: value.diversity + cluster.diversityCount
  }), { density: 0, themes: 0, diversity: 0 });
  const first = score(a);
  const second = score(b);
  return second.density - first.density
    || second.themes - first.themes
    || second.diversity - first.diversity
    || a.map(cluster => cluster.id).join('|').localeCompare(b.map(cluster => cluster.id).join('|'));
}

function createBuckets(trees, radiusM) {
  const buckets = new Map();
  for (const tree of trees) {
    const key = cellKey(tree, radiusM);
    const members = buckets.get(key) ?? [];
    members.push(tree);
    buckets.set(key, members);
  }
  return buckets;
}

function nearbyTrees(anchor, buckets, radiusM) {
  const [cellX, cellY] = cellCoordinates(anchor, radiusM);
  const nearby = [];
  for (let x = cellX - 1; x <= cellX + 1; x += 1) {
    for (let y = cellY - 1; y <= cellY + 1; y += 1) {
      for (const tree of buckets.get(`${x}:${y}`) ?? []) {
        if (distanceMeters(anchor, tree) <= radiusM) nearby.push(tree);
      }
    }
  }
  return nearby.sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

function createCluster(members, themeMembers, selectedTheme, radiusM) {
  const centroid = members.reduce((value, tree) => ({
    latitude: value.latitude + Number(tree.latitude) / members.length,
    longitude: value.longitude + Number(tree.longitude) / members.length
  }), { latitude: 0, longitude: 0 });
  const anchorTree = [...members].sort((a, b) => distanceMeters(centroid, a) - distanceMeters(centroid, b) || String(a.id).localeCompare(String(b.id)))[0];
  const memberTreeIds = members.map(tree => String(tree.id));
  const themeTreeIds = themeMembers.map(tree => String(tree.id));
  const diversityCount = new Set(members.map(tree => `${normalized(tree.genus)}:${normalized(tree.species)}:${normalized(tree.commonName)}`)).size;
  return {
    id: `cluster-${selectedTheme.id}-${stableHash(memberTreeIds.join('|'))}`,
    radiusM,
    anchor: { treeId: String(anchorTree.id), latitude: Number(anchorTree.latitude), longitude: Number(anchorTree.longitude) },
    memberTreeIds,
    themeTreeIds,
    totalTreeCount: memberTreeIds.length,
    themeTreeCount: themeTreeIds.length,
    diversityCount,
    locationLabel: locationLabel(anchorTree.address),
    score: { density: memberTreeIds.length, themeMatches: themeTreeIds.length, diversity: diversityCount }
  };
}

function suppressOverlappingClusters(candidates, radiusM) {
  const selected = [];
  const signatures = new Set();
  for (const candidate of [...candidates].sort(compareClusters)) {
    const signature = candidate.memberTreeIds.join('|');
    if (signatures.has(signature)) continue;
    const overlaps = selected.some(cluster => distanceMeters(cluster.anchor, candidate.anchor) < radiusM || overlapRatio(cluster.memberTreeIds, candidate.memberTreeIds) >= 0.6);
    if (overlaps) continue;
    signatures.add(signature);
    selected.push(candidate);
  }
  return selected;
}

function compareClusters(a, b) {
  return b.totalTreeCount - a.totalTreeCount || b.themeTreeCount - a.themeTreeCount || b.diversityCount - a.diversityCount || a.id.localeCompare(b.id);
}

function overlapRatio(first, second) {
  const ids = new Set(first);
  const overlap = second.filter(id => ids.has(id)).length;
  return overlap / Math.min(first.length, second.length);
}

function cellCoordinates(point, cellSizeM) {
  const latitude = Number(point.latitude);
  const longitude = Number(point.longitude);
  const longitudeScale = 111_320 * Math.cos(latitude * Math.PI / 180);
  return [Math.floor(longitude * longitudeScale / cellSizeM), Math.floor(latitude * 111_320 / cellSizeM)];
}

function cellKey(point, cellSizeM) {
  return cellCoordinates(point, cellSizeM).join(':');
}

function locationLabel(address) {
  const value = normalized(address);
  const match = value.match(/^(\d+)\s+(?:([NSEW])\s+)?(.+)$/);
  if (!match) return value ? titleWords(value) : 'Location recorded by the City';
  const block = Math.floor(Number(match[1]) / 100) * 100;
  const direction = { N: 'North', S: 'South', E: 'East', W: 'West' }[match[2]];
  const street = titleWords(match[3].replace(/\bAV\b/g, 'Avenue').replace(/\bST\b/g, 'Street').replace(/\bRD\b/g, 'Road').replace(/\bDR\b/g, 'Drive'));
  return `${block} block of ${direction ? `${direction} ` : ''}${street}`;
}

function titleWords(value) {
  return value.toLowerCase().replace(/\b\w/g, character => character.toUpperCase());
}

function theme(id, displayName, matches) {
  return Object.freeze({ id, displayName, matches });
}

function normalized(value) {
  return String(value ?? '').trim().toUpperCase();
}

function stableHash(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function validateInputs(trees, settings, selectedTheme) {
  if (!Array.isArray(trees)) throw new TypeError('Cluster trees must be an array');
  if (!selectedTheme || typeof selectedTheme.matches !== 'function') throw new TypeError('Cluster theme requires a matcher');
  for (const field of ['radiusM', 'minimumTrees', 'minimumThemeTrees']) {
    if (!Number.isFinite(settings[field]) || settings[field] <= 0) throw new TypeError(`Invalid cluster ${field}`);
  }
}
