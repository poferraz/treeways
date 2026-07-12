import maplibregl from 'maplibre-gl';
import { DEFAULT_STYLE } from './map-style.js';
import { addTreeLayers, setTreeData } from './tree-layers.js';
import { addRouteLayers, setRouteData } from './route-layers.js';
export class MapController { constructor(container, { onSelect } = {}) { this.map = new maplibregl.Map({ container, style: DEFAULT_STYLE, center: [-123.1207, 49.2827], zoom: 12, antialias: false, preserveDrawingBuffer: false }); this.selectedId = null; this.map.on('load', () => { addTreeLayers(this.map); addRouteLayers(this.map); this.map.on('click', 'trees-points', event => onSelect?.(event.features[0].properties.id)); this.map.on('mouseenter', 'trees-points', () => this.map.getCanvas().style.cursor = 'pointer'); this.map.on('mouseleave', 'trees-points', () => this.map.getCanvas().style.cursor = ''); }); }
setTrees(trees) { const update = () => setTreeData(this.map, trees); this.map.loaded() ? update() : this.map.once('load', update); }
select(id) { if (this.selectedId) this.map.setFeatureState({ source: 'trees', id: this.selectedId }, { selected: false }); this.selectedId = id; if (id) this.map.setFeatureState({ source: 'trees', id }, { selected: true }); }
setRoute(geometry) { setRouteData(this.map, geometry); } destroy() { this.map.remove(); } }
