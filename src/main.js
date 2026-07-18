import 'maplibre-gl/dist/maplibre-gl.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/app-shell.css';
import { createStore } from './core/store.js';
import { actions } from './core/actions.js';
import { loadCityManifest } from './data/city-loader.js';
import { DataWorkerClient } from './data/worker-client.js';
import { distanceMeters } from './data/spatial-index.js';
import { VANCOUVER_CENTER } from './domain/location.js';
import { toFeature } from './domain/tree.js';
import { MapController } from './map/map-controller.js';
import { createAppShell } from './ui/app-shell.js';
import { createSearch } from './ui/search.js';
import { createFilters } from './ui/filters.js';
import { renderNearbyInspector, renderSourceInfo, renderTreeInspector, seasonalState } from './ui/tree-inspector.js';
import { titleCase } from './ui/format.js';
import { addRouteStop, moveRouteStop, renderRouteBuilder } from './ui/route-builder.js';
import { routeSummary } from './ui/route-summary.js';
import { OsrmProvider } from './services/routing/osrm-provider.js';
import { getLocation } from './services/geolocation.js';
import { createStatusRegion } from './ui/status-region.js';
import { createConnectivity } from './services/connectivity.js';
import { classifyGiant } from './domain/giant.js';

const initialState = {
  city: null,
  dataStatus: 'loading',
  selectedTreeId: null,
  filters: { kind: 'all' },
  sheet: 'peek',
  location: null,
  theme: localStorage.getItem('theme') ?? 'daylight',
  route: { stops: [], version: 0, status: 'idle', geometry: null, distance: null, duration: null },
  error: null
};

const store = createStore(initialState);
const worker = new DataWorkerClient();
const routeProvider = new OsrmProvider();
let map;
let shell;
let status;
let filters;
let manifest;
let allTrees = [];
let visibleTrees = [];
let selectedTree = null;
let trails;
let trailExperience;
let activeView = 'nearby';
let routeAbort;

async function start() {
  shell = createAppShell();
  document.body.replaceChildren(shell.app);
  document.documentElement.dataset.theme = store.getState().theme;
  status = createStatusRegion();
  shell.app.append(status.element);
  shell.inspector.innerHTML = loadingMarkup();
  wireConnectivity();

  manifest = await loadCityManifest('vancouver');
  await worker.loadCity(manifest.data.pack);
  store.dispatch({ type: 'CITY_LOADED', city: manifest });
  allTrees = await worker.queryBounds(manifest.bounds);
  visibleTrees = allTrees;

  map = new MapController(shell.map, {
    onSelect: id => selectTree(id),
    onMove: () => activeView === 'nearby' && renderNearby()
  });
  map.setTrees(allTrees.map(toFeature));

  const search = createSearch({
    search: query => worker.search(query, 12),
    onSelect: tree => selectTree(tree.id, tree)
  });
  filters = createFilters({ onChange: applyFilter });
  shell.searchSlot.append(search);
  shell.actionsSlot.append(filters.element, createLocationButton(), createThemeButton());
  shell.sheet.onClose(clearSelection);
  shell.routeCapsule.addEventListener('click', showRouteBuilder);
  renderNearby();
  updateRouteCapsule();
  status.announce(`${allTrees.length} reported public-tree records loaded for Vancouver.`);
}

function wireConnectivity() {
  const update = online => {
    shell.offlineNotice.hidden = online;
    shell.offlineNotice.textContent = online ? '' : 'You are offline. Showing saved tree data. New walking routes need a connection.';
    if (!online) status.announce('You are offline. Showing saved tree data.');
  };
  createConnectivity(update);
  update(navigator.onLine);
}

function createLocationButton() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'icon-button';
  button.textContent = 'Near me';
  button.setAttribute('aria-label', 'Find trees near my location');
  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = 'Locating';
    status.announce('Requesting your location to sort nearby trees.');
    try {
      const location = await getLocation();
      store.dispatch({ type: 'SET_LOCATION', location });
      map.showLocation(location);
      button.textContent = 'Recenter';
      status.announce('Location found. Nearby trees are now sorted from your position.');
      renderNearby();
    } catch (error) {
      console.error('Geolocation failed:', error);
      button.textContent = 'Location unavailable';
      status.announce('Location is unavailable. Trees remain sorted from the map centre.');
    } finally {
      button.disabled = false;
    }
  });
  return button;
}

