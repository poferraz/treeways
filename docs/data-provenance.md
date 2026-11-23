# Data provenance

Vancouver’s specimen baseline comes from the City of Vancouver **Public trees** inventory. It covers public boulevard and park trees. Attributes can lag conditions on the ground. The July 12, 2026 snapshot contained 185,845 source records. The published pack includes 185,307 and the project records the reasons for rejecting 538. [City dataset](https://opendata.vancouver.ca/explore/dataset/public-trees/) · [Open Government Licence - Vancouver](https://opendata.vancouver.ca/pages/licence/) · [Rejection summary](../data/cities/vancouver/rejection-summary.json)

The committed full city pack records the raw-export checksum, projected-snapshot checksum, retrieval date, projected fields, transform version and reported count under `sourceSnapshot`. Its `foodSiteSourceSnapshot` field records the separate **Community gardens and food trees** snapshot. That source covered 170 sites and 169 were included. Counts and varieties describe the site as a whole. Each site’s access status is unknown. [Published city pack](../public/cities/vancouver/vancouver.v2.1.0.json) · [Data licence](../public/cities/vancouver/LICENSE-DATA.md)

The city rebuild uses local source manifests and checksum-verified snapshots. These inputs are outside the public checkout. For a fresh checkout, `npm run city:validate-published` checks the reviewed trail source against the committed packs. [Contributing](../CONTRIBUTING.md)

Milestone 2 adds an intentionally empty, deterministic evidence registry at [`data/cities/vancouver/evidence-registry.json`](../data/cities/vancouver/evidence-registry.json). It is the only permitted source for botanical enrichment. A source must state reuse, redistribution, derivative, and attribution terms; every record must have an exact scientific name and optional exact cultivar, canonical/source-record URLs, exact supporting statement, reviewed status/date, and supported claim semantics. The resolver matches scientific names and cultivars exactly and conservatively discards conflicts. No reviewed candidate passed all gates at this checkpoint, so the Vancouver artifact retains unknown edibility and null bloom, harvest, and canopy-enrichment values. The review certificate is [`v2.1.0-milestone-2.md`](release-gates/v2.1.0-milestone-2.md).

Trail pilots use the OpenRouteService `foot-walking` profile during the local
build and review workflow. The API key stays in the ignored `.env.local` file and
is sent only in the request authorization header. Each accepted route stores the
ORS engine version, graph date, generation time, profile, result licence
(`CC-BY-4.0`), and the required OpenRouteService/OpenStreetMap attribution. The
route is pinned review evidence, not a claim about live conditions, safety,
accessibility, or right of access.
