/**
 * AdminFirmDetail — overview page for a single law firm.
 *
 * Shows the firm's basic info, its listings, and its subscriptions.
 * Per-listing "Start billing" (→ Stripe Checkout) appears when the
 * firm has a stripeCustomerId and the listing is not already tied to
 * an active subscription. "Manage billing" (→ Stripe Portal) appears
 * once the firm has a stripeCustomerId.
 *
 * The edit form lives at /admin/firms/:id/edit; this page has an
 * Edit button that routes there.
 *
 * Ref: Step 25, Commit 2.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

type Status = 'active' | 'suspended' | 'churned';
type ListingStatus = 'draft' | 'published' | 'archived';
type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid';

interface Firm {
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

interface Listing {
  id: string;
  lawFirmId: string;
  title: string;
  slug: string;
  category: string;
  status: ListingStatus;
  tier: string;
  shortDescription: string | null;
}

interface Subscription {
  id: string;
  lawFirmId: string;
  listingId: string | null;
  stripeSubscriptionId: string | null;
  tier: 'basic' | 'premium';
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface DetailResponse {
  firm: Firm;
  listings: Listing[];
  subscriptions: Subscription[];
}

export default function AdminFirmDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauth, setUnauth] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/admin/firms/${encodeURIComponent(id)}`, {
        credentials: 'include',
      });
      if (resp.status === 401) {
        setUnauth(true);
        return;
      }
      if (resp.status === 404) {
        setNotFound(true);
        return;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setData((await resp.json()) as DetailResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleStartBilling(listingId: string, tier: 'basic' | 'premium') {
    if (!id) return;
    const priceId = window.prompt(
      `Enter the Stripe Price id for the ${tier} tier.\n\n` +
        `You can find this in your Stripe Dashboard under Products → Pricing.\n` +
        `It looks like: price_1Abc2DeF3GhI4JkL`,
    );
    if (!priceId || !priceId.trim()) return;

    setActionPending(true);
    setActionError(null);
    try {
      const resp = await fetch('/api/stripe/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lawFirmId: id,
          listingId,
          tier,
          priceId: priceId.trim(),
        }),
      });
      if (!resp.ok) {
        const body = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${resp.status}`);
      }
      const { url } = (await resp.json()) as { url: string };
      // Full-page redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setActionPending(false);
    }
  }

  async function handleManageBilling() {
    if (!id) return;
    setActionPending(true);
    setActionError(null);
    try {
      const resp = await fetch('/api/stripe/portal', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lawFirmId: id }),
      });
      if (!resp.ok) {
        const body = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${resp.status}`);
      }
      const { url } = (await resp.json()) as { url: string };
      window.location.href = url;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Portal open failed');
    } finally {
      setActionPending(false);
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

  if (notFound) {
    return (
      <section>
        <Link
          to="/admin/firms"
          className="text-xs uppercase tracking-wider font-mono text-ink-500 hover:text-accent-600 underline underline-offset-2"
        >
          ← Firms
        </Link>
        <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mt-2 mb-6">
          Firm not found
        </h1>
        <p className="text-sm text-ink-700">
          The firm you&rsquo;re looking for doesn&rsquo;t exist, or belongs to a
          different organization.
        </p>
      </section>
    );
  }

  if (loading) return <p className="text-ink-500 italic">Loading…</p>;
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
      >
        {error}
      </div>
    );
  }
  if (!data) return null;

  const { firm, listings, subscriptions } = data;
  const hasStripeCustomer = Boolean(firm.stripeCustomerId);

  // Map listingId → active subscription (if any) for per-row billing state
  const activeSubByListing = new Map<string, Subscription>();
  for (const s of subscriptions) {
    if (s.status === 'active' || s.status === 'trialing') {
      if (s.listingId) activeSubByListing.set(s.listingId, s);
    }
  }

  return (
    <section>
      <Link
        to="/admin/firms"
        className="text-xs uppercase tracking-wider font-mono text-ink-500 hover:text-accent-600 underline underline-offset-2"
      >
        ← Firms
      </Link>

      {/* Firm header card */}
      <header className="mt-2 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-2">
              {firm.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <StatusPill status={firm.status} />
              <ModePill isPilot={firm.isPilot} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/admin/firms/${firm.id}/edit`}
              className="px-4 py-2 rounded-md border border-surface-200 text-ink-700 text-sm font-medium hover:bg-surface-100"
            >
              Edit
            </Link>
            {hasStripeCustomer && (
              <button
                type="button"
                onClick={handleManageBilling}
                disabled={actionPending}
                className="px-4 py-2 rounded-md bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 disabled:opacity-50 transition-colors"
              >
                Manage billing
              </button>
            )}
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <InfoRow label="Primary contact" value={firm.primaryContact ?? '—'} />
          <InfoRow label="Email" value={firm.email ?? '—'} />
          <InfoRow label="Phone" value={firm.phone ?? '—'} />
          <InfoRow
            label="Stripe customer"
            value={firm.stripeCustomerId ?? '—'}
            mono
          />
        </dl>

        {!hasStripeCustomer && !firm.isPilot && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-warning-500 bg-warning-50 px-4 py-3 text-sm text-warning-500"
          >
            This firm has no Stripe customer id and is not in pilot mode. Its
            listings will not surface to users. Either flip pilot mode on or add
            a Stripe customer id and start a subscription.
          </div>
        )}
      </header>

      {actionError && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {actionError}
        </div>
      )}

      {/* Listings section */}
      <section className="mb-8">
        <h2 className="font-display text-lg text-ink-900 mb-3">
          Listings{' '}
          <span className="text-ink-500 font-mono text-xs font-normal">
            {listings.length}
          </span>
        </h2>
        {listings.length === 0 ? (
          <p className="text-sm text-ink-500 italic">
            No listings for this firm yet. Create one from the Listings section
            (coming soon).
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-surface-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-surface-100 text-left text-xs uppercase tracking-wider font-mono text-ink-500">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Slug</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Tier</th>
                  <th className="px-3 py-2">Billing</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => {
                  const activeSub = activeSubByListing.get(l.id);
                  return (
                    <tr key={l.id} className="border-t border-surface-200">
                      <td className="px-3 py-2 text-ink-900 font-medium">
                        {l.title}
                      </td>
                      <td className="px-3 py-2 text-ink-700 font-mono text-xs">
                        {l.slug}
                      </td>
                      <td className="px-3 py-2">
                        <ListingStatusPill status={l.status} />
                      </td>
                      <td className="px-3 py-2 text-ink-700">{l.tier}</td>
                      <td className="px-3 py-2 text-ink-700">
                        {firm.isPilot ? (
                          <span className="text-ink-500 italic">
                            Pilot (free)
                          </span>
                        ) : activeSub ? (
                          <span className="text-success-500 font-medium">
                            {activeSub.status}
                          </span>
                        ) : (
                          <span className="text-ink-500 italic">None</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {!firm.isPilot && !activeSub && hasStripeCustomer && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStartBilling(
                                l.id,
                                l.tier === 'premium' ? 'premium' : 'basic',
                              )
                            }
                            disabled={actionPending}
                            className="text-accent-500 hover:text-accent-600 underline underline-offset-2 disabled:opacity-50"
                          >
                            Start billing
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Subscriptions section */}
      <section>
        <h2 className="font-display text-lg text-ink-900 mb-3">
          Subscriptions{' '}
          <span className="text-ink-500 font-mono text-xs font-normal">
            {subscriptions.length}
          </span>
        </h2>
        {subscriptions.length === 0 ? (
          <p className="text-sm text-ink-500 italic">
            No Stripe subscriptions recorded for this firm.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-surface-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-surface-100 text-left text-xs uppercase tracking-wider font-mono text-ink-500">
                <tr>
                  <th className="px-3 py-2">Stripe sub</th>
                  <th className="px-3 py-2">Tier</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Period ends</th>
                  <th className="px-3 py-2">Cancels at period end?</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr key={s.id} className="border-t border-surface-200">
                    <td className="px-3 py-2 text-ink-700 font-mono text-xs">
                      {s.stripeSubscriptionId ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-ink-700">{s.tier}</td>
                    <td className="px-3 py-2">
                      <SubStatusPill status={s.status} />
                    </td>
                    <td className="px-3 py-2 text-ink-700">
                      {s.currentPeriodEnd
                        ? new Date(s.currentPeriodEnd).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-ink-700">
                      {s.cancelAtPeriodEnd ? 'Yes' : 'No'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <dt className="text-ink-500 font-medium min-w-[120px]">{label}</dt>
      <dd className={`text-ink-900 ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </dd>
    </div>
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

function ListingStatusPill({ status }: { status: ListingStatus }) {
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

function SubStatusPill({ status }: { status: SubscriptionStatus }) {
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
