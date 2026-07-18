export function routeSummary(route) {
  if (route.stops.length === 1) return '1 stop saved. Add another tree for directions.';
  return `${route.stops.length} stops ready for walking directions`;
}
