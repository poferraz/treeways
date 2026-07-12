# Urban Canopy Engine v2: Design Brainstorm

This document is intentionally first and standalone. Complete and approve this design phase before running the architecture and implementation plan in `2026-07-11-v2-02-engine-overhaul.md`.

## Prompt 1: Run the design phase

```text
You are a Principal Product Designer and world-class UI/UX Design Engineer with exceptional design taste. Work in the existing Vancouver Interactive Tree Map repository.

Your task is to complete the standalone v2 design phase before any architectural refactor or feature implementation begins.

Start by auditing the current product, index.html, src/index.css, src/components/drawer.js, src/map.js, existing product documentation, and the design brief in docs/plans/2026-07-11-v2-01-design-brainstorm.md. If PRODUCT.md or DESIGN.md is missing, create them from evidence in the repository and this brief.

Produce a decisive, implementation-ready design specification for a premium, map-first "living field guide" experience. Cover mobile, tablet, desktop, outdoor readability, seasonal palettes, typography, responsive information architecture, bottom-sheet behavior, desktop inspector behavior, search, filters, tree details, route building, onboarding, loading, empty, offline, and failure states. Define motion timings, critically damped spring behavior, reduced-motion behavior, accessibility requirements, exact design tokens, representative wireframes, and key interaction sequences.

Do not write production application code yet. You may create or update only design and product artifacts under PRODUCT.md, DESIGN.md, and docs/design/. Avoid generic glassmorphism, repetitive card grids, emoji controls, decorative gradients, and unrelated stock imagery. Seasonal color must communicate tree phenology rather than decorate the entire interface.

Conclude with a design acceptance checklist and a clear list of decisions that the implementation agent must preserve. Stop after the design artifacts are complete so they can be reviewed before Prompt 2 is run.
```

## 1. Design thesis

The physical scene should drive the experience: a person is walking outdoors, holding a phone one-handed in changeable daylight, trying to identify a nearby tree without losing spatial context.

The v2 direction is a **living field guide**: quiet, legible, botanical, seasonal, and map-first. It should feel authored and spatial rather than like a dashboard laid over a map.

The current Arboreal Obsidian system is visually coherent for a prototype, but permanent dark glass is poorly matched to outdoor use. The v2 interface should use a warm, lightly tinted daylight surface over a desaturated map, with a genuine dusk theme available when appropriate.

## 2. Design principles

1. **The map remains primary.** UI surfaces reveal themselves in response to intent and preserve geographic context.
2. **Season is information.** Blossom pink, canopy green, harvest amber, and dormant blue have stable semantic roles.
3. **Outdoor legibility wins.** Contrast, touch size, glare resistance, and one-handed reach matter more than decorative effects.
4. **Spatial continuity builds trust.** Selection, cluster expansion, search, sheet movement, and route creation preserve a clear origin and destination.
5. **Botanical data deserves editorial care.** Taxonomy, phenology, provenance, and verified media replace generic stock imagery.
6. **Motion explains state.** Animation is restrained, interruptible, transform-based, and never bouncy.
7. **Every map action has a non-map equivalent.** Nearby trees, routes, filters, and selection remain accessible as structured text.

## 3. Visual direction

### Theme

- Daylight mode uses warm, tinted neutrals and a quiet, desaturated map.
- Dusk mode uses ink and bark neutrals rather than pure black.
- Blur is limited to the mobile sheet edge and temporary search surface.
- Decorative glass panels, neon glows, generic statistic cards, and heavy shadows are removed.
- UI icons are authored SVGs, not emoji.
- Species media must be verified and attributed. When no trustworthy media exists, use a botanical placeholder or omit the image.

### Typography

- `Instrument Sans` for controls, labels, search, navigation, and compact metadata.
- `Newsreader` italic for scientific names and editorial species notes.
- Self-host WOFF2 subsets and preload only the critical weights.
- Use a hierarchy ratio of at least 1.25 and cap long-form content at 65 to 75 characters.

### Color system

Use OKLCH tokens with reduced chroma near lightness extremes. Never use pure black or pure white.

- Spring: blossom pink and young-leaf chartreuse.
- Summer: canopy green and cool shade.
- Autumn: harvest amber and russet.
- Winter: lichen blue and bark umber.

The active city manifest defines hemisphere and seasonal periods. The interface consumes semantic tokens such as:

```css
--surface-canvas
--surface-raised
--surface-scrim
--text-primary
--text-secondary
--border-subtle
--focus-ring
--season-accent
--phenology-bloom
--phenology-harvest
--phenology-canopy
--phenology-dormant
```

Filters retain stable meanings across seasons. A harvest marker does not become pink simply because the global theme is spring.

## 4. Responsive information architecture

