# Urban Canopy Engine v2 Design Specification

## Design read

Mobile-first public field guide for outdoor walkers, with a quiet editorial botanical language and a practical spatial interface. This is a redesign of the existing map prototype, not a dashboard rebuild.

**Design settings:** variance 4, motion 3, density 6. The composition is stable enough for public utility, information-dense enough for field data, and animated only where motion preserves spatial context or confirms a state change.

## Visual system

Daylight is the default because the primary use case is outdoors. It uses matte, lightly tinted surfaces over a desaturated map. Dusk is a user-selectable, system-aware alternative for low-light use. Both themes use the same semantic token names and hierarchy.

Instrument Sans is used for controls, UI labels, and metadata. Newsreader italic is reserved for scientific names and short editorial notes because those are the moments that benefit from a botanical, publishing-informed voice. Self-host WOFF2 subsets and preload only the UI regular and semibold files. Use `font-display: swap`, stable fallback metrics, and a 65-75 character line length for reading text.

All controls use authored SVGs from one icon family, such as Tabler or Phosphor. No emoji functions as an icon, status, or category label.

The base system uses a 4 px spacing unit. Target control height is 48 px, with a hard minimum target of 44 by 44 px. Radius rules are 12 px for inputs and contained surfaces, 16 px for sheets and inspectors, and full radius only for compact control chips. Shadows are low-contrast, tinted to the surface, and used only to separate a floating surface from the map.

## Token contract

All colour values are OKLCH. Production should place these in a single token file and resolve derived component styles from semantic names only. No component may use a raw seasonal colour as its default text or border colour.

| Token | Daylight | Dusk | Use |
| --- | --- | --- | --- |
| `--surface-canvas` | `oklch(0.97 0.012 92)` | `oklch(0.19 0.016 71)` | app and inspector base |
| `--surface-raised` | `oklch(0.99 0.008 94)` | `oklch(0.25 0.018 72)` | search, sheet, menu |
| `--surface-scrim` | `oklch(0.27 0.02 73 / 0.36)` | `oklch(0.08 0.012 68 / 0.54)` | media and map-legibility scrim |
| `--text-primary` | `oklch(0.25 0.025 67)` | `oklch(0.93 0.012 88)` | primary text |
| `--text-secondary` | `oklch(0.48 0.025 69)` | `oklch(0.74 0.02 83)` | metadata |
| `--border-subtle` | `oklch(0.82 0.018 82)` | `oklch(0.39 0.018 75)` | boundaries and dividers |
| `--focus-ring` | `oklch(0.54 0.13 226)` | `oklch(0.72 0.11 225)` | 2 px focus ring |
| `--phenology-bloom` | `oklch(0.68 0.13 8)` | `oklch(0.75 0.1 8)` | flowering period |
| `--phenology-canopy` | `oklch(0.56 0.12 145)` | `oklch(0.7 0.1 145)` | leaf and shade period |
| `--phenology-harvest` | `oklch(0.69 0.14 70)` | `oklch(0.77 0.11 72)` | fruit and nut period |
| `--phenology-dormant` | `oklch(0.59 0.07 238)` | `oklch(0.72 0.07 235)` | dormant period |

### Seasonal accent mapping

`--season-accent` changes only environmental accents such as the city-season label, selected map halo tint, and non-semantic decorative edge. It never changes filter identity or phenology-band meanings.

| Manifest season | Daylight `--season-accent` | Signal |
| --- | --- | --- |
| Spring | `oklch(0.7 0.11 8)` | blossom emergence |
| Summer | `oklch(0.59 0.12 145)` | canopy and shade |
| Autumn | `oklch(0.7 0.13 70)` | harvest and leaf change |
| Winter | `oklch(0.61 0.07 238)` | dormant structure |

## Contrast and map treatment

Body text must meet WCAG 2.2 AA, with an AAA target for common outdoor-reading text. Do not place text directly on a complex map without a solid or sufficiently opaque surface. The default map style is desaturated, low-label-density, and low-saturation; a high-contrast map option raises road, water, and tree-symbol separation without changing app colours. Markers use shape, label, and colour together. Selected state uses a ring and label, not glow alone.

## Layer scale

1. Map canvas
2. Map symbols and route line
3. Persistent controls
4. Temporary search results or filter surface
5. Inspector or bottom sheet
6. Dialog only when confirmation is genuinely blocking

## Implementation guardrails

- Use CSS custom properties and `data-theme` for daylight and dusk. Respect system preference until a user choice exists.
- Do not use global `touch-action: none`, fixed body locking, automatic camera motion during manual pan, or inline UI styles.
- Use transform and opacity only for animated transitions. Avoid blur except at the sheet edge and temporary search surface.
- All maps must have a synchronized structured list alternative and an accessible text summary of selected results.
- Loading placeholders reserve final content dimensions. Images reserve aspect ratio before fetching.

The detailed behavior is specified in [information architecture](docs/design/information-architecture.md), [wireframes](docs/design/responsive-wireframes.md), [interactions](docs/design/interaction-spec.md), [motion](docs/design/motion-spec.md), [accessibility](docs/design/accessibility-spec.md), [content](docs/design/content-guidelines.md), and [states](docs/design/states-and-edge-cases.md).

## Design acceptance checklist

- [x] Mobile, tablet, and desktop layouts define the map, controls, and inspector or sheet relationship.
- [x] Daylight and dusk themes, plus spring, summer, autumn, and winter semantic roles, are defined with OKLCH tokens.
- [x] Search, selection, filters, tree detail, route building, onboarding, loading, empty, offline, stale, and failure behavior are specified.
- [x] Motion specifies timings, curves, critically damped sheet physics, interruption, and reduced-motion behavior.
- [x] Controls have accessible names, focus treatment, keyboard behavior, structured alternatives, and screen-reader announcements.
- [x] Media verification and attribution rules replace generic stock imagery as botanical evidence.
- [x] The system avoids permanent decorative glass, generic card grids, emoji controls, gradient text, and bouncing motion.
- [x] Implementation-critical decisions are recorded in `PRODUCT.md` and must be preserved by the next phase.
