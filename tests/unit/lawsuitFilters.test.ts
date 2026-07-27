/**
 * M3 Phase 2 — the /lawsuits filter seam.
 *
 * All filtering happens in memory over the full 36-row set, matching
 * Base44's browse page: the endpoint returns everything under its 200
 * cap, so a filter change is instant and needs no round trip. Status
 * filtering has to be client-side regardless — the endpoint takes no
 * status param, by design.
 *
 * This module exists as a pure seam because the repo has no React
 * render testing (no @testing-library/react + jsdom). If the filter
 * logic lived inside the component it would be untestable, and this is
 * the only real logic on the page.
 *
 * TWO RESOLVED DECISIONS ARE PINNED HERE:
 *
 * 1. Closed cases stay hidden. The public endpoint excludes
 *    draft/closed/archived by contract, so `closed` is not an offered
 *    filter value and `?status=closed` falls back to "all" rather than
 *    producing a filter that can never match.
 *
 * 2. Nationwide rows ALWAYS match a state filter. Base44 strips the
 *    `__nationwide__` sentinel before comparing, so filtering by
 *    Arizona there hides every nationwide case — 17 of 39 rows. A
 *    nationwide ADA class action plainly affects Arizonans, so this is
 *    a correctness fix, not a redesign; the visual output is identical.
 *
 * Ref: /plan M3 Phase 2, AC2 + AC3.
 */

import { describe, it, expect } from 'vitest';
import {
  parseInitialFilters,
  filterLawsuits,
  EMPTY_FILTERS,
  type LawsuitFilterState,
  type FilterableLawsuit,
} from '@/app/lib/lawsuitFilters';

function row(
  overrides: Partial<FilterableLawsuit> & { slug: string },
): FilterableLawsuit & { slug: string } {
  return {
    kind: 'class',
    status: 'active',
    caseName: 'Generic v. Defendant',
    shortDescription: null,
    affectedStates: [],
    ...overrides,
  };
}

const ROWS = [
  row({ slug: 'az-class', kind: 'class', status: 'active', affectedStates: ['AZ', 'NV'], caseName: 'Desert v. Acme' }),
  row({ slug: 'ca-enf', kind: 'enforcement_action', status: 'investigating', affectedStates: ['CA'], caseName: 'DOJ v. Bayshore' }),
  row({ slug: 'nationwide-decree', kind: 'consent_decree', status: 'compliance', affectedStates: [], caseName: 'US v. Hilton' }),
  row({ slug: 'sentinel-only', kind: 'pattern_of_practice', status: 'tracking', affectedStates: ['__nationwide__'], caseName: 'Pattern v. Chain' }),
  row({ slug: 'tx-reg', kind: 'regulatory_challenge', status: 'active', affectedStates: ['TX'], shortDescription: 'Kiosk accessibility rulemaking challenge.' }),
];

const slugs = (rows: { slug: string }[]) => rows.map((r) => r.slug).sort();

describe('parseInitialFilters', () => {
  it('returns the empty state for no query string', () => {
    expect(parseInitialFilters('')).toEqual(EMPTY_FILTERS);
  });

  it('honors each deep-link param', () => {
    const f = parseInitialFilters('?kind=consent_decree&status=compliance&state=az&search=hilton');
    expect(f.kind).toBe('consent_decree');
    expect(f.status).toBe('compliance');
    expect(f.state).toBe('AZ');
    expect(f.search).toBe('hilton');
  });

  it('falls back to "all" for an unrecognised kind', () => {
    expect(parseInitialFilters('?kind=bogus').kind).toBe('all');
    expect(parseInitialFilters('?kind=CLASS').kind).toBe('all');
  });

  it('treats ?status=closed as "all" — closed cases are not public', () => {
    // Decision 1. The endpoint never returns a closed row, so honoring
    // this would silently render an empty page with no explanation.
    expect(parseInitialFilters('?status=closed').status).toBe('all');
    expect(parseInitialFilters('?status=draft').status).toBe('all');
    expect(parseInitialFilters('?status=archived').status).toBe('all');
  });

  it('accepts each of the four public statuses', () => {
    for (const s of ['active', 'compliance', 'investigating', 'tracking']) {
      expect(parseInitialFilters(`?status=${s}`).status).toBe(s);
    }
  });

  it('uppercases the state code and tolerates junk', () => {
    expect(parseInitialFilters('?state=tx').state).toBe('TX');
    expect(parseInitialFilters('?state=').state).toBe('');
  });
});

