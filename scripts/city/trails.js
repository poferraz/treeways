import { buildDensityClusters, selectTrailClusters, THEMES, CLUSTER_DEFAULTS } from '../../src/domain/trail-clusters.js';

export const CANDIDATE_GENERATOR_VERSION = 'treeways-density-clusters-v1';

const PILOT_AREAS = Object.freeze([
  { id: 'mount-pleasant', name: 'Mount Pleasant', themeId: 'cherry-blossoms', bounds: [-123.117, 49.256, -123.077, 49.272] },
  { id: 'grandview-woodland', name: 'Grandview-Woodland', themeId: 'fruit-tree-families', bounds: [-123.078, 49.262, -123.052, 49.293] },
  { id: 'kitsilano', name: 'Kitsilano', themeId: 'maples', bounds: [-123.185, 49.257, -123.145, 49.28] }
]);

const PILOT_THEMES = Object.freeze([
  THEMES.cherryBlossoms,
  THEMES.maples,
  THEMES.fruitTreeFamilies,
  THEMES.recordedSize
]);

export function generateCandidateReviewPacket({ city, sourceArtifact, species = [], trees }) {
  const records = trees.map(tuple => treeRecord(tuple, species));
  const candidates = PILOT_AREAS.map(area => candidateForArea(area, records)).filter(Boolean);
  return {
    schemaVersion: 2,
    status: 'NOT HUMAN REVIEWED',
    candidateGeneratorVersion: CANDIDATE_GENERATOR_VERSION,
    sourceArtifact,
    methodology: {
      priority: ['overall public-tree density', 'theme matches', 'recorded diversity', 'supported measurements'],
      clusterRadiusM: CLUSTER_DEFAULTS.radiusM,
      minimumClusterTrees: CLUSTER_DEFAULTS.minimumTrees,
      minimumThemeTrees: CLUSTER_DEFAULTS.minimumThemeTrees,
      clusterStops: { minimum: CLUSTER_DEFAULTS.minimumStops, maximum: CLUSTER_DEFAULTS.maximumStops },
      routeStatus: 'requires pinned foot-walking routing before review'
    },
    unsupportedClaims: ['safety', 'accessibility', 'pedestrian plausibility', 'right of access', 'edibility', 'harvesting permission', 'live bloom', 'live fruit'],
    requiredHumanDecisions: ['Approve or reject each routed pilot.', 'Review cluster membership, path shape, order, name, narrative, limitations, reviewer identity, and review date.'],
    candidates
  };
}

function candidateForArea(area, records) {
  const localTrees = records.filter(tree => inBounds(tree, area.bounds));
  const byId = new Map(localTrees.map(tree => [tree.id, tree]));
  const densityClusters = buildDensityClusters(localTrees, { theme: THEMES.allTrees });
  const themedOptions = PILOT_THEMES.map(theme => {
    const eligibleClusters = densityClusters.map(cluster => withTheme(cluster, theme, byId)).filter(cluster => cluster.themeTreeCount >= CLUSTER_DEFAULTS.minimumThemeTrees);
    const clusters = selectTrailClusters(eligibleClusters);
    return { theme, clusters, score: clusters.reduce((total, cluster) => total + cluster.totalTreeCount * 100 + cluster.themeTreeCount * 10 + cluster.diversityCount, 0) };
  }).filter(option => option.clusters.length >= CLUSTER_DEFAULTS.minimumStops)
    .sort((a, b) => b.score - a.score || a.theme.id.localeCompare(b.theme.id));
  const selected = themedOptions.find(option => option.theme.id === area.themeId) ?? themedOptions[0];
  if (!selected) return null;
  return {
    id: `candidate-${area.id}-${selected.theme.id}`,
    neighbourhoodId: area.id,
    neighbourhoodName: area.name,
    theme: { id: selected.theme.id, displayName: selected.theme.displayName },
    status: 'NOT HUMAN REVIEWED',
    clusterStops: selected.clusters,
    routing: { status: 'not-routed', requiredProfile: 'foot-walking' },
    unresolved: { accessibility: 'unknown', pedestrianPlausibility: 'unknown', safety: 'unknown', rightOfAccess: 'unknown', liveConditions: 'unknown' }
  };
}

function withTheme(cluster, selectedTheme, trees) {
  const themeTreeIds = cluster.memberTreeIds.filter(id => selectedTheme.matches(trees.get(id)));
  return {
    ...cluster,
    themeTreeIds,
    themeTreeCount: themeTreeIds.length,
    score: { ...cluster.score, themeMatches: themeTreeIds.length }
  };
}

function inBounds(tree, bounds) {
  return tree.longitude >= bounds[0] && tree.longitude <= bounds[2] && tree.latitude >= bounds[1] && tree.latitude <= bounds[3];
}

function treeRecord(tuple, species) {
  const metadata = species[tuple[3]] ?? {};
  return {
    id: String(tuple[0]),
    latitude: Number(tuple[1]),
    longitude: Number(tuple[2]),
    commonName: metadata.commonName ?? '',
    genus: metadata.genus ?? '',
    species: metadata.species ?? '',
    heightM: tuple[4],
    diameterCm: tuple[5],
    canopySpreadM: tuple[6],
    address: tuple[7]
  };
}
