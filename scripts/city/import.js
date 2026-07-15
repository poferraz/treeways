import { cityArgument } from './pipeline.js';
import { normalizeCity } from './normalize.js';
import { normalizeFoodSites } from './food-sites.js';

const city = cityArgument();
const { coverage } = await normalizeCity(city);
const foodSites = await normalizeFoodSites(city);
console.log(`Imported ${coverage.acceptedRecords}/${coverage.snapshotRecords} pinned ${city} tree records and ${foodSites.coverage.acceptedRecords}/${foodSites.coverage.snapshotRecords} food sites.`);
