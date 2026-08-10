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
   * The category error this closes: pinConfidenceTier was written for
   * PLACEMENT confidence — placeFinding asks the model "how sure are you this
   * point is correct", a claim about location. Box-derived pins were being fed
   * the FINDING confidence instead, which the analyzer prompt defines as an
   * honest assessment of whether the concern is real — a claim about
   * existence. So a fixed shower bench rendered as an approximate halo because
   * the analyzer was slightly unsure it needs a folding seat, not because
   * anyone was unsure where the bench is.
   *
   * A box IS the localization. If the analyzer drew one, we know where it is.
   */
  it('treats a box-derived pin as precise even at low confidence', () => {
    expect(pinConfidenceTier(0.6, { source: 'box' })).toBe('precise');
    expect(pinConfidenceTier(0.51, { source: 'box' })).toBe('precise');
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
