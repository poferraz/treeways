# Urban Canopy Engine — Forage & Bloom/Giants Reconciled Implementation Plan

**Status:** Gates A and A2 are approved; the complete-inventory Milestone 1 backend decision is recorded on 2026-07-12. Milestone 2 contract/classification foundations are underway; evidence-backed enrichment remains separately gated.
**Scope:** this document plans the complete PRD outcome. It does not authorize deployment, account creation, social posting, or publication.
**Routing decision:** keep the active basic OSRM route preview as a separately flagged online feature; do not claim shade optimization or native navigation. Curated trails use external handoff as their primary navigation action.
**PRD:** v2.0 remains verbatim in Appendix B. Where the PRD's proposed internals conflict with the built engine, the decisions below preserve the user-facing goal and record an explicit architectural deviation.

---

## 1. Outcome and definition of done

The expansion is complete only when all of the following are true:

1. **Urban Forage** uses reproducible, licensed source data and distinguishes botanical edibility, access/permission, seasonal expectation, and unknowns. The UI never turns a species heuristic into a safety claim.
2. **Bloom & Giants** shows evidence-backed bloom metadata, source-reported per-specimen measurements, honest canopy provenance, derived giant status, and GPU-rendered dual-encoded markers.
3. **Curated trails** are generated as candidates, reviewed by a person, compiled into the city pack, browsable without the map, available offline after one connected visit, and exportable within provider limits.
4. **The engine remains fast and accessible**: eligibility changes produce correct cluster membership/counts without DOM markers or per-frame source churn, all map actions have a structured keyboard equivalent, WCAG 2.2 AA gates pass, and the agreed mid-tier device holds at least 55fps in the bloom/giant stress flow.
5. **Delivery is real**: source provenance is enforceable, returning clients receive pack updates, PR previews and cache headers are verified, governance is usable, and launch copy/media pass evidence and licensing review.

### Product-safety language

- Month masks mean **"typically blooming/fruiting this month"**, not a live observation.
- A species may be botanically edible without being safe, permitted, ripe, uncontaminated, or reachable. Use **"reported edible species"** or **"potential forage tree"** until the record has verified access/policy evidence.
- Straight lines or spatial clusters are **collections of waypoints**, not pedestrian-safe routes. External map providers decide navigation.
- Missing measurements remain `null`. Estimates are never presented as measurements.

---

## 2. Evidence-based reconciliation

No completion percentage is assigned: the implemented core is substantial, while most expansion-specific requirements remain open.

| Requirement | Status | Current evidence | Gap to close |
|---|---|---|---|
| GPU MapLibre baseline | **Done (core)** | `src/map/tree-layers.js` has clustered GPU circle/symbol layers and feature-state selection. | Bloom halo, non-colour bloom symbol, giant marker, trail line/waypoints, layer ordering, performance proof. |
| Worker-decoded pack | **Done (core), partial (contract)** | `src/data/data.worker.js` decodes and indexes the tuple pack. | Versioned canonical schema, validation, trail loading, worker-client method, cache migration, worker tests. |
| Bounded offline | **Partial** | `public/sw.js` caches the manifest and stable `trees.pack`; offline test passes. | Stable cache-first URLs can stay stale forever; trails and upgrade behavior are absent. |
| Independent licensing | **Partial** | Manifest attribution and a short `LICENSE-DATA.md` exist. | Exact datasets, versions/access dates, queries/transforms, derivations, record-level source IDs, media ledger, validation. |
| FR-A1 forage ingestion | **Open** | `city:import`, adapter, and normalizer are stubs; `scratch/` contains old one-off API heuristics only. | Real adapter-driven, pinned, deterministic import plus a verified forage/access source. |
| FR-A2 seasonality | **Partial** | Masks, exclusive filters, and current-month tests exist. | Composable category/season/month controls, Vancouver timezone, GPU opacity/icon state, no full-source reset. |
| FR-A3 forage details | **Partial** | The inspector already shows identity, phenology, measurements, source, and a general caution. | Edible status/part, evidence, access/policy, etiquette, readable season, uncertainty and source timestamps. |
| FR-B1 floral/giant metadata | **Partial** | Bloom/harvest arrays become runtime masks; actual `heightM` exists. | Semantic bloom colour, canopy spread/provenance, specimen-vs-species height semantics, source citations. |
| FR-B2 bloom rendering | **Open** | No halo, petal/icon, or month-driven opacity exists. | GPU layers, white-flower contrast, cluster suppression, deterministic month tests. |
| FR-B3 giant classification | **Open** | Only eight current records exceed 20m; no canopy spread or classifier exists. | Shared per-tree classifier, configurable thresholds, evidence in inspector, giant map symbol. |
| FR-B4 curated trails | **Open** | No trail schema, generator, editorial source, state, UI, or layers exist. | Candidate generation, human review, compiled ordered waypoints, reverse membership and integrity tests. |
| FR-B5 external handoff | **Partial** | Single-tree Google navigation already exists in `tree-inspector.js`. | Shared URL builder, ordered Google export within limits, accurately labelled Apple per-leg fallback, tests. |
| Existing OSRM route preview | **Active, mislabeled by old plan** | `src/main.js` always instantiates OSRM and exposes route controls. | Add a real `routePreview` capability, respect it, populate route-stop map data, remove shade claims. |
| NFR-P1 bundle delta | **Partial** | `check:bundle` enforces only an 80KB gzip ceiling on `index.js`; current entry is about 10.6KB gzip. | Tracked baseline and ≤5% core-entry delta, plus worker/CSS/data/first-load budgets. |
| NFR-P2 55fps | **Open** | Lighthouse passes a generic 0.50 threshold; no halo stress benchmark exists. | Reproducible pan/zoom scenario, long-task/decode metrics, named physical-device gate. |
| NFR-A1 keyboard/screen reader | **Partial** | Nearby list, live region, keyboard search, and Axe baseline exist. | The list exposes only eight trees; exact bloom-colour/trail announcements and complete viewport equivalence are absent. |
| NFR-A2 dual encoding | **Partial** | Design guidance requires colour plus shape/text. | A colour-only halo would fail; add petal/pattern and distinct giant shape. |
| CI | **Done (baseline), partial (depth)** | Static, unit, build, bundle, browser, Axe, offline, visual, and Lighthouse jobs exist. | Only eight unit tests; type check excludes UI/map/services/scripts; map canvas is hidden in visual snapshots; expansion states untested. |
| Vercel previews/cache | **Open/unverified** | No `vercel.json`; deployment doc is three lines. | Repo config, Git integration evidence, preview smoke, safe headers, returning-client upgrade, rollback. |
| Governance/public launch | **Partial/Open** | Root governance files exist but are skeletal; no issue forms or launch assets. | Propose-a-trail form, security/release automation, version alignment, licensed content backlog, channel approvals. |

