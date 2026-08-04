import { describe, it, expect } from 'vitest';
import {
  boxCenterOf,
  shortConcern,
  paddedCropRegion,
  mapCropPointToFull,
} from '../../src/lib/spot/debugPlacement.js';

describe('paddedCropRegion', () => {
  it('pads outward by a fraction of the box, clamped to the image', () => {
    // curb-like box low in the frame: pads up to pull the threshold into view.
    const r = paddedCropRegion({ x: 0.05, y: 0.83, w: 0.5, h: 0.12 }, 0.35);
    // x: 0.05 - 0.175 -> clamp 0 ; right: 0.55 + 0.175 = 0.725
    expect(r.x).toBe(0);
    expect(r.w).toBe(0.725);
    // y: 0.83 - 0.042 = 0.788 ; bottom: 0.95 + 0.042 = 0.992 (no clamp)
    expect(r.y).toBe(0.788);
    expect(r.y + r.h).toBeCloseTo(0.992, 5);
  });

  it('keeps padding proportional so a box beside a decoy is not swallowed', () => {
    // narrow box: proportional padding stays small, not a fixed image fraction.
    const r = paddedCropRegion({ x: 0.6, y: 0.62, w: 0.1, h: 0.1 }, 0.35);
    expect(r.x).toBeCloseTo(0.565, 3); // 0.6 - 0.035
    expect(r.w).toBeCloseTo(0.17, 3); // (0.7+0.035) - 0.565
  });
});

describe('mapCropPointToFull', () => {
  it('maps a crop-relative point back to full-image fractions', () => {
    const region = { x: 0.2, y: 0.5, w: 0.4, h: 0.4 };
    expect(mapCropPointToFull({ x: 0.5, y: 0.5 }, region)).toEqual({ x: 0.4, y: 0.7 });
    expect(mapCropPointToFull({ x: 0, y: 0 }, region)).toEqual({ x: 0.2, y: 0.5 });
    expect(mapCropPointToFull({ x: 1, y: 1 }, region)).toEqual({ x: 0.6, y: 0.9 });
  });
});

describe('shortConcern', () => {
  it('takes the object before an em-dash', () => {
    expect(shortConcern('Shower Threshold — Raised Curb Blocks Roll-In Entry')).toBe('Shower Threshold');
    expect(shortConcern('Lavatory — Closed Cabinet Blocks Knee Clearance')).toBe('Lavatory');
  });

  it('handles en-dash and hyphen separators', () => {
    expect(shortConcern('Shower Seat – Fixed Bench')).toBe('Shower Seat');
    expect(shortConcern('Ramp - Slope Too Steep')).toBe('Ramp');
  });

  it('falls back to the whole title when there is no dash', () => {
    expect(shortConcern('Narrow doorway')).toBe('Narrow doorway');
  });
});

describe('boxCenterOf', () => {
  it('returns the rounded center of a box', () => {
    expect(boxCenterOf({ x: 0.08, y: 0.79, w: 0.5, h: 0.12 })).toEqual({ x: 0.33, y: 0.85 });
  });

  it('rounds to three decimals', () => {
    // 0.1 + 0.333/2 = 0.2665 -> 0.267
    expect(boxCenterOf({ x: 0.1, y: 0.1, w: 0.333, h: 0.333 })).toEqual({ x: 0.267, y: 0.267 });
  });

  it('returns null for a missing box', () => {
    expect(boxCenterOf(null)).toBeNull();
    expect(boxCenterOf(undefined)).toBeNull();
  });
});
