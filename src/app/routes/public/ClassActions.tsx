/**
 * ClassActions — public directory of active litigation.
 *
 * Reads /api/public/litigation (cached 5min browser / 15min CDN).
 * Lists one card per row across the 4 page-visible statuses (active,
 * compliance, investigating, tracking) and 5 kinds (class action,
 * DOJ enforcement, consent decree, pattern-of-practice, regulatory
 * challenge). Filter chips for kind; no pagination (38 rows current
 * scale, the endpoint caps at 200).
 *
 * Each card links to /class-actions/:slug for the detail page.
 *
 * Design follows the Home page language: serif headline, plain-
 * language subhead, generous whitespace. The directory is rigorous,
 * not a marketplace.
 *
 * Ref: /plan Phase A3b. (Phase A3a wired the API; this page consumes
 * the new payload shape and the broader status set.)
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../../components/Breadcrumbs.js';
import { ClassActionsBanner } from './components/ClassActionsBanner.js';

type LitigationKind =
  | 'class'
  | 'enforcement_action'
  | 'consent_decree'
  | 'pattern_of_practice'
  | 'regulatory_challenge';

interface PublicLitigationRow {
  id: string;
  kind: LitigationKind;
  caseName: string;
  slug: string;
  legalTheory: string | null;
  shortDescription: string | null;
  shortDescriptionSimple: string | null;
  shortDescriptionProfessional: string | null;
  defendants: string[];
  affectedStates: string[];
  filingDate: string | null;
}

/**
 * Filter-chip definitions. Each chip selects exactly one kind. The
 * 'All' chip clears the filter.
 */
const KIND_CHIPS: { value: LitigationKind | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'class', label: 'Class action' },
  { value: 'enforcement_action', label: 'DOJ enforcement' },
  { value: 'consent_decree', label: 'Consent decree' },
  { value: 'pattern_of_practice', label: 'Pattern of practice' },
  { value: 'regulatory_challenge', label: 'Regulatory challenge' },
];

const KIND_LABEL: Record<LitigationKind, string> = {
  class: 'Class action',
  enforcement_action: 'DOJ enforcement',
  consent_decree: 'Consent decree',
  pattern_of_practice: 'Pattern of practice',
  regulatory_challenge: 'Regulatory challenge',
};

export default function ClassActions() {
  const [rows, setRows] = useState<PublicLitigationRow[]>([]);
  const [kind, setKind] = useState<LitigationKind | 'all'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (kind !== 'all') params.set('kind', kind);
      if (search.trim()) params.set('search', search.trim());
      params.set('limit', '200');
      const resp = await fetch(`/api/public/litigation?${params.toString()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as {
        litigation: PublicLitigationRow[];
        total_count: number;
      };
      setRows(data.litigation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [kind, search]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 200);
    return () => clearTimeout(timer);
  }, [load]);

  // Sort alphabetically by caseName for stable browse-order, per
  // /plan A3 AC4. The endpoint sorts by filing_date DESC for Ada's
  // prompt context (recency relevance); the public browse page wants
  // alphabetical for findability.
  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) =>
        a.caseName.localeCompare(b.caseName, 'en', { sensitivity: 'base' }),
      ),
    [rows],
  );

  return (
    <>
      <Helmet>
        <title>Class actions — ADA Legal Link</title>
        <meta
          name="description"
          content="Active ADA class actions, DOJ enforcement, consent decrees, and pattern-of-practice intake. Free, plain-language intake with Ada."
        />
        <meta property="og:title" content="Class actions — ADA Legal Link" />
        <meta
          property="og:description"
          content="Active ADA class actions, DOJ enforcement, consent decrees, and pattern-of-practice intake."
        />
        <meta property="og:url" content="https://ada.adalegallink.com/class-actions" />
        <meta name="twitter:title" content="Class actions — ADA Legal Link" />
        <meta
          name="twitter:description"
          content="Active ADA class actions, DOJ enforcement, consent decrees, and pattern-of-practice intake."
        />
        <link rel="canonical" href="https://ada.adalegallink.com/class-actions" />
      </Helmet>

      <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 pb-8 sm:pt-16 sm:pb-12">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Class actions' },
          ]}
          className="mb-6"
        />
        <h1 className="font-display text-4xl sm:text-5xl text-ink-900 mb-4 leading-tight">
          Class actions
        </h1>
        <p className="text-lg text-ink-700 max-w-2xl mb-6">
          Active legal actions and ongoing patterns of harm related to
          disability access. If your story matches, you can tell Ada
          what happened.
        </p>
        <ClassActionsBanner />
      </section>

      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-16">
        {/* Filter chips */}
        <fieldset className="mb-6">
          <legend className="sr-only">Filter by case type</legend>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Case type">
            {KIND_CHIPS.map((chip) => {
              const selected = kind === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setKind(chip.value)}
                  className={
                    selected
                      ? 'rounded-full border border-accent-500 bg-accent-500 text-white px-4 py-1.5 text-sm font-medium transition-colors'
                      : 'rounded-full border border-surface-200 bg-white text-ink-700 px-4 py-1.5 text-sm font-medium hover:border-accent-500 hover:text-accent-600 transition-colors'
                  }
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Search */}
        <fieldset className="mb-8">
          <legend className="sr-only">Search class actions</legend>
          <label className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm">
            <span className="text-ink-700 font-medium">Search</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hotels, service animals, rideshare, voting&hellip;"
              className="w-full sm:flex-1 rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900 placeholder-ink-500"
            />
          </label>
        </fieldset>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
          >
            {error}
          </div>
        )}

        {loading && sortedRows.length === 0 && (
          <p className="text-ink-500 italic">Loading&hellip;</p>
        )}

        {!loading && sortedRows.length === 0 && (
          <div className="rounded-md border border-surface-200 bg-white p-8 text-center">
            <p className="text-ink-900 font-medium mb-2">
              No cases match.
            </p>
            <p className="text-sm text-ink-500 mb-4">
              If your situation involves an ADA violation that isn&rsquo;t
              listed here, Ada can still help.
            </p>
            <Link
              to="/chat"
              className="inline-flex items-center px-5 py-3 rounded-md bg-accent-500 text-white font-medium hover:bg-accent-600 transition-colors"
            >
              Talk to Ada
            </Link>
          </div>
        )}

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sortedRows.map((r) => (
            <li key={r.id}>
              <Link
                to={`/class-actions/${encodeURIComponent(r.slug)}`}
                className="block h-full rounded-md border border-surface-200 bg-white p-5 hover:border-accent-500 hover:shadow-sm transition-all"
              >
                <h2 className="font-display text-xl text-ink-900 leading-snug mb-2">
                  {r.caseName}
                </h2>
                {r.shortDescription && (
                  <p className="text-sm text-ink-700 mb-3">
                    {r.shortDescription}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-surface-200 text-xs">
                  <KindPill kind={r.kind} />
                  {r.legalTheory && (
                    <span className="text-ink-500">{r.legalTheory}</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function KindPill({ kind }: { kind: LitigationKind }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-full bg-accent-50 text-accent-600 font-medium">
      {KIND_LABEL[kind]}
    </span>
  );
}
