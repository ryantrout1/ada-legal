/**
 * AdminPhotoReview — the expert-labeling queue.
 *
 * Collapsed one-row cards for every field-test photo analysis, newest-
 * unreviewed first. Filters by review state / risk / engine version.
 * An eval strip up top shows accuracy by engine version. Click a row to
 * open the detail + labeling view.
 */

import { Link } from 'react-router-dom';
import {
  useAdminPhotoReviewList,
  useAdminPhotoReviewEval,
  type OverallRisk,
  type ReviewState,
} from '../../hooks/useAdminPhotoReview.js';

const RISK_BADGE: Record<OverallRisk, { bg: string; text: string; label: string }> = {
  high: { bg: 'bg-danger-50', text: 'text-danger-500', label: 'HIGH' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'MEDIUM' },
  low: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'LOW' },
  none: { bg: 'bg-surface-100', text: 'text-ink-500', label: 'NONE' },
};

const STATE_BADGE: Record<ReviewState, { bg: string; text: string; label: string }> = {
  unreviewed: { bg: 'bg-accent-50', text: 'text-accent-600', label: 'Needs review' },
  reviewed: { bg: 'bg-surface-100', text: 'text-ink-700', label: 'Reviewed' },
  addressed: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Addressed' },
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AdminPhotoReview() {
  const { items, totalCount, filters, setFilters, loading, error, unauthenticated, totalPages } =
    useAdminPhotoReviewList();
  const { rows: evalRows } = useAdminPhotoReviewEval();

  if (unauthenticated) {
    return (
      <div
        role="alert"
        className="rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
      >
        Your session is not authenticated.{' '}
        <Link to="/admin/sign-in" className="underline">
          Sign in
        </Link>
        .
      </div>
    );
  }

  return (
    <section>
      <header className="mb-6">
        <h1 className="font-display text-2xl text-ink-900">Photo Review</h1>
        <p className="mt-1 text-sm text-ink-700">
          Expert labeling of field-test photo analyses. Mark what the engine got right, what it
          over-flagged, and what it missed — that record is how we tune the analyzer.
        </p>
      </header>

      {/* Eval strip — accuracy by engine version */}
      {evalRows.length > 0 && (
        <div className="mb-6 overflow-x-auto rounded-md border border-surface-200 bg-surface-50">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Accuracy by engine version</caption>
            <thead className="text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-3 py-2">Engine version</th>
                <th className="px-3 py-2">Reviewed</th>
                <th className="px-3 py-2">Findings</th>
                <th className="px-3 py-2">Correct</th>
                <th className="px-3 py-2">Over-flagged</th>
                <th className="px-3 py-2">Partial</th>
                <th className="px-3 py-2">Wrong cite</th>
                <th className="px-3 py-2">Missed</th>
              </tr>
            </thead>
            <tbody>
              {evalRows.map((r) => (
                <tr key={r.modelVersion} className="border-t border-surface-200 text-ink-900">
                  <td className="px-3 py-2 font-mono text-xs">{r.modelVersion}</td>
                  <td className="px-3 py-2">{r.analysesReviewed}</td>
                  <td className="px-3 py-2">{r.findingsLabeled}</td>
                  <td className="px-3 py-2 text-emerald-700">{r.correct}</td>
                  <td className="px-3 py-2 text-danger-500">{r.overFlagged}</td>
                  <td className="px-3 py-2 text-amber-700">{r.partial}</td>
                  <td className="px-3 py-2 text-danger-500">{r.wrongCite}</td>
                  <td className="px-3 py-2 text-danger-500">{r.missedTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-xs text-ink-700">
          Review state
          <select
            value={filters.reviewState}
            onChange={(e) =>
              setFilters({ ...filters, reviewState: e.target.value as ReviewState | '', page: 1 })
            }
            className="mt-1 rounded-md border border-surface-200 bg-surface-50 px-2 py-1.5 text-sm text-ink-900"
          >
            <option value="">All</option>
            <option value="unreviewed">Needs review</option>
            <option value="reviewed">Reviewed</option>
            <option value="addressed">Addressed</option>
          </select>
        </label>
        <label className="flex flex-col text-xs text-ink-700">
          Risk
          <select
            value={filters.risk}
            onChange={(e) =>
              setFilters({ ...filters, risk: e.target.value as OverallRisk | '', page: 1 })
            }
            className="mt-1 rounded-md border border-surface-200 bg-surface-50 px-2 py-1.5 text-sm text-ink-900"
          >
            <option value="">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="none">None</option>
          </select>
        </label>
        <label className="flex flex-col text-xs text-ink-700">
          Engine version
          <input
            type="text"
            value={filters.modelVersion}
            placeholder="e.g. claude-sonnet-4-5"
            onChange={(e) => setFilters({ ...filters, modelVersion: e.target.value, page: 1 })}
            className="mt-1 rounded-md border border-surface-200 bg-surface-50 px-2 py-1.5 text-sm text-ink-900"
          />
        </label>
        <span className="ml-auto text-sm text-ink-500">{totalCount} total</span>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ink-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink-500">No photo analyses match these filters.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => {
            const risk = it.overallRisk ? RISK_BADGE[it.overallRisk] : RISK_BADGE.none;
            const state = STATE_BADGE[it.reviewState];
            return (
              <li key={it.photoAnalysisId}>
                <Link
                  to={`/admin/photo-review/${it.photoAnalysisId}`}
                  className="flex items-center gap-4 rounded-md border border-surface-200 bg-surface-50 p-3 transition-colors hover:border-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                >
                  <img
                    src={it.photoUrl}
                    alt="Submitted field-test photo"
                    className="h-16 w-16 flex-shrink-0 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-bold ${risk.bg} ${risk.text}`}>
                        {risk.label}
                      </span>
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${state.bg} ${state.text}`}>
                        {state.label}
                      </span>
                      <span className="text-xs text-ink-500">{fmtDate(it.analyzedAt)}</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-ink-700">
                      {it.findingCount} finding{it.findingCount === 1 ? '' : 's'}
                      {it.criticalCount > 0 && ` · ${it.criticalCount} critical`}
                      {it.majorCount > 0 && ` · ${it.majorCount} major`}
                      {it.minorCount > 0 && ` · ${it.minorCount} minor`}
                      {it.advisoryCount > 0 && ` · ${it.advisoryCount} advisory`}
                    </p>
                  </div>
                  <span className="flex-shrink-0 font-mono text-[10px] text-ink-500">
                    {it.modelVersion}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={filters.page <= 1}
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            className="rounded-md border border-surface-200 px-3 py-1.5 text-sm text-ink-700 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-ink-500">
            Page {filters.page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={filters.page >= totalPages}
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            className="rounded-md border border-surface-200 px-3 py-1.5 text-sm text-ink-700 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
