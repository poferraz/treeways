const metersPerDegree = 111_320;
export function createSpatialIndex(trees) { return [...trees]; }
export function distanceMeters(from, tree) { const x = (tree.longitude - from.longitude) * metersPerDegree * Math.cos(((tree.latitude + from.latitude) / 2) * Math.PI / 180); const y = (tree.latitude - from.latitude) * metersPerDegree; return Math.hypot(x, y); }
export function nearest(index, point) { return index.reduce((best, tree) => !best || distanceMeters(point, tree) < best.distance ? { tree, distance: distanceMeters(point, tree) } : best, null); }
export function queryBounds(index, [west, south, east, north]) { return index.filter(tree => tree.longitude >= west && tree.longitude <= east && tree.latitude >= south && tree.latitude <= north); }
