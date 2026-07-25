/**
 * AdminSpot — the Spot funnel and the sessions behind it.
 *
 * Spot was the only product taking money with no admin surface. The funnel
 * lived briefly on the dashboard; it belongs here, where the numbers can be
 * clicked through to the rows that produced them.
 *
 * The dashboard keeps only the callouts — "4 reports waiting" is something
 * you should be told without going looking. The detail is here.
 *
 * Two column definitions carry the same warnings as the summary endpoint:
 * `Paid` reflects paid_at rather than status (so refunds leave the column),
 * and `Delivery` reflects spot_report.sent_at rather than session status (so
 * a report the reviewer approved but nobody received reads as unsent, not
 * delivered).
 *
 * Ref: /plan Spot admin, Phase 2.
 */

import { useEffect, useState } from 'react';

interface Summary {
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

interface SessionRow {
  id: string;
  status: string;
  buyer_email: string | null;
  amount_cents: number | null;
  photo_count: number | null;
  created_at: string;
  paid_at: string | null;
  report_slug: string | null;
  report_status: string | null;
  delivery: 'sent' | 'unsent' | 'no_email' | 'in_review' | 'none';
}

const STAGES: { key: keyof Summary; label: string }[] = [
  { key: 'free_reads', label: 'Free reads' },
  { key: 'abandoned_checkout', label: 'Left at checkout' },
  { key: 'paid', label: 'Paid' },
  { key: 'uploaded', label: 'Photos in' },
  { key: 'awaiting_review', label: 'In review' },
  { key: 'delivered', label: 'Delivered' },
];

const FILTERS = ['all', 'pending_payment', 'paid', 'uploaded', 'in_review', 'delivered', 'refunded'];

/** Plain words. "in_review" is a database value, not something to read. */
const DELIVERY_LABEL: Record<SessionRow['delivery'], string> = {
  sent: 'Emailed',
  unsent: 'Released, not emailed',
  no_email: 'No email on file',
  in_review: 'Waiting for review',
  none: 'No report yet',
};

/**
 * Delivery states in which a report has been released, and therefore has a
 * public readout to link to. `in_review` deliberately is not one: that
 * readout 404s.
 */
const RELEASED = new Set<SessionRow['delivery']>(['sent', 'unsent']);

/** Only the two that need action are marked. Everything else stays quiet. */
const NEEDS_ATTENTION = new Set<SessionRow['delivery']>(['no_email', 'unsent']);

/**
 * Money actually received — not the price on the session.
 *
 * amount_cents is written when the checkout session is created, before any
 * money moves, so a `pending_payment` row carries $79.00 while nothing has
 * been collected. Rendering that under "Amount" made the table disagree with
 * the gross figure directly above it, which correctly counts only captured
 * payments. Same class of error as a count that is populated and means
 * something other than its label.
 *
 * Unpaid rows show nothing rather than a struck-through price: this column
 * answers "what came in", and for those rows the answer is nothing.
 */
function money(cents: number | null, paidAt: string | null): string {
  if (!paidAt) return '—';
  if (cents === null || cents === undefined) return '—';
  return `$${(cents / 100).toFixed(2)}`;
}

function when(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AdminSpot() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch('/api/admin/spot/summary', { credentials: 'include' });
        if (!resp.ok) throw new Error(String(resp.status));
        const body = (await resp.json()) as { summary?: Summary };
        if (!cancelled) setSummary(body.summary ?? {});
      } catch {
        if (!cancelled) setSummary({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setSessions(null);
    (async () => {
      try {
        const qs = filter === 'all' ? '' : `?status=${encodeURIComponent(filter)}`;
        const resp = await fetch(`/api/admin/spot/sessions${qs}`, { credentials: 'include' });
        if (!resp.ok) throw new Error(String(resp.status));
        const body = (await resp.json()) as { sessions?: SessionRow[] };
        if (!cancelled) setSessions(body.sessions ?? []);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl text-ink-900">Spot</h1>
        <p className="mt-1 text-sm text-ink-700">
          Free reads through to delivered reports.{' '}
          <a className="underline underline-offset-2 text-accent-600" href="/admin/spot-review">
            Report review
          </a>
        </p>
      </header>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 list-none p-0 m-0">
        {STAGES.map((stage) => (
          <li key={stage.key} className="rounded-lg border border-surface-200 bg-white p-3">
            <span className="block font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-500">
              {stage.label}
            </span>
            <span className="mt-1 block font-display text-2xl leading-none text-ink-900">
              {summary === null ? '—' : (summary[stage.key] ?? 0).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>

      {summary?.gross_cents ? (
        <p className="mt-3 text-sm text-ink-700">
          {`$${((summary.gross_cents ?? 0) / 100).toFixed(2)}`} collected across{' '}
          {summary.paid ?? 0} purchases.
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={
              'min-h-[44px] rounded-md border px-3 py-1 text-sm ' +
              (filter === f
                ? 'border-accent-600 bg-accent-50 text-accent-600 font-semibold'
                : 'border-control-border text-ink-700')
            }
          >
            {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-6 text-sm text-ink-700" role="alert">
          Could not load Spot sessions.
        </p>
      ) : null}

      {sessions === null && !error ? (
        <p className="mt-6 text-sm text-ink-700">Loading…</p>
      ) : null}

      {sessions && sessions.length === 0 ? (
        <p className="mt-6 text-sm text-ink-700">No sessions with that status.</p>
      ) : null}

      {sessions && sessions.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Spot sessions, newest first, showing buyer, amount and delivery state
            </caption>
            <thead>
              <tr className="text-left">
                <th scope="col" className="border-b border-surface-200 py-2 pr-4 font-semibold">
                  Buyer
                </th>
                <th scope="col" className="border-b border-surface-200 py-2 pr-4 font-semibold">
                  Status
                </th>
                <th scope="col" className="border-b border-surface-200 py-2 pr-4 font-semibold">
                  Delivery
                </th>
                <th scope="col" className="border-b border-surface-200 py-2 pr-4 font-semibold">
                  Photos
                </th>
                <th scope="col" className="border-b border-surface-200 py-2 pr-4 font-semibold">
                  Amount
                </th>
                <th scope="col" className="border-b border-surface-200 py-2 pr-4 font-semibold">
                  Paid
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td className="border-b border-surface-200 py-2 pr-4">
                    {s.buyer_email ?? <span className="text-ink-500">No email on file</span>}
                  </td>
                  <td className="border-b border-surface-200 py-2 pr-4">
                    {s.status.replace(/_/g, ' ')}
                  </td>
                  <td className="border-b border-surface-200 py-2 pr-4">
                    {/* Colour is never the only signal: the word says it too. */}
                    <span
                      className={
                        NEEDS_ATTENTION.has(s.delivery) ? 'font-semibold text-warning-500' : ''
                      }
                    >
                      {DELIVERY_LABEL[s.delivery]}
                    </span>
                    {/* The public readout serves RELEASED reports only —
                        pending and rejected drafts 404 by design, so nothing
                        leaks. Linking it on an unreleased row sent the admin
                        to "Report not available", which reads as a broken
                        report rather than one that has not been approved yet.
                        Unreleased rows link to the place the work happens
                        instead. */}
                    {s.report_slug && RELEASED.has(s.delivery) ? (
                      <>
                        {' '}
                        <a
                          className="underline underline-offset-2 text-accent-600"
                          href={`/spot/r/${encodeURIComponent(s.report_slug)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          readout
                        </a>
                      </>
                    ) : null}
                    {s.report_slug && s.delivery === 'in_review' ? (
                      <>
                        {' '}
                        <a className="underline underline-offset-2 text-accent-600" href="/admin/spot-review">
                          review
                        </a>
                      </>
                    ) : null}
                  </td>
                  <td className="border-b border-surface-200 py-2 pr-4">{s.photo_count ?? '—'}</td>
                  <td className="border-b border-surface-200 py-2 pr-4">
                    {money(s.amount_cents, s.paid_at)}
                  </td>
                  <td className="border-b border-surface-200 py-2 pr-4">{when(s.paid_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
