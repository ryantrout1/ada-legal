/**
 * AdminIntakes — global read-only list of class_action_intake sessions.
 *
 * Each row shows firm, listing, session status, outcome (qualified /
 * disqualified / pending), is_test flag. Click into a session to see
 * the full conversation at /admin/sessions/:id.
 *
 * Filters: firm, status, outcome, include_test.
 *
 * Ref: Step 25, Commit 6.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type Status = 'active' | 'completed' | 'abandoned';
type Outcome = 'qualified' | 'disqualified';

interface IntakeRow {
  sessionId: string;
  status: Status;
  lawFirmId: string;
  lawFirmName: string;
  listingId: string;
  listingTitle: string;
  outcome: Outcome | null;
  isTest: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FirmOption {
  id: string;
  name: string;
}

export default function AdminIntakes() {
  const [rows, setRows] = useState<IntakeRow[]>([]);
  const [total, setTotal] = useState(0);
  const [firms, setFirms] = useState<FirmOption[]>([]);
  const [firmId, setFirmId] = useState('');
  const [status, setStatus] = useState<Status | ''>('');
  const [outcome, setOutcome] = useState<Outcome | ''>('');
  const [includeTest, setIncludeTest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauth, setUnauth] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const resp = await fetch('/api/admin/firms?page_size=100', {
          credentials: 'include',
        });
        if (resp.status === 401) {
          setUnauth(true);
          return;
        }
        if (!resp.ok) return;
        const data = (await resp.json()) as { firms: FirmOption[] };
        setFirms(data.firms);
      } catch {
        // non-fatal
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (firmId) params.set('law_firm_id', firmId);
      if (status) params.set('status', status);
      if (outcome) params.set('outcome', outcome);
      if (includeTest) params.set('include_test', 'true');
      const resp = await fetch(`/api/admin/intakes?${params.toString()}`, {
        credentials: 'include',
      });
      if (resp.status === 401) {
        setUnauth(true);
        return;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as {
        intakes: IntakeRow[];
        total_count: number;
      };
      setRows(data.intakes);
      setTotal(data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [firmId, status, outcome, includeTest]);

  useEffect(() => {
    void load();
  }, [load]);

  if (unauth) {
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
        <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">
          Intakes
        </h1>
        <p className="text-sm text-ink-500">
          Class-action intake sessions across every firm and listing.
          Preview (is_test) sessions are hidden by default.
        </p>
      </header>

      <fieldset className="mb-5 rounded-md border border-surface-200 bg-surface-100 p-3 sm:p-4">
        <legend className="sr-only">Filter intakes</legend>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-ink-700 font-medium">Firm</span>
            <select
              value={firmId}
              onChange={(e) => setFirmId(e.target.value)}
              className="rounded-md border border-surface-200 bg-white px-3 py-1.5 text-ink-900 max-w-[200px]"
            >
              <option value="">All</option>
              {firms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-ink-700 font-medium">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status | '')}
              className="rounded-md border border-surface-200 bg-white px-3 py-1.5 text-ink-900"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-ink-700 font-medium">Outcome</span>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as Outcome | '')}
              className="rounded-md border border-surface-200 bg-white px-3 py-1.5 text-ink-900"
            >
              <option value="">All</option>
              <option value="qualified">Qualified</option>
              <option value="disqualified">Disqualified</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeTest}
              onChange={(e) => setIncludeTest(e.target.checked)}
              className="w-4 h-4 rounded border-surface-200 text-accent-500 focus:ring-accent-500"
            />
            <span className="text-ink-700 font-medium">Include test sessions</span>
          </label>
          <span className="ml-auto text-xs text-ink-500 font-mono">
            {loading ? 'Loading…' : `${total} total`}
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
              <th className="px-3 py-2">Firm</th>
              <th className="px-3 py-2">Listing</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Outcome</th>
              <th className="px-3 py-2">Mode</th>
              <th className="px-3 py-2">Updated</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-ink-500">
                  No intakes match the current filters.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.sessionId} className="border-t border-surface-200">
                <td className="px-3 py-2 text-ink-900 font-medium">
                  <Link
                    to={`/admin/firms/${r.lawFirmId}`}
                    className="text-accent-500 hover:text-accent-600 underline underline-offset-2"
                  >
                    {r.lawFirmName}
                  </Link>
                </td>
                <td className="px-3 py-2 text-ink-700">
                  <Link
                    to={`/admin/listings/${r.listingId}`}
                    className="text-accent-500 hover:text-accent-600 underline underline-offset-2"
                  >
                    {r.listingTitle}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <StatusPill status={r.status} />
                </td>
                <td className="px-3 py-2">
                  <OutcomePill outcome={r.outcome} />
                </td>
                <td className="px-3 py-2">
                  {r.isTest && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-warning-50 text-warning-500">
                      test
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-ink-700 text-xs font-mono">
                  {r.updatedAt
                    ? new Date(r.updatedAt).toLocaleString()
                    : '—'}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <Link
                    to={`/admin/sessions/${r.sessionId}`}
                    className="text-accent-500 hover:text-accent-600 underline underline-offset-2"
                  >
                    View session
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusPill({ status }: { status: Status }) {
  const color =
    status === 'completed'
      ? 'bg-success-50 text-success-500'
      : status === 'active'
        ? 'bg-accent-50 text-accent-600'
        : 'bg-surface-200 text-ink-700';
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      {status}
    </span>
  );
}

function OutcomePill({ outcome }: { outcome: Outcome | null }) {
  if (outcome === null)
    return <span className="text-ink-500 italic text-xs">pending</span>;
  const color =
    outcome === 'qualified'
      ? 'bg-success-50 text-success-500'
      : 'bg-surface-200 text-ink-700';
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      {outcome}
    </span>
  );
}