describe('filterLawsuits — single filters', () => {
  it('returns everything for the empty filter state', () => {
    expect(filterLawsuits(ROWS, EMPTY_FILTERS)).toHaveLength(5);
  });

  it('filters by kind', () => {
    const out = filterLawsuits(ROWS, { ...EMPTY_FILTERS, kind: 'enforcement_action' });
    expect(slugs(out)).toEqual(['ca-enf']);
  });

  it('filters by status', () => {
    const out = filterLawsuits(ROWS, { ...EMPTY_FILTERS, status: 'active' });
    expect(slugs(out)).toEqual(['az-class', 'tx-reg']);
  });

  it('searches case name and short description, case-insensitively', () => {
    expect(slugs(filterLawsuits(ROWS, { ...EMPTY_FILTERS, search: 'HILTON' }))).toEqual([
      'nationwide-decree',
    ]);
    expect(slugs(filterLawsuits(ROWS, { ...EMPTY_FILTERS, search: 'kiosk' }))).toEqual([
      'tx-reg',
    ]);
  });

  it('ignores a whitespace-only search', () => {
    expect(filterLawsuits(ROWS, { ...EMPTY_FILTERS, search: '   ' })).toHaveLength(5);
  });
});

describe('filterLawsuits — nationwide rows always match a state filter', () => {
  it('includes both empty-array and sentinel-only rows alongside the state match', () => {
    // Decision 2. az-class matches on AZ; the two nationwide rows match
    // because a nationwide action reaches every state.
    const out = filterLawsuits(ROWS, { ...EMPTY_FILTERS, state: 'AZ' });
    expect(slugs(out)).toEqual(['az-class', 'nationwide-decree', 'sentinel-only']);
  });

  it('still excludes rows scoped to other states', () => {
    const out = filterLawsuits(ROWS, { ...EMPTY_FILTERS, state: 'AZ' });
    expect(slugs(out)).not.toContain('ca-enf');
    expect(slugs(out)).not.toContain('tx-reg');
  });

  it('never returns an empty list for a state no row names explicitly', () => {
    // The failure this guards: picking a state with no state-scoped case
    // and getting "no cases match", when three nationwide actions do.
    const out = filterLawsuits(ROWS, { ...EMPTY_FILTERS, state: 'WY' });
    expect(slugs(out)).toEqual(['nationwide-decree', 'sentinel-only']);
  });

  it('treats the sentinel as nationwide, never as a literal state code', () => {
    const out = filterLawsuits(ROWS, { ...EMPTY_FILTERS, state: '__NATIONWIDE__' });
    expect(slugs(out)).toEqual(['nationwide-decree', 'sentinel-only']);
  });
});

describe('filterLawsuits — filters combine', () => {
  it('ANDs kind + status + state + search', () => {
    const f: LawsuitFilterState = {
      kind: 'class',
      category: 'all',
      status: 'active',
      state: 'AZ',
      search: 'desert',
    };
    expect(slugs(filterLawsuits(ROWS, f))).toEqual(['az-class']);
  });

  it('returns nothing when the combination genuinely matches nothing', () => {
    const f: LawsuitFilterState = {
      kind: 'class',
      category: 'all',
      status: 'tracking',
      state: '',
      search: '',
    };
    expect(filterLawsuits(ROWS, f)).toHaveLength(0);
  });

  it('does not mutate the input array', () => {
    const before = ROWS.map((r) => r.slug);
    filterLawsuits(ROWS, { ...EMPTY_FILTERS, state: 'AZ', kind: 'class' });
    expect(ROWS.map((r) => r.slug)).toEqual(before);
  });
});

// ─── Taxonomy Phase 2 — filtering by barrier category ────────────────────────

/**
 * The category filter is what lets someone find their situation without
 * first working out whether it counts as a class action or a consent
 * decree. Type stays on the page for now — this is added alongside it,
 * not in place of it.
 *
 * Rows carry a category the same way they carry a state, so the rules
 * match the ones already here: an unrecognised value in the URL shows
 * the whole directory rather than an empty page, and filters combine
 * with AND.
 *
 * Ref: /plan litigation-taxonomy-and-contacts, Phase 2.
 */

