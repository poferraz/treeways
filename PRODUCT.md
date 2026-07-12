# Vancouver Interactive Tree Map

## Product definition

Vancouver Interactive Tree Map is a map-first living field guide for people walking through Vancouver who want to find, identify, and return to notable urban trees. It combines a curated species layer with municipal street-tree context, seasonal phenology, and simple walking routes.

The product is not a general inventory browser. Its job is to answer a physical, time-sensitive question: "What is this nearby tree, and is it worth walking to now?"

## People and jobs

| Person | Situation | Job to be done |
| --- | --- | --- |
| Curious walker | Sees a tree while outdoors | Identify it without losing place on the map. |
| Seasonal forager | Wants edible trees at the right time | Find nearby, currently harvestable trees and plan a safe route. |
| Blossom seeker | Is planning a short walk | Find trees likely to be blooming now. |
| Accessibility-conscious visitor | Cannot rely on dense map interaction | Browse nearby trees, details, and routes as structured content. |

## Product promise

- The map stays visible and spatial context is never discarded for a generic dashboard.
- Seasonal status is current, understandable, and distinct from fixed categories.
- Tree facts are presented with botanical care, clear provenance, and no invented certainty.
- The interface works in sunlight, one-handed use, keyboard use, and reduced-motion settings.

## Current product audit

The current prototype has a useful foundation: MapLibre map, curated local data, viewport background trees, type and seasonal filters, autocomplete, a three-state drawer, and OSRM walking routes. The primary interaction path is real and should be preserved.

The v2 design retires permanent dark mode, broad glass surfaces, emoji controls, generic Unsplash species images, twelve equal month blocks, forced map recentering on every selection, and global gesture suppression. Search currently selects the first matching record; v2 must instead present nearby matching specimens. The existing selected tree, filters, route-stop list, data source, map, and state model are implementation inputs, not a contract for the final interface.

## Scope and constraints

- Initial city: Vancouver, British Columbia. The city manifest provides location, hemisphere, seasonal periods, and supported data sources.
- Curated records can coexist with municipal background records. They must remain visibly distinguishable.
- Municipal records can be incomplete. Missing values are shown as unavailable, never guessed.
- Routing depends on a provider and can be stale or unavailable.
- Location permission is optional and requested only after a location-dependent action.
- No unverified media is used as species evidence. Attribution travels with every verified image.

## Success criteria

- A person can select a nearby tree, understand its current seasonal state, and start navigation in a few deliberate actions.
- A person can search by common name, scientific name, neighbourhood, or nearby tree and choose among relevant specimens.
- Filters change the visible map layer without rebuilding markers or hiding the reset path.
- The same essential tasks are possible from structured lists without relying on the map.
- Every shipped state has a readable loading, empty, offline, and failure treatment.

## Non-goals for v2 design

- Crowdsourced observations, accounts, social feeds, and gamified collecting.
- Claims that a tree is safe to eat or currently harvestable without clear data support and local guidance.
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
