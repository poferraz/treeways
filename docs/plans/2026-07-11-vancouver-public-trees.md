# Vancouver Public Trees Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal**: Build a premium, mobile-optimized, offline-first interactive map of Vancouver's public fruit and flowering trees with walk route planning.

**Architecture**: A modular Vite Single Page Application using MapLibre GL JS for vector maps, a custom state manager (`state.js`) for loose coupling, and OSRM for walking route geometry.

**Tech Stack**: Vite, Vanilla JS, Vanilla CSS, MapLibre GL JS, Vitest (for unit tests).

---

## Plan Checklist

### Task 1: Project Scaffolding & Testing Environment
**Files**:
*   Create: `package.json`
*   Create: `vite.config.js`
*   Create: `index.html`
*   Create: `vitest.config.js`
*   Test: `tests/setup.js`

**Step 1: Write a basic configuration test**
Create `tests/setup.test.js`:
```js
import { describe, it, expect } from 'vitest';
describe('Environment Setup', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true);
  });
});
```
**Step 2: Run test to verify setup**
Run: `npm install && npx vitest run tests/setup.test.js`
Expected: PASS

**Step 3: Write configurations**
Create `package.json`:
```json
{
  "name": "vancouver-public-trees",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "maplibre-gl": "^4.5.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "jsdom": "^24.0.0"
  }
}
```
Create `vite.config.js`:
```js
import { defineConfig } from 'vite';
export default defineConfig({
  server: {
    port: 3000
  }
});
```
Create `vitest.config.js`:
```js
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'jsdom'
  }
});
```
Create `index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Vancouver Public Trees</title>
  <link rel="stylesheet" href="/src/index.css">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌸</text></svg>">
</head>
<body>
  <div id="app">
    <div id="map-container"></div>
    <div id="floating-ui">
      <!-- Search bar & filters -->
      <div class="search-container">
        <input type="text" id="search-input" placeholder="Search trees or species..." autocomplete="off">
        <div id="search-suggestions" class="suggestions-dropdown hidden"></div>
      </div>
      <div id="filter-pills" class="filter-container">
        <button class="filter-pill active" data-filter="all">🌳 All Curated</button>
        <button class="filter-pill" data-filter="fruit">🍎 Edible Fruits</button>
        <button class="filter-pill" data-filter="flower">🌸 Blossoms</button>
        <button class="filter-pill" data-filter="bloom-now">✨ Blooming Now</button>
        <button class="filter-pill" data-filter="harvest-now">🧺 Harvesting Now</button>
      </div>
    </div>
    
    <!-- Google Maps-style Bottom Sheet -->
    <div id="bottom-sheet" class="bottom-sheet collapsed">
      <div class="drag-handle-container" id="drag-handle-container">
        <div class="drag-handle"></div>
      </div>
      <div class="sheet-content" id="sheet-content">
        <!-- Templates will render here dynamically -->
      </div>
    </div>
  </div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

**Step 4: Verify test suite runs**
Run: `npm run test -- --run`
Expected: PASS

**Step 5: Commit**
```bash
git add package.json vite.config.js vitest.config.js index.html tests/setup.test.js
git commit -m "chore: scaffold project files and testing environment"
```

---

### Task 2: State Manager (`state.js`)
**Files**:
*   Create: `src/state.js`
*   Create: `tests/state.test.js`

**Step 1: Write failing state manager tests**
Create `tests/state.test.js` verifying subscription events and state updates.
```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { state } from '../src/state.js';