### Current measured baseline (2026-07-12)

- Current pack: 10,000 records, 49 species, 608,280 bytes raw / 169,955 bytes gzip.
- Dataset composition: 9,501 `PRUNUS`, 449 `MALUS`, 32 `FICUS`, 18 `MORUS`; it does not support the stated breadth of giants/specimens.
- Data-quality warnings: two zero diameters and a maximum diameter of 778cm; the old compressor converted missing measurements to zero.
- Production build: entry 10.61KB gzip, CSS 12.68KB gzip, worker 2.90KB raw, MapLibre 216.98KB gzip.
- `npm run check`, `npm run test:unit` (4 files / 8 tests), `npm run city:validate`, `npm run build`, and `npm run check:bundle` pass. These prove the baseline, not PRD readiness.

---

## 3. Corrected architecture and data decisions

### 3.1 Source-of-truth and ingestion

1. Use a **pinned source snapshot in builds**. Network retrieval is an explicit refresh command; CI builds from the pinned snapshot and source manifest.
2. Make `scripts/city/import.js` invoke the named adapter. The Vancouver adapter must map, normalize, deduplicate, attach provenance, and produce a reject report; `build-pack.js` must consume that normalized output rather than copy `curated_trees.json`.
3. Use the City of Vancouver public-tree inventory as the specimen baseline. Evaluate the City's community-gardens-and-food-trees dataset as a forage/access source, but do not coerce site records into individual trees. Falling Fruit or another source remains optional until license, terms, identifiers, and deduplication are approved.
4. Record source URL, dataset ID/version, retrieval time, checksum, license, query/filter, transformation version, and coverage statistics. Builds from the same snapshot must be byte-identical; volatile timestamps do not belong in generated bytes.
5. Replace "exactly 10,000" validation with completeness and integrity gates: expected source categories, stable IDs, coordinate bounds, tuple arity, plausible units, null handling, duplicates, rejects, source coverage, and generated-artifact drift.

### 3.2 Canonical pack v2 contract

Use one worker-loaded, versioned city pack unless the size/performance gate in Milestone 0 requires vector tiles:

```js
{
  schemaVersion: 2,
  sourceSnapshot: { id, checksum, retrievedAt, transformVersion },
  species: [/* taxonomy, masks, bloom/forage metadata, evidence refs */],
  trees: [/* compact per-specimen tuples */],
  trails: [/* reviewed ordered waypoint collections */]
}
```

Schema semantics:

| Concern | Decision |
|---|---|
| Bloom season | Store a species-level 12-bit `bloomMask`; derive start/end labels. Do the same for `harvestMask`. |
| Bloom colour | Store a controlled semantic name (`pink`, `white`, `yellow`, etc.) plus a validated paint token/hex. The name feeds announcements; paint never has to infer language from a hex code. |
| Edibility and access | Species/cultivar metadata owns botanical status, edible part, cautions, and evidence. Per-specimen/site/city metadata owns access, permission and policy. Never inherit permission from a species record; `type`, genus, or a tag alone never proves safe edibility. |
| Height | Keep per-tree `heightM` as actual reported specimen height. If species potential is useful, call it `matureHeightRangeM`; never alias it to actual height. |
| Canopy spread | `canopySpreadM` is nullable. Add provenance (`measured`/`estimated`), method/version, source, and uncertainty. If no approved model exists, leave it null and classify height-only giants. |
| Giant status | Keep it specimen-level and derive it through one shared pure `classifyGiant(tree, thresholds)` function. Do not put a giant tag on the species record. Thresholds live in city configuration. |
| Trails | Store stable ID, reviewed name/theme, ordered tree IDs, reviewed `exportSegments` (each with at most five ordered anchor IDs and a shared boundary stop), seasonal mask, description, curator/source, review date, accessibility notes, and optional reviewed display geometry. |

`src/data/city-schema.js`, `tree-pack.js`, `scripts/city/validate.js`, and the docs must implement the same contract. Unsupported schema versions fail with a typed, user-recoverable error. The embedded `species` collection becomes the runtime and build source of truth; v2 stops emitting the redundant standalone `public/cities/vancouver/species.json`.

### 3.3 JSON versus MVT/PBF

Do not adopt PBF solely because the PRD named it, and do not assert JSON will scale without evidence. Milestone 0 performs a provisional sizing run from a pinned raw snapshot; Milestone 1 repeats the final decision from the minimally normalized pipeline output. Measure:

