import { describe, expect, it } from 'vitest';
import { validatePublishedTrailPacks } from '../scripts/city/publish-reviewed-trails.js';

describe('published Vancouver trail packs', () => {
  it('match the approved source and deterministic highlight selection', async () => {
    await expect(validatePublishedTrailPacks('vancouver')).resolves.toMatchObject({ trails: 3, memberships: 1034, highlightRecords: 4534 });
  });
});
