import { describe, it, expect } from 'vitest';
import { boxCenterOf } from '../../src/lib/spot/debugPlacement.js';

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
