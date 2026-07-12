import 'maplibre-gl/dist/maplibre-gl.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/app-shell.css';
import { createStore } from './core/store.js';
import { actions } from './core/actions.js';
import { loadCityManifest } from './data/city-loader.js';
import { DataWorkerClient } from './data/worker-client.js';
import { toFeature } from './domain/tree.js';
import { MapController } from './map/map-controller.js';
import { createAppShell } from './ui/app-shell.js';
import { createSearch } from './ui/search.js';
import { createFilters } from './ui/filters.js';
import { renderTreeInspector } from './ui/tree-inspector.js';
import { addRouteStop } from './ui/route-builder.js';
import { OsrmProvider } from './services/routing/osrm-provider.js';
import { createStatusRegion } from './ui/status-region.js';

const initialState = { city: null, dataStatus: 'loading', selectedTreeId: null, filters: { kind: 'all' }, sheet: 'closed', location: null, theme: localStorage.getItem('theme') ?? 'daylight', route: { stops: [], version: 0, status: 'idle', geometry: null, distance: null, duration: null }, error: null };
const store = createStore(initialState); const worker = new DataWorkerClient(); const routeProvider = new OsrmProvider(); let map; let routeAbort; let selectedTree;
async function start() { const shell = createAppShell(); document.body.replaceChildren(shell.app); document.documentElement.dataset.theme = store.getState().theme; const status = createStatusRegion(); shell.app.append(status.element); const manifest = await loadCityManifest('vancouver'); await worker.loadCity(manifest.data.pack); store.dispatch({ type: 'CITY_LOADED', city: manifest }); map = new MapController(shell.map, { onSelect: id => selectTree(id) }); const trees = await worker.queryBounds(manifest.bounds); map.setTrees(trees.map(toFeature)); const selectSearchTree = tree => selectTree(tree.id, tree); shell.toolbar.append(createSearch({ search: query => worker.search(query, 8), onSelect: selectSearchTree }), createFilters({ onChange: kind => { store.dispatch(actions.setFilters({ kind })); status.announce('Filters applied.'); } })); const theme = document.createElement('button'); theme.type = 'button'; theme.textContent = 'Dusk mode'; theme.addEventListener('click', () => { const value = document.documentElement.dataset.theme === 'dusk' ? 'daylight' : 'dusk'; document.documentElement.dataset.theme = value; localStorage.setItem('theme', value); theme.textContent = value === 'dusk' ? 'Daylight mode' : 'Dusk mode'; }); shell.toolbar.append(theme); store.subscribe(state => { if (state.selectedTreeId !== selectedTree?.id) renderTreeInspector(shell.inspector, selectedTree, { onRoute: tree => requestRoute(addRouteStop(state.route.stops, tree)), onNavigate: () => {} }); if (state.route.geometry) map.setRoute(state.route.geometry); }); async function selectTree(id, tree) { selectedTree = tree ?? await worker.getTree(id); store.dispatch(actions.selectTree(id)); map.select(id); shell.sheet.setState('peek'); status.announce(`${selectedTree.commonName} selected.`); } async function requestRoute(stops) { routeAbort?.abort(); const version = store.getState().route.version + 1; store.dispatch(actions.setRouteStops(stops)); if (stops.length < 2) return; routeAbort = new AbortController(); store.dispatch(actions.setRoute({ ...store.getState().route, status: 'loading' })); try { const route = await routeProvider.route(stops, routeAbort.signal); if (store.getState().route.version !== version) return; store.dispatch(actions.setRoute({ ...store.getState().route, ...route, status: 'ready' })); status.announce(`Route ready: ${(route.distance / 1000).toFixed(1)} kilometres, ${Math.round(route.duration / 60)} minutes walking.`); } catch (error) { if (error.name !== 'AbortError') store.dispatch(actions.setRoute({ ...store.getState().route, status: 'error' })); } } }
start().catch(error => { document.body.textContent = `The tree map could not start: ${error.message}`; });
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