describe('State Manager', () => {
  beforeEach(() => {
    state.reset();
  });

  it('should notify subscribers when selected tree changes', () => {
    const callback = vi.fn();
    state.subscribe('selectedTree', callback);
    state.setSelectedTree({ id: 1, name: 'Cherry' });
    expect(callback).toHaveBeenCalledWith({ id: 1, name: 'Cherry' });
  });

  it('should manage custom route stops', () => {
    state.addRouteStop({ id: 1, lat: 49, lng: -123 });
    expect(state.getRouteStops()).toHaveLength(1);
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/state.test.js`
Expected: FAIL (Cannot find module '../src/state.js')

**Step 3: Implement state manager**
Create `src/state.js`:
```js
class StateManager {
  constructor() {
    this.reset();
  }

  reset() {
    this._state = {
      selectedTree: null,
      activeFilters: 'all',
      customRouteStops: [], // Array of stops: { id, name, lat, lng }
      currentRouteGeometry: null, // OSRM GeoJSON geometry
      currentRouteInfo: null, // { distance, duration }
      uiState: 'collapsed', // collapsed, half, expanded
      curatedTrees: [], // list of trees loaded initially
      currentMonth: new Date().getMonth() + 1 // 1-indexed (1 = Jan, 12 = Dec)
    };
    this._listeners = {};
  }

  subscribe(key, callback) {
    if (!this._listeners[key]) {
      this._listeners[key] = [];
    }
    this._listeners[key].push(callback);
    // Call immediately with initial value
    callback(this._state[key]);
    return () => {
      this._listeners[key] = this._listeners[key].filter(cb => cb !== callback);
    };
  }

  _notify(key) {
    if (this._listeners[key]) {
      this._listeners[key].forEach(callback => callback(this._state[key]));
    }
  }

  get(key) {
    return this._state[key];
  }

  set(key, value) {
    if (JSON.stringify(this._state[key]) !== JSON.stringify(value)) {
      this._state[key] = value;
      this._notify(key);
    }
  }

  setSelectedTree(tree) {
    this.set('selectedTree', tree);
    if (tree) this.set('uiState', 'half');
  }

  addRouteStop(tree) {
    const stops = [...this._state.customRouteStops];
    if (!stops.some(s => s.id === tree.id)) {
      stops.push({
        id: tree.id,
        name: tree.name,
        lat: tree.lat,
        lng: tree.lng
      });
      this.set('customRouteStops', stops);
    }
  }

  removeRouteStop(treeId) {
    const stops = this._state.customRouteStops.filter(s => s.id !== treeId);
    this.set('customRouteStops', stops);
  }

  clearRoute() {
    this.set('customRouteStops', []);
    this.set('currentRouteGeometry', null);
    this.set('currentRouteInfo', null);
  }

  getRouteStops() {
    return this._state.customRouteStops;
  }
}

export const state = new StateManager();
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/state.test.js`
Expected: PASS

**Step 5: Commit**
```bash
git add src/state.js tests/state.test.js
git commit -m "feat: implement state manager with reactivity subscription model"
```

---

### Task 3: API & Route Services (`api.js`)
**Files**:
*   Create: `src/api.js`
*   Create: `tests/api.test.js`

**Step 1: Write failing API test**
Create `tests/api.test.js` mocking fetches to OSRM and Vancouver API.
```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../src/api.js';

describe('API Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch route details from OSRM', async () => {
    const mockRouteGeoJSON = { type: 'LineString', coordinates: [[-123, 49], [-123.1, 49.1]] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        routes: [{
          geometry: mockRouteGeoJSON,
          distance: 1200,
          duration: 900
        }]
      })
    });

    const route = await api.fetchRoute([
      { lat: 49, lng: -123 },
      { lat: 49.1, lng: -123.1 }
    ]);
    expect(route.distance).toBe(1200);
    expect(route.geometry.type).toBe('LineString');
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/api.test.js`
Expected: FAIL (Cannot find module '../src/api.js')

**Step 3: Implement API wrapper**
Create `src/api.js`:
```js
export const api = {
  /**
   * Fetches walking route connecting coordinate stops
   * @param {Array<{lat, lng}>} stops 
   * @returns {Promise<{geometry, distance, duration}>}
   */
  async fetchRoute(stops) {
    if (!stops || stops.length < 2) return null;
    const coordString = stops.map(s => `${s.lng},${s.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/foot/${coordString}?geometries=geojson&overview=full`;
    
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`OSRM HTTP error: ${res.status}`);
      const data = await res.json();
      if (!data.routes || data.routes.length === 0) return null;
      
      return {
        geometry: data.routes[0].geometry,
        distance: data.routes[0].distance, // meters
        duration: data.routes[0].duration // seconds
      };
    } catch (e) {
      console.error("Failed to calculate route:", e);
      return null;
    }
  },

  /**
   * Fetches generic street trees in a bounding box (live API query fallback)
   */
  async fetchTreesInBounds(south, west, north, east) {
    const query = `in_bbox(geo_point_2d, ${south}, ${west}, ${north}, ${east})`;
    const url = `https://opendata.vancouver.ca/api/explore/v2.1/catalog/datasets/public-trees/records?where=${encodeURIComponent(query)}&limit=100`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`OpenData HTTP error: ${res.status}`);
      const data = await res.json();
      return (data.results || []).map(t => ({
        id: t.asset_id,
        name: t.common_name,
        genus: t.genus_name,
        species: t.species_name,
        height: t.height_m,
        diameter: t.diameter_cm,
        address: t.address,
        lat: t.geo_point_2d?.lat,
        lng: t.geo_point_2d?.lon,
        type: 'shade', // generic background trees
        tags: ['street-tree'],
        bloom: [],
        harvest: [],
        usefulness: 'Provides urban canopy, carbon sequestration, and shade.'
      })).filter(t => t.lat && t.lng);
    } catch (e) {
      console.error("Failed to fetch trees in bounds:", e);
      return [];
    }
  }
};
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/api.test.js`
Expected: PASS

**Step 5: Commit**
```bash
git add src/api.js tests/api.test.js
git commit -m "feat: create api manager for live bounding box queries and OSRM walking routes"
```

---

### Task 4: Design Tokens & Base CSS (`index.css`)
**Files**:
*   Create: `src/index.css`

**Step 1: Write index.css with Arboreal Obsidian theme**
Create `src/index.css` containing variables, fonts, glassmorphism filters, bottom drawer layout, and smooth animations:
```css
/* Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  /* Colors */
  --bg-primary: #0F0F0F;
  --bg-surface: #1A1A1A;
  --bg-glass: rgba(26, 26, 26, 0.7);
  --border-glass: rgba(255, 255, 255, 0.1);
  --text-primary: #FFFFFF;
  --text-secondary: #A0A0A0;
  --text-dark: #000000;
  
  --primary-green: #2D5A27;
  --primary-green-glow: rgba(45, 90, 39, 0.4);
  --accent-pink: #FFB7C5;
  --accent-pink-glow: rgba(255, 183, 197, 0.4);
  --accent-gold: #FFA500;
  
  /* Layout & Radii */
  --radius-lg: 24px;
  --radius-md: 16px;
  --radius-sm: 8px;
  
  font-family: 'Inter', sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100vh;
  width: 100vw;
}