- compressed pack size and first-load transfer;
- worker decode/index time and long tasks;
- memory after GeoJSON feature creation;
- filter response and the 55fps map stress flow.

Keep the JSON tuple pack if it meets the agreed budgets. If the real source set fails them, move map geometry to PMTiles/MVT while the worker loads a compact tree lookup/search index plus species/trail metadata. Both backends must expose the same `loadCity`, `search`, `nearest`, `queryBounds`, `getTree`, and `getTrails` behavior to the app. The manifest identifies the map source and worker index explicitly; no later milestone may assume map geometry and accessible/search data live in one artifact. Record the final backend and filtered-clustering semantics in an ADR before enrichment or UI work begins.

### 3.4 Runtime, filters, and GPU layers

- Cluster membership and visible counts must come from the same eligible tree IDs. For the JSON backend, the data worker produces the filtered feature collection and the app calls `setData()` once per committed eligibility change so MapLibre reclusters correctly; selection and paint-only emphasis never replace the source. No main-thread rebuild, DOM markers, per-frame update, or change while a control is merely being previewed. If PMTiles/MVT is selected, its ADR must define filter-correct aggregate/cluster behavior or disable misleading cluster counts while filtered.
- Use composable state: `category` (`all`, `edible`, `blossoms`, `giants`), `season` (`any`, `bloom`, `harvest`), and `month` (1–12). Convenience presets map onto that state.
- Default month in `manifest.timezone` (`America/Vancouver`), not the device timezone. Unit-test UTC month boundaries. Filtered list totals, cluster totals, and rendered members must agree for the committed state.
- MapLibre 4.7 does not provide a bitwise-and style expression. Add and validate one arithmetic `maskHasMonthExpression(property, month)` helper, or precompute month booleans during feature creation. Do not invent an unsupported expression.
- Deterministic layer order:
  1. curated trail lines;
  2. curated trail waypoint emphasis;
  3. bloom halo;
  4. giant ring/symbol;
  5. normal tree points;
  6. selected-tree emphasis through feature-state paint in `trees-points`;
  7. active custom OSRM route and ordered route stops.
- Bloom uses colour **and** a petal/pattern symbol; giants use a distinct ring/shape. Suppress both on clusters. White blooms require a contrast outline.

### 3.5 Trails and navigation scope

- Generate deterministic **candidate groups** from high-value bloom/giant trees. A committed editorial file supplies final name, ordered members, export anchors, description, and approval metadata. The build validates and compiles it.
- A trail line is a visual connection between reviewed waypoints, not a safety-checked pedestrian route. Do not call OSRM or another live router during CI.
- Keep custom OSRM route preview, but add and honor separate `routePreview`, `trailExport`, and `shadeRouting` capabilities. `shadeRouting:false` means only shade optimization is unavailable; current shortest routing is not dormant.
- Extract the existing single-tree Google URL into `src/services/navigation-url.js` and reuse it.
- Google Maps is the full ordered export baseline. Each reviewed export segment has at most five total stops (origin + three mobile-browser waypoints + destination) and its generated URL must stay within 2,048 characters. Adjacent segments share a boundary stop; concatenating them must preserve every approved anchor in order.
- Apple's documented Map Links accept a source and one destination. Offer **next leg in Apple Maps**, not a misleading full-trail action.
- Trail state and layers remain separate from the user's custom OSRM route so both can coexist.

### 3.6 Offline, versioning, and Vercel caching

- Fingerprint every city data artifact (pack/index/tiles/media as applicable) and reference it from the manifest. Immutable caching is allowed only for fingerprinted artifacts.
- Revalidate the registry and manifest; never give a stable manifest a one-year immutable lifetime.
- Update the service worker so a returning client can fetch a new manifest, cache the new pack, switch atomically, and remove obsolete data after activation. Add an old-pack-to-v2 browser test.
- On a schema/update failure, revalidate the manifest, evict only the stale city artifact, and retry once. If that fails, show a non-looping "map update required" recovery state with reconnect/retry and clear-saved-city-data actions; never enter an automatic reload loop.
- Add `vercel.json` and, if needed, change `vite.config.js` so the header/version matrix is explicit:

  | Path class | Required policy |
  |---|---|
  | `/`, `index.html`, `sw.js`, city registry and manifests | `max-age=0, must-revalidate` (or equivalent `no-cache`) |
  | Stable shell aliases such as current `assets/index.js`, `index.css`, `maplibre.js` | Revalidate, or replace them with content-fingerprinted filenames before using immutable caching. |
  | Content-fingerprinted JS/CSS/worker, city pack/index/tiles and media | `public, max-age=31536000, immutable` |

- Test one returning-client upgrade across both shell and city-data versions; pack fingerprinting alone is insufficient.
- A file is not deployment proof. Require a PR preview URL, smoke result, response-header assertions, returning-client upgrade test, and documented rollback before release.

### 3.7 Repository mapping

Keep the built architecture instead of adding a parallel `src/modules/` tree:

| Responsibility | Location |
|---|---|
| Pure tree, forage, giant and trail rules | `src/domain/` |
| Pack/schema/worker/client | `src/data/` |
| Tree, trail and route GPU layers | `src/map/` |
| Inspector, filters, trail panel, accessible result proxy | `src/ui/` |
| External navigation URL builder | `src/services/` |
| Import, enrichment, candidate generation and pack build | `scripts/city/` |
| City outputs and data license | `public/cities/vancouver/` |
| Pinned inputs, enrichment evidence and reviewed trail definitions | a documented city-source directory chosen in Milestone 0, outside runtime `src/` |

---

## 4. Dependency-ordered execution plan

