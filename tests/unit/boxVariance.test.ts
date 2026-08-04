/**
 * boxVariance — summarize the analyzer's box across repeated runs of the SAME
 * photo (/plan repeat-run phase 1, AC2).
 *
 * The reason this exists: ten runs of one bathroom photo produced curb boxes
 * whose top edge ranged 0.72–0.85 with no code change at all. That spread is
 * larger than most of the "improvements" we were eyeballing one screenshot at
 * a time. Containment across N runs is the number that survives that noise.
 */

import { describe, it, expect } from 'vitest';
import { summarizeRuns, type PreviewRun } from '../../src/lib/spot/boxVariance.js';

/** The ten real curb boxes pulled from photo_analyses on 2026-08-04. */
const CURB_Y = [0.85, 0.72, 0.78, 0.79, 0.83, 0.72, 0.83, 0.79, 0.79, 0.79];

const curbRuns: PreviewRun[] = CURB_Y.map((y) => ({
  findings: [
    {
      title: 'Shower Threshold — Raised Curb Blocks Roll-In Entry',
      box: { x: 0.08, y, w: 0.5, h: 0.12 },
    },
    { title: 'Lavatory — Cabinet Beneath Blocks Knee Clearance', box: { x: 0.6, y: 0.72, w: 0.35, h: 0.28 } },
  ],
}));

describe('summarizeRuns', () => {
  it('reports containment 0 of 10 for the curb — the box never covers it', () => {
    // Truth well above every observed box.
    const s = summarizeRuns(curbRuns, 'curb', { x: 0.33, y: 0.55 });
    expect(s.matchedRuns).toBe(10);
    expect(s.containment).toEqual({ inside: 0, total: 10 });
  });

  it('reports the observed y spread — the noise floor any change must beat', () => {
    const s = summarizeRuns(curbRuns, 'curb', { x: 0.33, y: 0.55 });
    expect(s.ySpread.min).toBeCloseTo(0.72, 6);
    expect(s.ySpread.max).toBeCloseTo(0.85, 6);
    expect(s.ySpread.range).toBeCloseTo(0.13, 6);
  });

  it('reports containment 10 of 10 for a finding whose box does cover truth', () => {
    const s = summarizeRuns(curbRuns, 'cabinet', { x: 0.78, y: 0.83 });
    expect(s.containment).toEqual({ inside: 10, total: 10 });
  });

  it('counts only runs where the finding appeared — a missing finding is not a pass', () => {
    const runs: PreviewRun[] = [
      { findings: [{ title: 'Shower curb', box: { x: 0, y: 0.5, w: 1, h: 0.2 } }] },
      { findings: [{ title: 'Something else', box: { x: 0, y: 0, w: 0.1, h: 0.1 } }] },
    ];
    const s = summarizeRuns(runs, 'curb', { x: 0.5, y: 0.6 });
    expect(s.matchedRuns).toBe(1);
    expect(s.containment).toEqual({ inside: 1, total: 1 });
    expect(s.missingRuns).toBe(1);
  });

  it('handles a finding with no box, and works without ground truth', () => {
    const runs: PreviewRun[] = [{ findings: [{ title: 'Shower curb', box: null }] }];
    const s = summarizeRuns(runs, 'curb', undefined);
    expect(s.matchedRuns).toBe(1);
    expect(s.boxedRuns).toBe(0);
    expect(s.containment).toBeNull();
    expect(s.ySpread).toBeNull();
  });
});
