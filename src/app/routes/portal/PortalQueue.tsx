/**
 * PortalQueue — the attorney portal landing page (criteria 2, 6).
 *
 * Summary tiles (open / handled, firm-scoped per DO3) + the queue list of
 * matched sessions for the attorney's firm. Cases handled by another firm that
 * shares the case render grayed with a badge (criterion 6); cases this firm
 * handled show a "Handled" badge. Each row links to the case detail.
 *
 * Firm scope is enforced server-side (requireAttorney); this page never sends a
 * firm id. Tokens + semantic HTML for WCAG 2.2 AAA.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  fetchPortalQueue,
  PortalApiError,
  type PortalQueueResponse,
} from '../../data/portalClient.js';

type HandledFilter = 'false' | 'all';

export default function PortalQueue() {
  const [data, setData] = useState<PortalQueueResponse | null>(null);
  const [filter, setFilter] = useState<HandledFilter>('false');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauth, setUnauth] = useState(false);
  const [notOnboarded, setNotOnboarded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPortalQueue({ handled: filter });
      setData(result);
    } catch (err) {
      if (err instanceof PortalApiError && err.status === 401) {
        setUnauth(true);
      } else if (err instanceof PortalApiError && err.status === 403) {
        setNotOnboarded(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load the queue');
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  if (unauth) return <Navigate to="/portal/sign-in" replace />;

  if (notOnboarded) {
    return (
      <section role="alert" className="rounded-md border border-surface-200 bg-white px-5 py-6">
        <h1 className="font-display text-2xl text-ink-900 mb-2">Not onboarded yet</h1>
        <p className="text-ink-700">
          Your account isn’t paired with a law firm yet. Contact ADA Legal Link to
          finish onboarding, then sign in again.
        </p>
      </section>
    );
  }

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">Your queue</h1>
          <p className="text-ink-500 text-sm">Sessions matched to your firm.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="handled-filter" className="text-ink-700">
            Show
          </label>
          <select
            id="handled-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as HandledFilter)}
            className="rounded-md border border-surface-200 bg-white px-2 py-1 text-ink-900"
          >
            <option value="false">Open</option>
            <option value="all">All</option>
          </select>
        </div>
      </header>

      {data && (
        <div className="grid grid-cols-2 gap-3 mb-6 max-w-md">
          <div className="rounded-md border border-surface-200 bg-white px-4 py-3">
            <div className="text-ink-500 text-xs uppercase tracking-wide">Open</div>
            <div className="text-ink-900 text-2xl font-display">{data.summary.open_count}</div>
          </div>
          <div className="rounded-md border border-surface-200 bg-white px-4 py-3">
            <div className="text-ink-500 text-xs uppercase tracking-wide">Handled by your firm</div>
            <div className="text-ink-900 text-2xl font-display">{data.summary.handled_count}</div>
          </div>
        </div>
      )}

      {loading && <p className="text-ink-500">Loading…</p>}
      {error && (
        <div role="alert" className="rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-danger-500">
          {error}{' '}
          <button type="button" onClick={() => void load()} className="underline">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data && data.cases.length === 0 && (
        <p className="text-ink-500">No matched cases yet.</p>
      )}

      {!loading && !error && data && data.cases.length > 0 && (
        <ul className="flex flex-col gap-2">
          {data.cases.map((c) => {
            const grayed = c.handled_by_other_firm && !c.handled_by_this_firm;
            return (
              <li key={c.session_id}>
                <Link
                  to={`/portal/cases/${c.session_id}`}
                  className={
                    'block rounded-md border border-surface-200 bg-white px-4 py-3 transition-colors hover:border-accent-500 ' +
                    (grayed ? 'opacity-70' : '')
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className={grayed ? 'text-ink-500' : 'text-ink-900'}>
                      {c.case_name}
                    </span>
                    {c.handled_by_this_firm && (
                      <span className="text-xs font-mono uppercase tracking-wide text-ink-500">
                        Handled
                      </span>
                    )}
                    {grayed && (
                      <span className="text-xs font-mono uppercase tracking-wide text-ink-500">
                        Handled by another firm
                      </span>
                    )}
                  </div>
                  <div className="text-ink-500 text-sm mt-0.5">
                    {c.user_name ?? 'Unknown claimant'}
                    {c.user_email ? ` · ${c.user_email}` : ''}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
