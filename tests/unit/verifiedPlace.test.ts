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
import {
  reconcilePlacements,
  correctPointFromCrop,
  VERIFY_WINDOW,
} from '../../src/lib/spot/verifiedPlace.js';

describe('verification window', () => {
  it('is tight enough that the crop cannot contain half the frame', () => {
    // The bug this replaces: a +/-0.18 window spans 36% of the image, so a pin
    // on the floor at y 0.85 produced a crop reaching y 0.67 — which contained
    // the curb. The model truthfully said "yes it is in this crop" and
    // rubber-stamped a point that was not on the curb.
    expect(VERIFY_WINDOW * 2).toBeLessThanOrEqual(0.2);
  });
});

describe('correctPointFromCrop', () => {
  const region = { x: 0.25, y: 0.8, w: 0.1, h: 0.1 };

  it('maps a point reported inside the crop back to full-image coordinates', () => {
    expect(correctPointFromCrop({ x: 0.5, y: 0.0 }, region)).toEqual({ x: 0.3, y: 0.8 });
    expect(correctPointFromCrop({ x: 0.0, y: 1.0 }, region)).toEqual({ x: 0.25, y: 0.9 });
  });
});

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
