/**
 * Lawsuits — public Active Cases browse page.
 *
 * Ported from Base44 (src/pages/Lawsuits.jsx @ 6b1e9ac, carrying B44's
 * 2026-07-08 grid-cohesion pass). Design authority is B44; changes are
 * confined to the port seams:
 *   - reads /api/public/litigation (Neon, reconciled at M0) instead of
 *     base44.entities.Litigation.list()
 *   - filter logic extracted to src/app/lib/lawsuitFilters.ts so it can
 *     be unit-tested; behavior is B44's apart from the two resolved
 *     decisions documented there
 *   - the focus-ring <style> block B44 rendered inside every card now
 *     lives once in app.css, rather than being emitted 36 times
 *
 * The Ada CTA is deliberately absent from this page — B44 gates it on
 * lawsuits_ada_cta_enabled and renders nothing in its place while the
 * flag is false. Phase 3 wires the flag on the detail page, which is
 * where B44 puts the CTA.
 *
 * Ref: /plan M3 Phase 2.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import GuideReadingLevelBar from '../../components/standards/GuideReadingLevelBar.jsx';
import LawsuitCard from '../../components/litigation/LawsuitCard.js';
import LawsuitFilters from '../../components/litigation/LawsuitFilters.js';
import {
  parseInitialFilters,
  filterLawsuits,
  type LawsuitFilterState,
} from '../../lib/lawsuitFilters.js';
import type {
  PublicLawsuitRow,
  PublicLitigationListResponse,
} from '../../lib/lawsuitTypes.js';

export default function Lawsuits() {
  const location = useLocation();
  const [filters, setFilters] = useState<LawsuitFilterState>(() =>
    parseInitialFilters(location.search),
  );
  const [rows, setRows] = useState<PublicLawsuitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch the whole set once and filter in memory, as B44 does. 36
      // rows sits well under the endpoint's 200 cap, and it keeps every
      // control instant — status filtering has to happen client-side
      // regardless, since the endpoint takes no status parameter.
      const resp = await fetch('/api/public/litigation?limit=200');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const body = (await resp.json()) as PublicLitigationListResponse;
      setRows(Array.isArray(body.litigation) ? body.litigation : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => filterLawsuits(rows, filters), [rows, filters]);

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
        <title>Active Cases — ADA Legal Link</title>
        <meta
          name="description"
          content="ADA class actions, enforcement actions, consent decrees, and other accessibility matters we're tracking."
        />
      </Helmet>

      <header style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            margin: '0 0 0.5rem',
            fontFamily: 'Manrope, sans-serif',
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: 'var(--heading)',
            lineHeight: 1.2,
          }}
        >
          Active Cases
        </h1>
        <p
          style={{
            margin: 0,
            fontFamily: 'Manrope, sans-serif',
            color: 'var(--body)',
            fontSize: '1.0625rem',
            lineHeight: 1.5,
            maxWidth: '60ch',
          }}
        >
          ADA class actions, enforcement actions, consent decrees, and other
          matters we&rsquo;re tracking. Open any case to read what it covers and
          who it may affect.
        </p>
      </header>

      <GuideReadingLevelBar />

      <LawsuitFilters filters={filters} onChange={setFilters} />

      {loading && (
        <p
          style={{
            fontFamily: 'Manrope, sans-serif',
            color: 'var(--body-secondary)',
            fontStyle: 'italic',
            margin: '2rem 0',
          }}
        >
          Loading cases…
        </p>
      )}

      {error && (
        <div
          role="alert"
          style={{
            background: 'var(--color-danger-50)',
            border: '1px solid var(--color-danger-500)',
            color: 'var(--color-danger-500)',
            padding: '0.85rem 1rem',
            borderRadius: 8,
            fontSize: '0.9375rem',
            margin: '1rem 0',
          }}
        >
          Couldn&rsquo;t load cases: {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div
          role="status"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 14,
            padding: '2rem 1.5rem',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: '0 0 0.5rem',
              fontFamily: 'Manrope, sans-serif',
              fontSize: '1.0625rem',
              fontWeight: 600,
              color: 'var(--heading)',
            }}
          >
            {rows.length === 0
              ? 'No cases are listed yet.'
              : 'No cases match your filters.'}
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.9375rem',
              color: 'var(--body)',
            }}
          >
            {rows.length === 0
              ? 'Please check back soon.'
              : 'Try clearing the search or choosing a different type, status, or state.'}
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <ul
          aria-label="Active cases"
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: '1.25rem',
          }}
        >
          {filtered.map((row) => (
            <li key={row.id}>
              <LawsuitCard row={row} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
