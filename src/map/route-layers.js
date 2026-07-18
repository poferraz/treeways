const line = () => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } });
export function addRouteLayers(map) { map.addSource('route', { type: 'geojson', data: line() }); map.addSource('route-stops', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }); map.addLayer({ id: 'route-line', type: 'line', source: 'route', paint: { 'line-color': '#9a5a3a', 'line-width': 5, 'line-opacity': 0.88, 'line-dasharray': [1.2, 1.2] } }); map.addLayer({ id: 'route-stops', type: 'circle', source: 'route-stops', paint: { 'circle-color': '#9a5a3a', 'circle-radius': 9, 'circle-stroke-color': '#fffaf0', 'circle-stroke-width': 2 } }); }
export function setRouteData(map, routeData) {
  const geometry = routeData?.geometry ?? null;
  const stops = routeData?.stops ?? [];
  map.getSource('route')?.setData(geometry ? { type: 'Feature', properties: {}, geometry } : line());
  map.getSource('route-stops')?.setData({
    type: 'FeatureCollection',
    features: stops.map((stop, index) => ({
      type: 'Feature',
      properties: { id: stop.id, index: index + 1 },
      geometry: { type: 'Point', coordinates: [Number(stop.anchor.longitude), Number(stop.anchor.latitude)] }
    }))
  });
}
