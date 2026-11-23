# v1 baseline — 2026-07-11

The v1 fixture contained 10,000 curated trees across 49 species (608 KB raw JSON). The pre-Build Week commit preserves that dataset. [Historical fixture](https://github.com/poferraz/treeways/blob/796fcb91a898a55a826f976c349915b307d14179/src/data/curated_trees.json)

At the time of the audit, `npm test -- --run` passed four suites / five tests. The original audit measured 624.38 KB JavaScript (177.26 KB gzip) plus 7.63 KB CSS (2.09 KB gzip), with MapLibre loaded separately.

The audit found that all trees used DOM markers, filters rebuilt tree objects and markers, state used serialized equality, and search selected the first match. Dependencies on remote map, routing, media and live tree APIs prevented reliable offline operation.
