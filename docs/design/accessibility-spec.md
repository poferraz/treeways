# Accessibility and outdoor usability specification

## Baseline

Meet WCAG 2.2 AA at minimum. Prioritize 4.5:1 contrast for standard text, 3:1 for large text and graphical controls, 44 by 44 px targets, visible focus, semantic HTML, and predictable keyboard behavior. Test in daylight, dusk, high-contrast map, 200% text zoom, narrow viewport, landscape phone, keyboard-only, screen reader, and reduced-motion modes.

## Landmarks and focus

- Map canvas: labeled region with an adjacent text alternative link.
- Search: labeled combobox with listbox semantics.
- Filters: labeled group with current result count in a polite live region.
- Inspector and sheet: labeled complementary region, not a modal by default.
- Route builder: labeled region with ordered list semantics.
- Temporary confirmation dialogs: use modal semantics only when user action must be confirmed. Return focus to the invoking control.

Focus order follows visual order. Opening a non-modal inspector does not steal focus from a map or list action. Opening the search surface moves focus to the input. Closing a search surface restores focus to the search trigger. A persistent 2 px `--focus-ring` outline with 2 px offset is visible against every seasonal theme and map surface.

## Keyboard equivalence

| Task | Keyboard path |
| --- | --- |
| Browse map results | Nearby results list, plus map marker focus where supported |
| Choose a tree | Enter or Space on a result or marker |
| Open and close detail | Enter or Space, then Escape or close button |
| Change sheet state | Handle button with Enter or Space; arrow keys offer next or previous state |
| Search results | Up and Down, Enter, Escape |
| Filters | Tab to controls, Space to toggle, Enter to apply secondary filters |
| Reorder stops | Move earlier and Move later buttons with ordinal announcement |
| Navigate route | Link or button with destination in accessible name |

## Screen-reader announcements

Use short, deduplicated polite announcements:

- "Japanese cherry selected. Blooming now. 180 metres north-east."
- "18 curated trees visible. Filters applied."
- "Stop 2 added: Apple tree."
- "Route ready: 1.4 kilometres, 18 minutes walking."
- "You are offline. Showing saved tree data."
- "Route could not be calculated. Try again or open directions for an individual tree."

Do not announce map marker changes continuously while panning. Do not use live regions for ordinary hover or pointer movement.

## Outdoor and device considerations

- Use opaque or near-opaque text surfaces over the map and avoid thin low-contrast type.
- Provide high-contrast map mode and make it discoverable in layers.
- Respect safe areas, orientation changes, browser zoom, text-only zoom, and system font scaling.
- Do not disable pinch zoom, browser gestures, text selection in content, or native sheet scrolling.
- Ensure colour is not the only indicator for bloom, canopy, harvest, or data source. Pair it with text and distinct marker shape or pattern.

## Media and content accessibility

Verified species media uses concise, specific alt text when it conveys field-identification value. Decorative placeholders use empty alt text and a visible text label such as "Image unavailable" when needed. Attribution links expose creator, license, and source. Scientific names use semantic emphasis where appropriate but remain readable when italics are unavailable.
