export function routeSummary(route) {
  if (route.status === 'loading') return 'Calculating walking route';
  if (route.status === 'error') return 'Route could not be calculated';
  if (route.distance) return `${(route.distance / 1000).toFixed(1)} km, ${Math.round(route.duration / 60)} minutes walking`;
  if (route.stops.length === 1) return '1 stop saved. Add another tree to calculate a route.';
  return `${route.stops.length} stops`;
}
