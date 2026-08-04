/**
 * boxAccuracy — measure how far each placement method lands from ground truth
 * (/plan phase 1, AC2).
 *
 * The whole point of this phase: replace "that looks better" with a number.
 * Distance is normalized-image units (the diagonal is ~1.41), so a distance of
 * 0.05 is tight and 0.2 is a miss you can see across the room.
 */

import { describe, it, expect } from 'vitest';
import {
  pointDistance,
  boxContains,
  scoreFinding,
  scoreSet,
  type GroundTruthFinding,
} from '../../src/lib/spot/boxAccuracy.js';

describe('pointDistance', () => {
  it('measures normalized euclidean distance', () => {
    expect(pointDistance({ x: 0, y: 0 }, { x: 0.3, y: 0.4 })).toBeCloseTo(0.5, 6);
    expect(pointDistance({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 })).toBe(0);
  });
});

describe('boxContains', () => {
  it('is true when the truth point falls inside the box', () => {
    expect(boxContains({ x: 0.2, y: 0.6, w: 0.4, h: 0.2 }, { x: 0.3, y: 0.7 })).toBe(true);
  });

  it('is false when the truth point is outside — the curb case', () => {
    // The real analyzer box sat on the floor; the curb is well above it.
    expect(boxContains({ x: 0.05, y: 0.83, w: 0.5, h: 0.12 }, { x: 0.33, y: 0.55 })).toBe(false);
  });

  it('is false for a null box', () => {
    expect(boxContains(null, { x: 0.5, y: 0.5 })).toBe(false);
  });
});

describe('scoreFinding', () => {
  const truth: GroundTruthFinding = {
    photoId: 'bathroom-01',
    findingTitleContains: 'curb',
    truth: { x: 0.33, y: 0.55 },
  };

  it('scores every method against the same ground truth', () => {
    const row = scoreFinding(truth, {
      title: 'Shower Threshold — Raised Curb Blocks Roll-In Entry',
      box: { x: 0.05, y: 0.83, w: 0.5, h: 0.12 },
      boxCenter: { x: 0.3, y: 0.89 },
      placement: { x: 0.32, y: 0.83 },
      cropPlacement: { x: 0.24, y: 0.73 },
    });

    expect(row.insideBox).toBe(false);
    // crop is closest here, box center is worst — the ordering is the signal.
    expect(row.methods.find((m) => m.method === 'cropPlacement')!.distance).toBeLessThan(
      row.methods.find((m) => m.method === 'boxCenter')!.distance,
    );
    expect(row.methods.find((m) => m.method === 'boxCenter')!.distance).toBeCloseTo(0.3406, 3);
  });

  it('records a null method as missing rather than scoring it as zero', () => {
    const row = scoreFinding(truth, {
      title: 'Shower Threshold — Raised Curb',
      box: null,
      boxCenter: null,
      placement: { x: 0.33, y: 0.55 },
      cropPlacement: null,
    });
    const crop = row.methods.find((m) => m.method === 'cropPlacement')!;
    expect(crop.distance).toBeNull();
    expect(row.methods.find((m) => m.method === 'placement')!.distance).toBeCloseTo(0, 6);
  });
});

describe('scoreSet', () => {
  it('aggregates mean distance per method over scored findings, ignoring missing', () => {
    const rows = [
      scoreFinding(
        { photoId: 'p1', findingTitleContains: 'a', truth: { x: 0, y: 0 } },
        { title: 'a', box: null, boxCenter: { x: 0.3, y: 0.4 }, placement: null, cropPlacement: null },
      ),
      scoreFinding(
        { photoId: 'p1', findingTitleContains: 'b', truth: { x: 0, y: 0 } },
        { title: 'b', box: null, boxCenter: { x: 0.6, y: 0.8 }, placement: null, cropPlacement: null },
      ),
    ];
    const agg = scoreSet(rows);
    const boxCenter = agg.find((a) => a.method === 'boxCenter')!;
    expect(boxCenter.scored).toBe(2);
    expect(boxCenter.meanDistance).toBeCloseTo(0.75, 6); // (0.5 + 1.0) / 2
    const placement = agg.find((a) => a.method === 'placement')!;
    expect(placement.scored).toBe(0);
    expect(placement.meanDistance).toBeNull();
  });
});
