import maplibregl from 'maplibre-gl';
import { VANCOUVER_CENTER } from '../domain/location.js';
import { DEFAULT_STYLE } from './map-style.js';
import { addTreeLayers, setTreeDataWhenReady } from './tree-layers.js';
import { addRouteLayers, setRouteData } from './route-layers.js';

export class MapController {
  constructor(container, { onSelect, onMove } = {}) {
    this.map = new maplibregl.Map({
      container,
      style: DEFAULT_STYLE,
      center: [VANCOUVER_CENTER.longitude, VANCOUVER_CENTER.latitude],
      zoom: 12,
      antialias: false,
      preserveDrawingBuffer: false
    });
    this.selectedId = null;
    this.locationMarker = null;
    this.map.on('load', () => {
      addTreeLayers(this.map);
      addRouteLayers(this.map);
      this.map.on('click', 'trees-hit-area', event => {
        const feature = closestFeature(this.map, event);
        if (feature?.properties?.id != null) onSelect?.(feature.properties.id);
      });
      this.map.on('click', 'trees-clusters', async event => {
        const feature = event.features?.[0];
        const clusterId = Number(feature?.properties?.cluster_id);
        const coordinates = feature?.geometry?.type === 'Point' ? feature.geometry.coordinates : null;
        if (!coordinates || !Number.isFinite(clusterId)) return;
        /** @type {import('maplibre-gl').GeoJSONSource} */
        const source = this.map.getSource('trees');
        const zoom = await source.getClusterExpansionZoom(clusterId);
        this.map.easeTo({ center: coordinates, zoom, duration: reducedMotion() ? 0 : 320 });
      });
      for (const layer of ['trees-hit-area', 'trees-clusters']) {
        this.map.on('mouseenter', layer, () => this.map.getCanvas().style.cursor = 'pointer');
        this.map.on('mouseleave', layer, () => this.map.getCanvas().style.cursor = '');
      }
      this.map.on('moveend', () => onMove?.(this.getCenter()));
    });
  }

  setTrees(trees) {
    setTreeDataWhenReady(this.map, trees);
  }

  select(id) {
    if (this.selectedId) this.map.setFeatureState({ source: 'trees', id: this.selectedId }, { selected: false });
    this.selectedId = id;
    if (id) this.map.setFeatureState({ source: 'trees', id }, { selected: true });
  }

  getCenter() {
    const center = this.map.getCenter();
    return { latitude: center.lat, longitude: center.lng };
  }

  showLocation(location) {
    this.locationMarker?.remove();
    const marker = document.createElement('div');
    marker.className = 'user-location-marker';
    marker.setAttribute('aria-label', 'Your location');
    this.locationMarker = new maplibregl.Marker({ element: marker })
      .setLngLat([location.longitude, location.latitude])
      .addTo(this.map);
    this.map.easeTo({ center: [location.longitude, location.latitude], duration: reducedMotion() ? 0 : 500 });
  }

  setRoute(routeData) {
    setRouteData(this.map, routeData);
  }

  showTrail(geometry, stops) {
    const update = () => {
      setRouteData(this.map, { geometry, stops });
      const coordinates = geometry?.coordinates ?? [];
      if (coordinates.length < 2) return;
      const bounds = coordinates.slice(1).reduce(
        (value, coordinate) => value.extend(coordinate),
        new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
      );
      this.map.fitBounds(bounds, { padding: 72, maxZoom: 15, duration: reducedMotion() ? 0 : 650 });
    };
    this.map.getSource('route') ? update() : this.map.once('load', update);
  }

  destroy() {
    this.locationMarker?.remove();
    this.map.remove();
  }
}

function closestFeature(map, event) {
  return [...(event.features ?? [])]
    .filter(feature => feature.geometry?.type === 'Point')
    .sort((left, right) => screenDistance(map, left.geometry.coordinates, event.point) - screenDistance(map, right.geometry.coordinates, event.point))[0];
}

function screenDistance(map, coordinates, point) {
  const projected = map.project(coordinates);
  return (projected.x - point.x) ** 2 + (projected.y - point.y) ** 2;
}

function reducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}
