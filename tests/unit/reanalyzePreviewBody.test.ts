/**
 * reanalyze-preview body parsing (/plan repeat-run phase 1, AC1).
 *
 * The `runs` count multiplies blocking Opus vision calls, so it is clamped
 * hard: a stray body value must never spend more than the cap.
 */

import { describe, it, expect } from 'vitest';
import {
  parseReanalyzePreviewBody,
  MAX_PREVIEW_RUNS,
} from '../../src/lib/reanalyzePreviewBody.js';

describe('parseReanalyzePreviewBody', () => {
  it('requires an id', () => {
    const r = parseReanalyzePreviewBody({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/id/i);
  });

  it('defaults to a single run when runs is absent', () => {
    const r = parseReanalyzePreviewBody({ id: 'a-1' });
    expect(r.ok && r.runs).toBe(1);
  });

  it('accepts a run count within the cap', () => {
    const r = parseReanalyzePreviewBody({ id: 'a-1', runs: 5 });
    expect(r.ok && r.runs).toBe(5);
  });

  it('clamps above the cap and below one — never spends more than the cap', () => {
    expect(MAX_PREVIEW_RUNS).toBe(5);
    expect(parseReanalyzePreviewBody({ id: 'a', runs: 99 }).ok && parseReanalyzePreviewBody({ id: 'a', runs: 99 })).toMatchObject({ runs: 5 });
    expect(parseReanalyzePreviewBody({ id: 'a', runs: 0 })).toMatchObject({ runs: 1 });
    expect(parseReanalyzePreviewBody({ id: 'a', runs: -4 })).toMatchObject({ runs: 1 });
  });

  it('ignores non-integer and non-numeric run values rather than guessing', () => {
    for (const v of ['5', 2.7, {}, null, NaN] as unknown[]) {
      const r = parseReanalyzePreviewBody({ id: 'a', runs: v });
      expect(r.ok && r.runs, `runs=${JSON.stringify(v)} should fall back to 1`).toBe(1);
    }
  });
});
