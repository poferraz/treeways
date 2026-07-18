import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { validateRoutedTrail } from '../src/domain/trail-routing.js';

describe('committed Vancouver routed pilots', () => {
  it('keeps exactly three validated ORS pilots outside the human-reviewed catalogue', async () => {
    const packet = JSON.parse(await readFile('data/cities/vancouver/trail-pilots-routed.json', 'utf8'));

    expect(packet).toMatchObject({ schemaVersion: 2, status: 'NOT HUMAN REVIEWED' });
    expect(packet.candidates.map(candidate => candidate.neighbourhoodName)).toEqual([
      'Mount Pleasant',
      'Grandview-Woodland',
      'Kitsilano'
    ]);
    expect(packet.candidates.map(candidate => candidate.shape)).toEqual(['loop', 'point-to-point', 'point-to-point']);
    for (const candidate of packet.candidates) {
      expect(candidate.status).toBe('NOT HUMAN REVIEWED');
      expect(candidate).not.toHaveProperty('review');
      expect(validateRoutedTrail(candidate.route, { size: candidate.size })).toBe(true);
    }
  });
});
