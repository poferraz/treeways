const EMPTY = { type: 'FeatureCollection', features: [] };

export function addTreeLayers(map) {
  map.addSource('trees', {
    type: 'geojson',
    data: EMPTY,
    cluster: true,
    clusterMaxZoom: 13,
    clusterRadius: 34,
    clusterProperties: {
      flower_count: ['+', ['case', ['==', ['get', 'type'], 'flower'], 1, 0]],
      fruit_count: ['+', ['case', ['==', ['get', 'type'], 'fruit'], 1, 0]],
      both_count: ['+', ['case', ['==', ['get', 'type'], 'both'], 1, 0]],
      large_count: ['+', ['case', ['==', ['get', 'type'], 'large'], 1, 0]],
      other_count: ['+', ['case', ['==', ['get', 'type'], 'other'], 1, 0]]
    }
  });

  const clusterColor = [
    'case',
    ['all', ['>', ['get', 'both_count'], 0], ['>=', ['get', 'both_count'], ['get', 'flower_count']], ['>=', ['get', 'both_count'], ['get', 'fruit_count']], ['>=', ['get', 'both_count'], ['get', 'large_count']], ['>=', ['get', 'both_count'], ['get', 'other_count']]], '#8c5f74',
    ['all', ['>', ['get', 'flower_count'], 0], ['>=', ['get', 'flower_count'], ['get', 'fruit_count']], ['>=', ['get', 'flower_count'], ['get', 'large_count']], ['>=', ['get', 'flower_count'], ['get', 'other_count']]], '#c95f78',
    ['all', ['>', ['get', 'fruit_count'], 0], ['>=', ['get', 'fruit_count'], ['get', 'large_count']], ['>=', ['get', 'fruit_count'], ['get', 'other_count']]], '#b66a1e',
    ['all', ['>', ['get', 'large_count'], 0], ['>=', ['get', 'large_count'], ['get', 'other_count']]], '#346c8a',
    '#4e7b59'
  ];

  map.addLayer({
    id: 'trees-clusters',
    type: 'circle',
    source: 'trees',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': clusterColor,
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

  map.addLayer({
    id: 'trees-hit-area',
    type: 'circle',
    source: 'trees',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-radius': 18,
      'circle-color': 'rgba(0, 0, 0, 0.01)'
    }
  });

  const typeColor = [
    'match',
    ['get', 'type'],
    'flower', '#c95f78',
    'fruit', '#b66a1e',
    'both', '#8c5f74',
    'large', '#346c8a',
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
