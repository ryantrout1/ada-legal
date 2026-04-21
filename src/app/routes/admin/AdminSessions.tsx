/**
 * AdminSessions — list view of ada_sessions for admin review.
 *
 * Columns: created/updated, status, reading level, classification,
 * messages, extracted fields, is-test flag, link to detail.
 *
 * Filters: status (all/active/completed/abandoned), include-test toggle.
 *
 * Ref: docs/ARCHITECTURE.md §11
 */

import { Link } from 'react-router-dom';
import { useAdminSessions, type SessionStatus } from '../../hooks/useAdminSessions.js';

export default function AdminSessions() {
  const {
    sessions,
    totalCount,
    filters,
    setFilters,
    loading,
    error,
    unauthenticated,
    totalPages,
  } = useAdminSessions();

  if (unauthenticated) {
    return (
      <div
        role="alert"
        className="rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
      >
        Your session is not authenticated. <Link to="/admin/sign-in" className="underline">Sign in</Link>.
      </div>
    );
  }

  return (
    <section>
      <header className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">
          Sessions
        </h1>
        <p className="text-sm text-ink-500">
          Ada conversations. Most recent first. QA/test sessions hidden by default.
        </p>
      </header>

      {/* Filter bar */}
      <fieldset className="mb-5 rounded-md border border-surface-200 bg-surface-100 p-3 sm:p-4">
        <legend className="sr-only">Filter sessions</legend>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-ink-700 font-medium">Status</span>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value as SessionStatus | '',
                  page: 1,
                })
              }
              className="rounded-md border border-surface-200 bg-white px-3 py-1.5 text-ink-900"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.includeTest}
              onChange={(e) =>
                setFilters({ ...filters, includeTest: e.target.checked, page: 1 })
              }
              className="accent-accent-500"
            />
            <span className="text-ink-700">Include QA / test sessions</span>
          </label>

          <span className="ml-auto text-xs text-ink-500 font-mono">
            {loading ? 'Loading…' : `${totalCount} total`}
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

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-surface-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-surface-100 text-left text-xs uppercase tracking-wider font-mono text-ink-500">
            <tr>
              <th className="px-3 py-2">Updated</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Level</th>
              <th className="px-3 py-2">Classification</th>
              <th className="px-3 py-2 text-right">Msgs</th>
              <th className="px-3 py-2 text-right">Fields</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-ink-500">
                  No sessions match the current filters.
                </td>
              </tr>
            )}
            {sessions.map((s) => (
              <tr key={s.session_id} className="border-t border-surface-200">
                <td className="px-3 py-2 font-mono text-xs text-ink-700">
                  {formatTime(s.updated_at)}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={s.status} />
                  {s.is_test && (
                    <span
                      title="QA test session"
                      className="ml-1.5 text-[10px] uppercase tracking-wider text-ink-500 font-mono"
                    >
                      test
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-ink-700">{s.reading_level}</td>
                <td className="px-3 py-2 text-ink-700">
                  {s.classification_title ?? (
                    <span className="text-ink-500 italic">Unclassified</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-ink-700 font-mono text-xs">
                  {s.message_count}
                </td>
                <td className="px-3 py-2 text-right text-ink-700 font-mono text-xs">
                  {s.extracted_field_count}
                </td>
                <td className="px-3 py-2">
                  <Link
                    to={`/admin/sessions/${s.session_id}`}
                    className="text-accent-500 hover:text-accent-600 underline underline-offset-2"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-4 flex items-center justify-between text-sm"
        >
          <button
            type="button"
            onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
            disabled={filters.page <= 1}
            className="text-ink-700 hover:text-accent-600 disabled:opacity-40 disabled:cursor-not-allowed underline underline-offset-2"
          >
            ← Previous
          </button>
          <span className="text-ink-500 font-mono text-xs">
            Page {filters.page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() =>
              setFilters({ ...filters, page: Math.min(totalPages, filters.page + 1) })
            }
            disabled={filters.page >= totalPages}
            className="text-ink-700 hover:text-accent-600 disabled:opacity-40 disabled:cursor-not-allowed underline underline-offset-2"
          >
            Next →
          </button>
        </nav>
      )}
    </section>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SessionStatus }) {
  const classes: Record<SessionStatus, string> = {
    active: 'bg-success-50 text-success-500 border-success-500',
    completed: 'bg-surface-100 text-ink-700 border-surface-200',
    abandoned: 'bg-warning-50 text-warning-500 border-warning-500',
  };
  return (
    <span
      className={
        'inline-block px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-mono border ' +
        classes[status]
      }
    >
      {status}
    </span>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
