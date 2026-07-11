/**
 * Pool — the self-select case pool (routing rebuild R4).
 *
 * Any eligible firm member browses consented, unclaimed cases the firm covers
 * and claims the ones they want, first-come-first-serve. Cards are
 * de-identified: the establishment, the kind of barrier, the state, and how
 * long it's waited — never the claimant's name or contact. Claiming reveals the
 * full case in the firm's queue.
 *
 * Accessibility (AAA + Josh — voice / head-pointer / eye-gaze / sip-puff): one
 * large, clearly-LABELLED "Claim" button per card (directly speakable, big
 * target), status announced via aria-live, errors via role="alert", state by
 * text + icon (never colour alone), visible focus throughout.
 *
 * Copy here is flagged for Gina's review before launch.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Building2, Scale, Check, Lock } from 'lucide-react';
import {
  fetchPool,
  claimPoolCase,
  PortalApiError,
  type PoolCase,
} from '../../data/portalClient.js';

function ageLabel(createdAt: string): string {
  const then = new Date(createdAt).getTime();
  if (Number.isNaN(then)) return '';
  const days = Math.floor((Date.now() - then) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day waiting';
  return `${days} days waiting`;
}

function titleLabel(title: string | null): string {
  if (!title) return 'ADA barrier';
  if (title === 'I' || title === 'II' || title === 'III') return `ADA Title ${title}`;
  if (title === 'class_action') return 'Class action';
  return title;
}

function PoolCard({
  c,
  pending,
  onClaim,
}: {
  c: PoolCase;
  pending: boolean;
  onClaim: () => void;
}) {
  const business = c.business_name ?? 'Establishment not recorded';
  return (
    <li className="flex items-start justify-between gap-4 border-b border-surface-200 py-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-900">
            <Scale className="h-3.5 w-3.5 shrink-0 text-ink-500" aria-hidden="true" />
            {titleLabel(c.classification_title)}
          </span>
          {c.classification_standard && (
            <span className="text-xs font-medium text-ink-500">{c.classification_standard}</span>
          )}
          <span className="text-xs font-medium text-ink-500">·</span>
          <span className="text-xs font-medium text-ink-500">{c.case_number}</span>
        </div>

        <p className="mt-1 flex items-center gap-1.5 text-base font-semibold text-ink-900">
          <Building2 className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
          <span className="truncate">{business}</span>
        </p>

        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {c.jurisdiction_state ?? 'State not recorded'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {ageLabel(c.created_at)}
          </span>
        </p>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={onClaim}
        className="inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[120px] px-4 rounded-md text-sm font-semibold border border-accent-500 bg-accent-500 text-white hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 disabled:opacity-60"
      >
        <Check className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
        <span>{pending ? 'Claiming…' : 'Claim'}</span>
        <span className="sr-only">
          {titleLabel(c.classification_title)} at {business}
        </span>
      </button>
    </li>
  );
}

export default function PortalPool() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<PoolCase[] | null>(null);
  const [eligible, setEligible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchPool();
      setEligible(res.eligible);
      setCases(res.cases);
    } catch (err) {
      setError(err instanceof PortalApiError ? err.message : 'Could not load the case pool.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onClaim = useCallback(
    async (c: PoolCase) => {
      setPendingId(c.id);
      setError(null);
      setStatus(null);
      try {
        await claimPoolCase(c.id);
        setStatus('Claimed. Opening the case…');
        navigate(`/portal/cases/${encodeURIComponent(c.id)}`);
      } catch (err) {
        // 409 = someone else claimed it first. Refresh so the list is honest.
        setError(
          err instanceof PortalApiError
            ? err.message
            : 'Could not claim that case. Please try again.',
        );
        setPendingId(null);
        void load();
      }
    },
    [navigate, load],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="font-display text-2xl text-ink-900">Case pool</h1>
        <p className="mt-1 text-sm text-ink-500">
          Consented cases in your states, waiting for an attorney. Claim the ones you want —
          first come, first served. You&rsquo;ll see the claimant&rsquo;s details once the case
          is yours.
        </p>
      </header>

      <p className="sr-only" role="status" aria-live="polite">
        {status ?? ''}
      </p>

      {error && (
        <p role="alert" className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm font-medium text-ink-900">
          {error}
        </p>
      )}

      {!eligible && (
        <div className="rounded-md border border-surface-200 bg-surface-50 px-4 py-6 text-center">
          <Lock className="mx-auto mb-2 h-6 w-6 text-ink-500" aria-hidden="true" />
          <p className="text-sm font-medium text-ink-900">Your firm isn&rsquo;t set up to claim cases yet.</p>
          <p className="mt-1 text-sm text-ink-500">Once your subscription is active, pooled cases in your states will show here.</p>
        </div>
      )}

      {eligible && cases === null && !error && (
        <p className="py-8 text-center text-sm text-ink-500">Loading the pool…</p>
      )}

      {eligible && cases !== null && cases.length === 0 && (
        <div className="rounded-md border border-surface-200 bg-surface-50 px-4 py-8 text-center">
          <p className="text-sm font-medium text-ink-900">No cases available right now.</p>
          <p className="mt-1 text-sm text-ink-500">New consented cases in your states will appear here as they come in.</p>
        </div>
      )}

      {eligible && cases !== null && cases.length > 0 && (
        <ul>
          {cases.map((c) => (
            <PoolCard key={c.id} c={c} pending={pendingId === c.id} onClaim={() => onClaim(c)} />
          ))}
        </ul>
      )}
    </div>
  );
}
