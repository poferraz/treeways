const EMPTY = { type: 'FeatureCollection', features: [] };

export function addTreeLayers(map) {
  map.addSource('trees', {
    type: 'geojson',
    data: EMPTY,
    cluster: true,
    clusterMaxZoom: 13,
    clusterRadius: 34
  });

  map.addLayer({
    id: 'trees-clusters',
    type: 'circle',
    source: 'trees',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': '#4e7b59',
      'circle-radius': ['step', ['get', 'point_count'], 17, 50, 22, 250, 28],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fffdf7'
    }
  });

  map.addLayer({
    id: 'trees-cluster-count',
    type: 'symbol',
    source: 'trees',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-size': 12
    }
  });

  const typeColor = [
    'match',
    ['get', 'type'],
    'flower', '#c95f78',
    'fruit', '#b66a1e',
    'both', '#8c5f74',
    '#4e7b59'
  ];

  const isSelected = ['boolean', ['feature-state', 'selected'], false];

  map.addLayer({
    id: 'trees-points',
    type: 'circle',
    source: 'trees',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-radius': ['case', isSelected, 10, 6],
      'circle-color': typeColor,
      'circle-stroke-color': ['case', isSelected, '#2474a6', '#fffdf7'],
      'circle-stroke-width': ['case', isSelected, 3, 1.5]
    }
  });
}

export function setTreeData(map, features) {
  map.getSource('trees')?.setData({ type: 'FeatureCollection', features });
}

export function setTreeDataWhenReady(map, features) {
  if (map.getSource('trees')) {
    setTreeData(map, features);
    return;
  }
  map.once('load', () => setTreeData(map, features));
}