body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  position: fixed;
  touch-action: none;
}

#app {
  position: relative;
  width: 100%;
  height: 100%;
}

/* Map Containers */
#map-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

/* Floating UI */
#floating-ui {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.search-container, .filter-container {
  pointer-events: auto;
}

/* Glassmorphic Search Bar */
.search-container {
  position: relative;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

#search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 14px 20px;
  font-size: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-glass);
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: var(--text-primary);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
}

#search-input:focus {
  outline: none;
  border-color: var(--accent-pink);
  box-shadow: 0 8px 32px var(--accent-pink-glow);
}

/* Autocomplete Suggestion Dropdown */
.suggestions-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--bg-surface);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  max-height: 240px;
  overflow-y: auto;
  z-index: 100;
}

.suggestion-item {
  padding: 12px 20px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.suggestion-item:hover, .suggestion-item.active {
  background: rgba(255, 255, 255, 0.05);
}

.suggestion-item .scientific {
  font-size: 12px;
  color: var(--text-secondary);
  font-style: italic;
}

/* Floating Filter Pills */
.filter-container {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px;
  scrollbar-width: none; /* Hide scrollbar for Firefox */
  -ms-overflow-style: none; /* Hide scrollbar for IE/Edge */
}

.filter-container::-webkit-scrollbar {
  display: none; /* Hide scrollbar for Chrome/Safari */
}

.filter-pill {
  flex-shrink: 0;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 999px;
  border: 1px solid var(--border-glass);
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-pill:hover {
  color: var(--text-primary);
  border-color: rgba(255, 255, 255, 0.3);
}

.filter-pill.active {
  color: var(--text-dark);
  background: var(--accent-pink);
  border-color: var(--accent-pink);
  box-shadow: 0 4px 12px var(--accent-pink-glow);
}

/* Google Maps-style Bottom Sheet */
.bottom-sheet {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  background: linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-primary) 100%);
  border-top: 1px solid var(--border-glass);
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5);
  transform: translateY(calc(100% - 80px)); /* default collapsed showing 80px */
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  max-height: 85vh;
}

.bottom-sheet.half {
  transform: translateY(calc(100% - 280px));
}

.bottom-sheet.expanded {
  transform: translateY(15vh);
}

/* Handle Bar for dragging */
.drag-handle-container {
  width: 100%;
  padding: 12px 0;
  display: flex;
  justify-content: center;
  cursor: grab;
  touch-action: none;
}

.drag-handle-container:active {
  cursor: grabbing;
}

.drag-handle {
  width: 40px;
  height: 4px;
  background-color: var(--border-glass);
  border-radius: 999px;
  transition: background-color 0.2s ease;
}

.bottom-sheet:hover .drag-handle {
  background-color: rgba(255, 255, 255, 0.3);
}

.sheet-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px 24px;
}

/* Tree Detail Card Styling */
.tree-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.tree-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.tree-scientific {
  font-size: 14px;
  font-style: italic;
  color: var(--text-secondary);
  margin-top: 4px;
}

.tag-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tag-badge.flower {
  background-color: var(--accent-pink-glow);
  color: var(--accent-pink);
}

.tag-badge.fruit {
  background-color: rgba(255, 165, 0, 0.2);
  color: var(--accent-gold);
}

.tag-badge.both {
  background-color: rgba(161, 212, 148, 0.2);
  color: #a1d494;
}

.tree-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  padding: 12px;
  text-align: center;
}

.stat-label {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 15px;
  font-weight: 700;
}

/* Seasonal Timeline Calendar */
.timeline-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.calendar-strip {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 4px;
  position: relative;
  background: rgba(255, 255, 255, 0.02);
  padding: 6px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-glass);
}

.calendar-month {
  text-align: center;
  padding: 8px 0;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  position: relative;
  transition: all 0.2s ease;
}

.calendar-month.bloom {
  background: var(--accent-pink-glow);
  color: var(--accent-pink);
  border: 1px solid var(--accent-pink);
}

.calendar-month.harvest {
  background: rgba(45, 90, 39, 0.3);
  color: #a1d494;
  border: 1px solid var(--primary-green);
}

