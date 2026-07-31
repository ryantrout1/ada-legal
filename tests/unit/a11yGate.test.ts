/**
 * Unit test for the verify:a11y gate wrapper (Phase 4, AAA remediation).
 *
 * The wrapper (scripts/verify-a11y.mjs) runs the Playwright a11y sweep,
 * ALWAYS emits report v1 (even on failure — you want the defect list when
 * it's red), then exits with the SUITE's code so the gate fails iff the
 * sweep failed. This pins that exit contract without spawning a browser.
 *
 * AC8a: exit non-zero iff there's a blocking finding (= suite non-zero).
 * AC8b: report emitted regardless of suite outcome.
 */

import { describe, it, expect } from 'vitest';
import { finalExitCode, shouldWriteReport } from '../a11y/lib/gate.js';

describe('verify:a11y gate contract', () => {
  it('exits with the suite code — 0 stays 0 (AC8a)', () => {
    expect(finalExitCode(0)).toBe(0);
  });

  it('exits non-zero when the suite failed (AC8a)', () => {
    expect(finalExitCode(1)).toBe(1);
    expect(finalExitCode(2)).toBe(2);
  });

  it('normalizes null/undefined suite codes to a failure, not a false pass', () => {
    // A crashed sweep with no code must NOT read as green.
    expect(finalExitCode(null)).not.toBe(0);
    expect(finalExitCode(undefined)).not.toBe(0);
  });

  it('always writes the report, pass or fail (AC8b)', () => {
    expect(shouldWriteReport(0)).toBe(true);
    expect(shouldWriteReport(1)).toBe(true);
    expect(shouldWriteReport(null)).toBe(true);
  });
});
