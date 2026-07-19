import { FLOWERING_FAMILY_GENERA, FRUIT_FAMILY_GENERA, isFloweringFamily, isFruitFamily, isLargeRecordedTree } from './tree-categories.js';

const DEFAULTS = Object.freeze({
  cellSizeM: 70,
  minimumDensityTrees: 8,
  maximumDensityAreas: 160,
  coverageCellSizeM: 400,
  floweringTreesPerCell: 3,
  fruitTreesPerCell: 3,
  tallTreesPerCell: 2,
  largeTrunkTreesPerCell: 1,
  otherTreesPerCell: 2,
  maximumMeasuredTrees: 600,
  maximumTrees: 5500
});

export function selectTreeHighlights(trees, options = {}) {
  const settings = { ...DEFAULTS, ...options };
  const densityAreas = densityAreasFor(trees, settings).slice(0, settings.maximumDensityAreas);
  const coverageCells = coverageCellsFor(trees, settings);
  const measuredTrees = [...trees]
    .filter(isLargeRecordedTree)
    .sort((a, b) => measurementScore(b) - measurementScore(a) || String(a.id).localeCompare(String(b.id)))
    .slice(0, settings.maximumMeasuredTrees);
  const selectedIds = new Set();

  addCoverageRounds(selectedIds, coverageCells, settings.maximumTrees);
  for (const tree of measuredTrees) {
    if (selectedIds.size >= settings.maximumTrees) break;
    selectedIds.add(String(tree.id));
  }
  for (const area of densityAreas) {
    for (const id of area.memberTreeIds) {
      if (selectedIds.size >= settings.maximumTrees) break;
      selectedIds.add(id);
    }
  }

  return {
    method: 'geographic-category-coverage-density-and-size',
    treeIds: [...selectedIds].sort(),
    densityAreas,
    criteria: {
      coverageCellSizeM: settings.coverageCellSizeM,
      floweringFamilyGenera: [...FLOWERING_FAMILY_GENERA].sort(),
      fruitFamilyGenera: [...FRUIT_FAMILY_GENERA].sort(),
      densityCellSizeM: settings.cellSizeM,
      minimumDensityTrees: settings.minimumDensityTrees,
      recordedHeightM: 15,
      recordedDiameterCm: 100
    }
  };
}

function coverageCellsFor(trees, settings) {
  const cells = new Map();
  for (const tree of [...trees].sort(compareTreeIds)) {
    const key = cellKey(tree, settings.coverageCellSizeM);
    const members = cells.get(key) ?? [];
    members.push(tree);
    cells.set(key, members);
  }
  return [...cells.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, members]) => ({ id, trees: coverageTreesForCell(members, settings) }));
}

function coverageTreesForCell(trees, settings) {
  const selected = new Map();
  addRepresentatives(selected, trees.filter(isFloweringFamily), settings.floweringTreesPerCell);
  addRepresentatives(selected, trees.filter(isFruitFamily), settings.fruitTreesPerCell);
  addRepresentatives(selected, trees.filter(tree => Number(tree.heightM) >= 15), settings.tallTreesPerCell, measurementScore);
  addRepresentatives(selected, trees.filter(tree => Number(tree.diameterCm) >= 100), settings.largeTrunkTreesPerCell, measurementScore);
  addRepresentatives(selected, trees.filter(tree => !selected.has(String(tree.id))), settings.otherTreesPerCell);
  return [...selected.values()];
}

function addRepresentatives(selected, candidates, limit, score = (_tree) => 0) {
  if (limit <= 0) return;
  const ordered = [...candidates].sort((a, b) => score(b) - score(a) || compareTreeIds(a, b));
  const present = ordered.filter(tree => selected.has(String(tree.id)));
  let covered = present.length;
  const genera = new Set(present.map(tree => String(tree.genus).toUpperCase()));
  for (const tree of ordered) {
    if (covered >= limit) return;
    if (selected.has(String(tree.id))) continue;
    const genus = String(tree.genus).toUpperCase();
    if (genera.has(genus)) continue;
    selected.set(String(tree.id), tree);
    genera.add(genus);
    covered += 1;
  }
  for (const tree of ordered) {
    if (covered >= limit) return;
    if (selected.has(String(tree.id))) continue;
    selected.set(String(tree.id), tree);
    covered += 1;
  }
}

function addCoverageRounds(selectedIds, cells, maximumTrees) {
  const maximumDepth = Math.max(0, ...cells.map(cell => cell.trees.length));
  for (let depth = 0; depth < maximumDepth; depth += 1) {
    for (const cell of cells) {
      if (selectedIds.size >= maximumTrees) return;
      const tree = cell.trees[depth];
      if (tree) selectedIds.add(String(tree.id));
    }
  }
}

function densityAreasFor(trees, settings) {
  const cells = new Map();
  for (const tree of [...trees].sort((a, b) => String(a.id).localeCompare(String(b.id)))) {
    const key = cellKey(tree, settings.cellSizeM);
    const members = cells.get(key) ?? [];
    members.push(tree);
    cells.set(key, members);
  }
  return [...cells.entries()]
    .filter(([, members]) => members.length >= settings.minimumDensityTrees)
    .map(([id, members]) => ({
      id: `density-${id}`,
      anchor: centroid(members),
      radiusM: settings.cellSizeM,
      treeCount: members.length,
      memberTreeIds: members.map(tree => String(tree.id))
    }))
    .sort((a, b) => b.treeCount - a.treeCount || a.id.localeCompare(b.id));
}

function cellKey(point, cellSizeM) {
  const latitude = Number(point.latitude);
  const longitudeScale = 111_320 * Math.cos(latitude * Math.PI / 180);
  return `${Math.floor(Number(point.longitude) * longitudeScale / cellSizeM)}:${Math.floor(latitude * 111_320 / cellSizeM)}`;
}

function centroid(trees) {
  return trees.reduce((value, tree) => ({
    latitude: value.latitude + Number(tree.latitude) / trees.length,
    longitude: value.longitude + Number(tree.longitude) / trees.length
  }), { latitude: 0, longitude: 0 });
}

function measurementScore(tree) {
  return (Number(tree.heightM) || 0) + (Number(tree.diameterCm) || 0) / 100;
}

function compareTreeIds(a, b) {
  return String(a.id).localeCompare(String(b.id));
}
