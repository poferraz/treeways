import { cityArgument, PUBLIC_CITY_ROOT, invokedDirectly, jsonBytes, readJson, sha256, writeJson } from './pipeline.js';
import { validateTreePack } from '../../src/data/city-schema.js';
import { selectTreeHighlights } from '../../src/domain/tree-highlights.js';
import { composeHighlightArtifact } from './build-pack.js';

export async function buildHighlightPack(city = cityArgument()) {
  const manifest = await readJson(`${PUBLIC_CITY_ROOT(city)}/manifest.json`);
  const artifact = await readJson(`${PUBLIC_CITY_ROOT(city)}/${manifest.data.artifact}`);
  const treeRecords = validateTreePack(artifact);
  const selection = selectTreeHighlights(treeRecords);
  const highlights = composeHighlightArtifact(artifact, selection);
  await writeJson(`${PUBLIC_CITY_ROOT(city)}/${manifest.data.highlightsArtifact}`, highlights);
  return {
    city,
    artifact: manifest.data.highlightsArtifact,
    records: highlights.trees.length,
    sha256: sha256(jsonBytes(highlights)),
    method: selection.method
  };
}

if (invokedDirectly(import.meta.url)) {
  const generated = await buildHighlightPack();
  console.log(`Built ${generated.records} startup highlights into ${generated.artifact} (${generated.sha256}).`);
}
