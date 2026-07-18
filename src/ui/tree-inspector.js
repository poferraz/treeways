import { maskHasMonth } from '../domain/phenology.js';
import { scientificName, titleCase } from './format.js';

export function renderNearbyInspector(root, trees, { total, onSelect, onLocate, onSources, onTrails }) {
  root.replaceChildren();
  const intro = document.createElement('section');
  intro.className = 'orientation-note';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'section-label';
  eyebrow.textContent = 'Treeways · Vancouver';
  const title = document.createElement('h1');
  title.textContent = 'Find your way through the trees';
  const copy = document.createElement('p');
  copy.textContent = seasonalWelcome();
  const introActions = document.createElement('div');
  introActions.className = 'inline-actions';
  const locate = document.createElement('button');
  locate.type = 'button';
  locate.className = 'primary-action';
  locate.textContent = 'Find trees near me';
  locate.addEventListener('click', onLocate);
  const sources = document.createElement('button');
  sources.type = 'button';
  sources.className = 'text-button';
  sources.textContent = 'How data is sourced';
  sources.addEventListener('click', onSources);
  const trails = document.createElement('button');
  trails.type = 'button';
  trails.className = 'secondary-action';
  trails.textContent = 'Browse neighbourhood trails';
  trails.addEventListener('click', onTrails);
  introActions.append(trails, locate, sources);
  intro.append(eyebrow, title, copy, introActions);

  const nearby = document.createElement('section');
  nearby.id = 'nearby-results';
  nearby.className = 'nearby-results';
  nearby.tabIndex = -1;
  const headingRow = document.createElement('div');
  headingRow.className = 'section-heading-row';
  const heading = document.createElement('h2');
  heading.textContent = 'Trees near map centre';
  const count = document.createElement('span');
  count.textContent = `${total} visible`;
  headingRow.append(heading, count);
  nearby.append(headingRow);

  if (!trees.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const emptyTitle = document.createElement('strong');
    emptyTitle.textContent = 'No curated trees match these filters in this area.';
    const emptyCopy = document.createElement('p');
    emptyCopy.textContent = 'Clear filters or move the map to search another area.';
    empty.append(emptyTitle, emptyCopy);
    nearby.append(empty);
  } else {
    const list = document.createElement('ol');
    list.className = 'tree-result-list';
    for (const tree of trees) list.append(createTreeResult(tree, onSelect));
    nearby.append(list);
  }
  root.append(intro, nearby);
}

function seasonalWelcome(date = new Date()) {
  const month = date.getMonth() + 1;
  if (month >= 6 && month <= 8) return 'Summer is a good time to notice canopy shape, shade, and fruit-tree forms. Start with a neighbourhood trail or explore what is near you.';
  if (month >= 9 && month <= 11) return 'Autumn changes the city block by block. Compare maples, fruit-tree families, and measured giants on a neighbourhood trail.';
  if (month >= 3 && month <= 5) return 'Flowering-tree season moves quickly. Compare cherries, plums, magnolias, and dogwoods while noting that timing varies by tree.';
  return 'Winter makes bark, branching, and evergreen form easier to notice. Start with a neighbourhood trail or explore nearby records.';
}

export function renderTreeInspector(root, tree, { onRoute, routeStopIndex }) {
  root.replaceChildren();
  if (!tree) return;
  const header = document.createElement('header');
  header.className = 'tree-header';
  const category = document.createElement('p');
  category.className = 'section-label';
  category.textContent = tree.curated ? 'Curated field-guide tree' : 'Municipal background tree';
  const title = document.createElement('h1');
  title.textContent = titleCase(tree.commonName);
  const scientific = document.createElement('p');
  scientific.className = 'scientific-name';
  const em = document.createElement('em');
  em.textContent = scientificName(tree);
  scientific.append(em);
  const status = document.createElement('p');
  status.className = `season-status ${seasonalState(tree).className}`;
  status.textContent = seasonalState(tree).label;
  header.append(category, title, scientific, status);

  const location = document.createElement('div');
  location.className = 'tree-location';
  const address = document.createElement('strong');
  address.textContent = tree.address ? titleCase(tree.address) : 'Address not recorded';
  const context = document.createElement('span');
  context.textContent = tree.distance == null ? 'Vancouver, British Columbia' : `${formatDistance(tree.distance)} from map centre`;
  location.append(address, context);

  const actions = document.createElement('div');
  actions.className = 'primary-actions';
  const route = document.createElement('button');
  route.type = 'button';
  route.className = 'primary-action';
  route.textContent = routeStopIndex ? `Added as stop ${routeStopIndex}` : 'Add to route';
  route.disabled = Boolean(routeStopIndex);
  route.addEventListener('click', () => onRoute(tree));
  const navigate = document.createElement('a');
  navigate.className = 'secondary-action';
  navigate.textContent = 'Navigate';
  navigate.href = `https://www.google.com/maps/dir/?api=1&destination=${tree.latitude},${tree.longitude}&travelmode=walking`;
  navigate.target = '_blank';
  navigate.rel = 'noopener noreferrer';
  navigate.setAttribute('aria-label', `Navigate to ${titleCase(tree.commonName)}`);
  actions.append(route, navigate);

  const phenology = createPhenology(tree);
  const factsSection = document.createElement('section');
  factsSection.className = 'facts-section';
  const factsTitle = document.createElement('h2');
  factsTitle.textContent = 'Field record';
  const facts = document.createElement('dl');
  [
    ['Height', tree.heightM == null ? 'Not recorded' : `${tree.heightM} m`],
    ['Diameter', tree.diameterCm == null ? 'Not recorded' : `${tree.diameterCm} cm`],
    ['Source', tree.source?.label ?? tree.source ?? 'Not recorded']
  ].forEach(([term, value]) => {
    const group = document.createElement('div');
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    dd.textContent = value;
    group.append(dt, dd);
    facts.append(group);
  });
  factsSection.append(factsTitle, facts);

  if (tree.usefulness) {
    const note = document.createElement('p');
    note.className = 'field-note';
    note.textContent = tree.usefulness;
    factsSection.append(note);
  }
  const caution = document.createElement('p');
  caution.className = 'data-caution';
  caution.textContent = 'Seasonal timing is reported by the dataset. Confirm local rules and conditions before harvesting.';
  factsSection.append(caution);
  root.append(header, location, actions, phenology, factsSection);
}

