import { describe, it, expect } from 'vitest';
import {
  resolveSpotShowAnnotations,
  SPOT_SHOW_ANNOTATIONS_KEY,
} from '@/lib/spot/spotAvailability';

describe('resolveSpotShowAnnotations', () => {
  it('is off when the key is absent', () => {
    expect(resolveSpotShowAnnotations({})).toBe(false);
    expect(resolveSpotShowAnnotations(null)).toBe(false);
    expect(resolveSpotShowAnnotations(undefined)).toBe(false);
  });

  it('is off when present but not a boolean', () => {
    expect(resolveSpotShowAnnotations({ [SPOT_SHOW_ANNOTATIONS_KEY]: 'yes' })).toBe(false);
    expect(resolveSpotShowAnnotations({ [SPOT_SHOW_ANNOTATIONS_KEY]: 1 })).toBe(false);
  });

  it('is on only when explicitly true', () => {
    expect(resolveSpotShowAnnotations({ [SPOT_SHOW_ANNOTATIONS_KEY]: true })).toBe(true);
    expect(resolveSpotShowAnnotations({ [SPOT_SHOW_ANNOTATIONS_KEY]: false })).toBe(false);
  });
});
