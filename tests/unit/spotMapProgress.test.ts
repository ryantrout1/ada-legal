/**
 * What the free read is allowed to say WHILE it is still reading.
 *
 * This file used to pin the opposite behaviour: findings streamed in as they
 * completed, fully-formed only, hedged rather than dropped. That was right
 * when the free read handed over everything at the end anyway. Once the free
 * read became a teaser it became the hole in it — a visitor watching the
 * spinner was shown every barrier and the whole summary, and it sat in the
 * network payload no matter what the UI painted. Withholding at the end only
 * counts if nothing leaked on the way there.
 *
 * So the mapper now emits the scene and nothing else, and these tests pin that
 * the leak stays closed.
 *
 * Ref: /plan Spot free-read teaser (no markers), Phase 1, criterion 2.
 */

import { describe, it, expect } from 'vitest';
import { mapSpotProgress } from '@/lib/spot/mapSpotProgress';

describe('mapSpotProgress', () => {
  it('returns an empty view for a snapshot with nothing in it yet', () => {
    expect(mapSpotProgress({})).toEqual({});
  });

  it('tolerates a non-object snapshot', () => {
    expect(mapSpotProgress(null)).toEqual({});
    expect(mapSpotProgress('nope')).toEqual({});
    expect(mapSpotProgress([1, 2])).toEqual({});
  });

  it('surfaces the scene once present — it names no barrier', () => {
    const v = mapSpotProgress({ scene: 'A concrete entrance', summary: 'One concern.' });
    expect(v.scene).toBe('A concrete entrance');
  });

  it('never streams a finding, however complete it is', () => {
    const v = mapSpotProgress({
      scene: 'A residential bathroom',
      findings: [
        {
          title: 'Raised shower curb blocks entry',
          finding: 'A wheelchair cannot roll over this curb.',
          severity: 'critical',
          standard: '608.7',
          confirmable: true,
        },
      ],
    });
    expect(JSON.stringify(v)).not.toContain('Raised shower curb');
    expect(JSON.stringify(v)).not.toContain('608.7');
    expect(Object.keys(v)).toEqual(['scene']);
  });

  it('never streams the summary — it names the barriers in prose', () => {
    const v = mapSpotProgress({
      scene: 'S',
      summary: 'The headline concern is the raised curb, plus a fixed bench and no grab bars.',
    });
    expect(JSON.stringify(v)).not.toContain('headline concern');
  });

  it('never streams the positives either', () => {
    // Harmless on its own, but it is still read content arriving before the
    // teaser decides what to give away, and the teaser does not show it.
    const v = mapSpotProgress({ scene: 'S', positive_findings: ['curb cut present'] });
    expect(JSON.stringify(v)).not.toContain('curb cut present');
  });

  it('carries no verdict — there is nothing here to read an all-clear from', () => {
    const v = mapSpotProgress({ scene: 'S', findings: [] });
    expect(v).not.toHaveProperty('kind');
    expect(v).not.toHaveProperty('overallRisk');
  });

  it('ignores a non-string scene rather than emitting a half-parsed value', () => {
    expect(mapSpotProgress({ scene: 42 })).toEqual({});
    expect(mapSpotProgress({ scene: '' })).toEqual({});
  });
});
