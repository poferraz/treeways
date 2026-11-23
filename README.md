# Treeways

Treeways is a field guide for exploring Vancouver on foot. Browse trees by name or address, choose a neighbourhood trail, or build a list of stops and open it in Google Maps. [Explore Treeways](https://treeways.vercel.app/)

## What you can explore

The map starts with 6,509 highlights from the City of Vancouver’s July 2026 inventory. Turn on **All public trees** to browse all 185,307 published records. After an online visit, the app can reopen saved tree and trail data offline. The background map and external walking directions need a connection.

| Reviewed trail | Walking distance |
| --- | --- |
| Maples in Kitsilano | 3.3 km |
| Fruit-tree families in Grandview-Woodland | 3.6 km |
| Cherry blossoms in Mount Pleasant | 6.1 km |

These distances come from saved OpenRouteService walking routes. Check current access and street conditions before a walk. The inventory has no verified bloom or harvest dates for these trees. A fruit-family label gives no assurance of edibility or permission to harvest.

## My role

I reviewed and approved the three launch trails on July 18, 2026. During OpenAI Build Week, Codex with GPT-5.6 helped me implement and test the trail catalogue. Earlier versions showed generated trail previews. I chose to publish routes only after editorial review. Safety and accessibility remain unverified. [Trail review guide](docs/trail-review-guide.md) · [Build Week record](BUILD_WEEK.md)

## Run locally

Use Node.js 24 and npm. The Vancouver data ships with the repository. You can run the app and its tests without a routing key.

```sh
git clone https://github.com/poferraz/treeways.git
cd treeways
npm ci
npm run dev
```

Open the local URL printed by Vite. Run `npm run test:unit` for the unit tests, `npm run city:validate-published` to check the reviewed trails against the published data, or `npm run build` for a production build. [Contributor checks](CONTRIBUTING.md)

## Credits and licences

Treeways uses MapLibre to display CARTO maps with OpenStreetMap data. Saved walking routes are © openrouteservice.org by HeiGIT, licensed under CC BY 4.0. The underlying map data is © OpenStreetMap contributors. The City of Vancouver provides the tree inventory under the Open Government Licence – Vancouver. The application code is MIT licensed. [Data provenance](docs/data-provenance.md) · [City data licence](public/cities/vancouver/LICENSE-DATA.md) · [Code licence](LICENSE) · [Privacy](docs/privacy.md)
