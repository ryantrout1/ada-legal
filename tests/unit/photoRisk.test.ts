/**
 * Phase 3 — deterministic overall_risk roll-up.
 *
 * Risk is computed in code from the findings, not emitted by the model.
 * The load-bearing rule: a concern the analyzer could NOT establish from the
 * photo (confirmable:false) is surfaced as needs-on-site-verification but
 * never inflates the risk score above low. Only confirmable findings drive
 * high/medium.
 */

import { describe, it, expect } from 'vitest';
import { computeOverallRisk } from '@/lib/photoRisk';
import type { PhotoFinding, PhotoFindingSeverity } from '@/types/db';

function f(severity: PhotoFindingSeverity, confirmable: boolean): PhotoFinding {
  return {
    title_standard: `${severity} finding`,
    finding_standard: 'description',
    severity,
    standard: '§X',
    confidence: 0.8,
    confirmable,
  };
}

describe('computeOverallRisk — deterministic risk roll-up (Phase 3)', () => {
  it('no findings → none', () => {
    expect(computeOverallRisk([])).toBe('none');
  });

  it('a confirmable critical → high', () => {
    expect(computeOverallRisk([f('critical', true)])).toBe('high');
  });

  it('a confirmable major → high', () => {
    expect(computeOverallRisk([f('major', true)])).toBe('high');
  });

  it('a confirmable minor → medium', () => {
    expect(computeOverallRisk([f('minor', true)])).toBe('medium');
  });

  it('a confirmable advisory only → low', () => {
    expect(computeOverallRisk([f('advisory', true)])).toBe('low');
  });

  // The core Phase 3 guarantee: unconfirmable findings never inflate risk.
  it('an unconfirmable critical → low (not high)', () => {
    expect(computeOverallRisk([f('critical', false)])).toBe('low');
  });

  it('an unconfirmable major → low (not high)', () => {
    expect(computeOverallRisk([f('major', false)])).toBe('low');
  });

  it('an unconfirmable minor → low (not medium)', () => {
    expect(computeOverallRisk([f('minor', false)])).toBe('low');
  });

  it('confirmable minor + unconfirmable critical → medium (the critical is not confirmed)', () => {
    expect(computeOverallRisk([f('minor', true), f('critical', false)])).toBe(
      'medium',
    );
  });

  it('confirmable critical + unconfirmable minor → high', () => {
    expect(computeOverallRisk([f('critical', true), f('minor', false)])).toBe(
      'high',
    );
  });
});
