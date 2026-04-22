/**
 * AdminSubscriptions — global read-only list of Stripe subscriptions.
 *
 * The subscription lifecycle is owned by Stripe (checkout + portal +
 * webhook). This page is a window into that state, not a CRUD surface.
 * Filters by firm, status, tier.
 *
 * Ref: Step 25, Commit 6.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type Status = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
type Tier = 'basic' | 'premium';

interface SubscriptionRow {
  id: string;
  lawFirmId: string;
  listingId: string | null;
  stripeSubscriptionId: string | null;
  tier: Tier;
  status: Status;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt?: string;
}

interface AdminListRow {
  subscription: SubscriptionRow;
  lawFirmName: string;
  listingTitle: string | null;
}

interface FirmOption {
  id: string;
  name: string;
}

export default function AdminSubscriptions() {
  const [rows, setRows] = useState<AdminListRow[]>([]);
  const [total, setTotal] = useState(0);
  const [firms, setFirms] = useState<FirmOption[]>([]);
  const [firmId, setFirmId] = useState('');
  const [status, setStatus] = useState<Status | ''>('');
  const [tier, setTier] = useState<Tier | ''>('');
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
      if (tier) params.set('tier', tier);
      const resp = await fetch(`/api/admin/subscriptions?${params.toString()}`, {
        credentials: 'include',
      });
      if (resp.status === 401) {
        setUnauth(true);
        return;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as {
        subscriptions: AdminListRow[];
        total_count: number;
      };
      setRows(data.subscriptions);
      setTotal(data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [firmId, status, tier]);

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
          Subscriptions
        </h1>
        <p className="text-sm text-ink-500">
          All Stripe subscriptions across firms in this organization.
          Read-only; manage billing from the firm detail page.
        </p>
      </header>

      <fieldset className="mb-5 rounded-md border border-surface-200 bg-surface-100 p-3 sm:p-4">
        <legend className="sr-only">Filter subscriptions</legend>
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
              <option value="trialing">Trialing</option>
              <option value="past_due">Past due</option>
              <option value="canceled">Canceled</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-ink-700 font-medium">Tier</span>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as Tier | '')}
              className="rounded-md border border-surface-200 bg-white px-3 py-1.5 text-ink-900"
            >
              <option value="">All</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
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
              <th className="px-3 py-2">Stripe id</th>
              <th className="px-3 py-2">Tier</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Period ends</th>
              <th className="px-3 py-2">Cancels at period end?</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-ink-500">
                  No subscriptions match the current filters.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.subscription.id} className="border-t border-surface-200">
                <td className="px-3 py-2 text-ink-900 font-medium">
                  <Link
                    to={`/admin/firms/${r.subscription.lawFirmId}`}
                    className="text-accent-500 hover:text-accent-600 underline underline-offset-2"
                  >
                    {r.lawFirmName}
                  </Link>
                </td>
                <td className="px-3 py-2 text-ink-700">
                  {r.listingTitle ? (
                    <Link
                      to={`/admin/listings/${r.subscription.listingId}`}
                      className="text-accent-500 hover:text-accent-600 underline underline-offset-2"
                    >
                      {r.listingTitle}
                    </Link>
                  ) : (
                    <span className="italic text-ink-500">firm-wide</span>
                  )}
                </td>
                <td className="px-3 py-2 text-ink-700 font-mono text-xs">
                  {r.subscription.stripeSubscriptionId ?? '—'}
                </td>
                <td className="px-3 py-2 text-ink-700">{r.subscription.tier}</td>
                <td className="px-3 py-2">
                  <StatusPill status={r.subscription.status} />
                </td>
                <td className="px-3 py-2 text-ink-700">
                  {r.subscription.currentPeriodEnd
                    ? new Date(r.subscription.currentPeriodEnd).toLocaleDateString()
                    : '—'}
                </td>
                <td className="px-3 py-2 text-ink-700">
                  {r.subscription.cancelAtPeriodEnd ? 'Yes' : 'No'}
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
  const active = status === 'active' || status === 'trialing';
  const color = active
    ? 'bg-success-50 text-success-500'
    : status === 'past_due' || status === 'unpaid'
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
