/**
 * Attorney directory filter seam — pure, so it can be tested.
 *
 * DIVISION OF LABOUR: `useAttorneys` already filters server-side
 * (state / city / practice_area params, debounced 250ms) and that
 * stays — it is the better data layer and Base44 has no equivalent.
 * What lives here is the client-side layer B44 has that we lack: the
 * free-text search over name + firm, and facet derivation for the
 * dropdowns.
 *
 * The state rule differs deliberately from the lawsuit filter's. A
 * nationwide lawsuit genuinely reaches every state, so it matches any
 * state filter. An attorney with no recorded licensure is *unknown*,
 * not universal — matching them everywhere would tell a reader in
 * Wyoming that someone is available to them when nobody knows that.
 * Unknown licensure matches nothing.
 */

import type { PublicAttorneyRow } from './attorneyTypes.js';

export interface AttorneyFilterState {
  search: string;
  /** 'all' or a practice-area slug. */
  practiceArea: string;
  /** 'all' or a two-letter state code. */
  state: string;
}

/** The minimum shape the filter reads. */
export type FilterableAttorney = Pick<
  PublicAttorneyRow,
  'id' | 'name' | 'firm_name' | 'location_state' | 'practice_areas' | 'states_of_practice'
>;

export const EMPTY_ATTORNEY_FILTERS: AttorneyFilterState = {
  search: '',
  practiceArea: 'all',
  state: 'all',
};

function nonEmpty(values: readonly string[] | null | undefined): string[] {
  if (!values) return [];
  return values.filter((v) => typeof v === 'string' && v.trim().length > 0);
}

export interface AttorneyFacets {
  states: string[];
  practiceAreas: string[];
}

/** Distinct, sorted filter values present in the current roster. */
export function deriveFacets(rows: readonly FilterableAttorney[]): AttorneyFacets {
  const states = new Set<string>();
  const practiceAreas = new Set<string>();

  for (const r of rows) {
    for (const s of nonEmpty(r.states_of_practice)) states.add(s);
    if (r.location_state && r.location_state.trim()) states.add(r.location_state);
    for (const p of nonEmpty(r.practice_areas)) practiceAreas.add(p);
  }

  return {
    states: [...states].sort(),
    practiceAreas: [...practiceAreas].sort(),
  };
}

function matchesState(row: FilterableAttorney, state: string): boolean {
  if (state === 'all' || !state) return true;
  if (row.location_state === state) return true;
  return nonEmpty(row.states_of_practice).includes(state);
}

function matchesSearch(row: FilterableAttorney, needle: string): boolean {
  if (!needle) return true;
  const haystack = `${row.name ?? ''} ${row.firm_name ?? ''}`.toLowerCase();
  return haystack.includes(needle);
}

/** Apply every active filter. Filters AND together. */
export function filterAttorneys<T extends FilterableAttorney>(
  rows: readonly T[],
  filters: AttorneyFilterState,
): T[] {
  const needle = filters.search.trim().toLowerCase();

  return rows.filter((r) => {
    if (!matchesSearch(r, needle)) return false;
    if (
      filters.practiceArea !== 'all' &&
      !nonEmpty(r.practice_areas).includes(filters.practiceArea)
    ) {
      return false;
    }
    if (!matchesState(r, filters.state)) return false;
    return true;
  });
}
