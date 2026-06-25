/**
 * Layer 1 tests for the case-number formatter.
 *
 * `formatCaseNumber` turns a monotonic sequence value (from the Postgres
 * `case_number_seq` created in migration 0023) into the human-facing
 * `CASE-NNNN` label. Pure + deterministic; the DB supplies the sequence.
 *
 * Supports acceptance criterion 1 from /plan Phase 0 (a case carries a
 * stable, readable case_number).
 */

import { describe, it, expect } from 'vitest';
import { formatCaseNumber } from '@/engine/cases/caseNumber';

describe('formatCaseNumber', () => {
  it.each<[number, string]>([
    [1, 'CASE-0001'],
    [42, 'CASE-0042'],
    [999, 'CASE-0999'],
    [9999, 'CASE-9999'],
    [12345, 'CASE-12345'],
  ])('formatCaseNumber(%d) = %s', (seq, expected) => {
    expect(formatCaseNumber(seq)).toBe(expected);
  });

  it.each<[unknown]>([[0], [-1], [1.5], [Number.NaN], [Number.POSITIVE_INFINITY]])(
    'rejects invalid sequence value %s',
    (bad) => {
      expect(() => formatCaseNumber(bad as number)).toThrow();
    },
  );
});
