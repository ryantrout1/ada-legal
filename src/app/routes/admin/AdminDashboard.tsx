/**
 * AdminDashboard — what needs doing, then what's happening, then where to go.
 *
 * WHY THIS WAS RESTRUCTURED. The first version was eight equal tiles in a
 * grid. Six of them read zero, and the one thing that actually needed a
 * human — a Spot report someone had paid for and nobody had sent — was
 * below all of them. A dashboard that gives a paid, unsent report the same
 * visual weight as "Firms: 2" is sorting by convenience of query, not by
 * what the person reading it should do next.
 *
 * Three bands now, in the order you'd want them:
 *
 *   1. Needs you   — open work items, each with somewhere to go. Silent
 *                    when there is none. Nothing here is a statistic.
 *   2. Ada, 30 days — sessions and the intakes they produced, side by side,
 *                    because the gap between those two numbers is the whole
 *                    story and two separate tiles hid it completely.
 *   3. Reference    — Spot totals and the catalog counts, small. These
 *                    barely move week to week; they're navigation.
 *
 * HONESTY RULES CARRIED FORWARD. An em dash while loading, never a zero —
 * a fake zero reads as real data and gets believed. Every number links to
 * the rows that produced it. The funnel reads `intakes_30d`, not `intakes`,
 * because `intakes` is all-time and pairing it with a 30-day session count
 * would overstate conversion the moment either number moves off zero.
 *
 * Figures are set in the body face, not Fraunces — see the .admin-shell
 * de-serif rule in app.css.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Counts {
  sessions?: number;
  intakes?: number;
  intakes_30d?: number;
  cases_unplaced?: number;
  firms?: number;
  attorneys?: number;
  feedback_new?: number;
  listings_published?: number;
  litigation_active?: number;
}

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

/** Loading reads as an em dash. Never a placeholder zero. */
function figure(n: number | undefined, loaded: boolean): string {
  return loaded ? (n ?? 0).toLocaleString() : '—';
}

const CARD = 'rounded-lg border border-surface-200 bg-white';

/** 44px minimum target, per the standing floor on anything admin clicks. */
const ACTION_LINK =
  'inline-flex items-center min-h-[44px] px-4 rounded-md border border-accent-500 ' +
  'text-accent-500 no-underline hover:bg-accent-50 ' +
  'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-accent-500';

