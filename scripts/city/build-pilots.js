import { readFile } from 'node:fs/promises';
import { cityArgument, CITY_ROOT, PUBLIC_CITY_ROOT, invokedDirectly, readJson, sha256, writeJson } from './pipeline.js';
import { generateCandidateReviewPacket } from './trails.js';

export async function buildPilotCandidates(city = cityArgument()) {
  const manifest = await readJson(`${PUBLIC_CITY_ROOT(city)}/manifest.json`);
  const artifactPath = `${PUBLIC_CITY_ROOT(city)}/${manifest.data.artifact}`;
  const artifactBytes = await readFile(artifactPath);
  const artifact = JSON.parse(artifactBytes.toString('utf8'));
  const packet = generateCandidateReviewPacket({
    city,
    sourceArtifact: {
      city,
      artifact: manifest.data.artifact,
      sha256: sha256(artifactBytes),
      sourceSnapshotSha256: artifact.sourceSnapshot.sha256
    },
    species: artifact.species,
    trees: artifact.trees
  });
  await writeJson(`${CITY_ROOT(city)}/trail-pilots.json`, packet);
  return packet;
}

if (invokedDirectly(import.meta.url)) {
  const packet = await buildPilotCandidates();
  console.log(`Built ${packet.candidates.length} unrouted density-first pilot candidates.`);
}
