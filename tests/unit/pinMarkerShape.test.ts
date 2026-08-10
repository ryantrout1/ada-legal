/**
 * markerShape — is this box an edge (draw a band) or an object (draw a dot)?
 *
 * A dot claims we know the spot to within a percent. Measured across 8 runs,
 * the analyzer's box for the shower curb drifts about 6% of the frame between
 * runs. A band covering that box still sits over the curb at 6% off; a dot at
 * 6% off is on the floor tile, which is what a reader keeps seeing.
 *
 * Same predicate that decides where the pin goes, exported from one place, so
 * the two answers cannot drift apart.
 */

import { describe, it, expect } from 'vitest';
import { markerShape, isEdgeBox } from '../../src/lib/spot/pinMarkerShape.js';

describe('markerShape', () => {
  it('calls the real curb box an edge', () => {
    // Measured shape from production: wide and thin.
    expect(markerShape({ x: 0.09, y: 0.744, w: 0.43, h: 0.058 })).toBe('band');
  });

  it('calls the vanity cabinet an object', () => {
    expect(markerShape({ x: 0.6, y: 0.7, w: 0.35, h: 0.28 })).toBe('dot');
  });

  it('calls the shower bench an object', () => {
    expect(markerShape({ x: 0.5, y: 0.6, w: 0.18, h: 0.19 })).toBe('dot');
  });

  it('calls the mirror an object', () => {
    expect(markerShape({ x: 0.6, y: 0.1, w: 0.34, h: 0.5 })).toBe('dot');
  });

  it('calls a tall thin box an object — a vertical feature is not a step line', () => {
    expect(markerShape({ x: 0.5, y: 0.2, w: 0.05, h: 0.4 })).toBe('dot');
  });

  it('is a dot when there is no box at all (stored reports predate it)', () => {
    expect(markerShape(undefined)).toBe('dot');
  });

  it('agrees with isEdgeBox, which is the single shared predicate', () => {
    const curb = { x: 0.09, y: 0.744, w: 0.43, h: 0.058 };
    expect(isEdgeBox(curb)).toBe(true);
    expect(markerShape(curb)).toBe('band');
    const cabinet = { x: 0.6, y: 0.7, w: 0.35, h: 0.28 };
    expect(isEdgeBox(cabinet)).toBe(false);
    expect(markerShape(cabinet)).toBe('dot');
  });
});
