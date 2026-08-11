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

describe('pin source decides precision', () => {
  /**
   * A box-derived pin renders approximate, not precise — even when the finding
   * confidence is high. Earlier this returned precise on the theory "a box IS
   * the localization", but the box's y proved systematically low (measured
   * ~0.15 at the curb, growing toward the bottom of the frame; every
   * model-based placement method reproduced it). The finding confidence is a
   * claim about whether the concern is real, not about where it is, so it
   * cannot rescue the location. Ref: /triage "all pins low".
   */
  it('treats a box-derived pin as approximate, even at high confidence', () => {
    expect(pinConfidenceTier(0.6, { source: 'box' })).toBe('approximate');
    expect(pinConfidenceTier(0.9, { source: 'box' })).toBe('approximate');
    expect(pinConfidenceTier(1, { source: 'box' })).toBe('approximate');
  });

  it('keeps the confidence tier for a placement-derived pin', () => {
    expect(pinConfidenceTier(0.6, { source: 'placement' })).toBe('approximate');
    expect(pinConfidenceTier(0.9, { source: 'placement' })).toBe('precise');
  });

  it('falls back to the confidence tier when source is absent (legacy pins)', () => {
    // Stored reports predate the field. They must not silently become precise.
    expect(pinConfidenceTier(0.6, {})).toBe('approximate');
    expect(pinConfidenceTier(0.6)).toBe('approximate');
  });
});
