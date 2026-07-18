import { routeSummary } from './route-summary.js';

export function addRouteStop(stops, tree) {
  return stops.some(stop => stop.id === tree.id) ? stops : [...stops, routeStop(tree)];
}

export function moveRouteStop(stops, index, direction) {
  const target = index + direction;
  if (target < 0 || target >= stops.length) return stops;
  const next = [...stops];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function googleWalkingDirectionsUrl(stops) {
  if (stops.length < 2) return '';
  const parameters = new URLSearchParams({
    api: '1',
    origin: coordinate(stops[0]),
    destination: coordinate(stops.at(-1)),
    travelmode: 'walking'
  });
  const waypoints = stops.slice(1, -1).map(coordinate).join('|');
  if (waypoints) parameters.set('waypoints', waypoints);
  return `https://www.google.com/maps/dir/?${parameters}`;
}

export function renderRouteBuilder(root, route, { onBack, onMove, onRemove, onClear }) {
  root.replaceChildren();
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'text-button back-button';
  back.textContent = 'Back to trees';
  back.addEventListener('click', onBack);
  const label = document.createElement('p');
  label.className = 'section-label';
  label.textContent = 'Walking route';
  const title = document.createElement('h1');
  title.textContent = route.stops.length < 2 ? 'Add one more tree' : 'Your tree walk';
  const summary = document.createElement('p');
  summary.className = 'route-summary';
  summary.setAttribute('role', 'status');
  summary.textContent = route.stops.length ? routeSummary(route) : 'Add a tree to begin a walking route.';
  root.append(back, label, title, summary);

  const list = document.createElement('ol');
  list.className = 'route-stop-list';
  route.stops.forEach((stop, index) => {
    const item = document.createElement('li');
    const number = document.createElement('span');
    number.className = 'stop-number';
    number.textContent = String(index + 1);
    const name = document.createElement('strong');
    name.textContent = stop.commonName;
    const controls = document.createElement('div');
    controls.className = 'stop-controls';
    const earlier = controlButton('Earlier', `Move ${stop.commonName} earlier`, index === 0, () => onMove(index, -1));
    const later = controlButton('Later', `Move ${stop.commonName} later`, index === route.stops.length - 1, () => onMove(index, 1));
    const remove = controlButton('Remove', `Remove ${stop.commonName} from route`, false, () => onRemove(index));
    controls.append(earlier, later, remove);
    item.append(number, name, controls);
    list.append(item);
  });
  root.append(list);

  if (route.stops.length > 1) {
    const directions = document.createElement('a');
    directions.className = 'primary-action route-directions';
    directions.href = googleWalkingDirectionsUrl(route.stops);
    directions.target = '_blank';
    directions.rel = 'noopener noreferrer';
    directions.textContent = 'Open walking directions';
    const handoff = document.createElement('p');
    handoff.className = 'provenance-note';
    handoff.textContent = 'Opens your ordered stops in Google Maps, where current walking directions are calculated.';
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'text-button clear-route';
    clear.textContent = 'Clear route';
    clear.addEventListener('click', onClear);
    root.append(directions, handoff, clear);
  }
}

function coordinate(stop) {
  return `${Number(stop.latitude)},${Number(stop.longitude)}`;
}

function routeStop(tree) {
  return {
    id: tree.id,
    commonName: tree.commonName,
    latitude: tree.latitude,
    longitude: tree.longitude
  };
}

function controlButton(label, accessibleName, disabled, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.setAttribute('aria-label', accessibleName);
  button.disabled = disabled;
  button.addEventListener('click', onClick);
  return button;
}
