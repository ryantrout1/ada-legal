import { describe, it, expect } from 'vitest';
import { boxCenterOf, shortConcern } from '../../src/lib/spot/debugPlacement.js';

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