Each milestone ends at its exit gate. Do not begin a dependent milestone while its gate is open.

### Milestone 0 — decisions, evidence, and budgets

**Primary paths:** `docs/adr/`, `docs/data-contract.md`, `docs/data-provenance.md`, `PRODUCT.md`, `docs/release-gates/`, bundle/performance baseline files.

1. Approve forage wording and the distinction among edibility, access, permission, and current conditions.
2. Approve the source/license matrix and snapshot policy.
3. Decide whether canopy estimates may ship. If yes, approve model/source/version/uncertainty and UI wording; otherwise keep null.
4. Pin the raw benchmark snapshot and run a provisional JSON-versus-MVT sizing harness. The final decision waits for Milestone 1's minimally normalized output.
5. Define the bundle baseline before feature code: "core entry" includes the entry module and every static/default-startup dependency, even if moved to another chunk. Decide which non-default expansion panels may lazy-load, give every lazy chunk its own cap, and record that the current 10.61KB baseline leaves only about 0.53KB under the 5% rule.
6. Name the mid-tier performance profile (default proposal: Pixel 6 / current Chrome, 390×844, plus iPhone 12 Safari smoke), fixed camera/filter scenario, 5-second warm-up, three 30-second runs, frame/long-task calculation, and artifact path. Release requires the median run at ≥55fps plus the approved frame-time/long-task bounds.
7. Align the release identifier across `package.json`, manifest data version, changelog, and release gates; do not reuse "v2.0.0" ambiguously.

**Exit:** source/license, product-safety, provisional sizing, bundle scope/loading boundaries, performance method and release naming are approved. Final storage-backend approval is intentionally deferred until Milestone 1 produces normalized benchmark input.

### Milestone 1 — real, reproducible city ingestion

**Primary paths:** `package.json`, `scripts/city/{import,normalize,validate,build-pack}.js`, `scripts/city/adapters/vancouver.js`, source manifest/snapshot paths, `src/data/{city-schema,tree-pack}.js`, `scripts/check-bundle-budget.js`, pipeline/contract tests.

1. Convert the stub commands into an adapter-driven import/normalize/validate/build pipeline.
2. Migrate useful logic from `scratch/` only after replacing name heuristics with reviewed mappings and citations; retire the one-off scripts after parity is proven.
3. Preserve nulls, reject impossible units/coordinates, detect duplicates, and emit machine-readable reject/coverage reports.
4. Keep network access out of CI. Add an explicit refresh command for maintainers.
5. Use the minimally normalized output to run the final JSON-versus-MVT and filtered-clustering benchmark; approve the backend ADR before continuing.
6. Implement the chosen versioned city-artifact skeleton and contract tests: embedded tuples for JSON, or explicit tile plus compact worker-index references for the tiled path. The metadata artifact owns species and an initially empty `trails` collection.
7. Install the non-gameable relative/absolute bundle gate now so every later milestone fails early if its loading strategy exceeds budget.
8. Make two builds from the same snapshot byte-identical and fail CI when committed generated outputs drift.

**Exit:** the adapter is actually invoked; every accepted/rejected record is accounted for; source coverage is reported; no arbitrary 10,000-record ceiling remains; the final backend/cluster ADR, versioned artifact skeleton and early budget gate are approved.

### Milestone 2 — trustworthy enrichment and classification

**Primary paths:** enrichment/evidence files, `src/domain/{tree,forage,giant}.js`, `src/data/tree-pack.js`, domain/data tests.

1. Add semantic bloom colour, masks, forage metadata, and evidence references at species/cultivar granularity.
2. Add nullable canopy spread and provenance fields without converting missing values to zero.
3. Implement one pure giant classifier used by build-time trail selection and runtime feature creation.
4. Extend `normalizeTree` and `toFeature` with the exact properties needed by MapLibre and announcements.
5. Test unknown/unsafe edibility states, mask boundaries, implausible measurements, threshold edges, and build/runtime classifier parity.

**Exit:** every forage/bloom/canopy claim has evidence; estimated values are distinguishable; type/tags cannot accidentally create a safety claim.

### Milestone 3 — candidate generation and human-curated trails

**Primary paths:** `scripts/city/trails.js`, reviewed trail source, trail domain/schema tests.

1. Generate stable candidate groups by theme, season, distance, and value score.
2. Require a reviewed source record for names, order, membership, export anchors, narrative, and accessibility/pedestrian-plausibility notes.
3. Validate unique IDs, city bounds, existing tree references, stable order, export limits, and review metadata.
4. Compile trails into the chosen metadata artifact's top-level `trails` collection and build reverse tree-to-trail membership.

**Exit:** no algorithm-only output is published as "curated"; every trail is deterministic, valid, human-reviewed, and accurately described as waypoints.

### Milestone 4 — worker, manifest, capabilities, and offline upgrade

**Primary paths:** `src/data/{city-schema,tree-pack,data.worker,worker-client}.js`, `public/cities/vancouver/manifest.json`, `public/sw.js`, `scripts/inject-sw-version.js`, `vite.config.js`, worker/offline tests.

1. Complete the selected runtime data-source decoder/index and typed schema errors against Milestone 1's contract.
2. Extend the existing worker protocol with `getTrails` and add the matching client wrapper; clear all tree/trail indexes on city reload.
3. Add and validate `routePreview`, `trailExport`, and `shadeRouting` capabilities in the manifest; later controls must consume these exact values.
4. Fingerprint the chosen data artifacts and shell assets (or explicitly revalidate stable shell aliases), update the manifest, and implement manifest revalidation plus atomic cache migration.
5. Implement the one-retry, non-looping update-recovery state described in §3.6.
6. Test tuple/index integrity, missing species, duplicate IDs, orphan trail references, unsupported versions, stale cached v1 data, shell-plus-pack upgrades, recovery failure, and offline trail availability.

