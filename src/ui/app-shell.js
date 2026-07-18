import { createBottomSheet } from './bottom-sheet.js';

export function createAppShell() {
  const app = document.createElement('main');
  app.className = 'app-shell';

  const skipLink = document.createElement('a');
  skipLink.className = 'skip-link';
  skipLink.href = '#nearby-results';
  skipLink.textContent = 'Skip to nearby trees';

  const map = document.createElement('section');
  map.id = 'map';
  map.setAttribute('role', 'region');
  map.setAttribute('aria-label', 'Interactive tree map of Vancouver');

  const toolbar = document.createElement('header');
  toolbar.className = 'toolbar';
  toolbar.setAttribute('aria-label', 'Map controls');

  const cityContext = document.createElement('div');
  cityContext.className = 'city-context';
  const brand = document.createElement('span');
  brand.className = 'wordmark';
  brand.textContent = 'Treeways';
  const cityName = document.createElement('strong');
  cityName.textContent = 'Vancouver';
  const season = document.createElement('span');
  season.textContent = currentSeason();
  const place = document.createElement('span');
  place.className = 'city-place';
  place.append(cityName, document.createTextNode(' · '), season);
  cityContext.append(brand, place);

  const searchSlot = document.createElement('div');
  searchSlot.className = 'toolbar-search';
  const actionsSlot = document.createElement('div');
  actionsSlot.className = 'toolbar-actions';
  toolbar.append(cityContext, searchSlot, actionsSlot);

  const inspectorContent = document.createElement('div');
  inspectorContent.className = 'inspector-content';
  const sheet = createBottomSheet(inspectorContent);

  const routeCapsule = document.createElement('button');
  routeCapsule.type = 'button';
  routeCapsule.className = 'route-capsule';
  routeCapsule.hidden = true;

  const offlineNotice = document.createElement('p');
  offlineNotice.className = 'offline-notice';
  offlineNotice.hidden = true;
  offlineNotice.setAttribute('role', 'status');

  app.append(skipLink, map, toolbar, routeCapsule, offlineNotice, sheet.element);
  return {
    app,
    map,
    toolbar,
    searchSlot,
    actionsSlot,
    inspector: inspectorContent,
    sheet,
    routeCapsule,
    offlineNotice
  };
}

function currentSeason(date = new Date()) {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  if (month >= 9 && month <= 11) return 'Autumn';
  return 'Winter';
}