export function renderSourceInfo(root, manifest, onBack) {
  root.replaceChildren();
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'text-button back-button';
  back.textContent = 'Back to nearby trees';
  back.addEventListener('click', onBack);
  const title = document.createElement('h1');
  title.textContent = 'Where the tree data comes from';
  const copy = document.createElement('p');
  copy.textContent = 'Curated entries combine species context with Vancouver street-tree records. Missing measurements stay unfilled, and seasonal timing is presented as reported rather than guaranteed.';
  const source = document.createElement('dl');
  const dt = document.createElement('dt');
  dt.textContent = 'Municipal source';
  const dd = document.createElement('dd');
  const link = document.createElement('a');
  link.href = manifest.attribution.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = manifest.attribution.name;
  dd.append(link, document.createTextNode(` (${manifest.attribution.license})`));
  source.append(dt, dd);
  root.append(back, title, copy, source);
}

function createTreeResult(tree, onSelect) {
  const item = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  const identity = document.createElement('span');
  const name = document.createElement('strong');
  name.textContent = titleCase(tree.commonName);
  const scientific = document.createElement('em');
  scientific.textContent = scientificName(tree);
  identity.append(name, scientific);
  const meta = document.createElement('span');
  meta.className = 'result-meta';
  meta.textContent = `${formatDistance(tree.distance)} · ${seasonalState(tree).label}`;
  button.append(identity, meta);
  button.addEventListener('click', () => onSelect(tree));
  item.append(button);
  return item;
}

function createPhenology(tree) {
  const section = document.createElement('section');
  section.className = 'phenology-section';
  const title = document.createElement('h2');
  title.textContent = 'Annual timing';
  const legend = document.createElement('p');
  legend.className = 'phenology-legend';
  legend.textContent = 'Bloom and reported harvest periods';
  const band = document.createElement('div');
  band.className = 'phenology-band';
  band.setAttribute('role', 'img');
  band.setAttribute('aria-label', phenologyLabel(tree));
  for (let month = 1; month <= 12; month += 1) {
    const segment = document.createElement('span');
    const bloom = maskHasMonth(tree.bloomMask, month);
    const harvest = maskHasMonth(tree.harvestMask, month);
    segment.className = bloom && harvest ? 'both' : bloom ? 'bloom' : harvest ? 'harvest' : 'inactive';
    if (month === new Date().getMonth() + 1) segment.dataset.current = 'true';
    segment.setAttribute('aria-hidden', 'true');
    band.append(segment);
  }
  const months = document.createElement('div');
  months.className = 'phenology-months';
  months.innerHTML = '<span>Jan</span><span>Apr</span><span>Jul</span><span>Oct</span><span>Dec</span>';
  section.append(title, legend, band, months);
  return section;
}

function phenologyLabel(tree) {
  const bloom = monthsFromMask(tree.bloomMask);
  const harvest = monthsFromMask(tree.harvestMask);
  const parts = [];
  if (bloom.length) parts.push(`Bloom: ${bloom.join(', ')}`);
  if (harvest.length) parts.push(`Reported harvest: ${harvest.join(', ')}`);
  return parts.join('. ') || 'Seasonal timing not recorded';
}

function monthsFromMask(mask) {
  const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return names.filter((_, index) => maskHasMonth(mask, index + 1));
}

export function seasonalState(tree, date = new Date()) {
  const month = date.getMonth() + 1;
  if (maskHasMonth(tree.bloomMask, month)) return { label: 'Blooming now', className: 'bloom' };
  if (maskHasMonth(tree.harvestMask, month)) return { label: 'Reported harvest period', className: 'harvest' };
  if (tree.bloomMask || tree.harvestMask) return { label: 'Seasonal period expected later', className: 'dormant' };
  return { label: 'Seasonal timing not recorded', className: 'dormant' };
}

function formatDistance(distance) {
  if (!Number.isFinite(distance)) return 'Distance unavailable';
  return distance < 1000 ? `${Math.max(10, Math.round(distance / 10) * 10)} m` : `${(distance / 1000).toFixed(1)} km`;
}
