# Information architecture

## Primary model

The map is the spatial home. Search, filters, tree detail, and route building are contextual modes within the same map session, not separate full-screen products.

```text
Map session
|- City and season control
|- Search
|  |- Species result
|  `- Nearby matching specimens
|- Filters and layers
|  |- Primary intents
|  `- More filters
|- Selected tree
|  |- Identity and current state
|  |- Field guide detail
|  `- Actions
|- Nearby list (non-map alternative)
`- Route builder
   |- Stop list and reorder
   `- Route result and navigation
```

## Persistent controls

| Control | Mobile placement | Tablet and desktop placement | Behavior |
| --- | --- | --- | --- |
| City and season | top left | inspector header | Opens city context and daylight/dusk choice. |
| Search | top center | inspector header | Expands to the active search surface. |
| Location | top right | map toolbar | Centres only after permission and a successful fix. |
| Layers and filters | top right overflow | inspector toolbar | Opens progressive filters; never a permanent pill row. |
| Route capsule | above mobile sheet, when route has stops | inspector footer | Shows stop count and route state; opens builder. |

## Search information architecture

The accessible combobox groups results in this order: matching species, nearby matching specimens, neighbourhoods, then recent searches. A species result does not select a record immediately. It enters a nearby-matches view anchored to the user location when available, otherwise to the map centre, sorted by distance and bearing. The user chooses the specimen.

Search accepts common name, scientific name, genus, neighbourhood, and address fragments where data supports it. Results expose common name, scientific name, distance, bearing, and category as text. The default result count is five per group with an explicit "Show all" control.

## Filters and layers

Primary intents are: all curated, edible, blossoms, blooming now, and harvesting now. The first three are category filters. The last two are time-aware phenology filters. Secondary filters are distance, maturity, accessibility, health, and data source only where the dataset supports them.

The filter surface reports the result count and has one clear reset action. It keeps selections after closing. Filtering changes source-layer opacity and marker state without rebuilding all markers. Curated and municipal background layers can be independently toggled and are announced as distinct data sources.

## Tree inspector content order

1. Common name, category, and a concise current state such as "Harvesting now".
2. Walking distance, bearing, and address.
3. Primary actions: add to route, navigate.
4. Annual phenology band with the current date indicator.
5. Essential measurements: height, diameter, condition, maturity where available.
6. Verified media, editorial field-guide note, taxonomy, provenance, and last updated.
7. Secondary actions: save to passport, share, report observation, shown only when supported.

## Route builder

The route uses the same inspector or sheet, never a stacked modal. It shows ordered stops, route objective, route status, total distance and duration. Stop sequence appears as a numbered map symbol and an ordered list. Direct manipulation reordering is supplemented by Move earlier and Move later buttons. The builder can remain open while the map is explored.

## First-run content

The first run uses a dismissible inline note at the bottom of the initial map view. It states that curated trees are selected field-guide entries and municipal trees provide broader background context. It offers "See how data is sourced" and "Find trees near me". The latter is the first location-permission trigger. No blocking welcome modal is used.
