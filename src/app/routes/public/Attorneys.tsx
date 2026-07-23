/**
 * Attorneys — the public directory.
 *
 * Ported from Base44 (src/pages/Attorneys.jsx @ 6b1e9ac, carrying the
 * July 8 cohesion pass that matched this page's framing to Lawsuits).
 * B44 is the design authority for the anatomy: page header, intro,
 * filter card, and a responsive grid of attorney cards.
 *
 * WHAT THIS PAGE KEEPS THAT B44 DOES NOT HAVE:
 *   - useAttorneys, which fetches /api/attorneys/facets on mount and
 *     /api/attorneys on every filter change, debounced 250ms. B44
 *     fetches the whole roster once and filters it in memory.
 *   - the thin-roster gate: below ten approved attorneys the filter UI
 *     is suppressed entirely. Three dropdowns over four attorneys at a
 *     single firm is worse than just showing the four cards.
 *   - client-side sort by state then last name, nulls last.
 *
 * DIVISION OF FILTERING: the two dropdowns drive the SERVER-side
 * filter through useAttorneys, which is what that hook is for. The
 * free-text search is applied client-side on top, because
 * /api/attorneys has no name/firm search parameter and adding one
 * would be a non-additive change to an endpoint the live B44 site
 * still consumes. Nothing is filtered twice on the same dimension.
 *
 * Ref: /plan M4 Phase 2.
 */

import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAttorneys } from '../../hooks/useAttorneys.js';
import AttorneyCard from '../../components/attorneys/AttorneyCard.js';
import AttorneyFilters from '../../components/attorneys/AttorneyFilters.js';
import {
  filterAttorneys,
  deriveFacets,
  shouldShowFilters,
  EMPTY_ATTORNEY_FILTERS,
  type AttorneyFilterState,
} from '../../lib/attorneyFilters.js';

export default function Attorneys() {
  const { attorneys, totalApproved, facets, filters, setFilters, loading, error } =
    useAttorneys();

  // Display-side filter state. `search` is ours; the dropdowns mirror
  // into the hook's server-side filters below.
  const [display, setDisplay] = useState<AttorneyFilterState>(EMPTY_ATTORNEY_FILTERS);

  const showFilters = shouldShowFilters(totalApproved);

  // Prefer the server's facet list; fall back to deriving from the rows
  // we already hold if the facets call failed (it is non-fatal by
  // design — the list still loads).
  const facetOptions = useMemo(() => {
    if (facets.states.length > 0 || facets.practiceAreas.length > 0) {
      return { states: facets.states, practiceAreas: facets.practiceAreas };
    }
    return deriveFacets(attorneys);
  }, [facets, attorneys]);

  // Only the free-text search runs here; state and practice area were
  // already applied server-side.
  const visible = useMemo(
    () =>
      filterAttorneys(attorneys, {
        ...EMPTY_ATTORNEY_FILTERS,
        search: display.search,
      }),
    [attorneys, display.search],
  );

  function handleFilterChange(next: AttorneyFilterState) {
    setDisplay(next);
    setFilters({
      ...filters,
      state: next.state === 'all' ? null : next.state,
      practiceAreas: next.practiceArea === 'all' ? [] : [next.practiceArea],
    });
  }

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '2.5rem 1.25rem 4rem',
        background: 'var(--page-bg-subtle)',
        minHeight: 'calc(100vh - 72px)',
      }}
    >
      <Helmet>
        <title>Find an Attorney — ADA Legal Link</title>
        <meta
          name="description"
          content="Browse experienced ADA attorneys in our network and reach out directly."
        />
      </Helmet>

      <header style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            margin: 0,
            fontFamily: 'Manrope, sans-serif',
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: 'var(--heading)',
            lineHeight: 1.2,
          }}
        >
          Find an Attorney
        </h1>
        <p
          style={{
            margin: '0.5rem 0 0',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '1.0625rem',
            color: 'var(--body)',
            lineHeight: 1.5,
            maxWidth: '60ch',
          }}
        >
          Browse experienced ADA attorneys in our network. Reach out directly to
          discuss your situation.
        </p>
      </header>

      {loading && (
        <p
          style={{
            fontFamily: 'Manrope, sans-serif',
            color: 'var(--body-secondary)',
            fontStyle: 'italic',
          }}
        >
          Loading attorneys…
        </p>
      )}

      {!loading && error && (
        <div
          role="alert"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 12,
            padding: '2rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'Manrope, sans-serif',
              fontSize: '1rem',
              color: 'var(--body)',
              lineHeight: 1.5,
            }}
          >
            We couldn&rsquo;t load the attorney directory just now. Please refresh
            the page or try again in a moment.
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          {showFilters && (
            <AttorneyFilters
              filters={display}
              facets={facetOptions}
              onChange={handleFilterChange}
            />
          )}

          {showFilters && (
            <p
              aria-live="polite"
              style={{
                margin: '0 0 1rem',
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.875rem',
                color: 'var(--body-secondary)',
              }}
            >
              {visible.length === 1 ? '1 attorney' : `${visible.length} attorneys`}
            </p>
          )}

          {visible.length === 0 ? (
            <div
              role="status"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 12,
                padding: '2rem 1.5rem',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: '1rem',
                  color: 'var(--body)',
                  lineHeight: 1.5,
                }}
              >
                {totalApproved === 0
                  ? 'There are no attorneys in our network yet. Please check back soon.'
                  : 'No attorneys match your filters. Try adjusting your search or selecting a different state.'}
              </p>
            </div>
          ) : (
            <ul
              aria-label="Attorneys"
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
                gap: '1.25rem',
              }}
            >
              {visible.map((a) => (
                <li key={a.id}>
                  <AttorneyCard attorney={a} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
