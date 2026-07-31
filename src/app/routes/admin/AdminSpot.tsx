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

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
  buyer_name: string | null;
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

interface FreeRead {
  id: string;
  created_at?: string;
  createdAt?: string;
  photoCount?: number;
  modelVersion?: string | null;
  email?: string | null;
  findingCount?: number;
  overallRisk?: string | null;
}

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
 * money moves, so a `pending_payment` row carries $99.00 while nothing has
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
  const navigate = useNavigate();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(false);
  /**
   * Free reads are a separate record, not a cheaper session — no buyer, no
   * payment, no report. Since photo retention was turned on they do keep the
   * uploaded photo (for training), but they still share almost no columns with
   * paid sessions, so they get their own table on the same page.
   */
  const [tab, setTab] = useState<'paid' | 'free'>('paid');
  const [reads, setReads] = useState<FreeRead[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const loadReads = useCallback(async () => {
    try {
      const resp = await fetch('/api/admin/spot/reads', { credentials: 'include' });
      if (!resp.ok) throw new Error(String(resp.status));
      const body = (await resp.json()) as { reads?: FreeRead[] };
      setReads(body.reads ?? []);
    } catch {
      setReads([]);
    }
  }, []);

  useEffect(() => {
    if (tab === 'free' && reads === null) void loadReads();
  }, [tab, reads, loadReads]);

  /** One row at a time, with a confirm — this is a hard delete of paid data. */
  const remove = async (kind: 'paid' | 'free', id: string) => {
    const what = kind === 'paid' ? 'purchase' : 'free read';
    if (!window.confirm(`Delete this ${what} and its photos? This cannot be undone.`)) return;
    setBusyId(id);
    try {
      const path = kind === 'paid' ? 'sessions' : 'reads';
      const resp = await fetch(`/api/admin/spot/${path}?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!resp.ok) {
        window.alert('Could not delete. Try again.');
        return;
      }
      if (kind === 'paid') setSessions((prev) => prev?.filter((s) => s.id !== id) ?? null);
      else setReads((prev) => prev?.filter((r) => r.id !== id) ?? null);
    } finally {
      setBusyId(null);
    }
  };

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

      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Show paid purchases or free reads">
        {(['paid', 'free'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={
              'min-h-[44px] rounded-md border px-4 py-1 text-sm ' +
              (tab === t
                ? 'border-accent-600 bg-accent-50 text-accent-600 font-semibold'
                : 'border-control-border text-ink-700')
            }
          >
            {t === 'paid' ? 'Purchases' : 'Free reads'}
          </button>
        ))}
      </div>

      {tab === 'paid' && (
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
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

      )}

      {error ? (
        <p className="mt-6 text-sm text-ink-700" role="alert">
          Could not load Spot sessions.
        </p>
      ) : null}

      {tab === 'paid' && sessions === null && !error ? (
        <p className="mt-6 text-sm text-ink-700">Loading…</p>
      ) : null}

      {tab === 'paid' && sessions && sessions.length === 0 ? (
        <p className="mt-6 text-sm text-ink-700">No sessions with that status.</p>
      ) : null}

      {tab === 'paid' && sessions && sessions.length > 0 ? (
        <div className="mt-6 overflow-x-auto rounded-md border border-surface-200 bg-white">
          <table className="w-full text-sm">
            <caption className="sr-only">
              Spot sessions, newest first, showing buyer, amount and delivery state
            </caption>
            <thead className="bg-surface-100 text-left text-xs uppercase tracking-wider font-mono text-ink-500">
              <tr>
                <th scope="col" className="px-3 py-2">Buyer</th>
                <th scope="col" className="px-3 py-2">Status</th>
                <th scope="col" className="px-3 py-2">Delivery</th>
                <th scope="col" className="px-3 py-2">Photos</th>
                <th scope="col" className="px-3 py-2">Amount</th>
                <th scope="col" className="px-3 py-2">Paid</th>
                <th scope="col" className="px-3 py-2">
                  <span className="sr-only">Delete</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-t border-surface-200 hover:bg-surface-100">
                  <td className="px-3 py-2">
                    {s.buyer_name || s.buyer_email ? (
                      <span>
                        {s.buyer_name ? <span className="text-ink-900">{s.buyer_name}</span> : null}
                        {s.buyer_name && s.buyer_email ? ' ' : null}
                        {s.buyer_email ? <span className="text-ink-500">{s.buyer_email}</span> : null}
                      </span>
                    ) : (
                      <span className="text-ink-500">No buyer on file</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <SpotStatusBadge status={s.status} />
                  </td>
                  <td className="px-3 py-2">
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
                  <td className="px-3 py-2">{s.photo_count ?? '—'}</td>
                  <td className="px-3 py-2">{money(s.amount_cents, s.paid_at)}</td>
                  <td className="px-3 py-2 font-mono text-xs text-ink-700">{when(s.paid_at)}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      disabled={busyId === s.id}
                      onClick={() => void remove('paid', s.id)}
                      className="min-h-[44px] text-sm text-warning-500 underline disabled:opacity-50"
                    >
                      {busyId === s.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'free' && reads === null ? (
        <p className="mt-6 text-sm text-ink-700">Loading…</p>
      ) : null}

      {tab === 'free' && reads && reads.length === 0 ? (
        <p className="mt-6 text-sm text-ink-700">No free reads yet.</p>
      ) : null}

      {tab === 'free' && reads && reads.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <p className="mb-3 text-sm text-ink-700">
            What Spot told someone who never paid. The analysis is kept, and — for
            reads taken since photo retention was turned on — the photo too, for
            90 days. Older reads have no photo.
          </p>
          <table className="w-full text-sm">
            <caption className="sr-only">Free Spot reads, newest first</caption>
            <thead className="bg-surface-100 text-left text-xs uppercase tracking-wider font-mono text-ink-500">
              <tr>
                <th scope="col" className="px-3 py-2">When</th>
                <th scope="col" className="px-3 py-2">Email given</th>
                <th scope="col" className="px-3 py-2">Photos</th>
                <th scope="col" className="px-3 py-2">Findings</th>
                <th scope="col" className="px-3 py-2">Read</th>
                <th scope="col" className="px-3 py-2">Model</th>
                <th scope="col" className="px-3 py-2">
                  <span className="sr-only">View</span>
                </th>
                <th scope="col" className="px-3 py-2">
                  <span className="sr-only">Delete</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {reads.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/admin/spot/reads/${encodeURIComponent(r.id)}`)}
                  className="cursor-pointer border-t border-surface-200 hover:bg-surface-100"
                >
                  <td className="px-3 py-2 font-mono text-xs text-ink-700">
                    {when(r.createdAt ?? r.created_at ?? null)}
                  </td>
                  <td className="px-3 py-2">
                    {r.email ?? <span className="text-ink-500">None</span>}
                  </td>
                  <td className="px-3 py-2">{r.photoCount ?? '—'}</td>
                  <td className="px-3 py-2">{r.findingCount ?? 0}</td>
                  <td className="px-3 py-2">
                    {r.overallRisk ?? <span className="text-ink-500">—</span>}
                  </td>
                  <td className="px-3 py-2 text-ink-500">{r.modelVersion ?? '—'}</td>
                  <td className="px-3 py-2">
                    {/* The real focusable, screen-reader affordance; the row
                        click is a mouse convenience layered on top. */}
                    <Link
                      to={`/admin/spot/reads/${encodeURIComponent(r.id)}`}
                      className="inline-flex min-h-[44px] items-center text-accent-600 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                    >
                      View
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      // Stop the row navigate — Delete is a different action.
                      onClick={(e) => {
                        e.stopPropagation();
                        void remove('free', r.id);
                      }}
                      className="min-h-[44px] text-sm text-warning-500 underline disabled:opacity-50"
                    >
                      {busyId === r.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * A session-status pill, styled to match the one on /admin/spot-review so the
 * two Spot lists read as the same family. The Spot session lifecycle is
 * richer than the report review's three states, so the map is longer: the
 * terminal-good state (delivered) is green, the one waiting on a person
 * (in_review) is amber, a refund is red, and the in-flight middle states
 * (pending_payment, paid, uploaded) stay a neutral grey — they are not
 * problems, just not finished.
 */
function SpotStatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    delivered: 'bg-success-50 text-success-500 border-success-500',
    in_review: 'bg-warning-50 text-warning-500 border-warning-500',
    refunded: 'bg-danger-50 text-danger-500 border-danger-500',
  };
  return (
    <span
      className={
        'inline-block rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-mono ' +
        (classes[status] ?? 'bg-surface-100 text-ink-700 border-surface-200')
      }
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
