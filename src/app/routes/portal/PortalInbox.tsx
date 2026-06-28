/**
 * PortalInbox — the firm's referral inbox (Phase 5 §7.2), the /portal landing.
 *
 * Rebuilds the queue to the mockup's Inbox: a stat strip, filter chips, and a
 * referral table of the cases awaiting the firm's decision. Accept/Decline run
 * through the existing transition endpoint. Firm scope + the hard consent gate
 * are enforced server-side (requireAttorney + listCasesForFirm); this page never
 * sends a firm id.
 *
 * Honest-data discipline: no fabricated match score, no fabricated disability
 * tag, no auto-computed SOL. Priority is derived from the real first-contact
 * SLA; KPIs come from the activity log (GET /api/portal/pipeline). Fields the
 * engine doesn't carry yet (a one-line Ada barrier summary in the row) show a
 * neutral "open to view" affordance rather than invented text.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Sliders } from 'lucide-react';
import {
  fetchPortalQueue,
  fetchPipelineStats,
  transitionPortalCase,
  PortalApiError,
  type PortalCaseRow,
  type PipelineStatsResponse,
} from '../../data/portalClient.js';
import { priorityForSla, relativeAge, formatHours, type InboxPriority } from '../../utils/inboxFormat.js';
import { useAnnounce } from '../../portal/announcer.js';

const PRIORITY_LABEL: Record<InboxPriority, string> = {
  high: 'High priority — contact overdue',
  medium: 'Medium priority — contact due soon',
  none: 'Standard priority',
};

interface DeclineTarget {
  caseId: string;
  claimant: string;
}

export default function PortalInbox() {
  const [rows, setRows] = useState<PortalCaseRow[]>([]);
  const [counts, setCounts] = useState<{ new: number; working: number; resolved: number } | null>(null);
  const [stats, setStats] = useState<PipelineStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauth, setUnauth] = useState(false);
  const [notOnboarded, setNotOnboarded] = useState(false);

  const [filter, setFilter] = useState<string>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [declineFor, setDeclineFor] = useState<DeclineTarget | null>(null);
  const announce = useAnnounce();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queue = await fetchPortalQueue();
      setRows(queue.groups.new);
      setCounts(queue.counts);
      // KPIs are best-effort — never block the inbox if analytics fail.
      try {
        setStats(await fetchPipelineStats());
      } catch {
        setStats(null);
      }
    } catch (err) {
      if (err instanceof PortalApiError && err.status === 401) setUnauth(true);
      else if (err instanceof PortalApiError && err.status === 403) setNotOnboarded(true);
      else setError(err instanceof Error ? err.message : 'Failed to load the inbox');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = useCallback(
    async (caseId: string, action: 'accept' | 'decline', reason?: string) => {
      setBusyId(caseId);
      setActionError(null);
      try {
        await transitionPortalCase(caseId, action, reason ? { reason } : undefined);
        await load();
        announce(
          action === 'accept'
            ? 'Referral accepted — moved to your matters.'
            : 'Referral declined — re-routed for placement.',
        );
      } catch (err) {
        setActionError(
          err instanceof PortalApiError ? err.message : 'That action could not be completed.',
        );
      } finally {
        setBusyId(null);
      }
    },
    [load, announce],
  );

  // Filter chips derived from the real attributes present on awaiting rows.
  const chips = useMemo(() => {
    const byClass = new Map<string, number>();
    const byState = new Map<string, number>();
    for (const r of rows) {
      if (r.classification_title) byClass.set(r.classification_title, (byClass.get(r.classification_title) ?? 0) + 1);
      if (r.jurisdiction_state) byState.set(r.jurisdiction_state, (byState.get(r.jurisdiction_state) ?? 0) + 1);
    }
    return {
      classes: [...byClass.entries()].sort((a, b) => b[1] - a[1]),
      states: [...byState.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [rows]);

  const visibleRows = useMemo(() => {
    if (filter === 'all') return rows;
    const [kind, value] = filter.split(':');
    if (kind === 'class') return rows.filter((r) => r.classification_title === value);
    if (kind === 'state') return rows.filter((r) => r.jurisdiction_state === value);
    return rows;
  }, [rows, filter]);

  if (unauth) return <Navigate to="/portal/sign-in" replace />;

  if (notOnboarded) {
    return (
      <section role="alert" className="rounded-lg border border-control-border bg-white px-5 py-6">
        <h1 className="font-display text-2xl text-ink-900 mb-2">Not onboarded yet</h1>
        <p className="text-ink-700">
          Your account isn’t paired with a law firm yet. Contact ADA Legal Link to finish
          onboarding, then sign in again.
        </p>
      </section>
    );
  }

  const responseHours = stats?.time_in_stage.find((t) => t.stage === 'new')?.median_hours ?? null;

  return (
    <section>
      {/* Page header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-ink-500 text-xs font-semibold uppercase tracking-wider mb-1.5">
            Workspace · Inbox
          </p>
          <h1 className="font-display text-2xl sm:text-3xl text-ink-900">Incoming Referrals</h1>
        </div>
        <button
          type="button"
          disabled
          aria-label="Set criteria — coming soon"
          className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg border border-control-border bg-white text-ink-500 text-sm font-semibold cursor-not-allowed"
        >
          <Sliders size={15} aria-hidden="true" />
          Set criteria
        </button>
      </header>

      {/* Metric strip — one compact, hairline-divided panel (was four cards) */}
      <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 rounded-lg border border-control-border bg-white">
        <Metric
          label="Awaiting decision"
          value={counts ? String(counts.new) : '—'}
          sub="Referrals to review"
          accent
          pos={0}
        />
        <Metric
          label="Accepted this week"
          value={stats ? String(stats.accepted_this_week) : '—'}
          sub="Last 7 days"
          pos={1}
        />
        <Metric
          label="Response time"
          value={formatHours(responseHours)}
          sub="Median, routed → accepted"
          pos={2}
        />
        <Metric
          label="Active matters"
          value={counts ? String(counts.working) : '—'}
          sub="In progress"
          pos={3}
        />
      </div>

      {/* Filter chips */}
      {rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4" role="group" aria-label="Filter referrals">
          <FilterChip label="All" count={rows.length} active={filter === 'all'} onClick={() => setFilter('all')} />
          {chips.classes.map(([c, n]) => (
            <FilterChip
              key={`class:${c}`}
              label={c}
              count={n}
              active={filter === `class:${c}`}
              onClick={() => setFilter(`class:${c}`)}
            />
          ))}
          {chips.states.map(([s, n]) => (
            <FilterChip
              key={`state:${s}`}
              label={s}
              count={n}
              active={filter === `state:${s}`}
              onClick={() => setFilter(`state:${s}`)}
            />
          ))}
        </div>
      )}

      {actionError && (
        <div role="alert" className="mb-4 rounded-lg border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500">
          {actionError}
        </div>
      )}

      {/* Body */}
      {loading ? (
        <p className="text-ink-500">Loading the inbox…</p>
      ) : error ? (
        <div role="alert" className="rounded-lg border border-danger-500 bg-danger-50 px-4 py-3 text-danger-500">
          {error}{' '}
          <button type="button" onClick={() => void load()} className="underline font-medium">
            Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-control-border bg-white px-6 py-12 text-center">
          <h2 className="font-display text-xl text-ink-900 mb-2">No referrals awaiting your decision</h2>
          <p className="text-ink-500">New matched cases will appear here once a claimant consents to share.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-control-border bg-white overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-100 text-ink-500 text-xs uppercase tracking-wide">
                <th scope="col" className="px-4 py-2.5 font-bold w-8"><span className="sr-only">Priority</span></th>
                <th scope="col" className="px-4 py-2.5 font-bold">Client</th>
                <th scope="col" className="px-4 py-2.5 font-bold">Summary from Ada</th>
                <th scope="col" className="px-4 py-2.5 font-bold">Jurisdiction</th>
                <th scope="col" className="px-4 py-2.5 font-bold">Age</th>
                <th scope="col" className="px-4 py-2.5 font-bold text-right"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((c) => (
                <ReferralRow
                  key={c.case_id}
                  c={c}
                  busy={busyId === c.case_id}
                  onAccept={() => void act(c.case_id, 'accept')}
                  onDecline={() => setDeclineFor({ caseId: c.case_id, claimant: c.claimant_name ?? 'this case' })}
                />
              ))}
              {visibleRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-500 text-sm">
                    No referrals match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {declineFor && (
        <DeclineDialog
          target={declineFor}
          busy={busyId === declineFor.caseId}
          onCancel={() => setDeclineFor(null)}
          onConfirm={(reason) => {
            const t = declineFor;
            setDeclineFor(null);
            void act(t.caseId, 'decline', reason);
          }}
        />
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  sub,
  accent,
  pos,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
  pos: number;
}) {
  // Hairline dividers: vertical between columns on desktop (4-up single row),
  // a 2×2 grid with both dividers on mobile.
  const smRight = pos % 2 === 0;
  const smBottom = pos < 2;
  const lgRight = pos < 3;
  const cls = [
    'px-5 py-4 border-surface-200',
    smRight ? 'border-r' : '',
    smBottom ? 'border-b' : '',
    'lg:border-b-0',
    lgRight ? 'lg:border-r' : 'lg:border-r-0',
  ].join(' ');
  return (
    <div className={cls}>
      <div className="text-ink-500 text-xs uppercase tracking-wide font-bold">{label}</div>
      <div
        className={`text-2xl font-bold leading-tight tabular-nums mt-1 ${accent ? 'text-accent-500' : 'text-ink-900'}`}
      >
        {value}
      </div>
      <div className="text-ink-500 text-xs mt-0.5">{sub}</div>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex items-center gap-2 min-h-[44px] px-3.5 rounded-lg border text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
        active
          ? 'border-accent-500 bg-accent-50 text-accent-600'
          : 'border-control-border bg-white text-ink-700 hover:bg-surface-100'
      }`}
    >
      {label}
      <span className={`text-xs font-bold rounded-full px-1.5 ${active ? 'text-accent-600' : 'text-ink-500'}`}>
        {count}
      </span>
    </button>
  );
}

const DOT_CLASS: Record<InboxPriority, string> = {
  high: 'bg-accent-500 ring-4 ring-accent-500/20',
  medium: 'bg-warning-500',
  none: 'bg-surface-300',
};

function ReferralRow({
  c,
  busy,
  onAccept,
  onDecline,
}: {
  c: PortalCaseRow;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const priority = priorityForSla(c.first_contact_due);
  const ageSource = c.routed_at ?? c.created_at;
  const summary = c.case_name ?? 'Open to view the full intake.';
  return (
    <tr className="border-t border-surface-200 hover:bg-surface-100">
      <td className="px-4 py-3 align-top">
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${DOT_CLASS[priority]}`} aria-hidden="true" />
        <span className="sr-only">{PRIORITY_LABEL[priority]}</span>
      </td>
      <td className="px-4 py-3 align-top">
        <Link
          to={`/portal/cases/${c.case_id}`}
          state={{ from: '/portal' }}
          className="font-semibold text-ink-900 hover:text-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm"
        >
          {c.claimant_name ?? 'Unnamed claimant'}
        </Link>
        <div className="text-ink-500 text-xs font-mono mt-0.5">{c.case_number}</div>
      </td>
      <td className="px-4 py-3 align-top max-w-md">
        <div className="flex items-start gap-2">
          <span className="lw-pill purple shrink-0">{c.classification_title ?? 'Intake'}</span>
          <span className="text-ink-700 text-sm">{summary}</span>
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        {c.jurisdiction_state ? (
          <span className="lw-pill blue"><span className="lw-pill-dot" />{c.jurisdiction_state}</span>
        ) : (
          <span className="text-ink-500 text-sm">—</span>
        )}
      </td>
      <td className="px-4 py-3 align-top text-ink-500 text-sm whitespace-nowrap tabular-nums">
        {relativeAge(ageSource)}
      </td>
      <td className="px-4 py-3 align-top">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onDecline}
            className="inline-flex items-center justify-center min-h-[44px] px-3 rounded-lg border border-control-border text-ink-700 text-sm font-semibold hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
          >
            Decline
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onAccept}
            className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg bg-accent-500 text-white text-sm font-semibold hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
          >
            Accept
          </button>
        </div>
      </td>
    </tr>
  );
}

function DeclineDialog({
  target,
  busy,
  onCancel,
  onConfirm,
}: {
  target: DeclineTarget;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (reason?: string) => void;
}) {
  const [reason, setReason] = useState('');
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = 'decline-dialog-title';

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    fieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (f.length === 0) return;
        const first = f[0]!;
        const last = f[f.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4" onClick={onCancel}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 id={titleId} className="font-display text-lg text-ink-900 mb-1">
          Decline referral
        </h2>
        <p className="text-sm text-ink-500 mb-4">
          The case re-routes for placement elsewhere. Optionally note why you’re passing on {target.claimant}.
        </p>
        <label htmlFor="decline-reason" className="block text-sm font-medium text-ink-700 mb-1">
          Reason <span className="text-ink-500 font-normal">(optional)</span>
        </label>
        <textarea
          id="decline-reason"
          ref={fieldRef}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-control-border bg-white px-3 py-2 text-ink-900 mb-4"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg border border-control-border text-ink-700 font-medium hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onConfirm(reason.trim() || undefined)}
            className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg bg-accent-500 text-white font-medium hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
