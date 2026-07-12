const searchable = tree => `${tree.commonName} ${tree.genus} ${tree.species} ${tree.address ?? ''}`.toLocaleLowerCase();
export function createSearchIndex(trees) { return trees.map(tree => ({ tree, text: searchable(tree) })); }
export function search(index, query, limit = 20) { const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean); return terms.length ? index.filter(entry => terms.every(term => entry.text.includes(term))).slice(0, limit).map(entry => entry.tree) : []; }
