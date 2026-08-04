/**
 * pinShape — point-vs-region decision for photo markers (/plan Phase 1, AC1).
 *
 * A tight analyzer box is a trustworthy point; a wide or large box is the
 * signal the model is unsure WHERE, exactly, so it renders as an honest region
 * instead of a false-precise dot. This pins the decision boundary.
 */

import { describe, it, expect } from 'vitest';
import {
  pinShape,
  REGION_MAX_SIDE,
  REGION_MAX_AREA,
} from '../../src/lib/spot/pinShape.js';

describe('pinShape', () => {
  it('a wide box (a curb spanning half the frame) is a region', () => {
    // The real curb box: w 0.5 — wider than the side threshold.
    expect(pinShape({ x: 0.05, y: 0.83, w: 0.5, h: 0.12 })).toBe('region');
  });

  it('a tight box is a point', () => {
    expect(pinShape({ x: 0.4, y: 0.4, w: 0.08, h: 0.06 })).toBe('point');
  });

  it('a large-area box is a region even when neither side is very long', () => {
    // 0.35 x 0.36 = 0.126 area — over the area floor, under the side floor.
    expect(pinShape({ x: 0.1, y: 0.1, w: 0.35, h: 0.36 })).toBe('region');
  });

  it('respects the documented default thresholds', () => {
    expect(REGION_MAX_SIDE).toBe(0.4);
    expect(REGION_MAX_AREA).toBe(0.12);
    // Exactly at the side threshold is still a point (strict >).
    expect(pinShape({ x: 0, y: 0, w: 0.4, h: 0.1 })).toBe('point');
    // Just past it is a region.
    expect(pinShape({ x: 0, y: 0, w: 0.41, h: 0.1 })).toBe('region');
  });

  it('honors caller overrides', () => {
    // A caller can loosen the side threshold so a 0.5-wide box stays a point.
    expect(pinShape({ x: 0, y: 0, w: 0.5, h: 0.1 }, { maxSide: 0.6, maxArea: 0.9 })).toBe(
      'point',
    );
  });
});