.calendar-month.both {
  background: linear-gradient(135deg, var(--accent-pink-glow) 0%, rgba(45, 90, 39, 0.3) 100%);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.calendar-month.current-month::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--text-primary);
  box-shadow: 0 0 8px #FFFFFF;
}

.usefulness-card {
  background: rgba(255, 255, 255, 0.02);
  border-left: 3px solid var(--accent-pink);
  padding: 16px;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 24px;
}

/* Button Actions */
.action-buttons {
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
  padding: 14px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  border: none;
}

.btn-primary {
  background: var(--accent-pink);
  color: var(--text-dark);
}

.btn-primary:hover {
  box-shadow: 0 4px 12px var(--accent-pink-glow);
  transform: translateY(-1px);
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--border-glass);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

/* Custom Route Pane Layout */
.route-pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.route-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-glass);
  padding-bottom: 12px;
}

.route-meta {
  font-size: 15px;
  font-weight: 700;
}

.route-stops-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.route-stop-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stop-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stop-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--accent-pink);
  color: var(--text-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.stop-name {
  font-size: 14px;
  font-weight: 600;
}

.remove-stop-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
}

.remove-stop-btn:hover {
  color: #ffb4ab;
}

/* Utility Hidden state */
.hidden {
  display: none !important;
}
```

**Step 2: Commit styling**
```bash
git add src/index.css
git commit -m "style: implement visual elements and glassmorphism styling"
```

---

### Task 5: Interactive Bottom Sheet Component (`drawer.js`)
**Files**:
*   Create: `src/components/drawer.js`
*   Create: `tests/drawer.test.js`

**Step 1: Write failing Drawer tests**
Create `tests/drawer.test.js` verifying drawer height and template compilation.
```js
import { describe, it, expect, beforeEach } from 'vitest';
import { Drawer } from '../src/components/drawer.js';
import { state } from '../src/state.js';

