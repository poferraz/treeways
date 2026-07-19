import 'maplibre-gl/dist/maplibre-gl.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/app-shell.css';
import { createStore } from './core/store.js';
import { actions } from './core/actions.js';
import { loadCityManifest } from './data/city-loader.js';
import { DataWorkerClient } from './data/worker-client.js';
import { distanceMeters } from './data/spatial-index.js';
import { isFloweringFamily, isFruitFamily, selectCategoryBalancedTrees } from './domain/tree-categories.js';
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
import { getLocation } from './services/geolocation.js';
import { createStatusRegion } from './ui/status-region.js';
import { createConnectivity } from './services/connectivity.js';
import { classifyGiant } from './domain/giant.js';
import { orderedClusterStops } from './domain/trails.js';

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
let map;
let shell;
let status;
let filters;
let manifest;
let allTrees = [];
let highlightTrees = [];
let visibleTrees = [];
let selectedTree = null;
let trails = [];
let trailExperience;
let activeView = 'nearby';
let fullInventoryLoaded = false;
let inventoryLoad;
let inventoryMode = 'highlights';

async function start() {
  shell = createAppShell();
  document.body.replaceChildren(shell.app);
  document.documentElement.dataset.theme = store.getState().theme;
  status = createStatusRegion();
  shell.app.append(status.element);
  shell.inspector.innerHTML = loadingMarkup();
  wireConnectivity();

  manifest = await loadCityManifest('vancouver');
  const initialPack = await worker.loadCity(manifest.data.highlightsPack);
  store.dispatch({ type: 'CITY_LOADED', city: manifest });
  highlightTrees = await worker.queryBounds(manifest.bounds);
  allTrees = highlightTrees;
  visibleTrees = highlightTrees;
  trails = initialPack.trails ?? [];

  map = new MapController(shell.map, {
    onSelect: id => selectTree(id),
    onMove: () => activeView === 'nearby' && renderNearby()
  });
  map.setTrees(allTrees.map(toFeature));
  updateInventoryToggle();

  const search = createSearch({
    search: async query => {
      await ensureFullInventory();
      return worker.search(query, 12);
    },
    onSelect: tree => selectTree(tree.id, tree)
  });
  filters = createFilters({ onChange: applyFilter });
  shell.searchSlot.append(search);
  shell.actionsSlot.append(filters.element, createLocationButton(), createThemeButton());
  shell.map.addEventListener('pointerdown', () => {
    if (matchMedia('(max-width: 767px)').matches) shell.sheet.setState('map');
  }, { passive: true });
  shell.inventoryToggle.addEventListener('click', toggleInventoryMode);
  shell.sheet.onClose(clearSelection);
  shell.routeCapsule.addEventListener('click', showRouteBuilder);
  renderNearby();
  updateRouteCapsule();
  status.announce(`${highlightTrees.length} tree highlights loaded for Vancouver. The complete public inventory is available on request.`);
}

