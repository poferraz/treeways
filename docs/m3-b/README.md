# M3-B trail review

**Status:** awaiting human review. M3-A (candidate generation) is committed at `f73589c`. The compiler at `src/domain/trails.js` enforces the M3 gate (no AI in the reviewer field, `accessibilityNotes` / `pedestrianPlausibility` must be the literal string `unknown`, narrative cannot mention walkable/safe/accessible/etc.).

## What's here

- `review-tool.html` — single-file interactive map for reviewing the 25 candidates. Double-click to open in a browser.
- The candidate packet is embedded directly into the HTML so the tool works offline-from-the-repo (you still need internet for the OSM basemap tiles).

## How to use

1. Open `docs/m3-b/review-tool.html` in a browser.
2. Click a candidate in the left sidebar — the map flies to the cell and highlights the waypoint trees + the proposed nearest-neighbour order (dashed line).
3. Fill in the approval form at the bottom:
   - **Name** — short, location-based, your voice.
   - **Narrative** — waypoint-oriented description of the trees, grounded in the measured facts. The form will block approval if the narrative uses any of these words: *accessible, safe, walkable, walking route, pedestrian-safe, permission, edible, bloom, harvest*.
   - **Reviewer** — your name. The form will block approval if it contains *ai, agent, or model* (the gate regex).
   - **Reviewed date** — pre-filled with today.
   - **Accessibility / pedestrian plausibility** — leave as the literal `unknown` (the gate enforces this).
4. Click **Approve & save draft**. The candidate gets a green badge in the sidebar.
5. Repeat for any other candidates you want to publish. Reject the rest.
6. Click **Download reviewed.json**. Save the file to `data/cities/vancouver/trails-review.json` (overwrite the empty stub there).
7. Run `npm run city:validate`. If it passes, M3-B is complete and the public artifact gets `trails` + `trailMembership` populated.

## What the gate checks (cheat sheet)

The compiler at `src/domain/trails.js::validateTrail()` enforces, per reviewed trail:

| Field | Requirement |
|---|---|
| `id` | unique, non-empty |
| `name` | non-empty, human-authored |
| `cityId` | must match the city being built (vancouver) |
| `sourceSnapshotSha256` | must match the current snapshot hash (regenerates after `npm run city:refresh`) |
| `candidateGeneratorVersion` | must match `m3-a-giant-measurements-v1` (current) |
| `review.status` | literal string `human-reviewed` |
| `review.reviewer` | non-empty, no `ai`/`agent`/`model` |
| `review.reviewedAt` | non-empty ISO date |
| `waypointTreeIds` | 2–20 entries, unique, all must exist in the tree inventory |
| `exportAnchors` | 2–5 entries, each `treeId` must be in `waypointTreeIds`, lat/lng must match the tree's exact WGS84 coordinates |
| `narrative` | non-empty, no forbidden words (see above) |
| `accessibilityNotes` | literal string `unknown` |
| `pedestrianPlausibility` | literal string `unknown` |

If the snapshot SHA changes between the candidate packet and your reviewed file, you must re-validate: open the regenerated `data/cities/vancouver/reports/trail-candidates.json`, copy the new `sourceSnapshotSha256` into your reviewed file.

## Refreshing the candidate packet

```bash
npm run city:refresh      # rebuilds snapshot + artifact + candidate packet
npm run city:validate     # re-runs all gates
```

The tool's embedded data is a one-time snapshot from `data/cities/vancouver/reports/trail-candidates.json`. If you regenerate it, re-run the injection step:

```bash
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('data/cities/vancouver/reports/trail-candidates.json','utf8'));const h=fs.readFileSync('docs/m3-b/review-tool.html','utf8');const d=JSON.stringify(p,null,2).replace(/<\//g,'<\\\\/');fs.writeFileSync('docs/m3-b/review-tool.html',h.replace(/<script type=\"application\/json\" id=\"candidate-data\">[\s\S]*?<\/script>/,'<script type=\"application/json\" id=\"candidate-data\">'+d+'</script>'));"
```
