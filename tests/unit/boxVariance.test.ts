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
import {
  summarizeRuns,
  summarizeTrackedFindings,
  type PreviewRun,
} from '../../src/lib/spot/boxVariance.js';

/** The ten real curb boxes pulled from photo_analyses on 2026-08-04. */
const CURB_Y = [0.85, 0.72, 0.78, 0.79, 0.83, 0.72, 0.83, 0.79, 0.79, 0.79];

/**
 * Real reworded titles for the SAME curb, pulled from photo_analyses. The
 * analyzer renames findings between runs, so the run set below deliberately
 * uses a different title each time — matching must survive that.
 */
const CURB_TITLES = [
  'Shower Threshold — Raised Curb Blocks Roll-In Entry',
  'Shower Threshold — Raised Curb Blocks Roll-In Access',
  'Shower Threshold/Curb — Roll-In Entry Blocked',
  'Shower Curb / Threshold — Raised Step Blocks Roll-In Entry',
  'Shower Curb — Raised Threshold Blocks Wheelchair Entry',
  'Raised Shower Curb Blocks Roll-In Entry',
  'Roll-In Shower Threshold — Confirm Curbless Entry',
  'Shower Threshold — Raised Curb Blocks Roll-In Entry',
  'Shower Threshold — Raised Curb Blocks Roll-In Access',
  'Shower Threshold/Curb — Roll-In Entry Blocked',
];

const CURB = { standard: '§608.7', title: 'Shower Threshold/Curb — Roll-In Entry Blocked' };
const CABINET = { standard: '§606', title: 'Lavatory Knee Clearance — Closed Cabinet Below' };

const curbRuns: PreviewRun[] = CURB_Y.map((y, i) => ({
  findings: [
    {
      title: CURB_TITLES[i],
      standard: '§608.7',
      box: { x: 0.08, y, w: 0.5, h: 0.12 },
    },
    {
      title: 'Lavatory — Cabinet Beneath Blocks Knee Clearance',
      standard: '§606',
      box: { x: 0.6, y: 0.72, w: 0.35, h: 0.28 },
    },
  ],
}));

describe('summarizeRuns', () => {
  it('reports containment 0 of 10 for the curb — the box never covers it', () => {
    // Truth well above every observed box.
    const s = summarizeRuns(curbRuns, CURB, { x: 0.33, y: 0.55 });
    expect(s.matchedRuns).toBe(10);
    expect(s.containment).toEqual({ inside: 0, total: 10 });
  });

  it('reports the observed y spread — the noise floor any change must beat', () => {
    const s = summarizeRuns(curbRuns, CURB, { x: 0.33, y: 0.55 });
    expect(s.ySpread!.min).toBeCloseTo(0.72, 6);
    expect(s.ySpread!.max).toBeCloseTo(0.85, 6);
    expect(s.ySpread!.range).toBeCloseTo(0.13, 6);
  });

  it('reports containment 10 of 10 for a finding whose box does cover truth', () => {
    const s = summarizeRuns(curbRuns, CABINET, { x: 0.78, y: 0.83 });
    expect(s.containment).toEqual({ inside: 10, total: 10 });
  });

  it('matches every run despite the analyzer rewording the title each time', () => {
    // The regression this fix exists for: title-prefix matching scored this
    // 0 of 10 while the analyzer had found the curb in all ten.
    const s = summarizeRuns(curbRuns, CURB, { x: 0.33, y: 0.55 });
    expect(s.matchedRuns).toBe(10);
    expect(s.missingRuns).toBe(0);
    expect(new Set(s.matchedTitles).size).toBeGreaterThan(1);
  });

  it('counts only runs where the section appeared — a missing finding is not a pass', () => {
    const runs: PreviewRun[] = [
      { findings: [{ title: 'Shower curb', standard: '§608.7', box: { x: 0, y: 0.5, w: 1, h: 0.2 } }] },
      { findings: [{ title: 'Something else', standard: '§404.1', box: { x: 0, y: 0, w: 0.1, h: 0.1 } }] },
    ];
    const s = summarizeRuns(runs, { standard: '§608.7', title: 'Shower curb' }, { x: 0.5, y: 0.6 });
    expect(s.matchedRuns).toBe(1);
    expect(s.containment).toEqual({ inside: 1, total: 1 });
    expect(s.missingRuns).toBe(1);
  });

  it('disambiguates two findings sharing one section by title overlap', () => {
    // Measured at 4.5% of section groups — e.g. mirror and faucet both cite 606.
    const runs: PreviewRun[] = [
      {
        findings: [
          { title: 'Mirror Mounting Height — Verify', standard: '§606', box: { x: 0.6, y: 0.1, w: 0.3, h: 0.2 } },
          { title: 'Lavatory Faucet — Operable Parts', standard: '§606', box: { x: 0.7, y: 0.6, w: 0.1, h: 0.1 } },
        ],
      },
    ];
    const mirror = summarizeRuns(runs, { standard: '§606', title: 'Mirror Mounting Height — Verify' }, undefined);
    expect(mirror.matchedTitles[0]).toContain('Mirror');
    const faucet = summarizeRuns(runs, { standard: '§606', title: 'Lavatory Faucet — Operable Parts' }, undefined);
    expect(faucet.matchedTitles[0]).toContain('Faucet');
  });

  it('normalizes section formatting differences', () => {
    const runs: PreviewRun[] = [
      { findings: [{ title: 'Curb', standard: '608.7', box: null }] },
    ];
    const s = summarizeRuns(runs, { standard: '§608.7 ', title: 'Curb' }, undefined);
    expect(s.matchedRuns).toBe(1);
  });

  it('handles a finding with no box, and works without ground truth', () => {
    const runs: PreviewRun[] = [{ findings: [{ title: 'Shower curb', standard: '§608.7', box: null }] }];
    const s = summarizeRuns(runs, { standard: '§608.7', title: 'Shower curb' }, undefined);
    expect(s.matchedRuns).toBe(1);
    expect(s.boxedRuns).toBe(0);
    expect(s.containment).toBeNull();
    expect(s.ySpread).toBeNull();
  });
});

