# Motion specification

## Principles

Motion explains selection, spatial movement, and async progress. It never decorates a static surface, loops continuously, bounces, or competes with map navigation. All motion is interruptible by a new user action.

## Timing and curves

| Interaction | Duration | Curve or physics | Purpose |
| --- | ---: | --- | --- |
| Press, hover, focus | 140 ms | `cubic-bezier(.2, .8, .2, 1)` | tactile acknowledgement |
| Search and filter surface | 240 ms | `cubic-bezier(.2, .8, .2, 1)` | reveal a contextual layer |
| Inspector content replacement | 180 ms | opacity only | maintain selection continuity |
| Sheet snap | 280 ms typical | critically damped spring | sheet position confirmation |
| Map selection adjustment | 500 ms | MapLibre `easeTo`, ease-out | preserve spatial orientation |
| Cluster expansion and route fit | 600 ms max | MapLibre `easeTo`, ease-out | explain destination and extent |
| Route line reveal | 420 ms | opacity and dash offset if supported | confirm routing success |

The sheet spring uses a mass of 1, stiffness of 420, and damping of 42. It is critically damped in normal operation, velocity-aware at release, clamped to defined snap points, and never overshoots. If the implementation uses a different motion engine, tune it to equivalent non-bouncy behavior.

## Interaction choreography

- Selection: marker ring scales from 0.9 to 1 and fades in. Inspector content fades in after the selected marker state begins.
- Cluster: camera moves first, then child markers fade in as the map settles. The movement can be cancelled by a pointer pan.
- Filter: retained markers crossfade their opacity; entering markers fade in and leaving markers fade out. Reconstructing every marker is prohibited.
- Route: stop number appears at the marker, route request state is visible, then the line draws after a real success response.
- Phenology: only the current-state label and indicator shift. Annual bands do not animate as a decorative carousel.

## Reduced motion

Under `prefers-reduced-motion: reduce`, sheet and inspector state changes are immediate. Optional opacity changes are capped at 100 ms. Map camera movement is disabled except when the user explicitly activates a "Show on map" action, where a short 180 ms ease is allowed. Route lines appear immediately. No pulsing, spring, marker scale, or dash animation runs.

## Performance and interruption

Animate only `transform` and `opacity` outside the map renderer. Never animate layout measurements, blur radius, map style, marker width, or marker position in CSS. Cancel in-flight sheet, map, and route visual transitions when a newer selection or route request supersedes them. Route responses must be keyed to the stop-order version so a stale response cannot redraw the current route.
