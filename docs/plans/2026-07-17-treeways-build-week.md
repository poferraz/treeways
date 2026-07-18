# Treeways Build Week implementation plan

## Outcome

Ship a public, map-first Vancouver experience where a person can discover what
trees are worth noticing nearby, optionally reveal the complete public inventory,
find a reviewed neighbourhood walk, inspect evidence-backed tree details, and
hand ordered personal stops to walking directions.

## Launch scope

- Vancouver is the first city; the data contract remains city-extensible.
- Launch review starts with three pilots: Mount Pleasant, Grandview-Woodland,
  and Kitsilano.
- Overall tree density chooses the areas; neighbourhood and friendly common-name
  themes organize and explain them.
- Walking trail sizes: small up to 3 km, medium up to 5 km, large up to 8 km.
- Catalogue trails are walking only and may be loops or point-to-point.
- Internet is expected for basemap tiles and external directions.
- No accounts, backend, analytics, telemetry, crowdsourcing, or live-observation
  claims.

## Product gates

### Gate 0 — isolated repository and evidence baseline

- preserve full history and tag the last pre-event commit
- copy the approved in-progress trail-review artifacts without changing the
  original repository
- publish the new public repository
- record before/after scope in `BUILD_WEEK.md`

### Gate 1 — trail and evidence contract

- define one validated trail schema
- define theme, season, size, mode, ordered-stop, source, review, and limitation
  semantics
- keep missing and unverified facts explicitly unknown
- add contract and validation tests before runtime work

### Gate 2 — deterministic candidates and human review

- generate neighbourhood and theme candidates from pinned data
- route candidates with pinned OpenRouteService walking geometry and actual
  distance without safety or accessibility claims
- use the review tool to reorder, remove, annotate, approve, or reject
- require Paulo's review for every published trail

### Gate 3 — runtime trail experience

- compile reviewed trails into the city artifact
- load and query trails through the data worker
- render lines, ordered waypoints, trail details, and structured list equivalents
- support shareable trail URLs
- preserve custom tree-route building separately

### Gate 4 — seasonal onboarding and visual system

- guide first-time visitors without obscuring the map
- recommend seasonal and nearby trails with qualified language
- use a daylight, warm-paper interface with editorial typography, restrained
  botanical colour, and original hand-painted accents
- keep interactions familiar to Google Maps without copying its brand
- use subtle, interruptible transform/opacity motion and reduced-motion support

### Gate 5 — directions, hardening, and verification

- generate walking handoffs within provider URL limits
- divide long exports into ordered segments without losing stops
- pass static, unit, browser, accessibility, visual, offline-regression,
  performance, build, bundle, and deterministic-data gates

### Gate 6 — preview, production, and submission

- deploy one preview artifact
- test that exact artifact in clean desktop and mobile browsers
- promote it to the public production alias
- finish README, provenance, methodology, deployment, demo, and submission docs
- record a public sub-three-minute YouTube demo and submit before the deadline

## Scope protection

Do not add accounts, a runtime chatbot, live bloom detection, harvesting or food
safety claims, built-in turn-by-turn navigation, fully offline map tiles,
multiple cities, environmental-benefit forecasting, or community observations
before the launch gates pass.
