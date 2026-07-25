/**
 * AdminDashboard — six at-a-glance counts.
 *
 * Adopted from Base44's AdminDashboard (@ 6b1e9ac), which Gina lands on
 * every session. Counts come from one /api/admin/dashboard round trip
 * rather than six parallel fetches — this is the landing page, and six
 * sequential spinners is a poor first impression for the person who
 * uses the tool most.
 *
 * Every tile links somewhere. A count with no destination is trivia;
 * the point of the number is to get to the rows behind it.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Counts {
  sessions?: number;
  intakes?: number;
  cases_unplaced?: number;
  firms?: number;
  attorneys?: number;
  feedback_new?: number;
  listings_published?: number;
  litigation_active?: number;
}

/**
 * `to` is optional. Every tile that CAN link does — a count with no
 * destination is trivia, and the point of the number is to get to the
 * rows behind it. But litigation_listings has no admin page on this
 * side yet, and pointing that tile at /admin/listings would send you to
 * a different table entirely. A tile whose number disagrees with the
 * page it opens is the exact defect Phase 1 removed; a linkless tile is
 * merely less useful. Base44 renders its Active-listings, Active-firms
 * and Active-litigation tiles without drill-downs for the same reason.
 */
const TILES: { key: keyof Counts; label: string; to?: string; hint: string }[] = [
  { key: 'sessions', label: 'Ada sessions', to: '/admin/sessions', hint: 'Last 30 days, real only' },
  { key: 'intakes', label: 'Intakes', to: '/admin/intakes', hint: 'Class action intakes' },
  { key: 'cases_unplaced', label: 'Awaiting placement', to: '/admin/cases', hint: 'No firm assigned yet' },
  { key: 'firms', label: 'Firms', to: '/admin/firms', hint: 'In the directory' },
  { key: 'attorneys', label: 'Approved attorneys', to: '/admin/attorneys', hint: 'Publicly listed' },
  { key: 'listings_published', label: 'Active listings', to: '/admin/listings', hint: 'Published' },
  { key: 'litigation_active', label: 'Active litigation', hint: 'Class + mass' },
  { key: 'feedback_new', label: 'Feedback', to: '/admin/feedback', hint: 'Last 30 days' },
];

interface SpotSummary {
  free_reads?: number;
  free_with_email?: number;
  abandoned_checkout?: number;
  paid?: number;
  uploaded?: number;
  refunded?: number;
  paid_no_email?: number;
  awaiting_review?: number;
  released_unsent?: number;
  delivered?: number;
  gross_cents?: number;
}

