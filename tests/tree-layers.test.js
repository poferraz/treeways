import { describe, expect, it, vi } from 'vitest';
import { setTreeDataWhenReady } from '../src/map/tree-layers.js';

describe('tree map source updates', () => {
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
