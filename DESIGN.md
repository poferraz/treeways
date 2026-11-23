# Treeways design

Treeways pairs a quiet map with a field guide that can be read outdoors. Daylight uses warm paper-coloured surfaces over a desaturated basemap. Dusk is a manual choice. Use the shared colour tokens for both themes, system sans-serif type for controls and serif type for tree names and headings. [Theme tokens](src/styles/tokens.css) · [Base styles](src/styles/base.css)

## Map and list

On a phone, a bottom sheet holds nearby trees, trails and details. The sheet has labelled buttons as well as a draggable handle, so a walker can return to the map or open details with one hand. Wider screens use a side inspector. Keep the provider credits reachable at each screen size. [Layout styles](src/styles/app-shell.css)

Keep the tree list a complete way to select a tree. The skip link leads to nearby results, the search combobox supports arrow keys and Enter, and the route builder has buttons to move each stop earlier or later. Announce meaningful changes such as a selection, applied filter or offline state through the live region. [Keyboard journeys](tests/e2e/app.spec.js)

## Accessibility and outdoor reading

- Use labelled controls, visible keyboard focus and text labels for categories and status. Put text over a solid surface where the basemap would make it hard to read.
- Aim for WCAG AA contrast and 44-by-44-pixel touch targets. Check changes in both themes, on a narrow screen, at 200% text zoom and with keyboard navigation.
- Respect reduced-motion preferences for the sheet and camera. Keep browsing and search usable when the browser cannot draw the map. [Accessibility checks](tests/e2e/accessibility.spec.js) · [Map fallback test](tests/e2e/map-fallback.spec.js)

## Tree and trail wording

Lead with the common name, followed by the scientific name. Label measurements with units and identify the origin for nearby distances. A fruit-tree family is a botanical category. A missing measurement or unverified seasonal date should read as unknown. Published trail distances come from their recorded walking routes. Keep source licences, attribution and the limits of human review available alongside these claims. [Data provenance](docs/data-provenance.md) · [Trail review guide](docs/trail-review-guide.md)
