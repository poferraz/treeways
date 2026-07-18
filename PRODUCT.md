# Treeways

## Product definition

Treeways is a map-first field guide for people who want to understand a city through its trees. Vancouver launches with a clean highlight map, optional complete public inventory, density-led neighbourhood walks, municipal street-tree context, and external walking directions.

The product is not a general inventory browser. Its job is to answer: "What trees are worth noticing near me, and what route helps me compare them?"

## People and jobs

| Person | Situation | Job to be done |
| --- | --- | --- |
| Curious walker | Sees a tree while outdoors | Identify it without losing place on the map. |
| Fruit-tree observer | Wants to compare fruit-tree forms | Find nearby families without food-safety or harvesting claims. |
| Blossom seeker | Is planning a short walk | Compare flowering-tree relatives, with unknown timing kept explicit. |
| Accessibility-conscious visitor | Cannot rely on dense map interaction | Browse nearby trees, details, and routes as structured content. |

## Product promise

- The map stays visible and spatial context is never discarded for a generic dashboard.
- Seasonal guidance is useful but never presented as live observation without evidence.
- Tree facts are presented with botanical care, clear provenance, and no invented certainty.
- The interface works in sunlight, one-handed use, keyboard use, and reduced-motion settings.

## Current product audit

The current implementation has a MapLibre map, highlights-first city loading, optional complete inventory, filters, autocomplete, a three-state drawer, ordered personal stops, an external walking-directions handoff, and three Paulo-reviewed launch trails.

The v2 design retires permanent dark mode, broad glass surfaces, emoji controls, generic Unsplash species images, twelve equal month blocks, forced map recentering on every selection, and global gesture suppression. Search currently selects the first matching record; v2 must instead present nearby matching specimens. The existing selected tree, filters, route-stop list, data source, map, and state model are implementation inputs, not a contract for the final interface.

## Scope and constraints

- Initial city: Vancouver, British Columbia. The city manifest provides location, hemisphere, seasonal periods, and supported data sources.
- Curated records can coexist with municipal background records. They must remain visibly distinguishable.
- Municipal records can be incomplete. Missing values are shown as unavailable, never guessed.
- Reviewed pilot routing uses pinned OpenRouteService `foot-walking` results and can become stale; current personal directions are calculated by the external maps app.
- Location permission is optional and requested only after a location-dependent action.
- No unverified media is used as species evidence. Attribution travels with every verified image.

## Success criteria

- A person can choose a reviewed neighbourhood walk, understand its tree-rich areas and actual routed distance, and open its ordered stops in walking directions in a few deliberate actions.
- A person can search by common name, scientific name, neighbourhood, or nearby tree and choose among relevant specimens.
- Filters change the visible map layer without rebuilding markers or hiding the reset path.
- The same essential tasks are possible from structured lists without relying on the map.
- Every shipped state has a readable loading, empty, offline, and failure treatment.

## Non-goals for v2 design

- Crowdsourced observations, accounts, social feeds, and gamified collecting.
- Claims that a tree is edible, safe to eat, available to harvest, accessible, or on a safe route without specific evidence and review.
- A comprehensive inventory interface for every municipal field.
- Decorative seasonal reskins that alter the meaning of categorical markers.

## Design decisions to preserve

1. Use a daylight-first, warm-neutral surface with a manually selectable dusk mode. Do not return to permanent black glass.
2. Make season semantic: global season affects the environmental palette, while bloom, canopy, harvest, and dormant retain stable roles.
3. Keep the map primary. Mobile uses a bottom sheet; tablet and desktop use a side inspector.
4. Lead with common name and current seasonal state. Keep scientific name italic and subordinate.
5. Show annual phenology as continuous labeled bands, not twelve equal cards.
6. Search returns species and nearby specimens, not a silent first-record selection.
7. Treat verified media and attribution as data. Use a botanical placeholder or omit media when verification is absent.
8. Support non-map equivalents for nearby results, filters, route stop order, and selection.
9. Use restrained, interruptible transform and opacity motion. Reduced motion uses immediate state changes plus optional brief fades.
10. Never request location until the user invokes a location-dependent task.
11. Choose trail areas by overall tree density first; use popular-name themes such as Cherry blossoms as highlights.
12. Support both loops and point-to-point walking trails when the density pattern and routed overhead justify them.
13. Keep generated and routed pilots out of the catalogue until an identified human completes the review gate.
