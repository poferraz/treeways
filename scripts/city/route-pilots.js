import { chooseRouteOrder, ROUTED_DISTANCE_BANDS, validateRoutedTrail } from '../../src/domain/trail-routing.js';
import { cityArgument, CITY_ROOT, invokedDirectly, readJson, writeJson } from './pipeline.js';
import { OpenRouteServiceProvider } from './openrouteservice-provider.js';

export async function routePilotCandidate(candidate, provider, signal) {
  const anchors = candidate.clusterStops.map(stop => ({ id: stop.id, latitude: stop.anchor.latitude, longitude: stop.anchor.longitude }));
  const snappedAnchors = await provider.snap(anchors, signal);
  const matrix = await provider.matrix(snappedAnchors, signal);
  const selectedOrder = chooseRouteOrder(snappedAnchors, matrix);
  const byId = new Map(snappedAnchors.map(anchor => [anchor.id, anchor]));
  const orderedAnchors = selectedOrder.anchorIds.map(id => byId.get(id));
  const directions = await provider.directions(orderedAnchors, signal);
  const size = distanceBand(directions.distanceM);
  if (!size) throw new TypeError(`Pilot ${candidate.id} exceeds the 8 km routed-distance limit`);
  const route = { anchorOrder: selectedOrder.anchorIds, ...directions };
  try {
    validateRoutedTrail(route, { size });
  } catch (error) {
    throw new TypeError(`Pilot ${candidate.id} failed routed quality: ${error.message}`);
  }
  return {
    ...candidate,
    mode: 'walking',
    shape: selectedOrder.shape,
    size,
    route,
    routing: { status: 'routed', provider: 'openrouteservice', profile: 'foot-walking' }
  };
}

export async function routePilotPacket(packet, provider, signal) {
  const candidates = [];
  for (const candidate of packet.candidates) candidates.push(await routePilotCandidate(candidate, provider, signal));
  return { ...packet, status: 'NOT HUMAN REVIEWED', candidates };
}

export async function routePilotCandidates(city = cityArgument(), options = {}) {
  const packet = await readJson(`${CITY_ROOT(city)}/trail-pilots.json`);
  const provider = options.provider ?? new OpenRouteServiceProvider({ apiKey: process.env.OPENROUTESERVICE_API_KEY });
  const routed = await routePilotPacket(packet, provider, options.signal);
  await writeJson(`${CITY_ROOT(city)}/trail-pilots-routed.json`, routed);
  return routed;
}

function distanceBand(distanceM) {
  return Object.entries(ROUTED_DISTANCE_BANDS).find(([, maximum]) => distanceM <= maximum)?.[0] ?? null;
}

if (invokedDirectly(import.meta.url)) {
  const packet = await routePilotCandidates();
  console.log(`Routed ${packet.candidates.length} pilot candidates; status remains ${packet.status}.`);
}
