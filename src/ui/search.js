import { scientificName, titleCase } from './format.js';

export function createSearch({ search, onSelect }) {
  const form = document.createElement('form');
  form.className = 'search';
  const label = document.createElement('label');
  label.htmlFor = 'tree-search';
  label.textContent = 'Search trees';
  const input = document.createElement('input');
  input.id = 'tree-search';
  input.type = 'search';
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.placeholder = 'Search';
  const list = document.createElement('ul');
  list.hidden = true;
  list.id = 'search-results';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', 'Matching tree specimens');
  input.setAttribute('aria-controls', list.id);
  form.append(label, input, list);

  let results = [];
  let active = -1;
  let timer;
  let requestId = 0;

  const close = () => {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  };

  const render = async () => {
    const id = ++requestId;
    const query = input.value.trim();
    if (!query) {
      results = [];
      list.replaceChildren();
      close();
      return;
    }
    results = await search(query);
    if (id !== requestId) return;
    active = -1;
    if (!results.length) {
      const empty = document.createElement('li');
      empty.className = 'search-empty';
      empty.textContent = 'No nearby records match. Try a species or address.';
      list.replaceChildren(empty);
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      return;
    }
    list.replaceChildren(...results.map((tree, index) => {
      const option = document.createElement('li');
      option.id = `tree-option-${index}`;
      option.setAttribute('role', 'option');
      option.tabIndex = -1;
      const name = document.createElement('strong');
      name.textContent = titleCase(tree.commonName);
      const scientific = document.createElement('em');
      scientific.textContent = scientificName(tree);
      const address = document.createElement('span');
      address.textContent = tree.address || 'Address not recorded';
      option.append(name, scientific, address);
      option.addEventListener('click', () => {
        onSelect(tree);
        close();
      });
      return option;
    }));
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  };

  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(render, 150);
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') close();
    if (['ArrowDown', 'ArrowUp'].includes(event.key) && results.length) {
      event.preventDefault();
      active = (active + (event.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length;
      list.querySelectorAll('[role="option"]').forEach((option, index) => option.setAttribute('aria-selected', String(index === active)));
      input.setAttribute('aria-activedescendant', `tree-option-${active}`);
    }
    if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      onSelect(results[active]);
      close();
    }
  });
  form.addEventListener('submit', event => event.preventDefault());
  return form;
}