**Exit:** a returning v1 client receives and uses the new shell and city artifacts without a manual cache clear; the active data source and manifest cannot disagree; unsupported versions recover once and then stop with a useful action.

### Milestone 5 — composable filters and complete GPU rendering

**Primary paths:** `src/core/{store,actions,selectors}.js`, `src/domain/phenology.js`, `src/main.js`, `src/map/{tree-layers,trail-layers,route-layers}.js`, map/filter tests.

1. Add category/season/month state and Vancouver-timezone month selection.
2. Implement the backend's approved filter-correct clustering path. On JSON, request filtered features from the data worker and replace the source once per committed eligibility change; keep selection/opacity changes paint-only. On tiles, follow the ADR's aggregate semantics and never display counts that include hidden trees.
3. Add the tested month-mask expression helper, bloom halo + petal symbol, giant marker, trail line, ordered trail waypoints, and route-stop population.
4. Add tree/trail selection state while preserving custom-route state. Add pointer selection for trail lines through a wider transparent hit-target layer.
5. Add deterministic map-canvas visual tests for all 12 months, daylight/dusk, white blooms, giants, clusters, selected trail, and active route.

**Exit:** filters compose and announce counts; list, cluster and rendered-member totals agree; decorations never appear on clusters; layer order is stable; no main-thread collection rebuild, DOM-marker rebuild, per-frame source update or misleading filtered cluster remains.

### Milestone 6 — field-guide UX, trail panel, and external handoff

**Primary paths:** extend `src/ui/tree-inspector.js`; add `src/ui/trail-panel.js`, accessible results/pagination, `src/services/navigation-url.js`, UI and browser tests.

1. Extend the existing inspector rather than creating a competing field guide. Add forage evidence/etiquette, semantic bloom colour, giant evidence, canopy provenance, and trail membership.
2. Add a trail browser/list and a trail panel in the existing sheet with theme, season, ordered stops, waypoint span (or reviewed pedestrian distance only), review/source information, and accurately labelled export actions. Opening from the list or map line must produce the same selection state.
3. Make the synchronized results list the canonical keyboard proxy for canvas points. Expose every filtered tree in the current viewport through paginated or virtualized results regardless of cluster state; focus highlights the matching feature. Add a keyboard-accessible "Browse trees in this area" cluster action without creating DOM marker overlays.
4. Announce common name, qualified seasonal state, semantic bloom colour, giant evidence, and trail membership when present.
5. Unit-test Google ordering/encoding/waypoint and URL limits, segmented fallback, Apple next-leg labels, and the existing single-destination action.
6. Gate custom-route controls and OSRM construction/requests behind `routePreview`; gate trail actions behind `trailExport`; prove no OSRM request occurs when route preview is disabled.

**Exit:** every map task and every reviewed trail has a structured equivalent; viewport tree/member counts match at every zoom; selection remains visible above bloom/giant decoration; WCAG 2.2 AA/Axe gates pass for filter, forage, bloom, giant, trail, export and route states; no provider action promises unsupported behavior or calls straight-line geometry a walking distance.

### Milestone 7 — performance, CI, and release hardening

**Primary paths:** `scripts/check-bundle-budget.js`, baseline files, `jsconfig.json`/quality config, `.github/workflows/ci.yml`, Playwright/Lighthouse/performance tests.

1. Enforce Milestone 0's reviewed baseline manifest: the core measurement aggregates every app-authored module/chunk fetched by the default startup flow, so renaming or moving code cannot evade the ≤5% gzip delta. Apply separate absolute/delta budgets to permitted on-demand expansion chunks, worker, CSS, city data, media, and total first use.
2. Extend static checking to UI, map, services, scripts, and tests; add lint/format if needed to cover what TypeScript does not.
3. Add pack round-trip/versioning, worker, map-expression, URL, cache-upgrade, and failure-state unit/integration tests.
4. Stop hiding the map in feature visual tests; create portable CI baselines. Split functional e2e from dedicated a11y/offline/visual suites to remove duplicate runs.
5. Add a fixed 10k-or-expanded-dataset pan/zoom/filter benchmark with frame, long-task, decode, memory, and filter-response evidence. CI guards regressions; the named physical device is the NFR-P2 release authority.

**Exit:** all automated gates in §5 pass; physical-device evidence shows ≥55fps for the agreed scenario; the core entry is no more than 5% above its approved baseline.

### Milestone 8 — deployment, governance, and launch

**Primary paths:** `vercel.json`, `docs/deployment.md`, `.github/ISSUE_TEMPLATE/`, governance/security/release docs, `CHANGELOG.md`, launch/content/media ledger.

1. Configure safe cache headers and SPA behavior; verify PR preview, response headers, offline upgrade, production rollback, and required checks.
2. Add bug, feature, city-adapter, and propose-a-trail issue forms; verify CODEOWNERS; add dependency review, CodeQL/license checks, vulnerability reporting, and a release/version process proportionate to the project.
3. Produce release notes, a demo/screenshot set, licensed media ledger, and a 15–20-post content backlog across the four PRD pillars.
4. Review every public claim against dated evidence. Replace "peaking this week" or "every tree in bloom" unless a current observation source supports it.
5. Obtain explicit approval before connecting Vercel production, creating an Instagram account, posting, or publishing to external communities.

**Exit:** preview and production evidence is attached; governance paths work; all media/copy is licensed, attributed, accessible, and approved; launch has a signed go/no-go checklist.

