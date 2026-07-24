/**
 * M4 Phase 1 — attorney directory filter seam.
 *
 * B44 filters the full roster in memory. This app fetches server-side
 * filtered results through useAttorneys (state / city / practice_area
 * params, debounced), which is the better data layer and stays. What
 * lives here is the client-side layer B44 has that we don't: the
 * free-text search over name + firm, and the facet derivation the
 * dropdowns need.
 *
 * The thin-roster gate that used to live here is gone. It suppressed
 * the filter UI below ten approved attorneys, which with four approved
 * meant the public page shipped with no search box at all. B44 does
 * not gate; we no longer diverge.
 *
 * Ref: /plan M4 Phase 1, AC2; /plan attorney search.
 */

import { describe, it, expect } from 'vitest';
import {
  filterAttorneys,
  deriveFacets,
  EMPTY_ATTORNEY_FILTERS,
  type AttorneyFilterState,
  type FilterableAttorney,
} from '@/app/lib/attorneyFilters';

function att(
  overrides: Partial<FilterableAttorney> & { id: string },
): FilterableAttorney {
  return {
    name: 'Jane Doe',
    firm_name: null,
    location_state: null,
    practice_areas: [],
    states_of_practice: [],
    ...overrides,
  };
}

const ROSTER: FilterableAttorney[] = [
  att({
    id: 'a1',
    name: 'Kelley Brooks Simoneaux',
    firm_name: 'The Spinal Cord Injury Law Firm',
    location_state: 'DC',
    practice_areas: ['ada', 'civil_rights'],
  }),
  att({
    id: 'a2',
    name: 'Alex Elegudin',
    firm_name: 'The Spinal Cord Injury Law Firm',
    location_state: 'NY',
    practice_areas: ['ada', 'transportation'],
  }),
  att({
    id: 'a3',
    name: 'Maria Ortega',
    firm_name: 'Ortega Disability Law',
    location_state: 'AZ',
    practice_areas: ['education'],
    states_of_practice: ['AZ', 'NM'],
  }),
  // Sparse row: the shape that actually dominates the live roster.
  att({ id: 'a4', name: 'Ryan Trout' }),
];

const ids = (rows: FilterableAttorney[]) => rows.map((r) => r.id).sort();

describe('filterAttorneys', () => {
  it('returns everything for the empty filter state', () => {
    expect(filterAttorneys(ROSTER, EMPTY_ATTORNEY_FILTERS)).toHaveLength(4);
  });

  it('searches name and firm, case-insensitively', () => {
    expect(ids(filterAttorneys(ROSTER, { ...EMPTY_ATTORNEY_FILTERS, search: 'KELLEY' }))).toEqual(['a1']);
    // Firm match returns both attorneys at that firm.
    expect(ids(filterAttorneys(ROSTER, { ...EMPTY_ATTORNEY_FILTERS, search: 'spinal cord' }))).toEqual([
      'a1',
      'a2',
    ]);
  });

  it('ignores a whitespace-only search', () => {
    expect(filterAttorneys(ROSTER, { ...EMPTY_ATTORNEY_FILTERS, search: '   ' })).toHaveLength(4);
  });

  it('filters by practice area', () => {
    expect(ids(filterAttorneys(ROSTER, { ...EMPTY_ATTORNEY_FILTERS, practiceArea: 'ada' }))).toEqual([
      'a1',
      'a2',
    ]);
  });

  it('matches a state against either the office state or bar licensure', () => {
    // a3's office is AZ and it is also licensed in NM — both must match.
    expect(ids(filterAttorneys(ROSTER, { ...EMPTY_ATTORNEY_FILTERS, state: 'AZ' }))).toEqual(['a3']);
    expect(ids(filterAttorneys(ROSTER, { ...EMPTY_ATTORNEY_FILTERS, state: 'NM' }))).toEqual(['a3']);
  });

  it('does not match an attorney with no state at all', () => {
    // The sparse row has neither an office state nor licensure. It must
    // not silently match every state the way a nationwide lawsuit does —
    // an attorney with unknown licensure is unknown, not universal.
    expect(ids(filterAttorneys(ROSTER, { ...EMPTY_ATTORNEY_FILTERS, state: 'AZ' }))).not.toContain('a4');
  });

  it('ANDs search + practice area + state', () => {
    const f: AttorneyFilterState = {
      search: 'elegudin',
      practiceArea: 'ada',
      state: 'NY',
    };
    expect(ids(filterAttorneys(ROSTER, f))).toEqual(['a2']);
  });

  it('does not mutate the input array', () => {
    const before = ROSTER.map((r) => r.id);
    filterAttorneys(ROSTER, { ...EMPTY_ATTORNEY_FILTERS, state: 'AZ' });
    expect(ROSTER.map((r) => r.id)).toEqual(before);
  });
});

describe('deriveFacets', () => {
  it('collects sorted, de-duplicated states from both sources', () => {
    expect(deriveFacets(ROSTER).states).toEqual(['AZ', 'DC', 'NM', 'NY']);
  });

  it('collects sorted, de-duplicated practice areas', () => {
    expect(deriveFacets(ROSTER).practiceAreas).toEqual([
      'ada',
      'civil_rights',
      'education',
      'transportation',
    ]);
  });

  it('returns empty facets for an empty roster rather than throwing', () => {
    expect(deriveFacets([])).toEqual({ states: [], practiceAreas: [] });
  });

  it('drops empty-string values that would render a blank dropdown row', () => {
    const messy = [att({ id: 'x', location_state: '', practice_areas: ['', 'ada'] })];
    expect(deriveFacets(messy).states).toEqual([]);
    expect(deriveFacets(messy).practiceAreas).toEqual(['ada']);
  });
});
