import { state } from '../state.js';

export class Drawer {
  constructor(element, contentElement) {
    this.element = element;
    this.contentElement = contentElement;
    this.startY = 0;
    this.currentTranslateY = 0;
    this.isDragging = false;
    
    this.initDragEvents();
    this.initListeners();
  }

  initListeners() {
    // Listen to changes in selectedTree, customRouteStops, and uiState
    state.subscribe('uiState', (uiState) => {
      this.updateStateClass(uiState);
    });

    state.subscribe('selectedTree', (tree) => {
      if (tree) {
        this.renderTreeDetails(tree);
      } else if (state.get('customRouteStops').length > 0) {
        this.renderRouteInfo();
      } else {
        this.renderEmptyState();
      }
    });

    state.subscribe('customRouteStops', (stops) => {
      if (!state.get('selectedTree') && stops.length > 0) {
        this.renderRouteInfo();
      }
    });
  }

  updateStateClass(uiState) {
    this.element.classList.remove('collapsed', 'half', 'expanded');
    this.element.classList.add(uiState);
    
    // Clear inline transforms if state is updated programmatically
    this.element.style.transform = '';
  }

  initDragEvents() {
    const handle = document.getElementById('drag-handle-container');
    if (!handle) return;

    const startDrag = (y) => {
      this.startY = y;
      this.element.style.transition = 'none';
      this.isDragging = true;
    };

    const moveDrag = (y) => {
      if (!this.isDragging) return;
      const deltaY = y - this.startY;
      if (deltaY > 0) {
        // Dragging down
        this.element.style.transform = `translateY(${deltaY}px)`;
      }
    };

    const endDrag = (y) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.element.style.transition = '';
      this.element.style.transform = '';
      
      const deltaY = y - this.startY;
      const threshold = 100;
      
      const currentUi = state.get('uiState');
      if (deltaY > threshold) {
        // Collapse or scale down
        if (currentUi === 'expanded') {
          state.set('uiState', 'half');
        } else if (currentUi === 'half') {
          state.set('uiState', 'collapsed');
        }
      } else if (deltaY < -threshold) {
        // Expand
        if (currentUi === 'collapsed') {
          state.set('uiState', 'half');
        } else if (currentUi === 'half') {
          state.set('uiState', 'expanded');
        }
      }
    };

    handle.addEventListener('mousedown', (e) => startDrag(e.clientY));
    document.addEventListener('mousemove', (e) => moveDrag(e.clientY));
    document.addEventListener('mouseup', (e) => endDrag(e.clientY));

