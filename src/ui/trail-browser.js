import { orderedClusterStops } from '../domain/trails.js';
import { googleWalkingDirectionsUrl } from './route-builder.js';

export function renderTrailCatalogue(root, trails, { onBack, onSelect }) {
  root.replaceChildren();
  root.scrollTop = 0;
  const header = document.createElement('header');
  header.className = 'trail-intro';
  header.innerHTML = '<p class="section-label">Treeways · Vancouver</p><h1>Reviewed neighbourhood walks</h1><p>Density-led walks through tree-rich areas, with familiar tree names highlighted along the way.</p>';
  header.prepend(action('Back to nearby trees', 'text-button back-button', onBack));
  const notice = document.createElement('div');
  notice.className = 'review-notice';
  notice.innerHTML = '<strong>Human-reviewed catalogue</strong><p>Only routed pilots approved by an identified reviewer appear here.</p>';
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
  root.scrollTop = 0;
  const header = document.createElement('header');
  header.className = 'trail-detail-header';
  header.append(action('All trails', 'text-button back-button', onBack));
  const label = document.createElement('p');
  label.className = 'section-label';
  label.textContent = `${trail.neighbourhoodName} · ${trail.theme.displayName}`;
  const title = document.createElement('h1');
  title.textContent = trail.name;
  const copy = document.createElement('p');
  copy.textContent = trail.narrative;
  header.append(label, title, copy);

  const meta = document.createElement('div');
  meta.className = 'trail-detail-meta';
  meta.append(
    metaItem(distanceLabel(trail), 'routed distance'),
    metaItem(String(trail.clusterStops.length), 'tree-rich areas'),
    metaItem(shapeLabel(trail.shape), 'walking trail')
  );

  const directions = document.createElement('div');
  directions.className = 'primary-actions trail-directions';
  const walkingLink = document.createElement('a');
  walkingLink.className = 'primary-action';
  walkingLink.href = googleWalkingDirectionsUrl(orderedClusterStops(trail).map(stop => stop.anchor));
  walkingLink.target = '_blank';
  walkingLink.rel = 'noopener noreferrer';
  walkingLink.textContent = 'Open walking directions';
  directions.append(walkingLink);

  const caveat = document.createElement('p');
  caveat.className = 'data-caution';
  caveat.textContent = 'Distance and path geometry come from the pinned OpenRouteService walking result. Accessibility, right of access, safety, and live conditions remain unknown; check current conditions before setting out.';

  const stops = document.createElement('ol');
  stops.className = 'trail-stop-list';
  orderedClusterStops(trail).filter((stop, index, ordered) => index === 0 || stop.id !== ordered[0].id).forEach((stop, index) => {
    const item = document.createElement('li');
    const number = document.createElement('span');
    number.className = 'stop-number';
    number.textContent = String(index + 1);
    const identity = document.createElement('span');
    const name = document.createElement('strong');
    name.textContent = stop.locationLabel;
    const details = document.createElement('small');
    details.textContent = `${stop.totalTreeCount} recorded trees · ${stop.themeTreeCount} ${trail.theme.displayName} records · ${stop.diversityCount} recorded kinds`;
    identity.append(name, details);
    item.append(number, identity);
    stops.append(item);
  });

  const provenance = document.createElement('section');
  provenance.className = 'trail-provenance';
  const provenanceTitle = document.createElement('h2');
  provenanceTitle.textContent = 'Review and route record';
  const review = document.createElement('p');
  review.textContent = `Reviewed by ${trail.review.reviewer} on ${reviewDate(trail.review.reviewedAt)}.`;
  const routing = document.createElement('p');
  routing.textContent = trail.route.provenance.attribution;
  const counts = document.createElement('p');
  counts.textContent = `${totalTreeCount(trail)} recorded trees across ${trail.clusterStops.length} distinct areas. Individual records appear around each area on the map.`;
  provenance.append(provenanceTitle, review, routing, counts);
  root.append(header, meta, directions, caveat, stops, provenance);
}

function trailCard(trail, index, onSelect) {
  const item = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'trail-card';
  const number = document.createElement('span');
  number.className = 'trail-number';
  number.textContent = String(index + 1).padStart(2, '0');
  const copy = document.createElement('span');
  copy.className = 'trail-card-copy';
  const context = document.createElement('small');
  context.textContent = `${trail.neighbourhoodName} · ${trail.theme.displayName}`;
  const name = document.createElement('strong');
  name.textContent = trail.name;
  const detail = document.createElement('span');
  detail.textContent = `${shapeLabel(trail.shape)} · ${distanceLabel(trail)} · ${trail.clusterStops.length} tree-rich areas`;
  const arrow = document.createElement('span');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '→';
  copy.append(context, name, detail);
  button.append(number, copy, arrow);
  button.addEventListener('click', () => onSelect(trail));
  item.append(button);
  return item;
}

function action(label, className, callback) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.addEventListener('click', callback);
  return button;
}

function metaItem(value, label) {
  const item = document.createElement('span');
  const strong = document.createElement('strong');
  strong.textContent = value;
  const small = document.createElement('small');
  small.textContent = label;
  item.append(strong, small);
  return item;
}

function distanceLabel(trail) {
  return `${(trail.route.distanceM / 1000).toFixed(1)} km`;
}

function shapeLabel(shape) {
  return shape === 'loop' ? 'Loop' : 'Point to point';
}

function totalTreeCount(trail) {
  return new Set(trail.clusterStops.flatMap(stop => stop.memberTreeIds)).size;
}

function reviewDate(value) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
