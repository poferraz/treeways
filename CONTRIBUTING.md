# Contributing

Use conventional commits. With Node.js 24 and npm, run the following checks from a fresh checkout.

```sh
npm ci
npm run city:validate-published
npm run check
npm run test:unit
npm run build
npm run check:bundle
```

The published-trail check compares the reviewed source with both committed city packs. See the [trail review guide](docs/trail-review-guide.md) before changing the catalogue.

Rebuilding Vancouver from municipal source data requires the local source manifests and pinned snapshots under `data/cities/vancouver/`. With those inputs available, `city:import`, `city:build`, `city:validate` and `city:verify` work offline. A source refresh downloads City data. Routing pilots calls OpenRouteService.

Review the source licence, provenance, snapshot scope, checksums, coverage, rejected records and generated changes before publishing a refreshed pack. Claims about edibility or seasonal timing require reviewed botanical evidence. Municipal records alone cannot establish safety or harvesting permission. [Data provenance](docs/data-provenance.md)
