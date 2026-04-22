/**
 * AdminFirms — admin list view of law firms.
 *
 * Shows every firm in the org with filters for status and pilot flag,
 * plus a name/contact search. Each row links to the edit page.
 *
 * Ref: Step 25, Commit 1.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

type Status = 'active' | 'suspended' | 'churned';
type PilotFilter = '' | 'true' | 'false';

interface AdminFirm {
  id: string;
  name: string;
  primaryContact: string | null;
  email: string | null;
  phone: string | null;
  stripeCustomerId: string | null;
  status: Status;
  isPilot: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminFirms() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminFirm[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<Status | ''>('');
  const [pilot, setPilot] = useState<PilotFilter>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauth, setUnauth] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (pilot) params.set('is_pilot', pilot);
      if (search.trim()) params.set('search', search.trim());
      const resp = await fetch(`/api/admin/firms?${params.toString()}`, {
        credentials: 'include',
      });
      if (resp.status === 401) {
        setUnauth(true);
        return;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as { firms: AdminFirm[]; total_count: number };
      setRows(data.firms);
      setTotal(data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [status, pilot, search]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 200);
    return () => clearTimeout(timer);
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
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">
            Firms
          </h1>
          <p className="text-sm text-ink-500">
            Law firms that host class-action listings on the platform.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/firms/new')}
          className="px-4 py-2 rounded-md bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors"
        >
          + Add firm
        </button>
      </header>

      {/* Filters */}
      <fieldset className="mb-5 rounded-md border border-surface-200 bg-surface-100 p-3 sm:p-4">
        <legend className="sr-only">Filter firms</legend>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-ink-700 font-medium">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status | '')}
              className="rounded-md border border-surface-200 bg-white px-3 py-1.5 text-ink-900"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="churned">Churned</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-ink-700 font-medium">Mode</span>
            <select
              value={pilot}
              onChange={(e) => setPilot(e.target.value as PilotFilter)}
              className="rounded-md border border-surface-200 bg-white px-3 py-1.5 text-ink-900"
            >
              <option value="">All</option>
              <option value="true">Pilot</option>
              <option value="false">Paid</option>
            </select>
          </label>

          <label className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-ink-700 font-medium">Search</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or contact"
              className="flex-1 rounded-md border border-surface-200 bg-white px-3 py-1.5 text-ink-900 placeholder-ink-500"
            />
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
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Primary contact</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Mode</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-ink-500">
                  No firms match the current filters.
                </td>
              </tr>
            )}
            {rows.map((f) => (
              <tr key={f.id} className="border-t border-surface-200">
                <td className="px-3 py-2 text-ink-900 font-medium">{f.name}</td>
                <td className="px-3 py-2 text-ink-700">{f.primaryContact ?? '—'}</td>
                <td className="px-3 py-2 text-ink-700">{f.email ?? '—'}</td>
                <td className="px-3 py-2">
                  <ModePill isPilot={f.isPilot} />
                </td>
                <td className="px-3 py-2">
                  <StatusPill status={f.status} />
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <Link
                    to={`/admin/firms/${f.id}`}
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
    </section>
  );
}

function StatusPill({ status }: { status: Status }) {
  const color =
    status === 'active'
      ? 'bg-success-50 text-success-500'
      : status === 'suspended'
        ? 'bg-warning-50 text-warning-500'
        : 'bg-surface-200 text-ink-700';
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      {status}
    </span>
  );
}

function ModePill({ isPilot }: { isPilot: boolean }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
        isPilot
          ? 'bg-accent-50 text-accent-600'
          : 'bg-surface-200 text-ink-700'
      }`}
    >
      {isPilot ? 'Pilot' : 'Paid'}
    </span>
  );
}
