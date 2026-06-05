/**
 * PhotoReviewQueue — /review
 *
 * The public list of field-test photo analyses to review, newest-unreviewed
 * first. Each row is a large tap target (whole card is the link). A simple
 * three-way filter switches between needing review, reviewed, and all.
 */

import { Link } from 'react-router-dom';
import { usePhotoReviewQueue } from './usePhotoReview.js';
import type { ReviewState } from '../../hooks/useAdminPhotoReview.js';

const RISK_LABEL: Record<string, { label: string; cls: string }> = {
  high: { label: 'High risk', cls: 'bg-danger-50 text-danger-500' },
  medium: { label: 'Medium risk', cls: 'bg-amber-50 text-amber-700' },
  low: { label: 'Low risk', cls: 'bg-surface-100 text-ink-700' },
  none: { label: 'No issues', cls: 'bg-surface-100 text-ink-500' },
};

const STATE_LABEL: Record<ReviewState, { label: string; cls: string }> = {
  unreviewed: { label: 'Needs review', cls: 'bg-accent-50 text-accent-600' },
  reviewed: { label: 'Reviewed', cls: 'bg-surface-100 text-ink-700' },
  addressed: { label: 'Addressed', cls: 'bg-emerald-50 text-emerald-700' },
};

const FILTERS: { value: ReviewState | ''; label: string }[] = [
  { value: 'unreviewed', label: 'Needs review' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: '', label: 'All' },
];

export default function PhotoReviewQueue() {
  const { items, reviewState, setReviewState, loading, error } = usePhotoReviewQueue();

  return (
    <section aria-labelledby="queue-heading">
      <h2 id="queue-heading" className="sr-only">
        Photos to review
      </h2>

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter photos">
        {FILTERS.map((f) => {
          const active = reviewState === f.value;
          return (
            <button
              key={f.label}
              type="button"
              aria-pressed={active}
              onClick={() => setReviewState(f.value)}
              className={`min-h-[48px] rounded-md border px-4 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                active
                  ? 'border-accent-500 bg-accent-50 text-accent-600'
                  : 'border-surface-200 text-ink-700 hover:border-accent-500'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading && <p className="text-base text-ink-500">Loading…</p>}
      {error && !loading && (
        <p className="rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-base text-danger-500">
          {error}
        </p>
      )}
      {!loading && !error && items.length === 0 && (
        <p className="text-base text-ink-500">Nothing here right now.</p>
      )}

      <ul className="space-y-3">
        {items.map((it) => {
          const risk = RISK_LABEL[it.overallRisk ?? 'none'] ?? RISK_LABEL.none;
          const state = STATE_LABEL[it.reviewState];
          return (
            <li key={it.photoAnalysisId}>
              <Link
                to={`/review/${it.photoAnalysisId}`}
                className="flex items-center gap-4 rounded-md border border-surface-200 bg-surface-100 p-3 transition-colors hover:border-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                <img
                  src={it.photoUrl}
                  alt=""
                  className="h-20 w-20 flex-shrink-0 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-sm font-medium ${risk.cls}`}>
                      {risk.label}
                    </span>
                    <span className={`rounded px-2 py-0.5 text-sm font-medium ${state.cls}`}>
                      {state.label}
                    </span>
                    {it.reviewerCount > 0 && (
                      <span className="text-sm text-ink-500">
                        {it.reviewerCount} review{it.reviewerCount === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-base text-ink-700">
                    {it.findingCount} finding{it.findingCount === 1 ? '' : 's'}
                    {it.criticalCount > 0 && ` · ${it.criticalCount} critical`}
                    {it.majorCount > 0 && ` · ${it.majorCount} major`}
                  </p>
                </div>
                <span aria-hidden="true" className="flex-shrink-0 text-2xl text-ink-500">
                  ›
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