interface WorkItem {
  key: string;
  count: number;
  headline: string;
  detail: string;
  to: string;
  cta: string;
}

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
  // uses, and the same endpoint backs the Spot page.
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

  const loaded = counts !== null;
  const sessions30 = counts?.sessions ?? 0;
  const intakes30 = counts?.intakes_30d ?? 0;

  // Only non-zero items appear. A zero work item is not a green tick to be
  // reassured by, it's an absence — and eight reassurances are what buried
  // the one real item last time.
  const work: WorkItem[] = [
    {
      key: 'awaiting_review',
      count: spot?.awaiting_review ?? 0,
      headline: `${spot?.awaiting_review ?? 0} Spot ${spot?.awaiting_review === 1 ? 'report' : 'reports'} paid for, not sent`,
      detail: 'Someone has paid and is still waiting on a person to release it.',
      to: '/admin/spot-review',
      cta: 'Open Spot review',
    },
    {
      key: 'released_unsent',
      count: spot?.released_unsent ?? 0,
      headline: `${spot?.released_unsent ?? 0} released ${spot?.released_unsent === 1 ? 'report' : 'reports'} never emailed`,
      detail: 'Approved, but the delivery never went out. Resend from the review queue.',
      to: '/admin/spot-review',
      cta: 'Resend',
    },
    {
      key: 'paid_no_email',
      count: spot?.paid_no_email ?? 0,
      headline: `${spot?.paid_no_email ?? 0} ${spot?.paid_no_email === 1 ? 'purchase has' : 'purchases have'} no email on file`,
      detail: 'These cannot be delivered at all until someone finds an address.',
      to: '/admin/spot',
      cta: 'Open Spot',
    },
    {
      key: 'cases_unplaced',
      count: counts?.cases_unplaced ?? 0,
      headline: `${counts?.cases_unplaced ?? 0} ${counts?.cases_unplaced === 1 ? 'case is' : 'cases are'} waiting on a firm`,
      detail: 'Nobody has been assigned. The claimant is waiting on this one.',
      to: '/admin/cases',
      cta: 'Place them',
    },
    {
      key: 'feedback_new',
      count: counts?.feedback_new ?? 0,
      headline: `${counts?.feedback_new ?? 0} new ${counts?.feedback_new === 1 ? 'piece' : 'pieces'} of feedback`,
      detail: 'Submitted in the last 30 days.',
      to: '/admin/feedback',
      cta: 'Read it',
    },
  ].filter((w) => w.count > 0);

  const stillLoading = counts === null || spot === null;

  return (
    <div>
      <h1 className="text-2xl text-ink-900 mb-1">Dashboard</h1>
      <p className="text-ink-700 text-sm mb-8">Where things stand right now.</p>

      {error && (
        <div
          role="alert"
          className={`${CARD} p-4 text-sm text-ink-700 mb-8`}
        >
          Couldn&rsquo;t load the counts. The pages themselves are still fine — use the
          sidebar.
        </div>
      )}

      {/* ── 1. Needs you ─────────────────────────────────────────────── */}
      <section aria-labelledby="work-h" className="mb-10">
        <h2
          id="work-h"
          className="text-[0.65rem] font-mono uppercase tracking-[0.14em] text-ink-500 mb-3"
        >
          Needs you
        </h2>

        {stillLoading ? (
          <p className="text-sm text-ink-500">Checking&hellip;</p>
        ) : work.length === 0 ? (
          <div className={`${CARD} p-4 text-sm text-ink-700`}>
            Nothing is waiting on you. No unsent reports, no unplaced cases.
          </div>
        ) : (
          <ul className={`${CARD} list-none p-0 m-0 divide-y divide-surface-200`}>
            {work.map((item) => (
              <li
                key={item.key}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-ink-900 m-0">{item.headline}</p>
                  <p className="text-sm text-ink-500 m-0 mt-0.5">{item.detail}</p>
                </div>
                <Link to={item.to} className={ACTION_LINK}>
                  {item.cta}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── 2. Ada, last 30 days ─────────────────────────────────────── */}
      <section aria-labelledby="ada-h" className="mb-10">
        <h2
          id="ada-h"
          className="text-[0.65rem] font-mono uppercase tracking-[0.14em] text-ink-500 mb-3"
        >
          Ada — last 30 days
        </h2>

        <div className={`${CARD} p-5`}>
          <dl className="grid grid-cols-2 gap-6 m-0">
            <div className="flex flex-col-reverse">
              <dt className="text-sm text-ink-700">Sessions started</dt>
              <dd className="text-3xl text-ink-900 leading-none m-0 mb-1 tabular-nums">
                <Link
                  to="/admin/sessions"
                  className="text-ink-900 no-underline hover:text-accent-500 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-accent-500"
                >
                  {figure(counts?.sessions, loaded)}
                </Link>
              </dd>
            </div>
            <div className="flex flex-col-reverse">
              <dt className="text-sm text-ink-700">Reached an intake</dt>
              <dd className="text-3xl text-ink-900 leading-none m-0 mb-1 tabular-nums">
                <Link
                  to="/admin/intakes"
                  className="text-ink-900 no-underline hover:text-accent-500 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-accent-500"
                >
                  {figure(counts?.intakes_30d, loaded)}
                </Link>
              </dd>
            </div>
          </dl>

          {/* The gap is the point. Said in words, because two numbers in a
              grid is exactly how this went unnoticed before. */}
          {loaded && sessions30 > 0 && intakes30 === 0 && (
            <p className="mt-5 mb-0 p-3 rounded-md bg-warning-50 border border-warning-500 text-sm text-ink-900">
              All {sessions30.toLocaleString()} sessions ended before an intake.
              Reading the transcripts is the fastest way to find out where.{' '}
              <Link to="/admin/sessions" className="text-accent-500 underline underline-offset-2">
                Open sessions
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* ── 3. Reference ─────────────────────────────────────────────── */}
      <section aria-labelledby="spot-h" className="mb-10">
        <h2
          id="spot-h"
          className="text-[0.65rem] font-mono uppercase tracking-[0.14em] text-ink-500 mb-3"
        >
          Spot — all time
        </h2>
        <div className={`${CARD} p-5`}>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-5 m-0">
            {(
              [
                ['Uploaded', spot?.uploaded],
                ['Paid', spot?.paid],
                ['Delivered', spot?.delivered],
                ['Awaiting review', spot?.awaiting_review],
              ] as [string, number | undefined][]
            ).map(([label, value]) => (
              <div key={label} className="flex flex-col-reverse">
                <dt className="text-sm text-ink-700">{label}</dt>
                <dd className="text-2xl text-ink-900 leading-none m-0 mb-1 tabular-nums">
                  {figure(value, spot !== null)}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 mb-0 text-sm">
            <Link to="/admin/spot" className="text-accent-500 underline underline-offset-2">
              Open Spot
            </Link>
          </p>
        </div>
      </section>

      <section aria-labelledby="catalog-h">
        <h2
          id="catalog-h"
          className="text-[0.65rem] font-mono uppercase tracking-[0.14em] text-ink-500 mb-3"
        >
          Catalog
        </h2>
        {/* Navigation, not status. These barely move week to week, and giving
            them tile-sized numbers is what pushed the real work off-screen. */}
        <ul className={`${CARD} list-none p-0 m-0 flex flex-wrap divide-x divide-surface-200`}>
          {(
            [
              ['Litigation', counts?.litigation_active, '/admin/litigation'],
              ['Listings', counts?.listings_published, '/admin/listings'],
              ['Attorneys', counts?.attorneys, '/admin/attorneys'],
              ['Firms', counts?.firms, '/admin/firms'],
              ['Intakes, all time', counts?.intakes, '/admin/intakes'],
            ] as [string, number | undefined, string][]
          ).map(([label, value, to]) => (
            <li key={label} className="flex-1 basis-[9rem]">
              <Link
                to={to}
                className="flex items-center gap-2 min-h-[44px] px-4 py-2 no-underline text-ink-700 hover:bg-surface-100 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-accent-500"
              >
                <span className="text-lg text-ink-900 tabular-nums">
                  {figure(value, loaded)}
                </span>
                <span className="text-sm">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
