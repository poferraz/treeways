# Treeways

Treeways turns Vancouver's public tree inventory into neighbourhood discovery
trails. Pick a short walk or a wider drive, compare related trees, and open the
ordered stops in Google Maps.

Vancouver is the first city. The product and city-pack contract are designed so
future cities can be added without rebuilding the core experience.

## Try the product

Production: <https://treeways.vercel.app>

The catalogue contains ten evidence-safe route previews: Mount Pleasant Prunus,
Grandview Flowering Families, West End Giants, Kerrisdale Fruit-Tree Families,
Shaughnessy Big Trunks, Kitsilano Kwanzan Rows, Hastings Maple Cousins, Killarney
Evergreen Giants, Prunus Across Vancouver, and Vancouver Measured Giants.

Small routes are capped at 3 km between records, medium at 5 km, and large at
8 km. Those spans are straight-line measurements between ordered public records,
not claims about street distance. Google Maps calculates live walking or driving
directions.

## What works

- Browse 185,307 City of Vancouver public-tree records on a MapLibre map.
- Search by common name, scientific name, or address.
- Filter fruit-tree families, ornamental-flowering families, measured giants,
  and trees with large recorded trunk diameters.
- Browse ten neighbourhood-first route previews with six ordered tree stops.
- Open every route in Google Maps as a walking or driving trip.
- Build a separate custom tree walk with OSRM routing.
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

The ten launch routes are visibly marked `Preview routes` until Paulo Ferraz
personally checks each street sequence. The offline review tool and sign-off
procedure are documented in [docs/trail-review-guide.md](docs/trail-review-guide.md).

## Local development

Requirements: Node.js 20+ and npm.

```sh
git clone https://github.com/poferraz/treeways.git
cd treeways
npm ci
npm run dev
```

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

## Architecture

- Vanilla JavaScript modules and Vite keep the public client simple.
- MapLibre GL renders the basemap, clustered tree records, trail lines, and stops.
- A Web Worker decodes the 30 MB city pack and owns search/spatial indexes.
- Trail suggestions are deterministic, bounded by size, and composed only from
  real city-record IDs.
- Google Maps handles live walk/drive directions; OSRM powers custom tree walks.
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