const SPOT_STAGES: { key: keyof SpotSummary; label: string }[] = [
  { key: 'free_reads', label: 'Free reads' },
  { key: 'abandoned_checkout', label: 'Left at checkout' },
  { key: 'paid', label: 'Paid' },
  { key: 'uploaded', label: 'Photos in' },
  { key: 'awaiting_review', label: 'In review' },
  { key: 'delivered', label: 'Delivered' },
];

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [spot, setSpot] = useState<SpotSummary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch('/api/admin/dashboard', { credentials: 'include' });
        if (!resp.ok) throw new Error(String(resp.status));
        const body = (await resp.json()) as { counts?: Counts };
        if (!cancelled) setCounts(body.counts ?? {});
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Separate request rather than folding Spot into /api/admin/dashboard:
  // a slow or failing Spot query must not blank the counts everyone else
  // uses, and the same endpoint backs the Spot page in Phase 2.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch('/api/admin/spot/summary', { credentials: 'include' });
        if (!resp.ok) throw new Error(String(resp.status));
        const body = (await resp.json()) as { summary?: SpotSummary };
        if (!cancelled) setSpot(body.summary ?? {});
      } catch {
        if (!cancelled) setSpot({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 mb-1">Dashboard</h1>
      <p className="text-ink-700 text-sm mb-6">Where things stand right now.</p>

      {error && (
        <div role="alert" className="rounded-md border border-surface-200 bg-white p-4 text-sm text-ink-700">
          Couldn&rsquo;t load the counts. The pages themselves are still fine — use the
          sidebar.
        </div>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
        {TILES.map((tile) => {
          const value = counts?.[tile.key];
          const cardClass =
            'flex flex-col justify-between min-h-[112px] rounded-lg border border-surface-200 bg-white p-4';
          const body = (
            <>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-500">
                {tile.label}
              </span>
              <span className="font-display text-3xl text-ink-900 leading-none my-2">
                {/* An em dash while loading, never a zero — a fake zero
                    reads as real data and would be believed. */}
                {counts === null ? '—' : (value ?? 0).toLocaleString()}
              </span>
              <span className="text-xs text-ink-500">{tile.hint}</span>
            </>
          );

          return (
            <li key={tile.key}>
              {tile.to ? (
                <Link
                  to={tile.to}
                  className={`${cardClass} hover:border-accent-600 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-accent-600 transition-colors`}
                >
                  {body}
                </Link>
              ) : (
                <div className={cardClass}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Spot — the only product currently taking money, and until now the
          only one with no admin surface at all. Shown as a funnel rather
          than loose tiles because the interesting facts are the drops
          between stages: reads that never pay, purchases with no address to
          send to, and reports sitting in review undelivered.

          Two figures here are deliberately not what they look like:
          `paid` counts paid_at rather than status, so a refund does not stay
          in the paid column; `delivered` counts spot_report.sent_at rather
          than session status, because a session reaches `delivered` when the
          reviewer decides and the mail may never have left. See the endpoint
          for the full reasoning. */}
      <section className="mt-10" aria-labelledby="spot-funnel-h">
        <h2 id="spot-funnel-h" className="font-display text-xl text-ink-900">
          Spot
        </h2>
        <p className="mt-1 text-sm text-ink-700">
          Free reads through to delivered reports.
        </p>

        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 list-none p-0">
          {SPOT_STAGES.map((stage) => (
            <li
              key={stage.key}
              className="rounded-lg border border-surface-200 bg-white p-3"
            >
              <span className="block font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-500">
                {stage.label}
              </span>
              <span className="mt-1 block font-display text-2xl leading-none text-ink-900">
                {spot === null ? '—' : (spot[stage.key] ?? 0).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>

        {/* Only rendered when non-zero. These are not statistics, they are
            work items: a purchase with no address cannot be fulfilled, and a
            report in review has been paid for and not sent. A zero here
            should be silence, not a green tick nobody reads. */}
        <ul className="mt-3 space-y-2 list-none p-0">
          {spot?.awaiting_review ? (
            <li className="rounded-md border border-warning-500 bg-white p-3 text-sm text-ink-900">
              <strong>{spot.awaiting_review}</strong>{' '}
              {spot.awaiting_review === 1 ? 'report is' : 'reports are'} waiting for review. Paid
              for, not sent.{' '}
              <a className="underline underline-offset-2 text-accent-600" href="/spot-review">
                Open Spot review
              </a>
            </li>
          ) : null}
          {spot?.paid_no_email ? (
            <li className="rounded-md border border-warning-500 bg-white p-3 text-sm text-ink-900">
              <strong>{spot.paid_no_email}</strong>{' '}
              {spot.paid_no_email === 1 ? 'purchase has' : 'purchases have'} no email address on
              file. Those reports cannot be delivered until someone finds an address.
            </li>
          ) : null}
          {spot?.released_unsent ? (
            <li className="rounded-md border border-warning-500 bg-white p-3 text-sm text-ink-900">
              <strong>{spot.released_unsent}</strong> released{' '}
              {spot.released_unsent === 1 ? 'report' : 'reports'} never emailed.{' '}
              <a className="underline underline-offset-2 text-accent-600" href="/spot-review">
                Resend from Spot review
              </a>
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
