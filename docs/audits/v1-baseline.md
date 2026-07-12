# v1 baseline — 2026-07-11

The preserved v1 fixture contains 10,000 curated trees across 49 species (608 KB raw JSON).
`npm test -- --run` passes four suites / five tests. The original audit measured 624.38 KB
JavaScript (177.26 KB gzip) plus 7.63 KB CSS (2.09 KB gzip), with MapLibre loaded separately.

Known defects: all trees were DOM markers, filters rebuilt tree objects and markers, state used
serialized equality, search selected the first match, and remote map, routing, media and live
tree APIs prevented reliable offline operation.
