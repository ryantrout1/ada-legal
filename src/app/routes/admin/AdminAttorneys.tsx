/**
 * AdminAttorneys — admin list view of the attorney directory.
 *
 * Unlike the public /attorneys page which shows only approved rows,
 * this shows all statuses (pending, approved, rejected, archived)
 * with inline status filter + search + row actions.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

type Status = 'pending' | 'approved' | 'rejected' | 'archived';

interface AdminAttorney {
  id: string;
  name: string;
  firmName: string | null;
  locationCity: string | null;
  locationState: string | null;
  practiceAreas: string[];
  email: string | null;
  phone: string | null;
  websiteUrl: string | null;
  bio: string | null;
  photoUrl: string | null;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export default function AdminAttorneys() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminAttorney[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<Status | ''>('');
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
      if (search.trim()) params.set('search', search.trim());
      const resp = await fetch(`/api/admin/attorneys?${params.toString()}`, {
        credentials: 'include',
      });
      if (resp.status === 401) {
        setUnauth(true);
        return;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as { attorneys: AdminAttorney[]; total_count: number };
      setRows(data.attorneys);
      setTotal(data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 200);
    return () => clearTimeout(timer);
  }, [load]);

  async function handleArchive(id: string) {
    if (!window.confirm('Archive this attorney? They will be hidden from the public directory.')) {
      return;
    }
    try {
      const resp = await fetch(`/api/admin/attorneys/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archive failed');
    }
  }

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
            Attorneys
          </h1>
          <p className="text-sm text-ink-500">
            All statuses. Approved rows appear on the public directory.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/attorneys/new')}
          className="px-4 py-2 rounded-md bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors"
        >
          + Add attorney
        </button>
      </header>

      {/* Filters */}
      <fieldset className="mb-5 rounded-md border border-surface-200 bg-surface-100 p-3 sm:p-4">
        <legend className="sr-only">Filter attorneys</legend>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-ink-700 font-medium">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status | '')}
              className="rounded-md border border-surface-200 bg-white px-3 py-1.5 text-ink-900"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-ink-700 font-medium">Search</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or firm"
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
              <th className="px-3 py-2">Firm</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-ink-500">
                  No attorneys match the current filters.
                </td>
              </tr>
            )}
            {rows.map((a) => (
              <tr key={a.id} className="border-t border-surface-200">
                <td className="px-3 py-2 text-ink-900">{a.name}</td>
                <td className="px-3 py-2 text-ink-700">{a.firmName ?? '—'}</td>
                <td className="px-3 py-2 text-ink-700">
                  {a.locationCity && a.locationState
                    ? `${a.locationCity}, ${a.locationState}`
                    : a.locationState ?? a.locationCity ?? '—'}
                </td>
                <td className="px-3 py-2">
                  <StatusPill status={a.status} />
                </td>
                <td className="px-3 py-2 text-right space-x-3 whitespace-nowrap">
                  <Link
                    to={`/admin/attorneys/${a.id}`}
                    className="text-accent-500 hover:text-accent-600 underline underline-offset-2"
                  >
                    Edit
                  </Link>
                  {a.status !== 'archived' && (
                    <button
                      type="button"
                      onClick={() => handleArchive(a.id)}
                      className="text-danger-500 hover:text-danger-600 underline underline-offset-2"
                    >
                      Archive
                    </button>
                  )}
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
  const classes: Record<Status, string> = {
    pending: 'bg-warning-50 text-warning-500 border-warning-500',
    approved: 'bg-success-50 text-success-500 border-success-500',
    rejected: 'bg-danger-50 text-danger-500 border-danger-500',
    archived: 'bg-surface-100 text-ink-500 border-surface-200',
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
