# Treeways — OpenAI Build Week record

Treeways grew out of Urban Canopy Engine. This record covers the existing field guide and the work added during OpenAI Build Week.

## Submission window

- Event: OpenAI Build Week
- Submission period: July 13, 2026 at 9:00 AM PT through July 21, 2026 at
  5:00 PM PT
- Track selected for Treeways: Apps for Your Life

## Ownership and source material

Paulo Ferraz owns the project code. The code and the city data have separate licences. [MIT licence](LICENSE) · [Vancouver data provenance](docs/data-provenance.md)

## Pre-existing baseline

The tag `pre-build-week-2026-07-13` identifies the last commit before the event. [Pre-event revision](https://github.com/poferraz/treeways/tree/796fcb91a898a55a826f976c349915b307d14179)

That baseline already contained the map-first Vancouver field guide, municipal
and curated tree browsing, search, filters, tree details, custom route building,
responsive map/inspector layouts, accessibility foundations, service-worker
support, and automated verification.

## Work created during Build Week

### July 15 foundation

- `9b92cea`: repository commit-discipline guardrails
- `f73589c`: reproducible full-city artifact pipeline, source evidence
  foundations, giant-tree classification, trail candidate generation,
  deterministic-build verification, and expanded tests

### July 17–18 Treeways extension

The new repository adds the consumer-facing product layer:

- highlights-first startup with an explicit switch for the complete 185,307-tree inventory
- density-first cluster candidates built from real municipal records
- three launch pilots in Mount Pleasant, Grandview-Woodland, and Kitsilano
- popular-name-led Cherry blossoms, Fruit-tree families, and Maples themes
- small (up to 3 km), medium (up to 5 km), and large (up to 8 km) trail sizes
- loop and point-to-point walking semantics based on routed overhead
- evidence-qualified seasonal first-run guidance
- a field-journal visual design
- OpenRouteService `foot-walking` route contracts and Google Maps walking handoffs
- pinned live ORS results: a 6.1 km Mount Pleasant loop plus 3.6 km Grandview-Woodland
  and 3.3 km Kitsilano point-to-point walks
- trail, route, accessibility, and pipeline regression tests
- local development instructions and a human trail-review guide
- production Vercel deployment at <https://treeways.vercel.app>, verified in
  Chromium against the deployed artifact

The old ten generated previews were removed from the runtime. The three new
pilots were routed with OpenRouteService, reviewed by Paulo on 2026-07-18, and
compiled into the public catalogue with exact reverse membership for 1,034 City
tree records.

## Human decisions

Paulo reviewed the three launch trails’ names, descriptions, ordered membership, travel mode and limitations. Candidates could enter the catalogue after that review. Pedestrian safety, accessibility and live conditions remain unknown. [Trail review source](data/cities/vancouver/trails-review.json) · [Trail review guide](docs/trail-review-guide.md)

## AI collaboration

Paulo made the product, design and release decisions. Codex with GPT-5.6 helped implement and test the trail experience. The project also records earlier use of GLM 5.2, Kimi 2.7 and Mistral 3.
