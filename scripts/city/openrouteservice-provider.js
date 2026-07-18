const DEFAULT_BASE_URL = 'https://api.openrouteservice.org';
const MAXIMUM_SNAP_DISTANCE_M = 40;
const ATTRIBUTION = '© openrouteservice.org by HeiGIT | Map data © OpenStreetMap contributors';

export class OpenRouteServiceProvider {
  constructor({ apiKey, baseUrl = DEFAULT_BASE_URL, fetch: fetchImplementation = globalThis.fetch, now = () => new Date() } = {}) {
    if (!String(apiKey ?? '').trim()) throw new TypeError('OpenRouteService API key is required');
    if (typeof fetchImplementation !== 'function') throw new TypeError('OpenRouteService requires fetch');
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.fetch = fetchImplementation;
    this.now = now;
  }

  async snap(anchors, signal) {
    const data = await this.request('/v2/snap/foot-walking', {
      locations: anchors.map(anchor => [Number(anchor.longitude), Number(anchor.latitude)]),
      radius: MAXIMUM_SNAP_DISTANCE_M
    }, signal);
    if (!Array.isArray(data.locations) || data.locations.length !== anchors.length) throw new TypeError('OpenRouteService returned malformed snap results');
    return data.locations.map((location, index) => {
      if (!location?.location || !Number.isFinite(location.snapped_distance) || location.snapped_distance > MAXIMUM_SNAP_DISTANCE_M) throw new TypeError(`OpenRouteService could not snap anchor ${anchors[index].id} within ${MAXIMUM_SNAP_DISTANCE_M} metres`);
      return {
        ...anchors[index],
        snappedLongitude: Number(location.location[0]),
        snappedLatitude: Number(location.location[1]),
        snappedDistanceM: Number(location.snapped_distance)
      };
    });
  }

  async matrix(anchors, signal) {
    const data = await this.request('/v2/matrix/foot-walking', {
      locations: anchors.map(routeCoordinate),
      metrics: ['distance'],
      units: 'm'
    }, signal);
    const matrix = data.distances;
    if (!Array.isArray(matrix) || matrix.length !== anchors.length || matrix.some(row => !Array.isArray(row) || row.length !== anchors.length || row.some(distance => !Number.isFinite(distance)))) throw new TypeError('OpenRouteService returned an incomplete walking-distance matrix');
    return matrix;
  }

  async directions(anchors, signal) {
    const data = await this.request('/v2/directions/foot-walking/geojson', {
      coordinates: anchors.map(routeCoordinate),
      instructions: true,
      units: 'm'
    }, signal, 'application/geo+json');
    const feature = data.features?.[0];
    const summary = feature?.properties?.summary;
    const segments = feature?.properties?.segments;
    const engine = data.metadata?.engine;
    if (feature?.geometry?.type !== 'LineString' || !Number.isFinite(summary?.distance) || !Number.isFinite(summary?.duration) || !Array.isArray(segments)) throw new TypeError('OpenRouteService returned malformed foot-walking directions');
    if (!String(engine?.version ?? '').trim() || !String(engine?.graph_date ?? '').trim()) throw new TypeError('OpenRouteService response is missing engine provenance');
    return {
      geometry: feature.geometry,
      distanceM: Number(summary.distance),
      durationSeconds: Number(summary.duration),
      legDistancesM: segments.map(segment => Number(segment.distance)),
      snappedDistancesM: anchors.map(anchor => Number(anchor.snappedDistanceM)),
      provenance: {
        provider: 'openrouteservice',
        profile: 'foot-walking',
        engineVersion: String(engine.version),
        graphDate: String(engine.graph_date),
        engineBuildDate: String(engine.build_date ?? ''),
        generatedAt: this.now().toISOString(),
        attribution: ATTRIBUTION,
        resultLicense: 'CC-BY-4.0'
      }
    };
  }

  async request(path, body, signal, accept = 'application/json') {
    const response = await this.fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { Authorization: this.apiKey, Accept: accept, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const reason = sanitizedReason(data?.error?.message ?? data?.error ?? data?.message);
      throw new Error(`OpenRouteService request failed (${response.status})${reason ? `: ${reason}` : ''}`);
    }
    return data;
  }
}

function routeCoordinate(anchor) {
  return [Number(anchor.snappedLongitude ?? anchor.longitude), Number(anchor.snappedLatitude ?? anchor.latitude)];
}

function sanitizedReason(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\r\n\t]+/g, ' ').trim().slice(0, 240);
}
