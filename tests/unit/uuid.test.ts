/**
 * Tests isUuid — the guard that keeps malformed identifiers from
 * reaching a Postgres uuid column (§4 h3, /plan Phase 5).
 *
 * The load-bearing case is the legacy Base44 id (24 hex chars, no
 * hyphens): it must return false so the admin litigation filter answers
 * 400 instead of 500.
 */

import { describe, it, expect } from 'vitest';
import { isUuid } from '@/lib/uuid';

describe('isUuid', () => {
  it('accepts canonical hyphenated UUIDs (any case)', () => {
    expect(isUuid('7f21fb79-1234-4abc-89de-0123456789ab')).toBe(true);
    expect(isUuid('7F21FB79-1234-4ABC-89DE-0123456789AB')).toBe(true);
    expect(isUuid('3f10aa3b-3633-45dc-97a1-216cc719dfff')).toBe(true);
  });

  it('rejects the legacy 24-hex Base44 id (the 500 case)', () => {
    expect(isUuid('6994acc34810e36068eddec2')).toBe(false);
  });

  it('rejects malformed shapes', () => {
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isUuid('7f21fb79-1234-4abc-89de-0123456789')).toBe(false); // short last group
    expect(isUuid('7f21fb79123448de89de0123456789ab')).toBe(false); // no hyphens
    expect(isUuid('zzzzzzzz-1234-4abc-89de-0123456789ab')).toBe(false); // non-hex
    expect(isUuid('')).toBe(false);
    expect(isUuid('  7f21fb79-1234-4abc-89de-0123456789ab  ')).toBe(false); // padded
  });

  it('rejects non-string input', () => {
    expect(isUuid(undefined)).toBe(false);
    expect(isUuid(null)).toBe(false);
    expect(isUuid(12345)).toBe(false);
    expect(isUuid({})).toBe(false);
  });
});
