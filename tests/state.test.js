import { describe, it, expect, beforeEach, vi } from 'vitest';
import { state } from '../src/state.js';

describe('State Manager', () => {
  beforeEach(() => {
    state.reset();
  });

  it('should notify subscribers when selected tree changes', () => {
    const callback = vi.fn();
    state.subscribe('selectedTree', callback);
    state.setSelectedTree({ id: 1, name: 'Cherry' });
    expect(callback).toHaveBeenCalledWith({ id: 1, name: 'Cherry' });
  });

  it('should manage custom route stops', () => {
    state.addRouteStop({ id: 1, lat: 49, lng: -123 });
    expect(state.getRouteStops()).toHaveLength(1);
  });
});