---

## 5. Release gates

### Automated

- Deterministic import/build hash and clean generated diff.
- Schema/provenance/coverage/reject/duplicate/orphan/bounds validation.
- `npm run check`, `npm run test:unit`, `npm run city:validate`, `npm run build`, and the expanded `npm run check:bundle`.
- Functional Chromium, Firefox/WebKit smoke, Axe for every new state, offline first-visit limitation plus returning-client upgrade, and map-visible visual regression.
- Lighthouse plus the dedicated map stress benchmark; no serious/critical Axe violations.
- Navigation URL tests for ordering, encoding, provider limits and fallbacks.
- No OSRM construction/request when `routePreview` is false; no trail export control when `trailExport` is false.
- CodeQL, dependency review, license/provenance checks and all configured required checks are green.

### Manual

- Keyboard plus VoiceOver, NVDA, and TalkBack coverage of tree/trail browsing and announcements.
- 200% zoom, high contrast/colour-vision checks, reduced motion, landscape phone, daylight/dusk and outdoor-legibility review.
- ≥55fps on the named mid-tier device with all eligible decorations active.
- Google full/segmented trail handoff and Apple next-leg handoff on real devices.
- Data/license/editorial review for every new source, derivation, trail and media item.

### Deployment and launch

- PR preview URL and smoke report; cache headers verified against manifest and fingerprinted pack paths.
- Returning-client upgrade and rollback drill completed.
- Version, changelog, release notes, public copy, media ledger and 15–20-post backlog approved.
- No external publication occurs without explicit project-lead authorization.

---

## 6. Risks and approval gates

| Risk | Mitigation / stop condition |
|---|---|
| Edibility or harvest claims cause harm or imply permission | Product-safety vocabulary, evidence/status fields, local policy link, human review; stop launch if access/permission semantics are unresolved. |
| Municipal data is current but incomplete/stale at record level | Snapshot/version metadata, last-updated display, nulls preserved, coverage report, no live-state wording. |
| Canopy allometry invents precision | Ship measured values only, or approved model/version/uncertainty clearly marked; otherwise use height-only giant classification. |
| Candidate trails cross barriers or imply safe walking | Human review and waypoint wording; external provider navigation; no automated safety claim. |
| JSON pack no longer meets performance budgets | Milestone 0 benchmark gates PMTiles/MVT before dependent UI work. |
| Cached v1 and v2 contracts diverge | Fingerprinted pack, revalidated manifest, atomic service-worker migration, old-client browser test. |
| External Maps truncates waypoints | Reviewed export segments of at most five stops, shared boundaries, order/coverage and URL-length validation, Apple next-leg fallback. |
| Colour-only or canvas-only interaction excludes users | Dual encoding and a complete synchronized keyboard list; exact announcement tests. |
| Launch claims outrun month-mask evidence | Editorial evidence timestamps and approval; no "currently/peaking" language without observations. |

Approval gates:

- **Gate A — before Milestone 1:** source/license, forage language, canopy policy, provisional sizing, bundle/loading boundaries, performance method and release identifier approved.
- **Gate A2 — before Milestone 2:** the normalized-data backend/cluster ADR, artifact contract and early bundle gate are approved.
- **Gate B — before publishing trails:** reviewed names/order/anchors, pedestrian-plausibility notes and source evidence approved.
- **Gate C — before external changes:** Vercel project actions; GitHub branch protection/required checks, private vulnerability reporting, dependency/security settings and CODEOWNERS team verification; production release; social account creation/posting; and community submissions are explicitly authorized or assigned as project-lead manual steps.

---

## 7. Correct implementation starting point

The first implementation slice is **not** `src/domain/tree.js` or a halo layer. Start with Milestones 0–1:

1. record source/safety/cache decisions, provisional sizing, loading boundaries and measurement methods;
2. implement fixture-backed Vancouver import, normalize, reject reporting and validation;
3. benchmark the normalized output, approve the backend/cluster ADR, and add the chosen versioned artifact contract, deterministic output and early bundle gate;
4. only then add enrichment, trails, worker migration and rendering in dependency order.

This prevents UI and pack work from being built on the current one-off 10,000-record dataset, stub adapter, unsafe edibility heuristics, and stale-cache contract.

---

## Appendix A — audit evidence and external constraints

### Repository evidence

- Pipeline stubs: `scripts/city/import.js`, `scripts/city/normalize.js`, `scripts/city/adapters/vancouver.js`, `scripts/city/build-pack.js`, `scripts/city/validate.js`.
- Runtime and filters: `src/main.js`, `src/domain/tree.js`, `src/map/tree-layers.js`, `src/ui/filters.js`, `src/ui/tree-inspector.js`.
- Pack/worker/cache: `src/data/tree-pack.js`, `src/data/data.worker.js`, `src/data/worker-client.js`, `public/cities/vancouver/manifest.json`, `public/sw.js`.
- Quality gates: `.github/workflows/ci.yml`, `scripts/check-bundle-budget.js`, `tests/e2e/`, `lighthouserc.cjs`, `docs/release-gates/v2.0.0.md`.
- Product constraints: `PRODUCT.md`, `DESIGN.md`, `docs/design/accessibility-spec.md`, `docs/data-provenance.md`.

### Official external references checked on 2026-07-12

