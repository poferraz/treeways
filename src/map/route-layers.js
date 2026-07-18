const line = () => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } });
export function addRouteLayers(map) { map.addSource('route', { type: 'geojson', data: line() }); map.addSource('route-stops', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }); map.addLayer({ id: 'route-line', type: 'line', source: 'route', paint: { 'line-color': '#9a5a3a', 'line-width': 5, 'line-opacity': 0.88, 'line-dasharray': [1.2, 1.2] } }); map.addLayer({ id: 'route-stops', type: 'circle', source: 'route-stops', paint: { 'circle-color': '#9a5a3a', 'circle-radius': 9, 'circle-stroke-color': '#fffaf0', 'circle-stroke-width': 2 } }); }
export function setRouteData(map, geometry) {
  map.getSource('route')?.setData(geometry ? { type: 'Feature', properties: {}, geometry } : line());
  const coordinates = geometry?.coordinates ?? [];
  map.getSource('route-stops')?.setData({
    type: 'FeatureCollection',
    features: coordinates.map((coordinate, index) => ({ type: 'Feature', properties: { index: index + 1 }, geometry: { type: 'Point', coordinates: coordinate } }))
  });
}
