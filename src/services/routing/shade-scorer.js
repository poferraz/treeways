export function scoreShade(routeSegments) { return routeSegments.reduce((score, segment) => score + (segment.shadeMeters ?? 0), 0); }
