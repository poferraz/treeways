const DEFAULTS = Object.freeze({
  cellSizeM: 70,
  minimumDensityTrees: 8,
  maximumDensityAreas: 160,
  maximumMeasuredTrees: 400,
  maximumTrees: 3500
});

export function selectTreeHighlights(trees, options = {}) {
  const settings = { ...DEFAULTS, ...options };
  const densityAreas = densityAreasFor(trees, settings).slice(0, settings.maximumDensityAreas);
  const measuredTrees = [...trees]
    .filter(tree => Number(tree.heightM) >= 20 || Number(tree.diameterCm) >= 100)
    .sort((a, b) => measurementScore(b) - measurementScore(a) || String(a.id).localeCompare(String(b.id)))
    .slice(0, settings.maximumMeasuredTrees);
  const selectedIds = new Set();

  for (const area of densityAreas) {
    for (const id of area.memberTreeIds) {
      if (selectedIds.size >= settings.maximumTrees) break;
      selectedIds.add(id);
    }
  }
  for (const tree of measuredTrees) {
    if (selectedIds.size >= settings.maximumTrees) break;
    selectedIds.add(String(tree.id));
  }

  return {
    method: 'density-areas-and-recorded-size',
    treeIds: [...selectedIds].sort(),
    densityAreas,
    criteria: {
      densityCellSizeM: settings.cellSizeM,
      minimumDensityTrees: settings.minimumDensityTrees,
      recordedHeightM: 20,
      recordedDiameterCm: 100
    }
  };
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
