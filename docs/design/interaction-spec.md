# Interaction specification

## Map selection

1. A marker receives pointer, keyboard, or list selection.
2. The marker gains a stable ring and label. The selected tree is announced with common name and current state.
3. If the user is not actively panning, the map may ease just enough to avoid the inspector or sheet obscuring the selection. It does not force a zoom change by default.
4. The sheet opens to full detail on mobile or the inspector opens to summary on larger viewports. A persistent Map action returns to the unobstructed canvas.
5. Selecting a different tree replaces only inspector content and preserves filter and route context.

Clusters show a count and expand on tap with a short continuous map transition. Individual points use a 36 px map hit area while retaining their smaller visual marker. The resulting trees are also exposed in the nearby list.

## Mobile sheet behavior

| State | Visible content | Invocation | Dismissal |
| --- | --- | --- | --- |
| Map | map canvas plus a 54 px Explore trees tab | tap or begin a gesture on the map; tap Map | tap Explore trees or upward drag |
| Peek | Trails and Trees near me entry points | initial load; tap Explore trees | tap Map or downward drag |
| Half | trail or route summary | upward drag from peek | Map, downward drag, or Close |
| Full | selected tree, trail catalogue, provenance, and route actions | select a tree; tap More detail | Map, downward drag, or Close |

Map and More detail are the primary controls; dragging is an enhancement rather than the only way to change state. Dragging starts only on the wide labeled handle. The content area keeps native vertical scroll. A 36 px directional drag advances one snap point. Touching the map immediately reveals the full canvas before pan or pinch continues. Close clears selection but does not clear active filters or route stops.

## Search combobox

- Input has `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, and a persistent accessible label. The compact phone bar uses the short visible prompt “Search”; wider layouts retain the full label.
- Arrow Down and Arrow Up move through options. Enter chooses the active option. Escape closes results and retains the query. Tab commits no selection unless an option is explicitly active.
- Query updates use a 150 ms input debounce. Loading is announced once, not on every keystroke.
- Choosing a species opens nearby matching specimens. Choosing a specimen selects it. Choosing a neighbourhood changes map view and opens nearby results.

## Filters

Primary filter changes apply immediately. Secondary filters are applied with an explicit Apply button so users can inspect multiple choices. Results announce "18 curated trees visible" after the map layer settles. Reset removes all filters, restores the curated layer, and leaves map position unchanged.

## Location

The location control explains why location is needed before requesting permission. On success, show a user marker with accuracy radius and sort results by user position. On denial, retain map-centre sorting and provide a non-blocking explanation. Do not repeatedly prompt after denial.

## Tree details and actions

Add to route confirms inline by changing to "Added as stop 2" and moves the numbered stop to the map layer. Navigate opens the configured external navigation handoff after the user has a selected destination. Share uses the platform share sheet when available and a copy-link fallback otherwise. Save and report actions are hidden when the supporting service is absent.

## Route builder

1. First stop creates the route capsule and confirms the ordered number.
2. Second stop begins route calculation and shows a reserved route summary area.
3. Success draws the line, reveals distance and duration, and announces it.
4. Reorder recalculates after drop or keyboard move. The old route remains faintly visible until the new one succeeds.
5. Remove and clear actions require no confirmation except a clear-all action with more than one stop.

Objectives are shortest, shade, bloom, and harvest. Unsupported objectives are disabled with an explanation, never shown as successful choices.

## Onboarding and data provenance

The orientation note can be dismissed and revisited from the city-season control. The data-source detail explains curated versus municipal records, the source organization, last update, known limitations, and media attribution. It does not interrupt the initial mapping task.
