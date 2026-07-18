import { describe, expect, it, vi } from 'vitest';
import { renderTrailCatalogue, renderTrailDetail } from '../src/ui/trail-browser.js';

const trail = {
  id: 'mount-pleasant-cherry-blossoms',
  name: 'Cherry blossoms around East 10th Avenue',
  neighbourhoodName: 'Mount Pleasant',
  theme: { id: 'cherry-blossoms', displayName: 'Cherry blossoms' },
  size: 'small', mode: 'walking', shape: 'loop',
  narrative: 'Three tree-rich areas with recorded cherry relatives.',
  clusterStops: ['a', 'b', 'c'].map((id, index) => ({
    id: `cluster-${id}`,
    locationLabel: `${index + 1}00 block of East 10th Avenue`,
    totalTreeCount: 8,
    themeTreeCount: 3,
    diversityCount: 4,
    memberTreeIds: Array.from({ length: 8 }, (_, treeIndex) => `${id}-${treeIndex}`),
    anchor: { latitude: 49.25 + index * 0.001, longitude: -123.12 + index * 0.001 }
  })),
  route: {
    anchorOrder: ['cluster-a', 'cluster-b', 'cluster-c', 'cluster-a'],
    distanceM: 1800,
    durationSeconds: 1300,
    provenance: { provider: 'openrouteservice', profile: 'foot-walking', attribution: '© openrouteservice.org by HeiGIT | Map data © OpenStreetMap contributors' }
  },
  review: { status: 'human-reviewed', reviewer: 'Alicia', reviewedAt: '2026-07-18' },
  caveats: []
};

describe('reviewed trail browser', () => {
  it('catalogues reviewed cluster walks with actual routed distance', () => {
    const root = document.createElement('div');
    renderTrailCatalogue(root, [trail], { onBack: vi.fn(), onSelect: vi.fn() });
    expect(root.textContent).toContain('Reviewed neighbourhood walks');
    expect(root.textContent).toContain('Cherry blossoms');
    expect(root.textContent).toContain('1.8 km');
    expect(root.textContent).toContain('3 tree-rich areas');
    expect(root.textContent).not.toContain('Preview routes');
  });

  it('describes cluster counts, review provenance, and walking-only handoff', () => {
    const root = document.createElement('div');
    renderTrailDetail(root, trail, { onBack: vi.fn() });
    expect(root.textContent).toContain('Loop');
    expect(root.textContent).toContain('24 recorded trees');
    expect(root.textContent).toContain('8 recorded trees · 3 Cherry blossoms records');
    expect(root.textContent).toContain('Reviewed by Alicia on July 18, 2026');
    expect(root.textContent).toContain('openrouteservice.org');
    expect(root.textContent).not.toContain('Open driving route');
    expect(root.querySelector('a').href).toContain('travelmode=walking');
  });
});
