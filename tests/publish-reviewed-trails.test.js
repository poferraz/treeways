import { describe, expect, it } from 'vitest';
import { composeReviewedArtifact } from '../scripts/city/publish-reviewed-trails.js';

describe('reviewed trail publication', () => {
  it('replaces only compiled trails and membership without mutating the base artifact', () => {
    const artifact = { schemaVersion: 2, trees: [['1']], trails: [], trailMembership: {}, artifactVersion: '2.1.0' };
    const compiled = { trails: [{ id: 'reviewed' }], trailMembership: { '1': ['reviewed'] } };

    const published = composeReviewedArtifact(artifact, compiled);

    expect(published).toEqual({ ...artifact, trails: compiled.trails, trailMembership: compiled.trailMembership });
    expect(artifact).toMatchObject({ trails: [], trailMembership: {} });
  });
});
