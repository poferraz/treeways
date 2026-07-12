const FILTERS = [
  ['all', 'All curated'],
  ['edible', 'Edible'],
  ['blossoms', 'Blossoms'],
  ['blooming', 'Blooming now'],
  ['harvesting', 'Harvesting now']
];

export function createFilters({ onChange }) {
  const root = document.createElement('div');
  root.className = 'filter-control';
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'icon-button filter-trigger';
  trigger.textContent = 'Filters';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'filter-surface');

  const surface = document.createElement('div');
  surface.className = 'filter-surface';
  surface.id = 'filter-surface';
  surface.hidden = true;
  const heading = document.createElement('div');
  heading.className = 'filter-heading';
  const title = document.createElement('strong');
  title.textContent = 'Show trees for';
  const count = document.createElement('span');
  count.textContent = 'Loading trees';
  heading.append(title, count);
  const fieldset = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.className = 'sr-only';
  legend.textContent = 'Primary tree filters';
  fieldset.append(legend);

  for (const [value, label] of FILTERS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset.filter = value;
    button.setAttribute('aria-pressed', String(value === 'all'));
    button.addEventListener('click', () => {
      fieldset.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      trigger.textContent = value === 'all' ? 'Filters' : `${label} filter`;
      onChange(value);
    });
    fieldset.append(button);
  }

  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'text-button';
  clear.textContent = 'Clear filters';
  clear.addEventListener('click', () => fieldset.querySelector('[data-filter="all"]').click());
  surface.append(heading, fieldset, clear);
  root.append(trigger, surface);

  trigger.addEventListener('click', () => {
    surface.hidden = !surface.hidden;
    trigger.setAttribute('aria-expanded', String(!surface.hidden));
  });

  return {
    element: root,
    setCount(value) { count.textContent = `${value} curated ${value === 1 ? 'tree' : 'trees'} visible`; }
  };
}