function wireConnectivity() {
  const update = online => {
    shell.offlineNotice.hidden = online;
    shell.offlineNotice.textContent = online ? '' : 'You are offline. Showing saved tree data.';
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
      button.textContent = 'Near me';
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

async function applyFilter(kind) {
  await setInventoryMode('all');
  store.dispatch(actions.setFilters({ kind }));
  visibleTrees = allTrees.filter(tree => matchesFilter(tree, kind));
  map.setTrees(visibleTrees.map(toFeature));
  filters.setCount(visibleTrees.length);
  if (selectedTree && !visibleTrees.some(tree => tree.id === selectedTree.id)) clearSelection();
  if (activeView === 'nearby') renderNearby();
  status.announce(`${visibleTrees.length} tree records visible. ${kind === 'all' ? 'Filters cleared.' : 'Filters applied.'}`);
}

function matchesFilter(tree, kind, date = new Date()) {
  if (kind === 'fruit-families') return isFruitFamily(tree);
  if (kind === 'flowering-families') return isFloweringFamily(tree);
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
  shell.sheet.setState('full');
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
  restoreMapOverview();
  shell.sheet.setSelectionActive(false);
  shell.sheet.setState('peek');
  renderNearby();
}

function renderNearby() {
  activeView = 'nearby';
  const ranked = visibleTrees.map(withDistance).sort((a, b) => a.distance - b.distance);
  const nearby = inventoryMode === 'highlights' ? selectCategoryBalancedTrees(ranked) : ranked.slice(0, 8);
  renderNearbyInspector(shell.inspector, nearby, {
    total: visibleTrees.length,
    highlightMode: inventoryMode === 'highlights',
    onSelect: tree => selectTree(tree.id, tree),
    onTrails: trails.length ? showTrails : null,
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
  if (!trails.length) return;
  activeView = 'trails';
  selectedTree = null;
  restoreMapOverview();
  shell.sheet.setSelectionActive(false);
  shell.sheet.setState('full');
  experience.renderTrailCatalogue(shell.inspector, trails, {
    onBack: () => {
      restoreMapOverview();
      shell.sheet.setState('peek');
      renderNearby();
    },
    onSelect: showTrail
  });
  status.announce(`${trails.length} Treeways trail previews available.`);
}

function showTrail(trail) {
  activeView = 'trail';
  shell.map.dataset.view = 'trail';
  const trailTreeIds = new Set(trail.clusterStops.flatMap(stop => stop.memberTreeIds));
  const sourceTrees = inventoryMode === 'all' ? allTrees : highlightTrees;
  map.setTrees(sourceTrees.filter(tree => trailTreeIds.has(tree.id)).map(toFeature));
  map.showTrail(trail.route.geometry, orderedClusterStops(trail).filter((stop, index, stops) => index === 0 || stop.id !== stops[0].id));
  shell.sheet.setState('half');
  trailExperience.renderTrailDetail(shell.inspector, trail, { onBack: showTrails });
  status.announce(`${trail.name} selected. ${trail.clusterStops.length} tree-rich area stops.`);
}

function restoreMapOverview() {
  shell.map.dataset.view = 'overview';
  map.select(null);
  map.setRoute(null);
  map.setTrees(visibleTrees.map(toFeature));
}

async function loadTrailExperience() {
  if (!trailExperience) {
    trailExperience = await import('./ui/trail-browser.js');
  }
  return trailExperience;
}

async function toggleInventoryMode() {
  const nextMode = inventoryMode === 'highlights' ? 'all' : 'highlights';
  try {
    await setInventoryMode(nextMode);
    status.announce(nextMode === 'all' ? `${allTrees.length} public-tree records are now shown.` : `${highlightTrees.length} tree highlights are now shown.`);
  } catch (error) {
    console.error('Complete inventory load failed:', error);
    status.announce(navigator.onLine ? 'The complete public-tree inventory could not be loaded.' : 'Connect to load the complete public-tree inventory.');
  }
}

async function setInventoryMode(mode) {
  if (mode === 'all') await ensureFullInventory();
  inventoryMode = mode;
  const sourceTrees = mode === 'all' ? allTrees : highlightTrees;
  visibleTrees = sourceTrees.filter(tree => matchesFilter(tree, store.getState().filters.kind));
  map.setTrees(visibleTrees.map(toFeature));
  updateInventoryToggle();
  filters?.setCount(visibleTrees.length);
  if (activeView === 'nearby') renderNearby();
}

async function ensureFullInventory() {
  if (fullInventoryLoaded) return;
  if (inventoryLoad) return inventoryLoad;
  shell.inventoryToggle.disabled = true;
  shell.inventoryToggle.setAttribute('aria-busy', 'true');
  updateInventoryToggle({ loading: true });
  inventoryLoad = (async () => {
    const completePack = await worker.loadCity(manifest.data.pack);
    allTrees = await worker.queryBounds(manifest.bounds);
    trails = completePack.trails ?? [];
    fullInventoryLoaded = true;
  })();
  try {
    await inventoryLoad;
  } finally {
    inventoryLoad = null;
    shell.inventoryToggle.disabled = false;
    shell.inventoryToggle.removeAttribute('aria-busy');
    updateInventoryToggle();
  }
}

function updateInventoryToggle({ loading = false } = {}) {
  const enabled = inventoryMode === 'all';
  shell.inventoryToggle.setAttribute('aria-checked', String(enabled));
  const inventoryStatus = shell.inventoryToggle.querySelector('.inventory-toggle-status');
  if (loading) {
    inventoryStatus.textContent = 'Loading complete inventory';
    return;
  }
  const count = enabled ? allTrees.length : highlightTrees.length;
  inventoryStatus.textContent = enabled
    ? `${formatCount(count)} records shown`
    : `${formatCount(count)} highlights shown`;
}

function formatCount(value) {
  return new Intl.NumberFormat('en-CA').format(value);
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
    onClear: () => updateRoute([])
  });
  render();
}

function updateRoute(stops) {
  store.dispatch(actions.setRouteStops(stops));
  store.dispatch(actions.setRoute({ ...store.getState().route, status: 'idle', geometry: null, distance: null, duration: null }));
  map.setRoute(null);
  updateRouteCapsule();
  if (activeView === 'route') showRouteBuilder();
  else if (selectedTree) renderSelectedTree();
  if (stops.length === 1) status.announce(`Stop 1 added: ${titleCase(stops[0].commonName)}.`);
  if (stops.length > 1) status.announce(`${stops.length} ordered stops are ready to open in walking directions.`);
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
