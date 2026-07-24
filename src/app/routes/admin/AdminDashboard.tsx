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

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);
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
    </div>
  );
}
