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
