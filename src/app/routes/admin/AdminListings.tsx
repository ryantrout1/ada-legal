/**
 * AdminListings — admin list view of all listings across all firms.
 *
 * Filters: firm (dropdown), status, category, search on title/slug.
 * Each row links to the edit form (there is no detail page for
 * listings yet — the edit form carries all the info we need).
 *
 * Ref: Step 25, Commit 3.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

type Status = 'draft' | 'published' | 'archived';

interface AdminListing {
  id: string;
  lawFirmId: string;
  title: string;
  slug: string;
  category: string;
  status: Status;
  tier: string;
  shortDescription: string | null;
}

interface FirmOption {
  id: string;
  name: string;
}

export default function AdminListings() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<AdminListing[]>([]);
  const [total, setTotal] = useState(0);
  const [firms, setFirms] = useState<FirmOption[]>([]);
  const [firmId, setFirmId] = useState('');
  const [status, setStatus] = useState<Status | ''>('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauth, setUnauth] = useState(false);

  // Load firm options once. The list is small (pilot-era).
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
        // Non-fatal; filter stays empty
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
      if (category) params.set('category', category);
      if (search.trim()) params.set('search', search.trim());
      const resp = await fetch(`/api/admin/listings?${params.toString()}`, {
        credentials: 'include',
      });
      if (resp.status === 401) {
        setUnauth(true);
        return;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as {
        listings: AdminListing[];
        total_count: number;
      };
      setRows(data.listings);
      setTotal(data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [firmId, status, category, search]);

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

  const firmNameById = new Map(firms.map((f) => [f.id, f.name]));

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">
            Listings
          </h1>
          <p className="text-sm text-ink-500">
            Class-action listings across all firms. Drafts are visible here but
            hidden from users.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/listings/new')}
          className="px-4 py-2 rounded-md bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors"
        >
          + Add listing
        </button>
      </header>

      {/* Filters */}
      <fieldset className="mb-5 rounded-md border border-surface-200 bg-surface-100 p-3 sm:p-4">
        <legend className="sr-only">Filter listings</legend>
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
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-ink-700 font-medium">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-md border border-surface-200 bg-white px-3 py-1.5 text-ink-900"
            >
              <option value="">All</option>
              <option value="ada_title_i">Title I (employment)</option>
              <option value="ada_title_ii">Title II (gov)</option>
              <option value="ada_title_iii">Title III (public)</option>
            </select>
          </label>

          <label className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-ink-700 font-medium">Search</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title or slug"
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
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Firm</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-ink-500">
                  No listings match the current filters.
                </td>
              </tr>
            )}
            {rows.map((l) => (
              <tr key={l.id} className="border-t border-surface-200">
                <td className="px-3 py-2 text-ink-900 font-medium">{l.title}</td>
                <td className="px-3 py-2 text-ink-700 font-mono text-xs">{l.slug}</td>
                <td className="px-3 py-2 text-ink-700">
                  <Link
                    to={`/admin/firms/${l.lawFirmId}`}
                    className="text-accent-500 hover:text-accent-600 underline underline-offset-2"
                  >
                    {firmNameById.get(l.lawFirmId) ?? l.lawFirmId.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-3 py-2 text-ink-700 font-mono text-xs">
                  {l.category}
                </td>
                <td className="px-3 py-2">
                  <StatusPill status={l.status} />
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <Link
                    to={`/admin/listings/${l.id}`}
                    className="text-accent-500 hover:text-accent-600 underline underline-offset-2"
                  >
                    Edit
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
    status === 'published'
      ? 'bg-success-50 text-success-500'
      : status === 'draft'
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
