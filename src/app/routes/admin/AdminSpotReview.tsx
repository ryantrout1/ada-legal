/**
 * AdminSpotReview — the paid-report review queue at /admin/spot-review.
 *
 * This was a stack of cards, each carrying up to five equally-weighted
 * buttons whose set changed with the row's status, so nothing lined up and
 * the eye had to re-read every card. It is now the same shape as every other
 * admin list: filter bar, count, table, one action per row that opens a
 * detail page. The actions themselves moved to that detail page, next to the
 * report they act on — releasing someone's paid report should not be a thing
 * you can do from a list without looking at it.
 *
 * Ref: AdminSessions / AdminPhotoReview for the list-then-detail pattern.
 */

import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminSpotReports, type SpotReportRow } from '../../hooks/useAdminSpotReports.js';

export default function AdminSpotReview() {
  const { reports, loading, unauthenticated, error } = useAdminSpotReports();
  const navigate = useNavigate();
  // Needs-review first: it is the only state that wants a person. Everything
  // else on this screen is history.
  const [status, setStatus] = useState<string>('pending_review');

  const rows = useMemo(
    () => reports.filter((r) => !status || r.hitlStatus === status),
    [reports, status],
  );

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
        <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">Spot — report review</h1>
        <p className="text-sm text-ink-500">
          Paid photo screenings awaiting release. Open a report to release, reject, or regenerate it.
        </p>
      </header>

      <fieldset className="mb-5 rounded-md border border-surface-200 bg-surface-100 p-3 sm:p-4">
        <legend className="sr-only">Filter reports</legend>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-ink-700 font-medium">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="min-h-[44px] rounded-md border border-surface-200 bg-white px-3 py-1.5 text-ink-900"
            >
              <option value="pending_review">Needs review</option>
              <option value="">All</option>
              <option value="released">Released</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>

          <span className="ml-auto text-xs text-ink-500 font-mono">
            {loading ? 'Loading…' : `${rows.length} of ${reports.length}`}
          </span>
        </div>
      </fieldset>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-surface-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-surface-100 text-left text-xs uppercase tracking-wider font-mono text-ink-500">
            <tr>
              <th scope="col" className="px-3 py-2">Received</th>
              <th scope="col" className="px-3 py-2">Session</th>
              <th scope="col" className="px-3 py-2">Paid by</th>
              <th scope="col" className="px-3 py-2">Status</th>
              <th scope="col" className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-ink-500">
                  No reports match this filter.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const label = r.hitlStatus === 'pending_review' ? 'Review' : 'Open';
              return (
                // The whole row navigates on click for the mouse. The link in
                // the last cell stays as the real focusable, screen-reader
                // affordance — a clickable <tr> alone drops out of the tab
                // order and reads as nothing. Clicking the link lets the row
                // handler fire too, which is fine: same destination.
                <tr
                  key={r.id}
                  onClick={() => navigate(`/admin/spot-review/${encodeURIComponent(r.slug)}`)}
                  className="cursor-pointer border-t border-surface-200 hover:bg-surface-100"
                >
                  <td className="px-3 py-2 font-mono text-xs text-ink-700">{formatTime(r.createdAt)}</td>
                  <td className="px-3 py-2 font-mono text-xs text-ink-700">{r.sessionId.slice(0, 8)}</td>
                  <td className="px-3 py-2 text-ink-700">
                    <Buyer row={r} />
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={r.hitlStatus} />
                    {r.hitlStatus === 'released' && (
                      <span className="ml-1.5 text-[10px] uppercase tracking-wider text-ink-500 font-mono">
                        {r.sentAt ? 'emailed' : 'not emailed'}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      to={`/admin/spot-review/${encodeURIComponent(r.slug)}`}
                      aria-label={`${label} report for session ${r.sessionId.slice(0, 8)}`}
                      className="inline-flex min-h-[44px] items-center text-accent-600 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                    >
                      {label}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** The name is the CARDHOLDER, which is not always the person the barrier
 *  affects — a manager or an assistant may have paid — so it is labelled as
 *  who paid and never travels onto the report itself. No buyer at all is a
 *  real state worth seeing before pressing Release: that report can never be
 *  delivered. */
function Buyer({ row }: { row: SpotReportRow }) {
  if (!row.buyerName && !row.buyerEmail) {
    return <span className="text-ink-500 italic">No buyer on file</span>;
  }
  return (
    <>
      {row.buyerName && <span className="text-ink-900">{row.buyerName}</span>}
      {row.buyerName && row.buyerEmail && ' '}
      {row.buyerEmail && <span className="text-ink-700">{row.buyerEmail}</span>}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    pending_review: 'bg-warning-50 text-warning-500 border-warning-500',
    released: 'bg-success-50 text-success-500 border-success-500',
    rejected: 'bg-danger-50 text-danger-500 border-danger-500',
  };
  const labels: Record<string, string> = {
    pending_review: 'needs review',
    released: 'released',
    rejected: 'rejected',
  };
  return (
    <span
      className={
        'inline-block px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-mono border ' +
        (classes[status] ?? 'bg-surface-100 text-ink-700 border-surface-200')
      }
    >
      {labels[status] ?? status}
    </span>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
