/**
 * The parsers behind both review submission paths.
 *
 * `api/_photoReviewParse.ts` is shared by the Clerk-authed admin endpoint
 * and the public self-identified one so the two cannot drift. It was never
 * tested. Neither was the reviewer guard, which is the only thing standing
 * between the labeling loop and a spoofed name.
 *
 * WHAT THESE PIN, AND WHY IT IS NOT A BUG REPORT. Both parsers `continue`
 * past anything malformed and the endpoint still answers 200. That is a
 * silent drop, and this repo has been bitten by silent drops before — the
 * admin PATCH that discarded fields failing its guard is the same shape.
 * So I checked whether it was losing anything here: 12 of Peter's 19
 * reviews have no per-finding labels, but they carry an overall verdict and
 * written notes, and both review pages filter blanks client-side before
 * posting. The reviewers graded the analysis as a whole instead of marking
 * each finding. Nothing is being lost.
 *
 * The drop stays, then — as a decision rather than an accident. These tests
 * are what make it a decision. If it should become an error instead, that
 * is a product call, and these tests are where it would be changed.
 *
 * Ref: /triage — the photo-review surface has no tests.
 */

import { describe, it, expect } from 'vitest';
import {
  parseStatus,
  parseOverallVerdict,
  parseFindingLabels,
  parseMissedFindings,
  FINDING_VERDICTS,
  OVERALL_VERDICTS,
  REVIEW_STATUSES,
} from '../../api/_photoReviewParse.js';
import { isPhotoReviewer, PHOTO_REVIEWERS } from '@/types/reviewers';

describe('parseStatus', () => {
  it.each(REVIEW_STATUSES)('keeps %s', (s) => {
    expect(parseStatus(s)).toBe(s);
  });

  it('falls back to reviewed for anything else', () => {
    // Not null: status is NOT NULL in the table, so a fallback is required.
    for (const bad of ['addresed', '', null, undefined, 7, {}, ['reviewed']]) {
      expect(parseStatus(bad)).toBe('reviewed');
    }
  });
});

describe('parseOverallVerdict', () => {
  it.each(OVERALL_VERDICTS)('keeps %s', (v) => {
    expect(parseOverallVerdict(v)).toBe(v);
  });

  it('gives null for anything else', () => {
    // Null is meaningful here — the column is nullable and a reviewer who
    // wrote notes without grading the whole analysis leaves it unset.
    for (const bad of ['accurate ', 'ACCURATE', '', null, undefined, 3, {}]) {
      expect(parseOverallVerdict(bad)).toBeNull();
    }
  });
});

describe('parseFindingLabels', () => {
  it('keeps a well-formed label', () => {
    expect(
      parseFindingLabels([{ finding_index: 2, verdict: 'over_flagged', reason: 'ramp is compliant' }]),
    ).toEqual([{ finding_index: 2, verdict: 'over_flagged', reason: 'ramp is compliant' }]);
  });

  it.each(FINDING_VERDICTS)('accepts the %s verdict', (verdict) => {
    expect(parseFindingLabels([{ finding_index: 0, verdict }])).toHaveLength(1);
  });

  it('defaults a missing reason to empty rather than dropping the label', () => {
    // A verdict with no explanation is still the reviewer's verdict.
    expect(parseFindingLabels([{ finding_index: 0, verdict: 'correct' }])).toEqual([
      { finding_index: 0, verdict: 'correct', reason: '' },
    ]);
  });

  it('drops an unknown verdict', () => {
    expect(parseFindingLabels([{ finding_index: 0, verdict: 'sort_of' }])).toEqual([]);
  });

  it('drops a label with no finding_index, including a numeric string', () => {
    // The column is a number. '0' would land as a string in jsonb and break
    // the seeding lookup on the review page, which keys state by index.
    expect(parseFindingLabels([{ verdict: 'correct' }])).toEqual([]);
    expect(parseFindingLabels([{ finding_index: '0', verdict: 'correct' }])).toEqual([]);
  });

  it('keeps the good ones when one item in the list is bad', () => {
    const out = parseFindingLabels([
      { finding_index: 0, verdict: 'correct' },
      { finding_index: 1, verdict: 'nonsense' },
      { finding_index: 2, verdict: 'partial' },
    ]);
    expect(out.map((l) => l.finding_index)).toEqual([0, 2]);
  });

  it('gives an empty list for anything that is not an array', () => {
    for (const bad of [null, undefined, 'correct', 7, { finding_index: 0 }]) {
      expect(parseFindingLabels(bad)).toEqual([]);
    }
  });
});

describe('parseMissedFindings', () => {
  it('keeps a description and drops a blank or whitespace-only one', () => {
    expect(parseMissedFindings([{ description: 'no van-accessible space' }])).toHaveLength(1);
    expect(parseMissedFindings([{ description: '' }, { description: '   ' }])).toEqual([]);
  });

  it('keeps a known severity and drops an unknown one', () => {
    expect(parseMissedFindings([{ description: 'x', severity: 'critical' }])[0].severity).toBe(
      'critical',
    );
    // Dropping the severity is not the same as dropping the finding — the
    // finding is the part that matters and it survives.
    expect(parseMissedFindings([{ description: 'x', severity: 'catastrophic' }])[0]).toEqual({
      description: 'x',
      standard: undefined,
      severity: undefined,
    });
  });

  it('gives an empty list for anything that is not an array', () => {
    for (const bad of [null, undefined, 'x', 7, { description: 'x' }]) {
      expect(parseMissedFindings(bad)).toEqual([]);
    }
  });
});

describe('isPhotoReviewer', () => {
  it.each(PHOTO_REVIEWERS)('accepts %s', (r) => {
    expect(isPhotoReviewer(r)).toBe(true);
  });

  it('rejects anything else, including a near miss', () => {
    // The public endpoint has no login. This guard is the whole check on who
    // gets to write attribution into the labeling loop.
    for (const bad of ['peter', 'Peter ', 'Pete', '', null, undefined, 0, {}, ['Peter']]) {
      expect(isPhotoReviewer(bad)).toBe(false);
    }
  });
});
