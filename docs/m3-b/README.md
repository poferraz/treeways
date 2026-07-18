# Three-pilot trail review

**Status:** all three trails were reviewed by Paulo on 2026-07-18 and compiled into the public city packs.

Treeways now starts with three density-first pilot areas:

- Mount Pleasant — Cherry blossoms
- Grandview-Woodland — Fruit-tree families
- Kitsilano — Maples

Each candidate has three to five distinct tree-rich areas. Overall public-tree
density determines which areas qualify; the friendly theme name is a highlight,
not the primary selection rule.

## Rebuild the review artifact

1. Add `OPENROUTESERVICE_API_KEY` to `.env.local`.
2. Run `npm run city:route-pilots` when the candidates or ORS graph changes. This snaps the area anchors, calculates a
   walking-distance matrix, chooses a loop or point-to-point order, requests the
   routed geometry, records the actual distance and ORS provenance, validates
   route quality, and rebuilds `review-tool.html`.
3. Open `docs/m3-b/review-tool.html` directly in a browser.

The review tool works as a standalone file. It shows every cluster member tree,
theme matches, area counts, routed path, ordered stops, distance, and provenance.

Current routed results:

- Mount Pleasant / Cherry blossoms — 6.1 km loop, large
- Grandview-Woodland / Fruit-tree families — 3.6 km point-to-point, medium
- Kitsilano / Maples — 3.3 km point-to-point, medium

## Human review

For each pilot, Paulo inspected cluster membership, path shape, area order,
name, narrative, and limitations. Approving requires an identified human reviewer
and an ISO review date. Accessibility, pedestrian plausibility, safety, right of
access, and live conditions remain the literal value `unknown`.

The approved export was imported with `city:import-reviewed`, compiled into both
packs with `city:publish-reviewed`, and checked with
`city:validate-published`. Only trails that pass the schema-v2 compiler enter the
public city artifact and catalogue. The published validator proves the approved
source, full pack, and deterministic highlight pack agree when ignored raw
pipeline inputs are not present in the isolated Build Week checkout.

Generated or merely routed candidates are never published automatically. These
three trails entered the catalogue only after Paulo's approval import.

## Compiler requirements

The release gate verifies:

- three to five unique cluster stops;
- 60–75 m cluster radii, at least eight trees per area, and at least three theme
  matches;
- no repeated member tree across areas;
- exact City-record anchor coordinates;
- loop or point-to-point anchor order matching the clusters;
- OpenRouteService `foot-walking` geometry, actual distance and duration;
- anchor snap no greater than 40 m, legs no greater than 2 km, and limited
  repeated geometry;
- source snapshot and generator provenance;
- identified human reviewer and review date;
- no unsupported safety, access, accessibility, condition, bloom, harvest, or
  edibility claims.