function createThemeButton() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'icon-button theme-button';
  const updateLabel = () => {
    const dusk = document.documentElement.dataset.theme === 'dusk';
    button.textContent = dusk ? 'Daylight' : 'Dusk';
    button.setAttribute('aria-label', dusk ? 'Use daylight theme' : 'Use dusk theme');
  };
  button.addEventListener('click', () => {
    const value = document.documentElement.dataset.theme === 'dusk' ? 'daylight' : 'dusk';
    document.documentElement.dataset.theme = value;
    localStorage.setItem('theme', value);
    updateLabel();
  });
  updateLabel();
  return button;
}

function applyFilter(kind) {
  store.dispatch(actions.setFilters({ kind }));
  visibleTrees = allTrees.filter(tree => matchesFilter(tree, kind));
  map.setTrees(visibleTrees.map(toFeature));
  filters.setCount(visibleTrees.length);
  if (selectedTree && !visibleTrees.some(tree => tree.id === selectedTree.id)) clearSelection();
  if (activeView === 'nearby') renderNearby();
  status.announce(`${visibleTrees.length} tree records visible. ${kind === 'all' ? 'Filters cleared.' : 'Filters applied.'}`);
}

function matchesFilter(tree, kind, date = new Date()) {
  if (kind === 'fruit-families') return ['MALUS', 'PYRUS', 'PRUNUS', 'FICUS'].includes(tree.genus);
  if (kind === 'flowering-families') return ['PRUNUS', 'MALUS', 'MAGNOLIA', 'CORNUS'].includes(tree.genus);
  if (kind === 'giants') return classifyGiant(tree).isGiant;
  if (kind === 'big-trunks') return Number(tree.diameterCm) >= 100;
  return true;
}

async function selectTree(id, tree) {
  selectedTree = tree ?? await worker.getTree(id);
  if (!selectedTree) return;
  selectedTree = withDistance(selectedTree);
  activeView = 'tree';
  store.dispatch(actions.selectTree(id));
  map.select(id);
  shell.sheet.setSelectionActive(true);
  shell.sheet.setState('peek');
  renderSelectedTree();
  const seasonal = seasonalState(selectedTree);
  status.announce(`${titleCase(selectedTree.commonName)} selected. ${seasonal.label}.`);
}

function renderSelectedTree() {
  const routeStopIndex = store.getState().route.stops.findIndex(stop => stop.id === selectedTree?.id) + 1;
  renderTreeInspector(shell.inspector, selectedTree, {
    routeStopIndex,
    onRoute: tree => updateRoute(addRouteStop(store.getState().route.stops, tree))
  });
}

function clearSelection() {
  selectedTree = null;
  activeView = 'nearby';
  store.dispatch(actions.selectTree(null));
  map.select(null);
  shell.sheet.setSelectionActive(false);
  shell.sheet.setState('peek');
  renderNearby();
}

function renderNearby() {
  activeView = 'nearby';
  const nearby = visibleTrees.map(withDistance).sort((a, b) => a.distance - b.distance).slice(0, 8);
  renderNearbyInspector(shell.inspector, nearby, {
    total: visibleTrees.length,
    onSelect: tree => selectTree(tree.id, tree),
    onTrails: showTrails,
    onLocate: () => shell.actionsSlot.querySelector('[aria-label="Find trees near my location"]').click(),
    onSources: () => {
      activeView = 'sources';
      shell.sheet.setState('full');
      renderSourceInfo(shell.inspector, manifest, renderNearby);
    }
  });
  filters?.setCount(visibleTrees.length);
}

async function showTrails() {
  const experience = await loadTrailExperience();
  trails ??= experience.buildTrailSuggestions(allTrees);
  activeView = 'trails';
  selectedTree = null;
  map.select(null);
  map.setRoute(null);
  shell.sheet.setSelectionActive(false);
  shell.sheet.setState('full');
  experience.renderTrailCatalogue(shell.inspector, trails, {
    onBack: () => {
      map.setRoute(null);
      shell.sheet.setState('peek');
      renderNearby();
    },
    onSelect: showTrail
  });
  status.announce(`${trails.length} Treeways trail previews available.`);
}