    handle.addEventListener('touchstart', (e) => startDrag(e.touches[0].clientY), { passive: true });
    document.addEventListener('touchmove', (e) => moveDrag(e.touches[0].clientY), { passive: true });
    document.addEventListener('touchend', (e) => endDrag(e.changedTouches[0].clientY));
  }

  renderEmptyState() {
    this.contentElement.innerHTML = `
      <div style="text-align:center; padding:20px; color:var(--text-secondary);">
        <p style="font-size:18px; font-weight:700; margin-bottom:8px; color:var(--text-primary);">🌲 Vancouver Urban Canopy</p>
        <p style="font-size:13px;">Tap any colored marker on the map to inspect fruit harvesting schedules, cherry blossom bloom calendars, or build custom paths.</p>
      </div>
    `;
    state.set('uiState', 'collapsed');
  }

  renderTreeDetails(tree) {
    this.contentElement.innerHTML = this.compileDetailTemplate(tree);
    
    // Add event handlers
    const addBtn = this.contentElement.querySelector('#add-route-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        state.addRouteStop(tree);
        addBtn.innerText = 'Added to Route!';
        addBtn.disabled = true;
      });
    }

    const navBtn = this.contentElement.querySelector('#nav-btn');
    if (navBtn) {
      navBtn.addEventListener('click', () => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${tree.lat},${tree.lng}&travelmode=walking`);
      });
    }
  }

  compileDetailTemplate(tree) {
    const typeLabel = {
      'flower': '🌸 Flowering',
      'fruit': '🍎 Edible Fruit/Nut',
      'both': '✨ Fruit & Flower'
    }[tree.type] || '🌳 Standard';

    // Build timeline blocks
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = state.get('currentMonth') - 1;
    
    const timelineHtml = months.map((m, idx) => {
      const isBloom = tree.bloom && tree.bloom.includes(idx + 1);
      const isHarvest = tree.harvest && tree.harvest.includes(idx + 1);
      
      let cssClass = '';
      if (isBloom && isHarvest) cssClass = 'both';
      else if (isBloom) cssClass = 'bloom';
      else if (isHarvest) cssClass = 'harvest';
      
      if (idx === currentMonthIdx) cssClass += ' current-month';

      return `<div class="calendar-month ${cssClass}">${m}</div>`;
    }).join('');

    // Select dynamic placeholder image matching species
    let imageSrc = 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80'; // default tree
    if (tree.type === 'flower') {
      imageSrc = 'https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?auto=format&fit=crop&w=600&q=80'; // cherry blossom
    } else if (tree.type === 'fruit' || tree.type === 'both') {
      if (tree.name.includes('FIG')) {
        imageSrc = 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=600&q=80';
      } else if (tree.name.includes('APPLE')) {
        imageSrc = 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80';
      } else {
        imageSrc = 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=600&q=80'; // general fruit
      }
    }

    const alreadyAdded = state.get('customRouteStops').some(s => s.id === tree.id);

    return `
      <div class="tree-detail-header">
        <div>
          <h2 class="tree-title">${tree.name || 'Unknown Species'}</h2>
          <div class="tree-scientific">${tree.genus || ''} ${tree.species || ''}</div>
        </div>
        <span class="tag-badge ${tree.type}">${typeLabel}</span>
      </div>
      
      <img class="tree-image" src="${imageSrc}" alt="${tree.name}">
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Height</div>
          <div class="stat-value">${tree.height ? tree.height.toFixed(1) : '?'} m</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Diameter</div>
          <div class="stat-value">${tree.diameter ? tree.diameter.toFixed(0) : '?'} cm</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Address</div>
          <div class="stat-value" style="font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${tree.address || 'Unknown'}">${tree.address || 'Unknown'}</div>
        </div>
      </div>
      
      <div class="timeline-section">
        <div class="section-title">Seasonal Calendar</div>
        <div class="calendar-strip">
          ${timelineHtml}
        </div>
      </div>
      
      ${tree.usefulness ? `
        <div class="usefulness-card">
          <strong>Usefulness & Story:</strong><br>
          ${tree.usefulness}
        </div>
      ` : ''}
      
      <div class="action-buttons">
        <button class="btn btn-primary" id="add-route-btn" ${alreadyAdded ? 'disabled' : ''}>
          ${alreadyAdded ? 'Added to Route!' : 'Add to Walking Route'}
        </button>
        <button class="btn btn-secondary" id="nav-btn">Navigate</button>
      </div>
    `;
  }

  renderRouteInfo() {
    const stops = state.get('customRouteStops');
    const info = state.get('currentRouteInfo');
    
    let statsHtml = `Stops: ${stops.length}`;
    if (info) {
      const distanceKm = (info.distance / 1000).toFixed(1);
      const durationMins = Math.round(info.duration / 60);
      statsHtml = `${stops.length} stops • ${distanceKm} km • ${durationMins} mins walk`;
    }

    const stopsListHtml = stops.map((s, idx) => `
      <div class="route-stop-item">
        <div class="stop-info">
          <span class="stop-num">${idx + 1}</span>
          <span class="stop-name">${s.name}</span>
        </div>
        <button class="remove-stop-btn" data-id="${s.id}">×</button>
      </div>
    `).join('');

    this.contentElement.innerHTML = `
      <div class="route-pane">
        <div class="route-summary">
          <div>
            <h2 class="tree-title">Your Custom Trail</h2>
            <div class="tree-scientific">${statsHtml}</div>
          </div>
          <button class="btn btn-secondary" style="padding: 8px 12px; font-size:12px;" id="clear-route-btn">Clear</button>
        </div>
        
        <div class="route-stops-list">
          ${stopsListHtml}
        </div>
        
        <div class="action-buttons">
          <button class="btn btn-primary" id="start-trail-btn" ${stops.length < 2 ? 'disabled' : ''}>Start Walking Tour</button>
        </div>
      </div>
    `;

    // Event hooks
    this.contentElement.querySelectorAll('.remove-stop-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        state.removeRouteStop(id);
      });
    });

    const clearBtn = this.contentElement.querySelector('#clear-route-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        state.clearRoute();
      });
    }

    const startBtn = this.contentElement.querySelector('#start-trail-btn');
    if (startBtn && stops.length >= 2) {
      startBtn.addEventListener('click', () => {
        const stopCoords = stops.map(s => `${s.lat},${s.lng}`).join('/');
        window.open(`https://www.google.com/maps/dir/${stopCoords}/&travelmode=walking`);
      });
    }
  }
}