describe('summarizeTrackedFindings — exclusive assignment', () => {
  /**
   * The real defect this covers: two stored findings both cite 606 (lavatory
   * knee clearance and lavatory faucet). Matched independently, BOTH claimed
   * the run's single 606 finding, so the faucet row displayed the cabinet's
   * numbers and titles verbatim — a fabricated 5-of-5 for a finding that
   * actually appeared 0 of 5.
   */
  it('does not let two tracked findings claim the same run finding', () => {
    const runs: PreviewRun[] = Array.from({ length: 5 }, () => ({
      findings: [
        {
          title: 'Lavatory — Closed Cabinet Obstructs Knee Clearance',
          standard: '§606',
          box: { x: 0.6, y: 0.72, w: 0.3, h: 0.2 },
        },
      ],
    }));

    const [cabinet, faucet] = summarizeTrackedFindings(
      runs,
      [
        { standard: '§606', title: 'Lavatory Knee Clearance — Closed Cabinet Below' },
        { standard: '§606', title: 'Lavatory Faucet — Operable Parts' },
      ],
      undefined,
    );

    expect(cabinet.matchedRuns).toBe(5);
    // The faucet genuinely was not reported in any run — it must read as absent.
    expect(faucet.matchedRuns).toBe(0);
    expect(faucet.missingRuns).toBe(5);
    expect(faucet.observedY).toEqual([]);
    expect(faucet.matchedTitles).toEqual([]);
  });

  it('gives each tracked finding its own match when the run reports both', () => {
    const runs: PreviewRun[] = [
      {
        findings: [
          { title: 'Mirror Bottom Edge Height — Verify', standard: '§606', box: { x: 0.6, y: 0.08, w: 0.3, h: 0.2 } },
          { title: 'Lavatory Faucet — Operable Parts', standard: '§606', box: { x: 0.7, y: 0.6, w: 0.1, h: 0.1 } },
        ],
      },
    ];
    const [mirror, faucet] = summarizeTrackedFindings(
      runs,
      [
        { standard: '§606', title: 'Mirror Mounting Height — Verify' },
        { standard: '§606', title: 'Lavatory Faucet — Operable Parts' },
      ],
      undefined,
    );
    expect(mirror.matchedTitles[0]).toContain('Mirror');
    expect(faucet.matchedTitles[0]).toContain('Faucet');
  });

  it('assigns the best-overlapping pair first, not in list order', () => {
    // Faucet listed first, but the run's only 606 finding is clearly the mirror.
    const runs: PreviewRun[] = [
      { findings: [{ title: 'Mirror Bottom Edge Height — Verify', standard: '§606', box: null }] },
    ];
    const [faucet, mirror] = summarizeTrackedFindings(
      runs,
      [
        { standard: '§606', title: 'Lavatory Faucet — Operable Parts' },
        { standard: '§606', title: 'Mirror Mounting Height — Verify' },
      ],
      undefined,
    );
    expect(mirror.matchedRuns).toBe(1);
    expect(faucet.matchedRuns).toBe(0);
  });

  it('is unaffected when sections do not collide', () => {
    const runs: PreviewRun[] = [
      {
        findings: [
          { title: 'Shower Threshold — Raised Curb', standard: '§608.7', box: { x: 0, y: 0.83, w: 0.5, h: 0.1 } },
          { title: 'Mirror Height', standard: '§603.3', box: { x: 0.6, y: 0.08, w: 0.3, h: 0.2 } },
        ],
      },
    ];
    const out = summarizeTrackedFindings(
      runs,
      [
        { standard: '§608.7', title: 'Shower Threshold/Curb — Roll-In Entry Blocked' },
        { standard: '§603.3', title: 'Mirror Mounting Height — Verify' },
      ],
      undefined,
    );
    expect(out.map((s) => s.matchedRuns)).toEqual([1, 1]);
  });
});
