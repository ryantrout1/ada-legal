/**
 * attorneys-sort.test.ts — ATDD tests for /plan Phase 1.
 *
 * Phase 1 introduces a `getLastNameKey` pure helper used to sort the
 * public attorney directory by state-then-last-name. These tests
 * encode the acceptance criteria for that helper and for the resulting
 * order produced by `sortAttorneys`. The helper and exported sort
 * function live alongside the useAttorneys hook so the React tree
 * doesn't need to be mounted for these tests.
 *
 * Acceptance criteria (from /plan Phase 1):
 *   #3 — Attorneys render in alphabetical order by location_state
 *        (nulls last), then by parsed last name (last whitespace-
 *        separated token of `name`, case-insensitive). Order is stable
 *        across reloads when the underlying data is unchanged.
 */

import { describe, it, expect } from 'vitest';
import {
  getLastNameKey,
  sortAttorneys,
  type AttorneyDisplay,
} from '@/app/hooks/useAttorneys';

// ─── getLastNameKey: pure helper ──────────────────────────────────────────────

describe('getLastNameKey', () => {
  it('returns the single token when the name has no spaces', () => {
    expect(getLastNameKey('Madonna')).toBe('madonna');
  });

  it('returns the last whitespace-separated token for a two-token name', () => {
    expect(getLastNameKey('Jane Doe')).toBe('doe');
  });

  it('returns the last token for a multi-token name', () => {
    expect(getLastNameKey('Maria Lopez de la Cruz')).toBe('cruz');
  });

  it('lowercases the result for case-insensitive comparison', () => {
    expect(getLastNameKey('Jane DOE')).toBe('doe');
    expect(getLastNameKey('JANE Doe')).toBe('doe');
  });

  it('trims leading and trailing whitespace before parsing', () => {
    expect(getLastNameKey('  Jane Doe  ')).toBe('doe');
    expect(getLastNameKey('\tJane Doe\n')).toBe('doe');
  });

  it('handles names with multiple internal spaces', () => {
    expect(getLastNameKey('Jane    Doe')).toBe('doe');
  });

  it('returns the trimmed string for a name that becomes single-token after trim', () => {
    expect(getLastNameKey('   Madonna   ')).toBe('madonna');
  });

  it('returns empty string for an empty input', () => {
    expect(getLastNameKey('')).toBe('');
  });

  it('returns empty string for a whitespace-only input', () => {
    expect(getLastNameKey('   ')).toBe('');
  });
});

// ─── sortAttorneys: state-then-last-name, nulls last ──────────────────────────

function mkAttorney(partial: Partial<AttorneyDisplay>): AttorneyDisplay {
  return {
    id: partial.id ?? Math.random().toString(36).slice(2),
    name: partial.name ?? 'Test Attorney',
    firm_name: partial.firm_name ?? null,
    location_city: partial.location_city ?? null,
    location_state: partial.location_state ?? null,
    practice_areas: partial.practice_areas ?? [],
    email: partial.email ?? null,
    phone: partial.phone ?? null,
    website_url: partial.website_url ?? null,
  };
}

describe('sortAttorneys', () => {
  it('orders by state alphabetically when last names are equal across states', () => {
    const input = [
      mkAttorney({ name: 'Jane Doe', location_state: 'NY' }),
      mkAttorney({ name: 'John Doe', location_state: 'AZ' }),
      mkAttorney({ name: 'Jill Doe', location_state: 'CA' }),
    ];
    const out = sortAttorneys(input);
    expect(out.map((a) => a.location_state)).toEqual(['AZ', 'CA', 'NY']);
  });

  it('orders by last name within the same state', () => {
    const input = [
      mkAttorney({ name: 'Jane Walker', location_state: 'AZ' }),
      mkAttorney({ name: 'Bob Adams', location_state: 'AZ' }),
      mkAttorney({ name: 'Mary Lewis', location_state: 'AZ' }),
    ];
    const out = sortAttorneys(input);
    expect(out.map((a) => a.name)).toEqual([
      'Bob Adams',
      'Mary Lewis',
      'Jane Walker',
    ]);
  });

  it('sorts state first, then last name within state', () => {
    const input = [
      mkAttorney({ name: 'Jane Walker', location_state: 'CA' }),
      mkAttorney({ name: 'Bob Adams', location_state: 'AZ' }),
      mkAttorney({ name: 'Carol Smith', location_state: 'CA' }),
      mkAttorney({ name: 'Alice Adams', location_state: 'AZ' }),
    ];
    const out = sortAttorneys(input);
    expect(out.map((a) => `${a.location_state}/${a.name}`)).toEqual([
      'AZ/Alice Adams',
      'AZ/Bob Adams',
      'CA/Carol Smith',
      'CA/Jane Walker',
    ]);
  });

  it('places attorneys with null state at the end', () => {
    const input = [
      mkAttorney({ name: 'Jane Walker', location_state: null }),
      mkAttorney({ name: 'Bob Adams', location_state: 'AZ' }),
      mkAttorney({ name: 'Alice Brown', location_state: null }),
    ];
    const out = sortAttorneys(input);
    expect(out.map((a) => a.name)).toEqual([
      'Bob Adams',
      'Alice Brown',
      'Jane Walker',
    ]);
  });

  it('compares last names case-insensitively across mixed-case names', () => {
    const input = [
      mkAttorney({ name: 'Jane DOE', location_state: 'AZ' }),
      mkAttorney({ name: 'Bob adams', location_state: 'AZ' }),
    ];
    const out = sortAttorneys(input);
    expect(out.map((a) => a.name)).toEqual(['Bob adams', 'Jane DOE']);
  });

  it('does not mutate the input array', () => {
    const input = [
      mkAttorney({ name: 'Jane Walker', location_state: 'CA' }),
      mkAttorney({ name: 'Bob Adams', location_state: 'AZ' }),
    ];
    const before = input.map((a) => a.id);
    sortAttorneys(input);
    expect(input.map((a) => a.id)).toEqual(before);
  });

  it('produces a stable order across repeated calls on the same data', () => {
    const input = [
      mkAttorney({ name: 'Jane Walker', location_state: 'CA' }),
      mkAttorney({ name: 'Bob Adams', location_state: 'AZ' }),
      mkAttorney({ name: 'Carol Smith', location_state: 'CA' }),
    ];
    const a = sortAttorneys(input).map((x) => x.id);
    const b = sortAttorneys(input).map((x) => x.id);
    expect(a).toEqual(b);
  });

  it('returns an empty array for empty input', () => {
    expect(sortAttorneys([])).toEqual([]);
  });
});
