# Trail review and release gate

Treeways never converts generated ordering into a human-review claim. The public
preview is functional, but each trail retains `status: suggested` until Paulo
Ferraz performs the checks below.

## Review each of the ten trails

1. Open the trail in Treeways on a phone.
2. Open both walking and driving handoffs in Google Maps.
3. Inspect the route at street level; remove private, inaccessible, implausible,
   or awkward stops.
4. Walk or drive the route where practical. Do not infer accessibility or safety
   from map imagery.
5. Confirm the public-tree record appears to match the street location. Record
   discrepancies instead of silently correcting City data.
6. Approve or rewrite the name, neighbourhood, description, mode, and stop order.
7. Keep bloom, fruit, edibility, permission, and accessibility unknown unless a
   cited source and the trail schema support the exact claim.
8. Record reviewer name and ISO review date.

The existing generated-candidate tool is
`docs/m3-b/review-tool.html`. Its giant-tree packet predates the consumer trail
catalogue and remains useful for measurement-focused review. A later gate should
compile approved Treeways routes into the city artifact through
`data/cities/vancouver/trails-review.json`.

## Public wording before sign-off

- Use `Preview routes`, `suggested`, and `route order is not human reviewed`.
- Describe sizes as straight-line spans between records.
- Let Google Maps state live street distance and duration.
- Do not use `safe`, `accessible`, `walkable`, `edible`, `in bloom`, or `ready to
  harvest` as route claims.

## Public wording after sign-off

`Human reviewed` may describe the editorial stop selection and order only. It
must not imply a professional safety, accessibility, botanical-condition, or
right-of-access inspection.
