import { describe, it, expect, beforeEach } from 'vitest';
import { Drawer } from '../src/components/drawer.js';
import { state } from '../src/state.js';

describe('Drawer Component', () => {
  let drawerEl, contentEl;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="bottom-sheet" class="bottom-sheet collapsed">
        <div id="drag-handle-container"></div>
        <div id="sheet-content"></div>
      </div>
    `;
    drawerEl = document.getElementById('bottom-sheet');
    contentEl = document.getElementById('sheet-content');
  });

  it('should compile detail templates correctly', () => {
    const d = new Drawer(drawerEl, contentEl);
    const mockTree = {
      id: 1,
      name: 'Cherry',
      genus: 'Prunus',
      species: 'Serrulata',
      height: 4.5,
      diameter: 12,
      address: 'Kitsilano',
      bloom: [3, 4],
      harvest: [],
      type: 'flower',
      usefulness: 'Pretty blossoms'
    };
    const html = d.compileDetailTemplate(mockTree);
    expect(html).toContain('Cherry'); // Defaults to 'Cherry'
  });
});
