/**
 * Attorneys — the public directory.
 *
 * Layout:
 *   [intro + disclaimer]
 *   [filter bar: state, city, practice-area chips] [reset]
 *   [ test-data banner, visible while synthetic rows are in the DB ]
 *   [ attorney cards, one per row ]
 *
 * Data flow:
 *   useAttorneys hook owns facets + filters + list state, debounces
 *   filter changes, surfaces loading + error.
 *
 * Accessibility:
 *   - Filter bar is a <fieldset> with legend "Filter attorneys"
 *   - Practice-area chips are <button role="switch" aria-pressed>
 *   - Results count announced via aria-live polite
 *   - Each card's email / phone / website are real links with
 *     aria-labels that include the attorney name
 *
 * Ref: docs/ARCHITECTURE.md §11
 */

import type { ChangeEvent } from 'react';
import {
  useAttorneys,
  type AttorneyDisplay,
} from '../../hooks/useAttorneys.js';
import { Breadcrumbs } from '../../components/Breadcrumbs.js';

export default function Attorneys() {
  const { attorneys, facets, filters, setFilters, loading, error, reset } = useAttorneys();

  const hasAnyTestData = attorneys.some(
    (a) => a.firm_name?.startsWith('[TEST]') || a.email?.includes('example-test.invalid'),
  );

  function handleStateChange(e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setFilters((f) => ({ ...f, state: value === '' ? null : value }));
  }

  function handleCityChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setFilters((f) => ({ ...f, city: value }));
  }

  function togglePracticeArea(slug: string) {
    setFilters((f) => ({
      ...f,
      practiceAreas: f.practiceAreas.includes(slug)
        ? f.practiceAreas.filter((p) => p !== slug)
        : [...f.practiceAreas, slug],
    }));
  }

  const hasActiveFilters =
    filters.state !== null || filters.city !== '' || filters.practiceAreas.length > 0;

  return (
    <section className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
      {/* Header */}
      <header className="mb-8">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/' },
            { label: 'Attorneys' },
          ]}
          className="mb-6"
        />
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent-500 mb-4">
          Attorney directory
        </p>
        <h1 className="font-display text-3xl sm:text-4xl text-ink-900 mb-3">
          Find an attorney who knows the ADA.
        </h1>
        <p className="text-ink-700 leading-relaxed max-w-2xl">
          Attorneys below practice disability rights law. Ada refers to this
          directory when your situation warrants a private lawsuit — Title III
          public-accommodations claims especially. Contact an attorney directly
          to ask about your case.
        </p>
        <p className="mt-3 text-sm text-ink-500">
          Not a lawyer referral service. We don't vet outcomes. We aren't paid
          by the attorneys listed.
        </p>
      </header>

      {/* Test-data banner */}
      {hasAnyTestData && (
        <div
          role="note"
          className="mb-6 rounded-md border border-warning-500 bg-warning-50 px-4 py-3 text-sm text-warning-500"
        >
          <strong>Test data.</strong> Attorney records currently shown are
          synthetic placeholders for development. Real vetted attorneys will
          replace them before public launch.
        </div>
      )}

      {/* Filter bar */}
      <fieldset className="mb-6 rounded-md border border-surface-200 bg-surface-100 p-4 sm:p-5">
        <legend className="font-mono text-xs uppercase tracking-[0.18em] text-ink-500 px-2">
          Filter
        </legend>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-4">
          {/* State */}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-700 font-medium">State</span>
            <select
              value={filters.state ?? ''}
              onChange={handleStateChange}
              className="w-full sm:w-auto rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900 sm:min-w-[120px]"
            >
              <option value="">All states</option>
              {facets.states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          {/* City */}
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-700 font-medium">City</span>
            <input
              type="text"
              value={filters.city}
              onChange={handleCityChange}
              placeholder="Exact match"
              className="w-full sm:w-auto rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900 sm:min-w-[180px] placeholder-ink-500"
            />
          </label>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-md text-sm text-accent-500 hover:bg-accent-50 transition-colors"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Practice-area chips */}
        {facets.practiceAreas.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-ink-700 font-medium mb-2">
              Practice areas
            </p>
            <div className="flex flex-wrap gap-2">
              {facets.practiceAreas.map((slug) => {
                const active = filters.practiceAreas.includes(slug);
                return (
                  <button
                    key={slug}
                    type="button"
                    role="switch"
                    aria-pressed={active}
                    onClick={() => togglePracticeArea(slug)}
                    className={
                      'px-4 py-2 rounded-full text-sm font-medium transition-colors border ' +
                      (active
                        ? 'bg-accent-500 text-white border-accent-500 hover:bg-accent-600'
                        : 'bg-white text-ink-700 border-surface-200 hover:border-accent-500 hover:text-accent-600')
                    }
                  >
                    {humanizeSlug(slug)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </fieldset>

      {/* Results count (announced) */}
      <p aria-live="polite" className="text-sm text-ink-500 mb-4">
        {loading
          ? 'Loading attorneys…'
          : error
          ? ''
          : attorneys.length === 0
          ? 'No attorneys match your filters.'
          : `Showing ${attorneys.length} attorney${attorneys.length === 1 ? '' : 's'}.`}
      </p>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {error}
        </div>
      )}

      {/* List */}
      {!loading && !error && attorneys.length === 0 && (
        <div className="rounded-md border border-surface-200 bg-surface-100 p-6 text-center">
          <p className="text-ink-700">
            No attorneys match those filters. Try widening your search, or
            reset filters to see everyone.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {attorneys.map((a) => (
          <AttorneyCard key={a.id} attorney={a} />
        ))}
      </div>
    </section>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AttorneyCard({ attorney }: { attorney: AttorneyDisplay }) {
  const location =
    attorney.location_city && attorney.location_state
      ? `${attorney.location_city}, ${attorney.location_state}`
      : attorney.location_state ?? attorney.location_city ?? '';

  return (
    <article className="rounded-md border border-surface-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-1">
        <h2 className="font-display text-xl text-ink-900">{attorney.name}</h2>
        {location && (
          <p className="text-sm text-ink-500 font-mono">{location}</p>
        )}
      </div>

      {attorney.firm_name && (
        <p className="text-ink-700 mb-3">{attorney.firm_name}</p>
      )}

      {attorney.practice_areas.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 mb-4 list-none p-0">
          {attorney.practice_areas.map((slug) => (
            <li
              key={slug}
              className="text-[0.6875rem] uppercase tracking-wider font-mono text-ink-500 bg-surface-100 border border-surface-200 px-2 py-0.5 rounded"
            >
              {humanizeSlug(slug)}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {attorney.email && (
          <a
            href={`mailto:${attorney.email}`}
            aria-label={`Email ${attorney.name}`}
            className="inline-flex items-center px-2 py-1 -mx-2 -my-1 rounded text-accent-500 hover:bg-accent-50 hover:text-accent-600 underline underline-offset-2 transition-colors"
          >
            {attorney.email}
          </a>
        )}
        {attorney.phone && (
          <a
            href={`tel:${attorney.phone}`}
            aria-label={`Call ${attorney.name}`}
            className="inline-flex items-center px-2 py-1 -mx-2 -my-1 rounded text-accent-500 hover:bg-accent-50 hover:text-accent-600 underline underline-offset-2 transition-colors"
          >
            {attorney.phone}
          </a>
        )}
        {attorney.website_url && (
          <a
            href={attorney.website_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${attorney.name} website`}
            className="inline-flex items-center px-2 py-1 -mx-2 -my-1 rounded text-accent-500 hover:bg-accent-50 hover:text-accent-600 underline underline-offset-2 transition-colors"
          >
            Website
          </a>
        )}
      </div>
    </article>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert a snake_case slug into a human-readable title.
 *   'public_accommodations' -> 'Public accommodations'
 *   'ada'                   -> 'ADA'
 *   'eeoc'                  -> 'EEOC'
 */
function humanizeSlug(slug: string): string {
  const upper = new Set(['ada', 'eeoc', 'doj', 'hud']);
  if (upper.has(slug)) return slug.toUpperCase();
  return slug
    .split('_')
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}
