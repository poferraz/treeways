# Design Spec: Vancouver Public Trees Interactive Map

**Date**: 2026-07-11  
**Project**: Vancouver Public Trees ("Arboreal Obsidian")  
**Stack**: Vite + Vanilla JS + Vanilla CSS + MapLibre GL JS  

---

## 1. Purpose & Goals
The goal of this application is to provide Vancouver residents and visitors with an interactive, mobile-optimized map of the city's public boulevard and park trees. The app focuses on "tangible" usefulness:
*   **Fruit & Nut Trees**: Identify foraging locations (apples, plums, figs, walnuts) and their harvest seasons.
*   **Flowering Trees**: Map cherry blossoms, magnolias, and dogwoods, showing peak bloom times.
*   **Walking Trails**: Provide featured thematic walks and allow users to select multiple trees to build a custom walking route with turn-by-turn routing details.
*   **Google Maps Feel**: Optimized for phone use with a bottom drawer, smooth dragging, and high-performance vector map rendering.

---

## 2. Architecture & File Structure
This project is built as a static site using **Vite** for local development and build optimization. The architecture separates UI rendering, map rendering, API requests, and application state.

```text
public-trees/
├── index.html                 # App layout, responsive meta tags, and root container structures
├── package.json               # Vite project metadata
├── vite.config.js             # Vite configuration
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-07-11-vancouver-public-trees-design.md # This spec doc
├── src/
│   ├── main.js                # Core controller: initializes modules, coordinates state
│   ├── index.css              # Core design tokens (Arboreal Obsidian), layout, responsive styles
│   ├── map.js                 # MapLibre GL JS wrapper: handles map initialization, markers, paths, camera
│   ├── api.js                 # Network manager: handles OSRM walking routes & Vancouver Open Data API requests
│   ├── state.js               # Central store: tracks selected tree, custom route coordinates, active filters
│   ├── data/
│   │   └── curated_trees.json # Compressed local data (~10,000 trees: all edible fruits/nuts + mature showy blossoms)
│   └── components/
│       ├── drawer.js          # Bottom drawer: touch/drag slider, tree details card, seasonal calendar rendering
│       ├── route-panel.js     # Route details pane: handles listing stop names, distances, times, and clear actions
│       └── filter-pill.js     # Floating UI filters for quick categories (Fruits, Blossoms, Blooming/Harvesting Now)
```

---

## 3. Data & APIs

### A. Hybrid Data Strategy
To ensure immediate loading and offline-ready responsiveness on mobile phones, we use a hybrid database structure:
1.  **Local Curated Bundle (`src/data/curated_trees.json`)**: Contains 10,000 trees consisting of *all* edible fruit/nut trees in Vancouver plus a selection of mature, spectacular flowering trees (cherries, magnolias, dogwoods). To save bandwidth, this data is compressed into a flat JSON format (saving ~87% size, ~590KB total).
2.  **Live Bounding Box API**: When a user zooms in to view *all* generic street trees, the app fetches records dynamically using a spatial bounding box query:
    *   **Endpoint**: `https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/public-trees/records`
    *   **Parameters**: `where=in_bbox(geo_point_2d, S, W, N, E)&limit=100`

### B. Walking Routes API (OSRM)
Walking routes are generated in real-time using the Open Source Routing Machine (OSRM) public demo server.
*   **Request URL**: `https://router.project-osrm.org/route/v1/foot/lon1,lat1;lon2,lat2;lon3,lat3?geometries=geojson&overview=full`
*   **Payload**: Returns a JSON object with `geometry` (GeoJSON LineString) and summary info (`distance` in meters, `duration` in seconds).
*   **Map Rendering**: Drawn as a styled vector line layer directly onto the MapLibre canvas.

### C. Seasonal Calendar Definitions
Tree bloom and harvest schedules are mapped dynamically:
*   🌸 **Flowering Cherries** (*Prunus serrulata/yedoensis*): Bloom in **March - May**.
*   🌸 **Magnolias**: Bloom in **April - May**.
*   🌸 **Dogwoods** (*Cornus*): Bloom in **May - June**.
*   🍎 **Apples** (*Malus*): Bloom in **May**, harvest in **September - October**.
*   🍇 **Plums** (*Prunus domestica/cerasifera*): Bloom in **April**, harvest in **August - September**.
*   🌰 **Walnuts & Chestnuts** (*Juglans, Castanea*): Harvest in **September - October**.
*   🍫 **Hazelnuts** (*Corylus*): Harvest in **August - September**.

---

## 4. UI & Interaction Design
The design conforms to the **Arboreal Obsidian** system: a sleek, high-density dark mode featuring glassmorphic controls and vibrant pink highlights.

### A. Sliding Bottom Drawer
*   Three configurations:
    1.  **Collapsed (80px)**: Displays name of selected tree or current route status (e.g. "3 stops • 1.4 km").
    2.  **Half-Expanded (280px)**: Displays tree image, key dimensions (height, diameter), address, and actions ("Add to Route", "Navigate").
    3.  **Fully Expanded (85% height)**: Displays the horizontal 12-month bloom/harvest timeline, botanical notes, and custom route stops builder.
*   Implemented via native CSS transitions and touch drag listener.

### B. Visual Timeline Component
*   Horizontal calendar strip (Jan to Dec).
*   **Cherry Blossom Pink (#FFB7C5)** indicates blooming months.
*   **Forest Green (#2D5A27)** indicates harvest months.
*   A vertical indicator line highlights the current calendar month.

### C. MapLibre Custom Markers
*   Cherry Blossoms: Glowing pink circles (`#FFB7C5`).
*   Fruit/Nut Trees: Glowing orange/gold circles (`#FFA500`).
*   Active Route Stops: Sequentially numbered pins.
*   Selected Marker: Enlarged with a pulsing halo effect.

---

## 5. Verification Plan
*   **Component Verification**: Ensure the MapLibre instance loads and centers on Vancouver (`49.25512`, `-123.12999`).
*   **Data Integrity Check**: Verify the compressed JSON parse is successful, and coordinates map correctly to markers.
*   **Routing API Verification**: Mock route generation with coordinates in Kitsilano and confirm the OSRM request returns valid GeoJSON.
*   **Mobile Simulator Verification**: Test bottom sheet drag animations on narrow viewport sizes (<480px).
