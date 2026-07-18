# Treeways

Treeways turns Vancouver's public tree inventory into neighbourhood discovery
walks. It starts with a clean set of interesting, density-led tree highlights;
visitors can turn on the complete public inventory when they want it.

Vancouver is the first city. The product and city-pack contract are designed so
future cities can be added without rebuilding the core experience.

## Try the product

Production: <https://treeways.vercel.app>

Three routed launch pilots are prepared for Mount Pleasant, Grandview-Woodland,
and Kitsilano. They remain outside the public catalogue until Paulo reviews them.
Each walk connects three to five tree-rich areas and may be a loop or
point-to-point route. Small, medium, and large bands use actual OpenRouteService
walking distance, capped at 3 km, 5 km, and 8 km.

## What works

- Start with 3,500 deterministic density and recorded-size highlights.
- Turn on all 185,307 City of Vancouver public-tree records from the map control.
- Search by common name, scientific name, or address.
- Filter fruit-tree families, ornamental-flowering families, measured giants,
  and trees with large recorded trunk diameters.
- Browse only human-reviewed, walking-only neighbourhood trails.
- See actual routed geometry, distance, loop/point-to-point shape, tree-rich area
  counts, and the individual public-tree records around each area.
- Build an ordered personal stop list and open current walking directions in
  Google Maps.
- Use the same core flows with a keyboard or structured list, without relying on
  map gestures.
- Revisit cached application and tree data after the first online visit.

## Evidence and limitations

Tree records come from the City of Vancouver Open Data public-trees dataset
under the Open Government Licence – Vancouver. Exact provenance and the city
pack licence are in [docs/data-provenance.md](docs/data-provenance.md) and
[public/cities/vancouver/LICENSE-DATA.md](public/cities/vancouver/LICENSE-DATA.md).

Treeways does not claim that a route is safe, accessible, open, or pedestrian
reviewed. It does not claim that fruit is edible, available, or permitted to be
harvested. The July 12 city snapshot contains no supported bloom or harvest
timing records, so the interface says timing is unknown. Fruit-tree and flowering
tree labels describe botanical families or municipal names, not current field
conditions.

Generated and ORS-routed pilots stay hidden until Paulo Ferraz approves them.
The standalone review artifact and sign-off procedure are documented in
[docs/trail-review-guide.md](docs/trail-review-guide.md).

## Local development

Requirements: Node.js 20+ and npm.

```sh
git clone https://github.com/poferraz/treeways.git
cd treeways
npm ci
npm run dev
```

Routing the three review pilots also requires an OpenRouteService key:

```sh
cp .env.example .env.local
# Replace the placeholder in .env.local, then:
npm run city:route-pilots
```

The key is used only by the local build script and is never shipped to the browser.

The committed Vancouver artifact is ready to use; a city-data refresh is not
required for normal development.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite locally |
| `npm run build` | Build production assets and version the service worker |
| `npm run test:unit` | Run domain, data, trail, and pipeline tests |
| `npm run test:e2e` | Run core Chromium browser journeys |
| `npm run test:a11y` | Run Axe accessibility checks |
| `npm run test:offline` | Verify cached-data and offline messaging |
| `npm run check` | Type-check JavaScript sources |
| `npm run check:bundle` | Enforce bundle budgets |
| `npm run city:verify` | Verify deterministic city builds from pinned inputs |
| `npm run city:pilots` | Rebuild the three density-first candidate pilots |
| `npm run city:route-pilots` | Route pilots with ORS and rebuild the review artifact |

## Architecture

- Vanilla JavaScript modules and Vite keep the public client simple.
- MapLibre GL renders the basemap, clustered tree records, trail lines, and stops.
- A Web Worker loads the small highlight pack first and lazily replaces it with
  the full city pack for search, filters, or the inventory switch.
- Density clusters are deterministic and composed only from real City record IDs.
- OpenRouteService supplies pinned pilot walking routes; Google Maps handles the
  external current-directions handoff for personal stop lists.
- Vitest and Playwright cover logic, journeys, accessibility, offline behaviour,
  and visual regressions.

## OpenAI Build Week

Treeways is entered in **Apps for Your Life**. The original Urban Canopy Engine
predates the event; the last pre-event commit is tagged
`pre-build-week-2026-07-13`. [BUILD_WEEK.md](BUILD_WEEK.md) records the baseline,
new work, ownership, model use, and required submission evidence.

During Build Week, Codex with GPT-5.6 helped isolate the repository, audit the
existing system, design and implement the trail experience, strengthen tests,
document evidence boundaries, and prepare deployment. Paulo made the product,
safety, design, authorship, and release decisions. Other models used earlier in
the project were GLM 5.2, Kimi 2.7, and Mistral 3.

## Licence

Code is [MIT licensed](LICENSE). City data has its own licence and attribution.
