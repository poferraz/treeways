import { directionsUrl } from '../domain/trail-suggestions.js';
import { scientificName, titleCase } from './format.js';

export function renderTrailCatalogue(root, trails, { onBack, onSelect }) {
  root.replaceChildren();
  const header = document.createElement('header');
  header.className = 'trail-intro';
  header.innerHTML = '<p class="section-label">Treeways · Vancouver</p><h1>Choose a neighbourhood trail</h1><p>Ten data-guided routes for comparing tree families, exact species, fruit-tree forms, and measured giants.</p>';
  const back = action('Back to nearby trees', 'text-button back-button', onBack);
  header.prepend(back);
  const notice = document.createElement('div');
  notice.className = 'review-notice';
  notice.innerHTML = '<strong>Preview routes</strong><p>Tree records are real. Route order is generated and still awaits the creator’s street-level review.</p>';
  const filters = document.createElement('div');
  filters.className = 'trail-size-key';
  filters.innerHTML = '<span>Small ≤ 3 km</span><span>Medium ≤ 5 km</span><span>Large ≤ 8 km</span>';
  const list = document.createElement('ol');
  list.className = 'trail-card-list';
  trails.forEach((trail, index) => list.append(trailCard(trail, index, onSelect)));
  root.append(header, notice, filters, list);
}

export function renderTrailDetail(root, trail, { onBack }) {
  root.replaceChildren();
  const header = document.createElement('header');
  header.className = 'trail-detail-header';
  header.append(action('All trails', 'text-button back-button', onBack));
  const label = document.createElement('p');
  label.className = 'section-label';
  label.textContent = `${trail.neighbourhood} · ${trail.theme}`;
  const title = document.createElement('h1');
  title.textContent = trail.name;
  const copy = document.createElement('p');
  copy.textContent = trail.description;
  header.append(label, title, copy);

  const meta = document.createElement('div');
  meta.className = 'trail-detail-meta';
  meta.innerHTML = `<span><strong>${trail.distanceBand.label}</strong><small>up to ${trail.distanceBand.maximumKm} km</small></span><span><strong>${trail.waypoints.length}</strong><small>tree stops</small></span><span><strong>${trail.mode === 'driving' ? 'Drive' : 'Walk'}</strong><small>suggested mode</small></span>`;

  const directions = document.createElement('div');
  directions.className = 'primary-actions trail-directions';
  directions.append(mapLink(trail, 'walking', 'Open walking route'), mapLink(trail, 'driving', 'Open driving route'));
  const caveat = document.createElement('p');
  caveat.className = 'data-caution';
  caveat.textContent = `The ${trail.spanKm.toFixed(1)} km figure is a straight-line span between records, not street distance. Google Maps determines the live route. Check crossings, closures, and access conditions.`;

  const stops = document.createElement('ol');
  stops.className = 'trail-stop-list';
  trail.waypoints.forEach(tree => {
    const item = document.createElement('li');
    const number = document.createElement('span');
    number.className = 'stop-number';
    number.textContent = String(stops.children.length + 1);
    const identity = document.createElement('span');
    const name = document.createElement('strong');
    name.textContent = titleCase(tree.commonName);
    const details = document.createElement('small');
    details.textContent = `${scientificName(tree)} · ${tree.address ? titleCase(tree.address) : 'Address not recorded'}`;
    identity.append(name, details);
    item.append(number, identity);
    stops.append(item);
  });

  const provenance = document.createElement('section');
  provenance.className = 'trail-provenance';
  provenance.innerHTML = `<h2>Before you go</h2><p>${trail.provenance}</p><p>Fruit-tree routes are for looking and learning only. Tree condition, seasonal timing, accessibility, and harvesting permission are not asserted.</p>`;
  root.append(header, meta, directions, caveat, stops, provenance);
}

function trailCard(trail, index, onSelect) {
  const item = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'trail-card';
  button.innerHTML = `<span class="trail-number">${String(index + 1).padStart(2, '0')}</span><span class="trail-card-copy"><small>${trail.neighbourhood} · ${trail.theme}</small><strong>${trail.name}</strong><span>${trail.distanceBand.label} · up to ${trail.distanceBand.maximumKm} km · ${trail.waypoints.length} stops</span></span><span aria-hidden="true">→</span>`;
  button.addEventListener('click', () => onSelect(trail));
  item.append(button);
  return item;
}

function mapLink(trail, mode, label) {
  const link = document.createElement('a');
  link.className = mode === trail.mode ? 'primary-action' : 'secondary-action';
  link.href = directionsUrl(trail, mode);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = label;
  return link;
}

function action(label, className, callback) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', callback);
  return button;
}
