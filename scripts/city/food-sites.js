import { CITY_ROOT, readJson, writeJson } from './pipeline.js';
import { vancouverFoodSitesAdapter } from './adapters/vancouver-food-sites.js';

export async function normalizeFoodSites(city = 'vancouver') {
  if (city !== 'vancouver') throw new Error(`No food-site adapter configured for ${city}`);
  const manifest = await readJson(`${CITY_ROOT(city)}/food-sites-source-manifest.json`);
  const snapshotPath = `${CITY_ROOT(city)}/${manifest.snapshot.path}`;
  const snapshot = await vancouverFoodSitesAdapter.readSnapshot(snapshotPath);
  if (snapshot.checksum !== manifest.snapshot.sha256) throw new Error('Pinned food-site snapshot checksum mismatch');
  const normalized = vancouverFoodSitesAdapter.normalize(snapshot.records);
  const coverage = { city, sourceDataset: manifest.dataset.id, sourceRecordsReported: snapshot.sourceCount, snapshotRecords: snapshot.records.length, acceptedRecords: normalized.foodSites.length, rejectedRecords: normalized.rejects.length, duplicateIds: normalized.rejects.filter(reject => reject.reason === 'duplicate-id').length, unknownReportedFoodTreeCounts: normalized.foodSites.filter(site => site.reportedFoodTreeCount === null).length, scope: manifest.snapshot.scope };
  await writeJson(`${CITY_ROOT(city)}/food-sites.json`, { sourceSnapshot: manifest.snapshot, foodSites: normalized.foodSites });
  await writeJson(`${CITY_ROOT(city)}/reports/food-sites-rejects.json`, { city, rejects: normalized.rejects });
  await writeJson(`${CITY_ROOT(city)}/reports/food-sites-coverage.json`, coverage);
  return { ...normalized, coverage, sourceSnapshot: manifest.snapshot };
}
