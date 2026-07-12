# States and edge cases

## Loading

| Surface | Treatment | Accessibility |
| --- | --- | --- |
| Initial map | Static map frame, lightweight marker placeholders, concise status | "Loading map and tree data" once |
| Search | Result rows reserve text widths, no spinner-only state | "Searching" once per settled query |
| Tree detail | Summary retains selected name; content rows reserve height | selected tree announced before details load |
| Route | Stops remain visible; route summary shows calculation state | "Calculating walking route" |
| Verified media | Fixed aspect-ratio placeholder | image loading is not announced unless it changes content |

## Empty states

- No selection: show the orientation note and a nearby-list entry point.
- No route stops: route capsule is absent. Route builder explains that adding a first tree begins a route.
- One route stop: show the stop and invite a second stop. Do not show misleading distance or time.
- No filter matches: keep map position, show count zero, offer reset and search-area actions.
- No municipal data: retain curated results and state that background data is unavailable for this area.

## Connectivity and stale data

On offline detection, preserve already loaded tree details, phenology, saved route stops, and cached map area where feasible. Mark network-dependent information, such as live municipal records and new routes, as unavailable. Never erase a selection simply because the network changes.

For stale route results, keep the previous route visually subdued and label it "Route may be out of date" until recalculation succeeds. A route response is discarded if its stop-order version is not current. If the provider returns an error, expose retry and individual-tree navigation rather than a blank route surface.

## Permission outcomes

| Outcome | Behavior |
| --- | --- |
| Not requested | Sort nearby results from map centre and explain location is optional. |
| Granted | Show accuracy radius, sort from user location, and offer recenter. |
| Denied | Keep map-centre experience. Provide no repeated prompt. |
| Unavailable | State that location is unavailable and retain manual map browsing. |

## Data quality

- Duplicate records: de-duplicate by stable asset ID; present a source warning if merged values conflict.
- Missing coordinates: omit from the map and include only in a data-quality report, never a nearby list.
- Missing or invalid phenology: omit the annual band and show "Seasonal timing not recorded".
- Unknown species: preserve the source label, use "Species not recorded", and do not attach species-level imagery or claims.
- Incomplete address: show the available locality or block-level address without inventing precision.

## Map interaction conflicts

If a user is panning, do not auto-centre or fit bounds. Pause automatic location follow until the user explicitly recentres. Keep sheet scrolling separate from map gestures by accepting drag only on its handle and header. A long press on a map should not accidentally open the sheet. On touch devices, controls retain normal browser pinch zoom and accessibility gestures.

## Failure hierarchy

1. Preserve user input and current map position.
2. Explain which capability failed in plain language.
3. Offer the smallest useful recovery action.
4. Provide a non-network alternative when available.
5. Log technical detail privately; do not expose raw API errors as user-facing copy.
