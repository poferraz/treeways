# Adding a city

Add a named adapter under `scripts/city/adapters/`, a source manifest plus pinned raw snapshot under `data/cities/<city>/`, and a versioned public manifest under `public/cities/<city>/`. The adapter must account for every snapshot record, preserve missing measurements as null, reject invalid coordinates/units and duplicates, and generate machine-readable reject and coverage reports.

```sh
npm run city:refresh -- my-city # explicit network retrieval only
npm run city:import -- my-city  # pinned snapshot only
npm run city:build -- my-city
npm run city:validate -- my-city
```

Do not introduce city-specific branches in engine modules. Every source manifest must record publisher, licence, source URL, snapshot checksum, retrieval time, transform version, and scope. Species, evidence and trails belong in the versioned city artifact; do not emit a redundant standalone species file.
