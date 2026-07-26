/**
 * The admin litigation list renders `affected_states` straight from the
 * admin row, which — unlike the public projection — carries the RAW value.
 * 17 of 39 live rows still hold the legacy `__nationwide__` sentinel, so a
 * naive render puts the literal string "__nationwide__" in a column of
 * state codes, and a naive round-trip would write it back uppercased
 * (the exact corruption sanitizeIncomingStates exists to stop).
 *
 * normalizeStates is the read-side guard. Both encodings of "nationwide"
 * — the sentinel and the empty array the write path normalizes to — must
 * collapse to the same empty result.
 *
 * Ref: /plan Gate A Phase 1.
 */

import { describe, expect, it } from 'vitest';
import { normalizeStates } from '../../src/app/routes/admin/AdminLitigation.js';

describe('normalizeStates', () => {
  it('treats the legacy sentinel as nationwide (empty)', () => {
    expect(normalizeStates(['__nationwide__'])).toEqual([]);
  });

  it('treats an already-empty array as nationwide', () => {
    expect(normalizeStates([])).toEqual([]);
  });

  it('strips the sentinel case-insensitively', () => {
    // The corrupted uppercase form leaked to production once already.
    expect(normalizeStates(['__NATIONWIDE__'])).toEqual([]);
  });

  it('keeps real state codes and drops a co-occurring sentinel', () => {
    expect(normalizeStates(['__nationwide__', 'CA', 'NY'])).toEqual(['CA', 'NY']);
  });

  it('leaves an ordinary state list untouched', () => {
    expect(normalizeStates(['CA', 'NY', 'TX'])).toEqual(['CA', 'NY', 'TX']);
  });

  it('is defensive about null and undefined', () => {
    expect(normalizeStates(null)).toEqual([]);
    expect(normalizeStates(undefined)).toEqual([]);
  });
});