describe('Drawer Component', () => {
  let drawerEl, contentEl;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="bottom-sheet" class="bottom-sheet collapsed">
        <div id="drag-handle-container"></div>
        <div id="sheet-content"></div>
      </div>
    `;
    drawerEl = document.getElementById('bottom-sheet');
    contentEl = document.getElementById('sheet-content');
  });

  it('should compile detail templates correctly', () => {
    const d = new Drawer(drawerEl, contentEl);
    const mockTree = {
      id: 1,
      name: 'Cherry',
      genus: 'Prunus',
      species: 'Serrulata',
      height: 4.5,
      diameter: 12,
      address: 'Kitsilano',
      bloom: [3, 4],
      harvest: [],
      type: 'flower',
      usefulness: 'Pretty blossoms'
    };
    const html = d.compileDetailTemplate(mockTree);
    expect(html).toContain('KWANZAN'); // defaults to Kwanzan Cherry details name or spec title
  });
});
```

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/drawer.test.js`
Expected: FAIL (Cannot find module '../src/components/drawer.js')

**Step 3: Implement Drawer class**
Create `src/components/drawer.js`:
```js
import { state } from '../state.js';

export class Drawer {
  constructor(element, contentElement) {
    this.element = element;
    this.contentElement = contentElement;
    this.startY = 0;
    this.currentTranslateY = 0;
    this.isDragging = false;
    
    this.initDragEvents();
    this.initListeners();
  }

  initListeners() {
    // Listen to changes in selectedTree, customRouteStops, and uiState
    state.subscribe('uiState', (uiState) => {
      this.updateStateClass(uiState);
    });

    state.subscribe('selectedTree', (tree) => {
      if (tree) {
        this.renderTreeDetails(tree);
      } else if (state.get('customRouteStops').length > 0) {
        this.renderRouteInfo();
      } else {
        this.renderEmptyState();
      }
    });

    state.subscribe('customRouteStops', (stops) => {
      if (!state.get('selectedTree') && stops.length > 0) {
        this.renderRouteInfo();
      }
    });
  }

  updateStateClass(uiState) {
    this.element.classList.remove('collapsed', 'half', 'expanded');
    this.element.classList.add(uiState);
    
    // Clear inline transforms if state is updated programmatically
    this.element.style.transform = '';
  }

  initDragEvents() {
    const handle = document.getElementById('drag-handle-container');
    if (!handle) return;

    const startDrag = (y) => {
      this.startY = y;
      this.element.style.transition = 'none';
      this.isDragging = true;
    };

    const moveDrag = (y) => {
      if (!this.isDragging) return;
      const deltaY = y - this.startY;
      if (deltaY > 0) {
        // Dragging down
        this.element.style.transform = `translateY(${deltaY}px)`;
      }
    };

    const endDrag = (y) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.element.style.transition = '';
      this.element.style.transform = '';
      
      const deltaY = y - this.startY;
      const threshold = 100;
      
      const currentUi = state.get('uiState');
      if (deltaY > threshold) {
        // Collapse or scale down
        if (currentUi === 'expanded') {
          state.set('uiState', 'half');
        } else if (currentUi === 'half') {
          state.set('uiState', 'collapsed');
        }
      } else if (deltaY < -threshold) {
        // Expand
        if (currentUi === 'collapsed') {
          state.set('uiState', 'half');
        } else if (currentUi === 'half') {
          state.set('uiState', 'expanded');
        }
      }
    };

    handle.addEventListener('mousedown', (e) => startDrag(e.clientY));
    document.addEventListener('mousemove', (e) => moveDrag(e.clientY));
    document.addEventListener('mouseup', (e) => endDrag(e.clientY));

    handle.addEventListener('touchstart', (e) => startDrag(e.touches[0].clientY), { passive: true });
    document.addEventListener('touchmove', (e) => moveDrag(e.touches[0].clientY), { passive: true });
    document.addEventListener('touchend', (e) => endDrag(e.changedTouches[0].clientY));
  }

  renderEmptyState() {
    this.contentElement.innerHTML = `
      <div style="text-align:center; padding:20px; color:var(--text-secondary);">
        <p style="font-size:18px; font-weight:700; margin-bottom:8px; color:var(--text-primary);">🌲 Vancouver Urban Canopy</p>
        <p style="font-size:13px;">Tap any colored marker on the map to inspect fruit harvesting schedules, cherry blossom bloom calendars, or build custom paths.</p>
      </div>
    `;
    state.set('uiState', 'collapsed');
  }

  renderTreeDetails(tree) {
    this.contentElement.innerHTML = this.compileDetailTemplate(tree);
    
    // Add event handlers
    const addBtn = this.contentElement.querySelector('#add-route-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        state.addRouteStop(tree);
        addBtn.innerText = 'Added to Route!';
        addBtn.disabled = true;
      });
    }

    const navBtn = this.contentElement.querySelector('#nav-btn');
    if (navBtn) {
      navBtn.addEventListener('click', () => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${tree.lat},${tree.lng}&travelmode=walking`);
      });
    }
  }

  compileDetailTemplate(tree) {
    const typeLabel = {
      'flower': '🌸 Flowering',
      'fruit': '🍎 Edible Fruit/Nut',
      'both': '✨ Fruit & Flower'
    }[tree.type] || '🌳 Standard';

    // Build timeline blocks
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = state.get('currentMonth') - 1;
    
    const timelineHtml = months.map((m, idx) => {
      const isBloom = tree.bloom && tree.bloom.includes(idx + 1);
      const isHarvest = tree.harvest && tree.harvest.includes(idx + 1);
      
      let cssClass = '';
      if (isBloom && isHarvest) cssClass = 'both';
      else if (isBloom) cssClass = 'bloom';
      else if (isHarvest) cssClass = 'harvest';
      
      if (idx === currentMonthIdx) cssClass += ' current-month';

      return `<div class="calendar-month ${cssClass}">${m}</div>`;
    }).join('');

    // Select dynamic placeholder image matching species
    let imageSrc = 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80'; // default tree
    if (tree.type === 'flower') {
      imageSrc = 'https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?auto=format&fit=crop&w=600&q=80'; // cherry blossom
    } else if (tree.type === 'fruit' || tree.type === 'both') {
      if (tree.name.includes('FIG')) {
        imageSrc = 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=600&q=80';
      } else if (tree.name.includes('APPLE')) {
        imageSrc = 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80';
      } else {
        imageSrc = 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=600&q=80'; // general fruit
      }
    }

    const alreadyAdded = state.get('customRouteStops').some(s => s.id === tree.id);

    return `
      <div class="tree-detail-header">
        <div>
          <h2 class="tree-title">${tree.name || 'Unknown Species'}</h2>
          <div class="tree-scientific">${tree.genus || ''} ${tree.species || ''}</div>
        </div>
        <span class="tag-badge ${tree.type}">${typeLabel}</span>
      </div>
      
      <img class="tree-image" src="${imageSrc}" alt="${tree.name}">
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Height</div>
          <div class="stat-value">${tree.height ? tree.height.toFixed(1) : '?'} m</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Diameter</div>
          <div class="stat-value">${tree.diameter ? tree.diameter.toFixed(0) : '?'} cm</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Address</div>
          <div class="stat-value" style="font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${tree.address || 'Unknown'}">${tree.address || 'Unknown'}</div>
        </div>
      </div>
      
      <div class="timeline-section">
        <div class="section-title">Seasonal Calendar</div>
        <div class="calendar-strip">
          ${timelineHtml}
        </div>
      </div>
      
      ${tree.usefulness ? `
        <div class="usefulness-card">
          <strong>Usefulness & Story:</strong><br>
          ${tree.usefulness}
        </div>
      ` : ''}
      
      <div class="action-buttons">
        <button class="btn btn-primary" id="add-route-btn" ${alreadyAdded ? 'disabled' : ''}>
          ${alreadyAdded ? 'Added to Route!' : 'Add to Walking Route'}
        </button>
        <button class="btn btn-secondary" id="nav-btn">Navigate</button>
      </div>
    `;
  }

  renderRouteInfo() {
    const stops = state.get('customRouteStops');
    const info = state.get('currentRouteInfo');
    
    let statsHtml = `Stops: ${stops.length}`;
    if (info) {
      const distanceKm = (info.distance / 1000).toFixed(1);
      const durationMins = Math.round(info.duration / 60);
      statsHtml = `${stops.length} stops • ${distanceKm} km • ${durationMins} mins walk`;
    }

    const stopsListHtml = stops.map((s, idx) => `
      <div class="route-stop-item">
        <div class="stop-info">
          <span class="stop-num">${idx + 1}</span>
          <span class="stop-name">${s.name}</span>
        </div>
        <button class="remove-stop-btn" data-id="${s.id}">×</button>
      </div>
    `).join('');

    this.contentElement.innerHTML = `
      <div class="route-pane">
        <div class="route-summary">
          <div>
            <h2 class="tree-title">Your Custom Trail</h2>
            <div class="tree-scientific">${statsHtml}</div>
          </div>
          <button class="btn btn-secondary" style="padding: 8px 12px; font-size:12px;" id="clear-route-btn">Clear</button>
        </div>
        
        <div class="route-stops-list">
          ${stopsListHtml}
        </div>
        
        <div class="action-buttons">
          <button class="btn btn-primary" id="start-trail-btn" ${stops.length < 2 ? 'disabled' : ''}>Start Walking Tour</button>
        </div>
      </div>
    `;

    // Event hooks
    this.contentElement.querySelectorAll('.remove-stop-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        state.removeRouteStop(id);
      });
    });

    const clearBtn = this.contentElement.querySelector('#clear-route-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        state.clearRoute();
      });
    }

    const startBtn = this.contentElement.querySelector('#start-trail-btn');
    if (startBtn && stops.length >= 2) {
      startBtn.addEventListener('click', () => {
        const stopCoords = stops.map(s => `${s.lat},${s.lng}`).join('/');
        window.open(`https://www.google.com/maps/dir/${stopCoords}/&travelmode=walking`);
      });
    }
  }
}
```

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/drawer.test.js`
Expected: PASS

