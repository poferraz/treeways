import { describe, expect, it, vi } from 'vitest';
import { addTreeLayers, setTreeDataWhenReady } from '../src/map/tree-layers.js';

describe('tree map source updates', () => {
  it('clusters tree categories separately so useful highlights are not all rendered green', () => {
    const map = { addSource: vi.fn(), addLayer: vi.fn() };
    addTreeLayers(map);
    const source = map.addSource.mock.calls[0][1];
    const clusterLayer = map.addLayer.mock.calls.find(([layer]) => layer.id === 'trees-clusters')[0];
    const pointLayer = map.addLayer.mock.calls.find(([layer]) => layer.id === 'trees-points')[0];
    const hitLayer = map.addLayer.mock.calls.find(([layer]) => layer.id === 'trees-hit-area')[0];
    expect(source.clusterProperties).toHaveProperty('flower_count');
    expect(source.clusterProperties).toHaveProperty('fruit_count');
    expect(source.clusterProperties).toHaveProperty('large_count');
    expect(source.clusterProperties).toHaveProperty('other_count');
    expect(JSON.stringify(clusterLayer.paint['circle-color'])).toContain('#c95f78');
    expect(JSON.stringify(pointLayer.paint['circle-color'])).toContain('#346c8a');
    expect(hitLayer.paint['circle-radius']).toBe(18);
  });
  it('updates an existing source immediately even while the map is loading tiles', () => {
    const source = { setData: vi.fn() };
    const map = { getSource: vi.fn(() => source), once: vi.fn() };
    const features = [{ type: 'Feature', id: 'tree-1', properties: {}, geometry: { type: 'Point', coordinates: [-123.1, 49.2] } }];

    setTreeDataWhenReady(map, features);

    expect(source.setData).toHaveBeenCalledWith({ type: 'FeatureCollection', features });
    expect(map.once).not.toHaveBeenCalled();
  });

  it('waits for the first style load when the source does not exist yet', () => {
    const source = { setData: vi.fn() };
    const map = { getSource: vi.fn().mockReturnValueOnce(undefined).mockReturnValue(source), once: vi.fn() };

    setTreeDataWhenReady(map, []);
    const update = map.once.mock.calls[0][1];
    update();

    expect(map.once).toHaveBeenCalledWith('load', expect.any(Function));
    expect(source.setData).toHaveBeenCalledWith({ type: 'FeatureCollection', features: [] });
  });
});
