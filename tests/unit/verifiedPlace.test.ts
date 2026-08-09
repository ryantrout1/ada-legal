/**
 * Verified placement (the bimodal fix).
 *
 * Measured on the bathroom photo across nine post-prompt-change runs, the
 * curb box landed at 0.72 (on the curb) six times and 0.83–0.86 (down on the
 * floor) three times. The model finds it MOST of the time — the failure is
 * inconsistency, not blindness. So don't trust one roll: check the answer, and
 * resample when the check fails.
 *
 * The check is trustworthy because the model has demonstrated it: cropped to a
 * wrong box it declined three sessions running, and returned only 0.55
 * confidence when it finally did answer.
 */

import { describe, it, expect } from 'vitest';
import { reconcilePlacements } from '../../src/lib/spot/verifiedPlace.js';

const pin = (y: number, confidence = 0.9) => ({ x: 0.3, y, confidence, label: 'Curb' });

describe('reconcilePlacements', () => {
  it('takes the first attempt when it verifies — no resample needed', () => {
    const out = reconcilePlacements([{ pin: pin(0.72), verified: true }]);
    expect(out?.y).toBe(0.72);
    expect(out?.confidence).toBe(0.9);
  });

  it('takes the verified attempt over an unverified one, whatever the order', () => {
    const out = reconcilePlacements([
      { pin: pin(0.86), verified: false },
      { pin: pin(0.72), verified: true },
    ]);
    expect(out?.y).toBe(0.72);
  });

  it('prefers the higher-verification-confidence attempt when both verify', () => {
    const out = reconcilePlacements([
      { pin: pin(0.86), verified: true, verifyConfidence: 0.6 },
      { pin: pin(0.72), verified: true, verifyConfidence: 0.95 },
    ]);
    expect(out?.y).toBe(0.72);
  });

  it('caps confidence when NO attempt verifies, so the pin renders as approximate', () => {
    // This is the honesty guarantee: an unverified point must not present as
    // certain. Below the precise threshold it draws an approximate marker.
    const out = reconcilePlacements([
      { pin: pin(0.86, 0.95), verified: false },
      { pin: pin(0.83, 0.92), verified: false },
    ]);
    expect(out).not.toBeNull();
    expect(out!.confidence).toBeLessThan(0.75);
  });

  it('returns null when there is nothing to reconcile', () => {
    expect(reconcilePlacements([])).toBeNull();
    expect(reconcilePlacements([{ pin: null, verified: false }])).toBeNull();
  });

  it('ignores attempts that produced no point', () => {
    const out = reconcilePlacements([
      { pin: null, verified: false },
      { pin: pin(0.72), verified: true },
    ]);
    expect(out?.y).toBe(0.72);
  });
});
