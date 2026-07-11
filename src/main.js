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
