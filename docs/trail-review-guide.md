# Trail review and publication gate

Treeways separates four states: generated candidate, ORS-routed pilot,
human-reviewed trail, and compiled public trail. Only the last state appears in
the visitor catalogue.

## Review each pilot

1. Open `docs/m3-b/review-tool.html` after running `npm run city:route-pilots`.
2. Inspect every individual member tree around each 70 m area. Confirm the stop
   is genuinely tree-rich and the friendly theme is useful without dominating
   the density decision.
3. Inspect the ORS walking geometry, actual distance, loop/point-to-point shape,
   anchor order, snap distances, and each leg.
4. Check the streets in a current map and in person where practical. Record
   concerns; do not infer accessibility, safety, or permission from imagery.
5. Rewrite the popular-name-led title and factual narrative in Paulo’s voice.
6. Keep accessibility, pedestrian plausibility, safety, right of access, and
   live conditions as `unknown`.
7. Approve or reject the candidate and record Paulo’s name and review date.
8. Export the reviewed source and run the city build and validation gates.

## Public wording

Before approval, call the records “candidates” or “routed pilots” and label them
`NOT HUMAN REVIEWED`. Do not expose them in the visitor catalogue.

After approval, “human reviewed” describes the editorial cluster selection,
route order, name, and narrative. It does not imply a professional safety,
accessibility, botanical-condition, or right-of-access inspection. Public
distance is the pinned ORS routed distance, not a straight-line estimate.
