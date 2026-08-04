/**
 * pinConfidenceTier — precise vs approximate marker by placement confidence
 * (/plan phase 2, AC5). Composed pins have no box, so honesty re-anchors on the
 * placement confidence the model returns: a sure placement is a precise dot, a
 * less-sure one is an approximate marker (and the caption says so).
 */

import { describe, it, expect } from 'vitest';
import { pinConfidenceTier, PIN_PRECISE_MIN } from '../../src/lib/spot/pinConfidenceTier.js';

describe('pinConfidenceTier', () => {
  it('a high-confidence placement is precise', () => {
    expect(pinConfidenceTier(0.9)).toBe('precise');
  });

  it('a medium-confidence placement is approximate', () => {
    expect(pinConfidenceTier(0.6)).toBe('approximate');
  });

  it('uses 0.75 as the documented precise floor (inclusive)', () => {
    expect(PIN_PRECISE_MIN).toBe(0.75);
    expect(pinConfidenceTier(0.75)).toBe('precise');
    expect(pinConfidenceTier(0.749)).toBe('approximate');
  });

  it('honors a caller override', () => {
    expect(pinConfidenceTier(0.6, { preciseMin: 0.5 })).toBe('precise');
  });
});
