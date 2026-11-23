# Treeways

Treeways helps someone on foot find nearby trees worth noticing and a neighbourhood walk that connects them. Vancouver’s municipal tree inventory supplies the tree records. The map and the list give visitors two ways to browse them.

## Choosing what to show

The opening view uses 6,509 highlights from a city pack of 185,307 public trees. It represents tree-rich areas, flowering and fruit-tree families, large recorded trees and the members of the reviewed trails. The complete inventory is available for search, filters and the **All public trees** switch. [Highlight selection](src/domain/tree-highlights.js)

Treeways groups nearby public trees by density to propose walks. Familiar themes help a visitor choose among them. A published walk can be a loop or point-to-point route, depending on the measured walking distance and return leg. The catalogue requires an identified human reviewer to approve the trail. Paulo reviewed the three launch trails in Mount Pleasant, Grandview-Woodland and Kitsilano on July 18, 2026. [Reviewed trail source](data/cities/vancouver/trails-review.json) · [Build Week record](BUILD_WEEK.md)

## Using a walk

Visitors can browse from the map centre or choose **Near me** to sort trees from their position. A trail shows its ordered stops, pinned walking geometry and distance. Visitors can also select individual trees, arrange their own stops and open current walking directions in Google Maps. Saved city data can be reopened offline. The external basemap and fresh directions need a connection. [Privacy](docs/privacy.md)

The City inventory establishes which trees were recorded. Bloom timing, harvest readiness and access require other evidence. Human trail review covers the selected areas, order, names and descriptions. Pedestrian safety, accessibility and current conditions remain unknown. [Data provenance](docs/data-provenance.md) · [Trail review guide](docs/trail-review-guide.md)
