# Contributing

Use conventional commits. Add a city by creating its manifest and adapter, then run:

```sh
npm run city:import -- my-city source.csv
npm run city:validate -- my-city
npm run city:build -- my-city
npm run dev -- --city=my-city
```

Do not introduce city-specific branches in engine modules.
