import { normalizeTree } from '../domain/tree.js';

export function decodeTreePack(pack) {
  if (!pack?.species || !pack?.trees) throw new TypeError('Invalid tree pack');
  return pack.trees.map(([id, lat, lng, speciesIndex, heightM, diameterCm, address]) => {
    const species = pack.species[speciesIndex];
    if (!species) throw new TypeError(`Unknown species index ${speciesIndex}`);
    return normalizeTree({ id, lat, lng, name: species.name, genus: species.genus, species: species.species, type: species.type, tags: species.tags, bloom: species.bloom, harvest: species.harvest, usefulness: species.usefulness, heightM, diameterCm, address, source: 'City of Vancouver', curated: true });
  });
}

export function encodeTreePack(trees) { return JSON.stringify(trees); }