**Step 5: Commit**
```bash
git add src/components/drawer.js tests/drawer.test.js
git commit -m "feat: implement bottom sheet UI sliding panel and HTML rendering templates"
```

---

### Task 6: Map Controller (`map.js`)
**Files**:
*   Create: `src/map.js`

**Step 1: Implement Map controller**
MapLibre GL JS relies heavily on WebGL rendering context which is difficult to mock completely in jsdom. We will write a clean, defensive Map controller wrapper.
Create `src/map.js`:
```js
import { state } from './state.js';
import { api } from './api.js';

export class MapController {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.markers = {}; // asset_id -> marker object
    this.currentRouteLayerId = 'route-path-line';
    
    this.initMap();
  }

  initMap() {
    // Check if maplibre is loaded
    if (typeof maplibregl === 'undefined') {
      console.warn("MapLibre GL JS not loaded. Check script headers.");
      return;
    }

    this.map = new maplibregl.Map({
      container: this.containerId,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', // sleek dark theme style
      center: [-123.1207, 49.2827], // Downtown Vancouver
      zoom: 13,
      minZoom: 11,
      maxZoom: 18
    });

    this.map.on('load', () => {
      this.initRouteLayer();
      this.initListeners();
    });
  }

  initListeners() {
    // Listen to curated trees loaded in state
    state.subscribe('curatedTrees', (trees) => {
      this.renderMarkers(trees);
    });

    // Listen to route geometry changes
    state.subscribe('currentRouteGeometry', (geometry) => {
      this.drawRoutePath(geometry);
    });

    // Update route stops visually on the map (highlighting stops in order)
    state.subscribe('customRouteStops', (stops) => {
      this.highlightRouteStops(stops);
      this.recalculateRouteLine(stops);
    });

    // Listen to selected tree changes (centers camera)
    state.subscribe('selectedTree', (tree) => {
      if (tree && this.map) {
        this.map.easeTo({
          center: [tree.lng, tree.lat],
          zoom: 16,
          duration: 1000
        });
        this.pulsateSelectedMarker(tree.id);
      }
    });

    // Handle bounding box panning to pull generic street trees
    this.map.on('moveend', () => {
      this.handleMapViewportChange();
    });
  }

  renderMarkers(trees) {
    // Clear previous markers
    Object.values(this.markers).forEach(m => m.remove());
    this.markers = {};

    trees.forEach(tree => {
      const el = document.createElement('div');
      el.className = `map-tree-marker ${tree.type}`;
      
      // Select appropriate color indicators
      let color = '#a1d494'; // default
      if (tree.type === 'flower') color = 'var(--accent-pink)';
      else if (tree.type === 'fruit') color = 'var(--accent-gold)';
      else if (tree.type === 'both') color = '#ffd9df';

      el.style.width = '12px';
      el.style.height = '12px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color;
      el.style.border = '2px solid rgba(0,0,0,0.5)';
      el.style.boxShadow = `0 0 8px ${color}`;
      el.style.cursor = 'pointer';
      el.style.transition = 'transform 0.2s ease';

      el.addEventListener('click', () => {
        state.setSelectedTree(tree);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([tree.lng, tree.lat])
        .addTo(this.map);

      this.markers[tree.id] = marker;
    });
  }

  pulsateSelectedMarker(selectedId) {
    Object.keys(this.markers).forEach(id => {
      const el = this.markers[id].getElement();
      if (parseInt(id) === selectedId) {
        el.style.transform = 'scale(1.7)';
        el.style.zIndex = '100';
      } else {
        el.style.transform = '';
        el.style.zIndex = '';
      }
    });
  }

  highlightRouteStops(stops) {
    const stopIds = new Set(stops.map(s => s.id));
    Object.keys(this.markers).forEach(id => {
      const el = this.markers[id].getElement();
      const numId = parseInt(id);
      if (stopIds.has(numId)) {
        const stopIndex = stops.findIndex(s => s.id === numId) + 1;
        el.innerHTML = `<span style="font-size:8px; font-weight:700; color:black; display:flex; align-items:center; justify-content:center; height:100%; width:100%;">${stopIndex}</span>`;
        el.style.transform = 'scale(1.4)';
      } else {
        el.innerHTML = '';
        if (state.get('selectedTree')?.id !== numId) {
          el.style.transform = '';
        }
      }
    });
  }

  initRouteLayer() {
    if (!this.map) return;
    this.map.addSource('route-source', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: [] }
      }
    });

    this.map.addLayer({
      id: this.currentRouteLayerId,
      type: 'line',
      source: 'route-source',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#FFB7C5', // Pink route path
        'line-width': 5,
        'line-opacity': 0.8
      }
    });
  }

  drawRoutePath(geometry) {
    if (!this.map) return;
    const source = this.map.getSource('route-source');
    if (!source) return;

    if (geometry) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: geometry
      });

      // Fit bounds to fit entire route path
      const coords = geometry.coordinates;
      const bounds = coords.reduce((acc, coord) => {
        return acc.extend(coord);
      }, new maplibregl.LngLatBounds(coords[0], coords[0]));

      this.map.fitBounds(bounds, { padding: 50, maxZoom: 16 });
    } else {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: [] }
      });
    }
  }

  async recalculateRouteLine(stops) {
    if (stops.length < 2) {
      state.set('currentRouteGeometry', null);
      state.set('currentRouteInfo', null);
      return;
    }

    const routeData = await api.fetchRoute(stops);
    if (routeData) {
      state.set('currentRouteGeometry', routeData.geometry);
      state.set('currentRouteInfo', {
        distance: routeData.distance,
        duration: routeData.duration
      });
    }
  }

  async handleMapViewportChange() {
    if (state.get('activeFilters') !== 'all') return; // only load background trees in unfiltered viewport
    const zoom = this.map.getZoom();
    if (zoom < 15) return; // Only fetch detailed background trees when zoomed in close

    const bounds = this.map.getBounds();
    const south = bounds.getSouth();
    const west = bounds.getWest();
    const north = bounds.getNorth();
    const east = bounds.getEast();

    const liveTrees = await api.fetchTreesInBounds(south, west, north, east);
    
    // Merge live background trees with curated trees (avoiding duplicates)
    const curated = state.get('curatedTrees');
    const existingIds = new Set(curated.map(t => t.id));
    
    const newTrees = liveTrees.filter(t => !existingIds.has(t.id));
    if (newTrees.length > 0) {
      state.set('curatedTrees', [...curated, ...newTrees]);
    }
  }
}
```

