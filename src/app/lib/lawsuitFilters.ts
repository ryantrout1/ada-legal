/**
 * /lawsuits filter seam — pure, so it can be tested.
 *
 * Base44's browse page loads the full Litigation set and filters in
 * memory; this does the same against `/api/public/litigation` (36 rows,
 * well under the endpoint's 200 cap). In-memory filtering is what makes
 * the controls feel instant, and status filtering has to happen here
 * regardless — the endpoint takes no status parameter.
 *
 * This lives outside the component on purpose: the repo has no React
 * render testing, so logic inside a component is logic nothing can
 * pin. Everything here is a pure function over plain data.
 *
 * Two behaviors differ deliberately from B44 (both resolved decisions,
 * M3 Phase 2 — see the tests for the full reasoning):
 *   1. `closed` is not a filter value. The public endpoint never
 *      returns a closed row, so offering it would be a dead option.
 *   2. Nationwide rows always match a state filter. B44 strips the
 *      sentinel before comparing, which hides every nationwide case the
 *      moment a state is chosen — 17 of 39 rows.
 */

import {
  KIND_ORDER,
  PUBLIC_STATUS_ORDER,
  isNationwide,
  statesList,
  type LitigationKindValue,
  type PublicLitigationStatus,
} from './litigationLabels.js';
import { isBrowsableCategory, type BarrierCategory } from './barrierCategories.js';

export interface LawsuitFilterState {
  kind: LitigationKindValue | 'all' | string;
  /**
   * Where the barrier was encountered. This is the control most people
   * will actually reach for — it lets someone find their situation
   * without first working out what kind of legal action covers it.
   * 'all' means no category chosen.
   */
  category: BarrierCategory | 'all' | string;
  status: PublicLitigationStatus | 'all' | string;
  /** Two-letter code, uppercased. Empty string means "all states". */
  state: string;
  search: string;
}

/** The minimum shape the filter reads. Real rows carry much more. */
export interface FilterableLawsuit {
  kind: string;
  /**
   * Optional because rows come from the API and an older cached
   * response won't carry the field. Missing behaves like uncategorised.
   */
  barrierCategory?: string | null;
  status: string;
  caseName: string;
  shortDescription: string | null;
  affectedStates: string[];
}

export const EMPTY_FILTERS: LawsuitFilterState = {
  kind: 'all',
  category: 'all',
  status: 'all',
  state: '',
  search: '',
};

const VALID_KINDS = new Set<string>(KIND_ORDER);
const VALID_STATUSES = new Set<string>(PUBLIC_STATUS_ORDER);

/**
 * Read deep-link params off a location search string.
 *
 * Anything unrecognised degrades to the "all" default rather than
 * filtering to nothing — a bad link should show the full directory, not
 * an empty page the reader can't explain.
 */
export function parseInitialFilters(search: string): LawsuitFilterState {
  const params = new URLSearchParams(search);
  const kindRaw = params.get('kind') ?? '';
  const categoryRaw = params.get('category') ?? '';
  const statusRaw = params.get('status') ?? '';
  const stateRaw = params.get('state') ?? '';

  return {
    kind: VALID_KINDS.has(kindRaw) ? kindRaw : 'all',
    // 'unassigned' deliberately fails this check. It is a real stored
    // value but never a browsable one, so it lands on 'all' like any
    // other junk — a bad link shows the whole directory, not a blank page.
    category: isBrowsableCategory(categoryRaw) ? categoryRaw : 'all',
    // `closed` deliberately fails this check: it is a real status, but
    // never a public one, so it lands on "all" like any other junk.
    status: VALID_STATUSES.has(statusRaw) ? statusRaw : 'all',
    state: stateRaw.trim().toUpperCase(),
    search: params.get('search') ?? '',
  };
}

function matchesState(row: FilterableLawsuit, state: string): boolean {
  if (!state) return true;
  // A nationwide action reaches every state, so it matches whatever the
  // reader picked. This is the deliberate divergence from B44.
  if (isNationwide(row.affectedStates)) return true;
  return statesList(row.affectedStates).includes(state);
}

function matchesSearch(row: FilterableLawsuit, needle: string): boolean {
  if (!needle) return true;
  const haystack = `${row.caseName ?? ''} ${row.shortDescription ?? ''}`.toLowerCase();
  return haystack.includes(needle);
}

/** Apply every active filter. Filters AND together, as they do on B44. */
export function filterLawsuits<T extends FilterableLawsuit>(
  rows: readonly T[],
  filters: LawsuitFilterState,
): T[] {
  const needle = filters.search.trim().toLowerCase();
  const state = filters.state.trim().toUpperCase();

  return rows.filter((r) => {
    if (filters.kind !== 'all' && r.kind !== filters.kind) return false;
    if (filters.category !== 'all' && r.barrierCategory !== filters.category) return false;
    if (filters.status !== 'all' && r.status !== filters.status) return false;
    if (!matchesState(r, state)) return false;
    if (!matchesSearch(r, needle)) return false;
    return true;
  });
}
