import maplibregl from 'maplibre-gl';
import { DEFAULT_STYLE } from './map-style.js';
import { addTreeLayers, setTreeData } from './tree-layers.js';
import { addRouteLayers, setRouteData } from './route-layers.js';
export class MapController { constructor(container, { onSelect, onMove } = {}) { this.map = new maplibregl.Map({ container, style: DEFAULT_STYLE, center: [-123.1207, 49.2827], zoom: 12, antialias: false, preserveDrawingBuffer: false }); this.selectedId = null; this.locationMarker = null; this.map.on('load', () => { addTreeLayers(this.map); addRouteLayers(this.map); this.map.on('click', 'trees-points', event => onSelect?.(event.features[0].properties.id)); this.map.on('mouseenter', 'trees-points', () => this.map.getCanvas().style.cursor = 'pointer'); this.map.on('mouseleave', 'trees-points', () => this.map.getCanvas().style.cursor = ''); this.map.on('moveend', () => onMove?.(this.getCenter())); }); }
setTrees(trees) { const update = () => setTreeData(this.map, trees); this.map.loaded() ? update() : this.map.once('load', update); }
select(id) { if (this.selectedId) this.map.setFeatureState({ source: 'trees', id: this.selectedId }, { selected: false }); this.selectedId = id; if (id) this.map.setFeatureState({ source: 'trees', id }, { selected: true }); }
getCenter() { const center = this.map.getCenter(); return { latitude: center.lat, longitude: center.lng }; }
showLocation(location) { this.locationMarker?.remove(); const marker = document.createElement('div'); marker.className = 'user-location-marker'; marker.setAttribute('aria-label', 'Your location'); this.locationMarker = new maplibregl.Marker({ element: marker }).setLngLat([location.longitude, location.latitude]).addTo(this.map); this.map.easeTo({ center: [location.longitude, location.latitude], duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500 }); }
setRoute(geometry) { setRouteData(this.map, geometry); } destroy() { this.locationMarker?.remove(); this.map.remove(); } }
