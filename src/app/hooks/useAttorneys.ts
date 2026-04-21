/**
 * useAttorneys — fetches the attorney directory and exposes filter state.
 *
 * Owns two network calls:
 *   1. /api/attorneys/facets on mount (to populate filter options)
 *   2. /api/attorneys on every filter change (debounced via useEffect)
 *
 * Filters are client-owned; the component decides when to call setFilters.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface AttorneyDisplay {
  id: string;
  name: string;
  firm_name: string | null;
  location_city: string | null;
  location_state: string | null;
  practice_areas: string[];
  email: string | null;
  phone: string | null;
  website_url: string | null;
}

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

export function useAttorneys() {
  const [attorneys, setAttorneys] = useState<AttorneyDisplay[]>([]);
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
      const data = (await resp.json()) as { attorneys: AttorneyDisplay[] };
      setAttorneys(data.attorneys);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attorneys');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const reset = useCallback(() => setFilters(EMPTY_FILTERS), []);

  return { attorneys, facets, filters, setFilters, loading, error, reset };
}
