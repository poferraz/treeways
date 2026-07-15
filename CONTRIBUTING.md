# Contributing

Use conventional commits. City builds are deterministic and offline by default:

```sh
npm run city:import -- my-city
npm run city:build -- my-city
npm run city:validate -- my-city
npm run city:verify
```

`npm run city:refresh -- my-city` is the only network retrieval command. Review the source licence, provenance, snapshot scope, checksum, coverage/reject reports, generated diff, and deterministic build result before committing refreshed inputs. Do not add name-based edibility heuristics or imply safety or harvesting permission from municipal data.
