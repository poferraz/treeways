class StateManager {
  constructor() {
    this.reset();
  }

  reset() {
    this._state = {
      selectedTree: null,
      activeFilters: 'all',
      customRouteStops: [], // Array of stops: { id, name, lat, lng }
      currentRouteGeometry: null, // OSRM GeoJSON geometry
      currentRouteInfo: null, // { distance, duration }
      uiState: 'collapsed', // collapsed, half, expanded
      curatedTrees: [], // list of trees loaded initially
      currentMonth: new Date().getMonth() + 1 // 1-indexed (1 = Jan, 12 = Dec)
    };
    this._listeners = {};
  }

  subscribe(key, callback) {
    if (!this._listeners[key]) {
      this._listeners[key] = [];
    }
    this._listeners[key].push(callback);
    // Call immediately with initial value
    callback(this._state[key]);
    return () => {
      this._listeners[key] = this._listeners[key].filter(cb => cb !== callback);
    };
  }

  _notify(key) {
    if (this._listeners[key]) {
      this._listeners[key].forEach(callback => callback(this._state[key]));
    }
  }

  get(key) {
    return this._state[key];
  }

  set(key, value) {
    if (JSON.stringify(this._state[key]) !== JSON.stringify(value)) {
      this._state[key] = value;
      this._notify(key);
    }
  }

  setSelectedTree(tree) {
    this.set('selectedTree', tree);
    if (tree) this.set('uiState', 'half');
  }

  addRouteStop(tree) {
    const stops = [...this._state.customRouteStops];
    if (!stops.some(s => s.id === tree.id)) {
      stops.push({
        id: tree.id,
        name: tree.name,
        lat: tree.lat,
        lng: tree.lng
      });
      this.set('customRouteStops', stops);
    }
  }

  removeRouteStop(treeId) {
    const stops = this._state.customRouteStops.filter(s => s.id !== treeId);
    this.set('customRouteStops', stops);
  }

  clearRoute() {
    this.set('customRouteStops', []);
    this.set('currentRouteGeometry', null);
    this.set('currentRouteInfo', null);
  }

  getRouteStops() {
    return this._state.customRouteStops;
  }
}

export const state = new StateManager();