### Mobile

- Top-left: compact city and season control.
- Top-center: search control that expands when invoked.
- Top-right: location and layer controls.
- Bottom sheet states:
  - **Peek:** selected species, walking distance, and current seasonal status.
  - **Half:** identity, address, phenology, essential measurements, and primary action.
  - **Full:** field-guide story, verified media, provenance, route actions, and accessibility information.
- A route capsule appears only after the first route stop is added.
- Filters live in a compact progressive surface rather than a permanent row of pills.

### Tablet and desktop

- Replace the full-width bottom sheet with a 380 to 440 px side inspector.
- Search results, tree detail, and route construction reuse the inspector instead of stacking overlays.
- Keep a large, uninterrupted map viewport and avoid centering content inside generic cards.
- Allow the inspector to collapse to a narrow spatial summary rail.

## 5. Key product surfaces

### Search

- Accessible combobox with species, common name, neighbourhood, and nearby matching trees.
- Results include distance and bearing from the user or map center.
- Keyboard navigation, escape-to-close, loading, empty, offline, and failure states are mandatory.
- Selecting a species should offer the nearest matching trees rather than choosing the first dataset record.

### Filters and layers

- Primary intents: all curated, edible, blossoms, blooming now, harvesting now.
- Secondary filters: distance, maturity, accessibility, health, and data source when supported.
- Filter transitions crossfade layer opacity and counts. They do not reconstruct map markers.
- Results announce visible counts and expose a clear reset action.

### Tree inspector

- Common name leads; scientific name is clearly subordinate and correctly italicized.
- Current seasonal state appears before static measurements.
- Phenology uses a readable annual band rather than twelve tiny equal cards.
- Height, diameter, address, condition, source, and last-updated metadata use compact rows.
- Primary actions: add to route and navigate.
- Secondary actions: save to passport, share, and report an observation where supported.

### Route builder

- Stop order is visible on both map and list.
- Loading, success, stale, offline, and provider-error states are explicit.
- Route objectives can include shortest, shade, bloom, and harvest where supported.
- Reordering uses direct manipulation with a keyboard-accessible alternative.

### First-run experience

- Use a short inline introduction, not a blocking modal.
- Explain curated versus municipal background trees.
- Ask for location permission only when the user invokes a location-dependent action.
- Make offline capability and data provenance discoverable without front-loading legal copy.

## 6. Motion and micro-interactions

- Tree selection creates a restrained map halo and opens the inspector without unnecessary camera movement.
- Cluster expansion uses spatially continuous camera motion.
- Sheet movement uses a critically damped, velocity-aware spring and never bounces.
- Adding a route stop moves the stop number into the map layer, then draws the route only after success.
- Phenology transitions between bloom, leaf, fruit, and dormant periods.
- Press, hover, focus, and selection: 120 to 180 ms.
- Panels and filter changes: 240 to 320 ms.
- Map and route choreography: 450 to 650 ms.
- Animate transform and opacity, not layout properties.
- Reduced-motion mode uses immediate state changes with short opacity fades only.

## 7. Accessibility and outdoor usability

- Minimum 44 by 44 px touch targets.
- WCAG 2.2 AA contrast in all seasonal themes.
- Visible keyboard focus and keyboard alternatives for map-only actions.
- Search uses correct combobox semantics.
- Inspector and sheet are labelled regions, not forced modals.
- Screen-reader announcements cover selection, filter results, routing, connectivity, and errors.
- High-contrast map mode is available.
- Nearby results have a structured list alternative.
- Safe areas, orientation changes, browser zoom, and 200 percent text zoom are supported.
- Do not apply global `touch-action: none` or disable page-level accessibility gestures.
- Do not force camera movement while the user is actively panning.

## 8. Required design artifacts

The design phase should produce:

```text
PRODUCT.md
DESIGN.md
docs/design/
├── information-architecture.md
├── responsive-wireframes.md
├── interaction-spec.md
├── motion-spec.md
├── accessibility-spec.md
├── content-guidelines.md
└── states-and-edge-cases.md
```

## 9. Design acceptance checklist

- Mobile, tablet, and desktop layouts are specified.
- Daylight, dusk, spring, summer, autumn, and winter token roles are defined.
- Search, selection, filtering, tree detail, routing, onboarding, offline, loading, empty, and failure flows are covered.
- Motion includes durations, easing or spring parameters, interruption behavior, and reduced-motion behavior.
- All controls have accessible names, keyboard behavior, and focus treatment.
- Verified media and attribution rules replace generic stock imagery.
- The design avoids decorative glass, generic card grids, emoji controls, gradient text, and bouncing motion.
- Implementation-critical decisions are documented before Prompt 2 begins.
