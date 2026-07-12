# Urban Canopy Engine

A map-first field guide for urban trees. It turns municipal street-tree records into a browsable, seasonal map anyone can walk with.

Vancouver is the first city pack; the engine is built to add more cities without touching core modules.

## What it does

- Browse curated and municipal trees on a GPU-accelerated MapLibre map
- Filter by edible fruit, blossoms, current bloom, or current harvest windows
- Build custom walking routes between trees with OSRM-powered directions
- Works offline after the first visit thanks to a versioned service worker
- Screen-reader friendly with live region announcements and keyboard controls

## Stack

- Vanilla JavaScript modules + Vite
- MapLibre GL for rendering
- Web Worker for city-pack search and spatial indexing
- Vitest for unit tests, Playwright for e2e, accessibility, visual, and offline tests
- Lighthouse CI for performance budgets

## Quick start

```sh
npm install
npm run city:build
npm run dev
```

Then open the local URL from Vite.

## Useful commands

| Command | What it runs |
|---|---|
| `npm run dev` | Local development server |
| `npm run build` | Production build + service-worker version injection |
| `npm run test:unit` | Unit tests with Vitest |
| `npm run test:e2e` | Core Playwright e2e suite |
| `npm run test:a11y` | Accessibility checks |
| `npm run test:offline` | Offline service-worker checks |
| `npm run check` | TypeScript check over JS sources |
| `npm run check:bundle` | Bundle-size budget check |

Run `npm run test:unit`, `npm run check`, `npm run build`, and `npm run check:bundle` before submitting changes.

## Adding a city

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). The short version:

1. Add an adapter in `scripts/city/adapters/`
2. Run `npm run city:import -- my-city source.csv`
3. Run `npm run city:validate -- my-city` and `npm run city:build -- my-city`
4. Add the manifest to `public/cities/`

## Data and attribution

City data and media have independent licences. See each city pack's `LICENSE-DATA.md` and its attribution block.

## Contributing

Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) and [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md). We use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`.

## License

[MIT](./LICENSE)
