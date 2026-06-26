/**
 * PortalQueue — the firm's intake queue (Phase 2a).
 *
 * Reads the cases table (not sessions): matched + CONSENTED cases routed to the
 * attorney's firm, grouped New / Working / Resolved with live counts. Each row
 * links to the case detail by case id. Firm scope + the hard consent gate are
 * enforced server-side (requireAttorney + listCasesForFirm); this page never
 * sends a firm id. Tokens + semantic HTML for WCAG 2.2 AAA.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import PortalViewToggle from './PortalViewToggle.js';
import {
  fetchPortalQueue,
  PortalApiError,
  type PortalQueueResponse,
  type PortalCaseRow,
} from '../../data/portalClient.js';

const GROUPS = [
  { key: 'new', label: 'New' },
  { key: 'working', label: 'Working' },
  { key: 'resolved', label: 'Resolved' },
] as const;

export default function PortalQueue() {
  const [data, setData] = useState<PortalQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauth, setUnauth] = useState(false);
  const [notOnboarded, setNotOnboarded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchPortalQueue());
    } catch (err) {
      if (err instanceof PortalApiError && err.status === 401) setUnauth(true);
      else if (err instanceof PortalApiError && err.status === 403) setNotOnboarded(true);
      else setError(err instanceof Error ? err.message : 'Failed to load the queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (unauth) return <Navigate to="/portal/sign-in" replace />;

  if (notOnboarded) {
    return (
      <section role="alert" className="rounded-md border border-surface-200 bg-white px-5 py-6">
        <h1 className="font-display text-2xl text-ink-900 mb-2">Not onboarded yet</h1>
        <p className="text-ink-700">
          Your account isn’t paired with a law firm yet. Contact ADA Legal Link to finish
          onboarding, then sign in again.
        </p>
      </section>
    );
  }

  const total = data ? data.counts.new + data.counts.working + data.counts.resolved : 0;

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">Your intake queue</h1>
          <p className="text-ink-500 text-sm">Matched cases your clients consented to share.</p>
        </div>
        <PortalViewToggle active="list" />
      </header>

      {data && (
        <div className="grid grid-cols-3 gap-3 mb-8 max-w-lg">
          {GROUPS.map((g) => (
            <div key={g.key} className="rounded-md border border-surface-200 bg-white px-4 py-3">
              <div className="text-ink-500 text-xs uppercase tracking-wide">{g.label}</div>
              <div className="text-ink-900 text-2xl font-display">{data.counts[g.key]}</div>
            </div>
          ))}
        </div>
      )}

      {loading && <p className="text-ink-500">Loading…</p>}
      {error && (
        <div
          role="alert"
          className="rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-danger-500"
        >
          {error}{' '}
          <button type="button" onClick={() => void load()} className="underline">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data && total === 0 && (
        <p className="text-ink-500">No matched cases yet.</p>
      )}

      {!loading && !error && data && total > 0 && (
        <div className="flex flex-col gap-8">
          {GROUPS.map((g) => {
            const rows = data.groups[g.key];
            if (rows.length === 0) return null;
            return (
              <section key={g.key} aria-labelledby={`group-${g.key}`}>
                <h2
                  id={`group-${g.key}`}
                  className="font-display text-lg text-ink-900 mb-3 flex items-center gap-2"
                >
                  {g.label}
                  <span className="text-ink-500 text-sm font-mono">{rows.length}</span>
                </h2>
                <ul className="flex flex-col gap-2">
                  {rows.map((c) => (
                    <li key={c.case_id}>
                      <CaseRowLink c={c} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CaseRowLink({ c }: { c: PortalCaseRow }) {
  const meta = [c.classification_title ? `Title ${c.classification_title}` : null, c.jurisdiction_state]
    .filter(Boolean)
    .join(' · ');
  return (
    <Link
      to={`/portal/cases/${c.case_id}`}
      className="block rounded-md border border-surface-200 bg-white px-4 py-3 transition-colors hover:border-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-ink-900 font-medium">{c.claimant_name ?? 'Unknown claimant'}</span>
        <span className="text-xs font-mono uppercase tracking-wide text-ink-500">{c.case_number}</span>
      </div>
      <div className="text-ink-500 text-sm mt-0.5">
        {c.case_name ?? (meta || 'Matched case')}
        {c.case_name && meta ? ` · ${meta}` : ''}
        {c.claimant_email ? ` · ${c.claimant_email}` : ''}
      </div>
    </Link>
  );
}