- [City of Vancouver public trees](https://opendata.vancouver.ca/explore/dataset/public-trees/) — specimen source, schema, license, currency and accuracy notes.
- [City of Vancouver community gardens and food trees](https://opendata.vancouver.ca/explore/dataset/community-gardens-and-food-trees/) — candidate forage/access source with explicit accuracy limitations.
- [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) — required `api=1`, ordered waypoint and 2,048-character limits.
- [Apple Map Links](https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html) — documented source/destination and walking parameters, not multi-stop trail URLs.
- [Vercel static configuration](https://vercel.com/docs/project-configuration/vercel-json) and [cache-control guidance](https://vercel.com/docs/caching/cache-control-headers) — path headers and immutable caching only for versioned static assets.

---

## Appendix B — PRD v2.0 (verbatim)

# Product Requirements Document (PRD)
## Project: Urban Canopy Engine (Expansion Modules)
**Document Version:** 2.0 (Final)
**Prepared For:** Paulo (Project Lead)
**Prepared By:** Qwen3.7 Product & Engineering Task Force

---

## 1. Executive Summary & Product Vision
The **Urban Canopy Engine** is a map-first, accessible field guide for urban trees, launching with the Vancouver city pack. The core engine provides high-performance, GPU-accelerated tree mapping.

This PRD outlines the expansion of the engine into a comprehensive urban nature discovery tool. The expansion introduces two primary modules built *on top of* the core engine:
1.  **Urban Forage:** Locating edible fruit trees ("good to eat").
2.  **Bloom & Giants:** Curating routes and highlighting trees with spectacular floral displays, exceptional height, and massive canopies ("nice to see, big to look at").

The ultimate goal is to create a highly professional, open-source platform with a robust public presence (GitHub, Vercel website, Instagram), serving as both a practical tool for citizens and a showcase of advanced geospatial web engineering.

---

## 2. Core Architectural Constraints (Non-Negotiables)
All features detailed in this PRD must strictly adhere to the foundational constraints defined in the project's core README:

*   **Rendering Engine:** Must utilize **GPU MapLibre layers** for all map rendering to ensure 60fps performance.
*   **Data Processing:** Must utilize a **worker-decoded city pack** architecture. Heavy data parsing must occur in Web Workers, keeping the main thread unblocked.
*   **Routing Constraint:** The engine **does not claim routing**. We will build a "Curated Waypoint System" (visual paths and points of interest), but we will *not* build a native turn-by-turn navigation engine. Users will be prompted to export waypoints to external navigation apps.
*   **Offline Constraint:** The engine **does not claim the complete basemap works offline**. Only the vector tree data and specific media assets are cached/offline-capable.
*   **Licensing Constraint:** City data and media have **independent licenses**. Every dataset must be tracked and attributed via a `LICENSE-DATA.md` file in each city pack.

---

## 3. Functional Requirements: The Expansion Modules

### 3.1. Module A: "Urban Forage" (Good to Eat)
**Objective:** Allow users to discover and track edible urban fruit and nut trees.
*   **FR-A1 (Data Ingestion):** Integrate with open foraging datasets (e.g., Falling Fruit API, municipal food tree registries).
*   **FR-A2 (Seasonality Filtering):** The UI must include a temporal filter. Trees tagged with fruiting months will dynamically adjust their map opacity or icon state based on the current calendar month (e.g., Apple trees highlighted in October, dimmed in May).
*   **FR-A3 (Forage Details):** Clicking a forage tree opens an accessible field guide panel detailing the species, edibility, harvesting season, and foraging etiquette.

### 3.2. Module B: "Bloom & Giants" (Nice to See, Big to Look At)
**Objective:** Highlight the most visually spectacular trees in the city, with a **primary focus on floral displays**, followed by exceptional height and massive canopy size.
*   **FR-B1 (Floral Data Schema):** Trees in the dataset must support extended metadata: `bloom_color`, `bloom_month_start`, `bloom_month_end`, `max_height_meters`, and `canopy_spread_meters`.
*   **FR-B2 (Bloom State Rendering):** The GPU MapLibre layer must render a visual "halo" or specific floral icon for trees currently in bloom. The color of the halo should match the `bloom_color` data (e.g., pink for Cherry blossoms, white for Magnolias).
*   **FR-B3 (Giant/Specimen Tagging):** Trees exceeding specific thresholds (e.g., >20 meters tall, or >15 meters canopy spread) are automatically tagged as `type: giant`.
*   **FR-B4 (Curated Waypoint Trails):** The `npm run city:build` script will run a clustering algorithm to group high-value "Bloom" and "Giant" trees into logical walking sequences (e.g., "The Cherry Blossom Trail", "The Heritage Sequoia Stroll").
*   **FR-B5 (External Routing Handoff):** Each curated trail will feature an "Open in Maps" button, packaging the trail's waypoints into a URL scheme for Apple Maps or Google Maps, respecting the "no native routing" constraint.

---

## 4. Technical Architecture & Data Pipeline

### 4.1. The City Build Pipeline (`npm run city:build`)
This script is the backbone of the worker-decoded city pack. It must be updated to process the new modules:
1.  **Ingest:** Pull raw GeoJSON from core tree inventories, Falling Fruit, and floral/giant datasets.
2.  **Enrich:** Apply the `bloom_` and `giant_` metadata tags.
3.  **Cluster & Route:** Execute the waypoint clustering algorithm to generate the curated "Bloom & Giants" trails.
4.  **Vectorize:** Convert all points and polylines into highly optimized MapLibre vector tiles (`.pbf`).
5.  **Package:** Bundle the tiles, media, and metadata into the final worker-ready city pack.

### 4.2. Web Worker & GPU Rendering
*   **Worker Decoding:** The Web Worker will decode the new vector tiles and floral metadata. It must pass structured arrays to the main thread without causing garbage collection spikes.
*   **MapLibre GPU Layers:** The floral "halos" and giant tree markers must be rendered using custom GPU shaders or highly optimized MapLibre `circle` and `symbol` layers to ensure the map remains buttery smooth even when thousands of bloom indicators are active.

---

## 5. Non-Functional Requirements

### 5.1. Performance & Bundle Size
*   **NFR-P1:** The `npm run check:bundle` command must pass. The addition of the Forage and Bloom layers must not increase the core JavaScript bundle size by more than 5%. All heavy lifting must remain in the Web Worker and GPU.
*   **NFR-P2:** Map panning and zooming with all floral halos and forage markers active must maintain a minimum of 55fps on mid-tier mobile devices.

### 5.2. Accessibility (a11y) & The "Field Guide" UX
*   **NFR-A1 (Screen Readers):** Map markers must be reachable via keyboard. When focused, the screen reader must announce: *"Flowering Cherry Tree, currently in bloom, pink flowers. Part of the Gastown Blossom Trail."*
*   **NFR-A2 (Visual Design):** Maintain the tactile, illustrated "field guide" aesthetic. Use high-contrast, colorblind-friendly palettes. Floral indicators should rely on both color and distinct iconography (e.g., a specific petal shape) to ensure accessibility.

---

## 6. DevOps, CI/CD, & Deployment

### 6.1. GitHub Actions CI Pipeline
Every Pull Request must trigger a workflow that strictly enforces the README commands:
```yaml
steps:
  - run: npm install
  - run: npm run city:build
  - run: npm run test:unit
  - run: npm run check
  - run: npm run build
  - run: npm run check:bundle # Fails PR if bundle size limits are breached
```

### 6.2. Vercel Deployment
*   **Preview Deployments:** Every PR generates a unique Vercel URL for live testing of the GPU layers and worker decoding.
*   **Edge Caching:** `vercel.json` will be configured to cache the worker-decoded city packs and high-res floral media at the edge with `Cache-Control: public, max-age=31536000, immutable`.

---

## 7. Open Source Governance & Repository Structure

### 7.1. Directory Layout
```text
urban-canopy-engine/
├── .github/
│   ├── workflows/          # CI enforcing npm run checks
│   └── ISSUE_TEMPLATE/     # Templates for Bug, Feature, and "Propose a Trail"
├── src/
│   ├── core/               # MapLibre GPU layers, Web Workers
│   ├── modules/
│   │   ├── forage/         # Urban Forage logic & UI
│   │   └── bloom-giants/   # Floral & Giant tree logic & UI
│   └── ui/                 # Accessible field guide components
├── city-packs/
│   └── vancouver/
│       ├── data/           # Raw GeoJSON and processed vector tiles
│       ├── media/          # High-res photos of blooms and giants
│       └── LICENSE-DATA.md # Independent licenses for all data/media
├── scripts/                # Build scripts for city:build and trail generation
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
└── README.md
```

---

## 8. Brand, Marketing & Social Media Strategy

### 8.1. Visual Identity & Tone
*   **Aesthetic:** Professional, botanical, cartographic. Earthy greens, vibrant floral accents (magenta, soft pink, bright white), and clean typography.
*   **Tone:** Educational, appreciative of urban nature, and technically authoritative.

### 8.2. Instagram & Content Pillars
*   **Pillar 1: "In Bloom" (The Visual Hook)**
    *   *Content:* Stunning, close-up photography of urban flowers (e.g., Cherry blossoms in Queen Elizabeth Park) paired with a sleek UI screenshot showing the map's "bloom halo" feature.
    *   *Caption:* "The Cherry Blossoms at Queen Elizabeth Park are peaking this week. We've mapped every tree in full bloom. Link in bio to explore the trail."
*   **Pillar 2: "Giants of the City" (The Awe Factor)**
    *   *Content:* Extreme low-angle photography looking up into the canopy of massive trees (e.g., a 40-meter Douglas Fir or Sequoia), emphasizing scale.
*   **Pillar 3: "Urban Forage" (The Utility)**
    *   *Content:* Macro shots of urban fruit, highlighting the "good to eat" module and seasonal tracking.
*   **Pillar 4: "Under the Hood" (The Open Source Cred)**
    *   *Content:* Screen recordings of the GPU MapLibre layers rendering thousands of floral halos at 60fps, or snippets of the Web Worker code. Targeted at developers and GIS professionals.

---

## 9. Phased Execution Timeline

### Phase 1: Core Expansion & Data Pipeline (Weeks 1-4)
*   Update `npm run city:build` to process floral metadata (`bloom_color`, `bloom_months`) and giant tree thresholds.
*   Implement the Web Worker decoding for the new data structures.
*   Develop the clustering algorithm to generate the "Bloom & Giants" curated waypoint trails.
*   Ensure `npm run check:bundle` passes with the new logic integrated.

### Phase 2: GPU Rendering & UI/UX (Weeks 5-8)
*   Implement the MapLibre GPU layers for the floral "halos" and seasonal opacity transitions.
*   Build the accessible UI panels for the Field Guide, Forage details, and Trail information.
*   Implement the "Export to Navigation" handoff for the curated trails.
*   Conduct a comprehensive WCAG 2.1 AA accessibility audit.

### Phase 3: Professionalization & Launch (Weeks 9-12)
*   Finalize all GitHub governance files (`CONTRIBUTING.md`, `LICENSE-DATA.md`, etc.).
*   Configure Vercel preview deployments and edge caching.
*   Launch the Instagram account with a backlog of 15-20 high-quality posts focusing on Vancouver's spring blooms and giant trees.
*   Publish the project on Hacker News, r/gis, and r/maplibre, highlighting the GPU optimization, accessibility, and the "Bloom & Giants" feature.
