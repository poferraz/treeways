# Responsive wireframes

## Mobile: 320-767 px

```text
+------------------------------------------------+
| City / season       Search              Locate |
|                                                |
|                 MAP CANVAS                     |
|                                                |
|                    selected marker             |
|                                                |
| [route capsule, conditional]                   |
|                                                |
|---------------- bottom sheet ------------------|
|              grab handle                        |
| Common name              Current seasonal state |
| distance, bearing                              |
+------------------------------------------------+
```

The sheet is the only persistent lower surface. It has peek, half, and full states. Peek leaves at least 62% of the short viewport visible where possible, including safe-area padding. At 320 px width, title and current state stack rather than truncate meaningful words. The primary actions stay in the reachable lower half when the sheet is half or full.

Search overlays from the top control and occupies the available vertical space above the sheet. Filters open as a compact surface attached to the top toolbar and can become a full-height sheet only when secondary filters are invoked.

## Tablet: 768-1023 px

```text
+-----------------------------------------------------------+
| Map toolbar                                                |
| +--------------------+  +--------------------------------+ |
| | Inspector 400 px   |  |                                | |
| | Search             |  |            MAP CANVAS          | |
| | Detail or route    |  |                                | |
| |                    |  |                                | |
| +--------------------+  +--------------------------------+ |
+-----------------------------------------------------------+
```

Use a left inspector, 400 px wide, with the map retaining the majority of the viewport. The inspector may collapse into a 64 px summary rail that keeps selection and route context visible. Do not use a full-width bottom sheet at this breakpoint except when the viewport height is under 560 px.

## Desktop: 1024 px and above

```text
+------------------------------------------------------------------+
| City / season                                      locate layers |
| +------------------------+  +----------------------------------+ |
| | Inspector 420 px       |  |                                  | |
| | Search                 |  |              MAP                 | |
| | Search results, detail |  |                                  | |
| | or route builder       |  |                                  | |
| |                        |  |                                  | |
| +------------------------+  +----------------------------------+ |
+------------------------------------------------------------------+
```

The inspector width is 420 px, clamped between 380 and 440 px. It is a labeled region with normal document scrolling. Search results, detail, and route builder reuse its contents. The map must retain a visible area of at least 640 px wide at 1280 px viewport width. The collapsed rail is 64 px wide and includes open inspector, active filter count, and route count.

## Inspector and sheet states

| State | Mobile | Tablet and desktop |
| --- | --- | --- |
| No selection | Inline orientation note or nearby list peek | Collapsed rail or nearby list inspector |
| Selected tree | Peek by default, half after explicit open or upward drag | Inspector opens to summary |
| Detail reading | Full sheet with scroll | Inspector scrolls in place |
| Route building | Half or full based on list length | Reuses inspector |
| Search | top overlay above sheet | Reuses inspector |

## Responsive rules

- Use dynamic viewport units and `env(safe-area-inset-*)`; do not use a fixed `100vh` assumption.
- At 200% text zoom, move header controls into two rows and preserve all labels. No content may be clipped by the map canvas.
- At landscape phone heights below 560 px, use a 56 px summary sheet and open details in a full-height region on request.
- Side inspector transitions occur at the viewport breakpoint, not device detection.
- Never overlap a map control with the system status bar, browser chrome, or bottom safe area.
