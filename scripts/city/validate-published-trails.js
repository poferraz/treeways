import { validatePublishedTrailPacks } from './publish-reviewed-trails.js';

const result = await validatePublishedTrailPacks(process.argv[2] ?? 'vancouver');
console.log(`Validated ${result.trails} published trails, ${result.memberships} memberships, and ${result.highlightRecords} startup records.`);
