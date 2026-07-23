/**
 * useAttorneys — fetches the attorney directory and exposes filter state.
 *
 * Owns two network calls:
 *   1. /api/attorneys/facets on mount (to populate filter options)
 *   2. /api/attorneys on every filter change (debounced via useEffect)
 *
 * Filters are client-owned; the component decides when to call setFilters.
 *
 * Sort: results are sorted client-side by location_state (nulls last)
 * then by parsed last name (last whitespace-separated token of `name`,
 * case-insensitive). Sort is intentionally client-side so the underlying
 * /api/attorneys endpoint stays generic for Ada's search_attorneys tool,
 * which doesn't care about sort order. N is bounded at 50 per the API
 * limit, so sort cost is trivial.
 *
 * totalApproved: the unfiltered count of approved attorneys in the
 * network, returned alongside the (possibly filtered) list. The public
 * /attorneys page uses this to decide whether to show the filter UI at
 * all (thin-roster threshold).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PublicAttorneyRow } from '../lib/attorneyTypes.js';

/**
 * M4: the display row is now the full public payload.
 *
 * This interface used to declare nine fields while /api/attorneys
 * returned twelve — `bio`, `specialty_tags` and `states_of_practice`
 * were arriving over the wire on every request and being discarded by
 * the type, so the card could not render them without a cast. Aliased
 * to PublicAttorneyRow rather than re-declared, so the two cannot drift.
 *
 * The name is kept as an alias: the sort helpers and their tests import
 * it, and renaming them is churn with no benefit.
 */
export type AttorneyDisplay = PublicAttorneyRow;

export interface AttorneyFilters {
  state: string | null;
  city: string;
  practiceAreas: string[];
}

export interface FacetsData {
  states: string[];
  practiceAreas: string[];
}

const EMPTY_FILTERS: AttorneyFilters = {
  state: null,
  city: '',
  practiceAreas: [],
};

// Sentinel used so attorneys with a null state sort AFTER any real state
// code. '\uFFFF' is the highest BMP code point we'll plausibly see and
// reliably greater than any two-letter state abbreviation in localeCompare.
const NULL_STATE_SENTINEL = '\uFFFF';

/**
 * Parse a last-name sort key from a single-string `name` field. Takes
 * the last whitespace-separated token, lowercased. Imperfect for
 * compound surnames like "Maria Lopez de la Cruz" (sorts under "Cruz",
 * not "Lopez"), but acceptable for the network size we'll have for the
 * foreseeable future. Revisit if the schema gains proper firstName /
 * lastName columns.
 *
 * Splits on any whitespace run so tabs, newlines, and multi-space
 * inputs all produce the same key.
 */
export function getLastNameKey(name: string): string {
  const trimmed = name.trim();
  if (trimmed === '') return '';
  const tokens = trimmed.split(/\s+/);
  const last = tokens[tokens.length - 1];
  return last.toLowerCase();
}

/**
 * Sort a list of attorneys by location_state (nulls last) then by
 * parsed last name (case-insensitive), with full-name tiebreaker so
 * same-surname attorneys order by first name. Pure: returns a new
 * array, does not mutate the input.
 */
export function sortAttorneys(attorneys: AttorneyDisplay[]): AttorneyDisplay[] {
  return [...attorneys].sort((a, b) => {
    const stateA = a.location_state ?? NULL_STATE_SENTINEL;
    const stateB = b.location_state ?? NULL_STATE_SENTINEL;
    if (stateA !== stateB) return stateA.localeCompare(stateB);
    const lastA = getLastNameKey(a.name);
    const lastB = getLastNameKey(b.name);
    if (lastA !== lastB) return lastA.localeCompare(lastB);
    // Tiebreaker: same state, same last name. Compare full names so
    // "Alice Adams" comes before "Bob Adams" deterministically.
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
}

export function useAttorneys() {
  const [attorneys, setAttorneys] = useState<AttorneyDisplay[]>([]);
  const [totalApproved, setTotalApproved] = useState<number>(0);
  const [facets, setFacets] = useState<FacetsData>({ states: [], practiceAreas: [] });
  const [filters, setFilters] = useState<AttorneyFilters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const facetsLoadedRef = useRef(false);

  // Load facets once on mount.
  useEffect(() => {
    if (facetsLoadedRef.current) return;
    facetsLoadedRef.current = true;
    void (async () => {
      try {
        const resp = await fetch('/api/attorneys/facets');
        if (!resp.ok) throw new Error(`facets HTTP ${resp.status}`);
        const data = (await resp.json()) as { states: string[]; practice_areas: string[] };
        setFacets({ states: data.states, practiceAreas: data.practice_areas });
      } catch (err) {
        // Facets failure isn't fatal — the list still loads. Log it.
        console.warn('Failed to load facets', err);
      }
    })();
  }, []);

  // Load attorneys whenever filters change. Debounce by 250ms to avoid
  // hammering the server while the user types in the city box.
  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAttorneys();
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.state, filters.city, filters.practiceAreas.join('|')]);

  const loadAttorneys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.state) params.set('state', filters.state);
      if (filters.city.trim()) params.set('city', filters.city.trim());
      for (const p of filters.practiceAreas) params.append('practice_area', p);

      const resp = await fetch(`/api/attorneys?${params.toString()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as {
        attorneys: AttorneyDisplay[];
        total_approved?: number;
      };
      setAttorneys(sortAttorneys(data.attorneys));
      // total_approved is an additive field; older deployments may not
      // return it. Fall back to the visible list length so the consumer
      // never sees NaN, even if it under-counts in that case.
      setTotalApproved(
        typeof data.total_approved === 'number' ? data.total_approved : data.attorneys.length,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attorneys');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const reset = useCallback(() => setFilters(EMPTY_FILTERS), []);

  return { attorneys, totalApproved, facets, filters, setFilters, loading, error, reset };
}