const CATEGORY_ROWS = [
  row({ slug: 'seattle-ramps', barrierCategory: 'sidewalks_streets', status: 'compliance', affectedStates: ['WA'], caseName: 'Reynoldson v. Seattle' }),
  row({ slug: 'la-sidewalks', barrierCategory: 'sidewalks_streets', status: 'compliance', affectedStates: ['CA'], caseName: 'Willits v. Los Angeles' }),
  row({ slug: 'uber-animals', barrierCategory: 'rideshare_taxis', status: 'compliance', affectedStates: ['__nationwide__'], caseName: 'NFB v. Uber' }),
  row({ slug: 'harris-ballots', barrierCategory: 'voting_elections', status: 'active', affectedStates: ['TX'], caseName: 'Bryant v. Harris County' }),
  row({ slug: 'demo-row', barrierCategory: 'unassigned', status: 'active', affectedStates: [], caseName: 'Uncategorised matter' }),
];

describe('filterLawsuits — barrier category', () => {
  it('returns only rows in the chosen category', () => {
    const out = filterLawsuits(CATEGORY_ROWS, {
      ...EMPTY_FILTERS,
      category: 'sidewalks_streets',
    });
    expect(slugs(out)).toEqual(['la-sidewalks', 'seattle-ramps']);
  });

  it('returns everything when no category is chosen', () => {
    const out = filterLawsuits(CATEGORY_ROWS, EMPTY_FILTERS);
    expect(out).toHaveLength(CATEGORY_ROWS.length);
  });

  it('never shows an uncategorised row under a real category', () => {
    // The demo row is the only 'unassigned' one and it must not leak
    // into any category page.
    for (const category of ['sidewalks_streets', 'rideshare_taxis', 'voting_elections']) {
      const out = filterLawsuits(CATEGORY_ROWS, { ...EMPTY_FILTERS, category });
      expect(slugs(out)).not.toContain('demo-row');
    }
  });

  it('combines with the state filter, and nationwide rows still match', () => {
    // Same rule the state filter already follows: a nationwide case
    // reaches every state, so picking a state must not hide it.
    const out = filterLawsuits(CATEGORY_ROWS, {
      ...EMPTY_FILTERS,
      category: 'rideshare_taxis',
      state: 'AZ',
    });
    expect(slugs(out)).toEqual(['uber-animals']);
  });

  it('combines with status', () => {
    const out = filterLawsuits(CATEGORY_ROWS, {
      ...EMPTY_FILTERS,
      category: 'sidewalks_streets',
      status: 'compliance',
    });
    expect(slugs(out)).toEqual(['la-sidewalks', 'seattle-ramps']);

    const none = filterLawsuits(CATEGORY_ROWS, {
      ...EMPTY_FILTERS,
      category: 'sidewalks_streets',
      status: 'active',
    });
    expect(none).toEqual([]);
  });

  it('tolerates a row with no category at all', () => {
    // Rows come from the API, and an older cached response won't carry
    // the field. Missing must behave like uncategorised, not throw.
    const legacy = [row({ slug: 'legacy' })] as FilterableLawsuit[];
    expect(filterLawsuits(legacy, EMPTY_FILTERS)).toHaveLength(1);
    expect(
      filterLawsuits(legacy, { ...EMPTY_FILTERS, category: 'sidewalks_streets' }),
    ).toEqual([]);
  });
});

describe('parseInitialFilters — category deep links', () => {
  it('honors ?category=', () => {
    expect(parseInitialFilters('?category=jails_prisons').category).toBe('jails_prisons');
  });

  it('shows the whole directory for a category that does not exist', () => {
    // A bad link should never produce a blank page the reader can't explain.
    expect(parseInitialFilters('?category=nonsense').category).toBe('all');
    expect(parseInitialFilters('?category=unassigned').category).toBe('all');
    expect(parseInitialFilters('').category).toBe('all');
  });

  it('reads alongside the other params', () => {
    const f = parseInitialFilters('?category=air_travel&state=az&status=active');
    expect(f.category).toBe('air_travel');
    expect(f.state).toBe('AZ');
    expect(f.status).toBe('active');
  });
});