function showTrail(trail) {
  activeView = 'trail';
  map.showTrail(trailExperience.trailGeometry(trail));
  shell.sheet.setState('half');
  trailExperience.renderTrailDetail(shell.inspector, trail, { onBack: showTrails });
  status.announce(`${trail.name} selected. ${trail.waypoints.length} tree stops. Route order awaits human review.`);
}

async function loadTrailExperience() {
  if (!trailExperience) {
    const [domain, ui] = await Promise.all([import('./domain/trail-suggestions.js'), import('./ui/trail-browser.js')]);
    trailExperience = { ...domain, ...ui };
  }
  return trailExperience;
}

function withDistance(tree) {
  const origin = store.getState().location ?? map?.getCenter() ?? VANCOUVER_CENTER;
  return { ...tree, distance: distanceMeters(origin, tree) };
}

function showRouteBuilder() {
  activeView = 'route';
  shell.sheet.setSelectionActive(false);
  shell.sheet.setState('half');
  const render = () => renderRouteBuilder(shell.inspector, store.getState().route, {
    onBack: () => selectedTree ? (activeView = 'tree', shell.sheet.setSelectionActive(true), renderSelectedTree()) : renderNearby(),
    onMove: (index, direction) => updateRoute(moveRouteStop(store.getState().route.stops, index, direction)),
    onRemove: index => updateRoute(store.getState().route.stops.filter((_, itemIndex) => itemIndex !== index)),
    onClear: () => updateRoute([]),
    onRetry: () => updateRoute(store.getState().route.stops, true)
  });
  render();
}

async function updateRoute(stops, force = false) {
  routeAbort?.abort();
  store.dispatch(actions.setRouteStops(stops));
  const version = store.getState().route.version;
  if (stops.length < 2) {
    store.dispatch(actions.setRoute({ ...store.getState().route, status: 'idle', geometry: null, distance: null, duration: null }));
    map.setRoute(null);
    updateRouteCapsule();
    if (activeView === 'route') showRouteBuilder();
    else if (selectedTree) renderSelectedTree();
    if (stops.length === 1) status.announce(`Stop 1 added: ${titleCase(stops[0].commonName)}.`);
    return;
  }
  routeAbort = new AbortController();
  store.dispatch(actions.setRoute({ ...store.getState().route, status: 'loading', geometry: force ? null : store.getState().route.geometry }));
  updateRouteCapsule();
  if (activeView === 'route') showRouteBuilder();
  status.announce('Calculating walking route.');
  try {
    const route = await routeProvider.route(stops, routeAbort.signal);
    if (store.getState().route.version !== version) return;
    store.dispatch(actions.setRoute({ ...store.getState().route, ...route, status: 'ready' }));
    map.setRoute(route.geometry);
    status.announce(`Route ready: ${(route.distance / 1000).toFixed(1)} kilometres, ${Math.round(route.duration / 60)} minutes walking.`);
  } catch (error) {
    if (error.name === 'AbortError') return;
    console.error('Route calculation failed:', error);
    store.dispatch(actions.setRoute({ ...store.getState().route, status: 'error' }));
    status.announce(navigator.onLine ? 'Route could not be calculated. Try again or navigate to an individual tree.' : 'Route could not be calculated while offline.');
  }
  updateRouteCapsule();
  if (activeView === 'route') showRouteBuilder();
  else if (selectedTree) renderSelectedTree();
}

function updateRouteCapsule() {
  const route = store.getState().route;
  shell.routeCapsule.hidden = route.stops.length === 0;
  shell.routeCapsule.textContent = route.stops.length ? `Route · ${routeSummary(route)}` : '';
}

function loadingMarkup() {
  return '<section class="loading-state" role="status"><p class="wordmark">Treeways</p><p class="section-label">Vancouver field guide</p><h1>Loading the city canopy</h1><div class="loading-line"></div><div class="loading-line short"></div><p>Preparing public tree records and neighbourhood trails.</p></section>';
}

start().catch(error => {
  document.body.innerHTML = `<main class="fatal-error"><h1>The tree map could not start</h1><p>${navigator.onLine ? 'Tree data or the map could not be loaded.' : 'You are offline. Connect once to save the tree map for offline use.'}</p><button type="button" onclick="location.reload()">Try again</button></main>`;
  console.error(error);
});

if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