**Step 2: Commit map controller**
```bash
git add src/map.js
git commit -m "feat: implement MapLibre GL JS wrapper class with custom interactive overlays"
```

---

### Task 7: Featured Trails Loader & Filter Manager (`main.js`)
**Files**:
*   Create: `src/main.js`

**Step 1: Write application bootstrapper**
Create `src/main.js` tying state, drawer, map, and initial json files together:
```js
import { state } from './state.js';
import { Drawer } from './components/drawer.js';
import { MapController } from './map.js';

// Import local compressed dataset directly using Vite
import curatedData from './data/curated_trees.json';

class App {
  constructor() {
    this.drawer = null;
    this.mapController = null;
    
    this.initApp();
  }

  async initApp() {
    // 1. Unpack compressed flat trees data
    const unpackedTrees = this.unpackCuratedTrees(curatedData);
    state.set('curatedTrees', unpackedTrees);
    
    // 2. Initialize UI components
    const drawerEl = document.getElementById('bottom-sheet');
    const contentEl = document.getElementById('sheet-content');
    this.drawer = new Drawer(drawerEl, contentEl);

    // 3. Load MapLibre script files dynamically in DOM if not present, then boot map
    await this.ensureMaplibreLoaded();
    this.mapController = new MapController('map-container');
    
    // 4. Hook autocomplete search box
    this.initSearchAutoComplete(unpackedTrees);

    // 5. Hook filters
    this.initFilters();
    
    // Render initial empty state
    this.drawer.renderEmptyState();
  }

  unpackCuratedTrees(data) {
    const { species, trees } = data;
    return trees.map(t => {
      const [id, lat, lng, speciesIdx, height, diameter, address] = t;
      const s = species[speciesIdx];
      return {
        id,
        lat,
        lng,
        name: s.name,
        genus: s.genus,
        species: s.species,
        type: s.type,
        tags: s.tags,
        bloom: s.bloom,
        harvest: s.harvest,
        usefulness: s.usefulness,
        height,
        diameter,
        address
      };
    });
  }

  ensureMaplibreLoaded() {
    return new Promise((resolve) => {
      if (window.maplibregl) {
        resolve();
        return;
      }
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@4.5.0/dist/maplibre-gl.css';
      document.head.appendChild(link);
      
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/maplibre-gl@4.5.0/dist/maplibre-gl.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  initSearchAutoComplete(trees) {
    const input = document.getElementById('search-input');
    const dropdown = document.getElementById('search-suggestions');
    if (!input || !dropdown) return;

    // Compile unique species names
    const uniqueSpecies = Array.from(new Set(trees.map(t => `${t.name} (${t.genus} ${t.species})`)))
      .map(str => {
        const parts = str.match(/(.*) \((.*) (.*)\)/);
        return {
          common: parts[1],
          genus: parts[2],
          species: parts[3]
        };
      });

    input.addEventListener('input', (e) => {
      const val = e.target.value.toUpperCase();
      if (!val) {
        dropdown.classList.add('hidden');
        return;
      }

      const matches = uniqueSpecies.filter(s => 
        s.common.includes(val) || s.genus.includes(val) || s.species.includes(val)
      ).slice(0, 5);

      if (matches.length === 0) {
        dropdown.classList.add('hidden');
        return;
      }

      dropdown.innerHTML = matches.map(m => `
        <div class="suggestion-item" data-common="${m.common}">
          <span>${m.common}</span>
          <span class="scientific">${m.genus} ${m.species}</span>
        </div>
      `).join('');

      dropdown.classList.remove('hidden');
    });

    dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.suggestion-item');
      if (!item) return;

      const commonName = item.getAttribute('data-common');
      input.value = commonName;
      dropdown.classList.add('hidden');

      // Find the closest tree matching this name and select it
      const matchTree = trees.find(t => t.name === commonName);
      if (matchTree) {
        state.setSelectedTree(matchTree);
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        dropdown.classList.add('hidden');
      }
    });
  }

  initFilters() {
    const filterContainer = document.getElementById('filter-pills');
    if (!filterContainer) return;

    filterContainer.addEventListener('click', (e) => {
      const pill = e.target.closest('.filter-pill');
      if (!pill) return;

      filterContainer.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
      pill.classList.add('active');

      const filterValue = pill.getAttribute('data-filter');
      state.set('activeFilters', filterValue);

      this.applyFilter(filterValue);
    });
  }

  applyFilter(filterType) {
    const allTrees = this.unpackCuratedTrees(curatedData);
    const currentMonth = state.get('currentMonth');

    let filtered = allTrees;
    if (filterType === 'fruit') {
      filtered = allTrees.filter(t => t.type === 'fruit' || t.type === 'both');
    } else if (filterType === 'flower') {
      filtered = allTrees.filter(t => t.type === 'flower' || t.type === 'both');
    } else if (filterType === 'bloom-now') {
      filtered = allTrees.filter(t => t.bloom && t.bloom.includes(currentMonth));
    } else if (filterType === 'harvest-now') {
      filtered = allTrees.filter(t => t.harvest && t.harvest.includes(currentMonth));
    }

    state.set('curatedTrees', filtered);
    state.setSelectedTree(null); // clear detail sheet selection on filtering
  }
}

// Instantiate application on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
export { App };
```

**Step 2: Commit bootsrapper**
```bash
git add src/main.js
git commit -m "feat: write main application bootstrap code and autocomplete search mechanics"
```

---

### Task 8: Integration & Validation
**Files**:
*   Modify: `package.json`

**Step 1: Verify whole project compiles and builds successfully**
Run: `npm run build`
Expected: Done in <2s, creates static files in `dist/` directory.

**Step 2: Start local dev server and test manually**
Run: `npm run dev -- --port 3000`
Verify in local browser that map loads, markers are visible, bottom sheet expands and custom route works.

**Step 3: Save results**
Create: `docs/superpowers/specs/2026-07-11-vancouver-public-trees-validation-log.md`
Report the size of final javascript bundle and execution metrics.

**Step 4: Commit**
```bash
git add .
git commit -m "build: verify compilation and generate validation log files"
```
