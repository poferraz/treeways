export const FLOWERING_FAMILY_GENERA = Object.freeze(['PRUNUS', 'MALUS', 'MAGNOLIA', 'CORNUS']);
export const FRUIT_FAMILY_GENERA = Object.freeze(['MALUS', 'PYRUS', 'PRUNUS', 'FICUS']);

const FLOWERING_GENERA = new Set(FLOWERING_FAMILY_GENERA);
const FRUIT_GENERA = new Set(FRUIT_FAMILY_GENERA);

export function isFloweringFamily(tree) {
  return FLOWERING_GENERA.has(String(tree.genus).toUpperCase());
}

export function isFruitFamily(tree) {
  return FRUIT_GENERA.has(String(tree.genus).toUpperCase());
}

export function isLargeRecordedTree(tree) {
  return Number(tree.heightM) >= 15 || Number(tree.diameterCm) >= 100;
}

export function treeMarkerCategory(tree) {
  if (['flower', 'fruit', 'both'].includes(tree.type)) return tree.type;
  const flowering = isFloweringFamily(tree);
  const fruit = isFruitFamily(tree);
  if (flowering && fruit) return 'both';
  if (flowering) return 'flower';
  if (fruit) return 'fruit';
  if (isLargeRecordedTree(tree)) return 'large';
  return 'other';
}

export function treeCategoryLabel(tree) {
  return {
    both: 'Flowering + fruit family',
    flower: 'Flowering family',
    fruit: 'Fruit family',
    large: 'Large recorded tree',
    other: 'City tree'
  }[treeMarkerCategory(tree)];
}

export function selectCategoryBalancedTrees(trees, limit = 8, candidateLimit = 80) {
  const nearby = [...trees]
    .sort((a, b) => Number(a.distance) - Number(b.distance) || String(a.id).localeCompare(String(b.id)))
    .slice(0, candidateLimit);
  const categories = ['both', 'flower', 'fruit', 'large', 'other'];
  const buckets = new Map(categories.map(category => [category, nearby.filter(tree => treeMarkerCategory(tree) === category)]));
  const selected = [];
  let depth = 0;
  while (selected.length < limit) {
    let added = false;
    for (const category of categories) {
      const tree = buckets.get(category)[depth];
      if (!tree) continue;
      selected.push(tree);
      added = true;
      if (selected.length >= limit) break;
    }
    if (!added) break;
    depth += 1;
  }
  return selected;
}
