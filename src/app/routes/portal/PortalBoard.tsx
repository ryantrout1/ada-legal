/**
 * PortalBoard — pipeline (kanban) view of the firm's cases (Phase 4a).
 *
 * Columns are the four active stages (New / Accepted / Working / Resolved),
 * filled from the same listCasesForFirm fetch the list view uses, re-bucketed by
 * status. Moving a card runs the matching firm transition through the existing
 * transition endpoint — so the board is a view over the state machine, not a
 * second source of truth.
 *
 * Accessibility: pointer users drag cards between columns; everyone gets a
 * keyboard-operable "Move" menu on each card offering only the valid next
 * stages (the mandatory no-drag alternative — WCAG 2.1.1 / 2.5.7). Resolve and
 * decline open a small modal to capture the required field before committing.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Scale, Clock, User } from 'lucide-react';
import { relativeAge, priorityForSla, type InboxPriority } from '../../utils/inboxFormat.js';
import { useAnnounce } from '../../portal/announcer.js';
import {
  fetchPortalQueue,
  transitionPortalCase,
  PortalApiError,
  type PortalCaseAction,
  type PortalCaseRow,
} from '../../data/portalClient.js';
import type { CaseStatus, CaseTransition } from '../../../engine/cases/caseStateMachine.js';
import {
  BOARD_COLUMNS,
  COLUMN_LABEL,
  columnForStatus,
  dragTransition,
  moveOptions,
  type BoardColumn,
} from '../../../engine/cases/boardMoves.js';

const RESOLUTION_TYPES: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'engaged', label: 'Engaged / representing' },
  { value: 'referred_out', label: 'Referred out' },
  { value: 'not_viable', label: 'Not viable' },
  { value: 'claimant_unresponsive', label: 'Claimant unresponsive' },
  { value: 'claimant_declined', label: 'Claimant declined' },
];

const DND_MIME = 'application/x-adall-case';

// Spoken confirmation per transition (WCAG 4.1.3) — keyed by CaseTransition.
const MOVE_ANNOUNCEMENT: Record<string, string> = {
  accept: 'Matter accepted — moved to Investigating.',
  send_demand: 'Demand sent — moved to Demand sent.',
  begin_negotiation: 'Matter moved to Negotiating.',
  resolve: 'Matter resolved.',
  decline: 'Matter declined — re-routed for placement.',
};

const COLUMN_PILL: Record<BoardColumn, string> = {
  new: 'terra',
  investigating: 'blue',
  demand_sent: 'amber',
  negotiating: 'purple',
  resolved: 'green',
};

// The board shows accepted matters only — the 'new' (un-accepted) column lives
// in the Inbox. boardMoves keeps 'new' for the state machine; the view omits it.
const BOARD_VIEW_COLUMNS = BOARD_COLUMNS.filter((c) => c !== 'new');

interface Pending {
  caseId: string;
  claimant: string;
  action: 'resolve' | 'decline';
}

export default function PortalBoard() {
  const [rows, setRows] = useState<PortalCaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [dragOver, setDragOver] = useState<BoardColumn | null>(null);
  const [viewerAttorneyId, setViewerAttorneyId] = useState<string | null>(null);
  // Owner lens: 'all' | 'mine' | 'unassigned' | <attorneyId>. A view filter, not
  // a permission — every firm matter stays reachable, this only narrows what's shown.
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const announce = useAnnounce();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPortalQueue();
      setViewerAttorneyId(data.viewer_attorney_id);
      // The board is the accepted-matters pipeline. Un-accepted intakes
      // (status 'new') live in the Inbox for accept/decline — don't mirror them
      // here (was duplicating the Inbox in a 'New' column).
      setRows([...data.groups.working, ...data.groups.resolved]);
    } catch (err) {
      setError(
        err instanceof PortalApiError ? err.message : 'Could not load the board. Please retry.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const commit = useCallback(
    async (
      caseId: string,
      action: CaseTransition,
      opts?: { reason?: string; resolutionType?: string },
    ) => {
      setBusyId(caseId);
      setMoveError(null);
      try {
        await transitionPortalCase(caseId, action as PortalCaseAction, opts);
        await load();
        announce(MOVE_ANNOUNCEMENT[action] ?? 'Matter updated.');
      } catch (err) {
        setMoveError(
          err instanceof PortalApiError ? err.message : 'That move could not be completed.',
        );
      } finally {
        setBusyId(null);
      }
    },
    [load, announce],
  );

  // A move chosen from the keyboard menu (or a non-modal drag).
  const chooseMove = useCallback(
    (row: PortalCaseRow, transition: CaseTransition) => {
      if (transition === 'resolve') {
        setPending({ caseId: row.case_id, claimant: row.claimant_name ?? 'this case', action: 'resolve' });
      } else if (transition === 'decline') {
        setPending({ caseId: row.case_id, claimant: row.claimant_name ?? 'this case', action: 'decline' });
      } else {
        void commit(row.case_id, transition);
      }
    },
    [commit],
  );

  const onDropTo = useCallback(
    (column: BoardColumn, e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(null);
      let payload: { caseId: string; status: CaseStatus } | null = null;
      try {
        payload = JSON.parse(e.dataTransfer.getData(DND_MIME)) as { caseId: string; status: CaseStatus };
      } catch {
        return;
      }
      if (!payload) return;
      if (columnForStatus(payload.status) === column) return; // dropped in place
      const transition = dragTransition(payload.status, column);
      if (!transition) {
        setMoveError(`A case can't move straight to ${COLUMN_LABEL[column]}.`);
        return;
      }
      const row = rows.find((r) => r.case_id === payload!.caseId);
      if (row) chooseMove(row, transition);
    },
    [rows, chooseMove],
  );

  // Distinct owners present in the loaded matters, for the filter dropdown.
  const owners = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows) {
      if (r.assigned_lawyer_id) m.set(r.assigned_lawyer_id, r.assigned_lawyer_name ?? 'Unknown');
    }
    return [...m.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const visibleRows = useMemo(
    () =>
      rows.filter((r) => {
        if (ownerFilter === 'all') return true;
        if (ownerFilter === 'mine') return r.assigned_lawyer_id === viewerAttorneyId;
        if (ownerFilter === 'unassigned') return r.assigned_lawyer_id == null;
        return r.assigned_lawyer_id === ownerFilter;
      }),
    [rows, ownerFilter, viewerAttorneyId],
  );

  const byColumn = (column: BoardColumn) =>
    visibleRows.filter((r) => columnForStatus(r.status as CaseStatus) === column);

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">Matters</h1>
          <p className="text-sm text-ink-500">
            Drag a case to its next stage, or use each card&rsquo;s Move menu.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <span className="sr-only sm:not-sr-only">Show</span>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              aria-label="Filter matters by owner"
              className="min-h-[44px] rounded-lg border border-control-border bg-white px-3 text-sm font-semibold text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <option value="all">All firm matters</option>
              <option value="mine">My matters</option>
              <option value="unassigned">Unassigned</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <Link
            to="/portal/cases/new"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-lg border border-accent-500 bg-accent-500 text-white text-sm font-semibold hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            New matter
          </Link>
        </div>
      </header>

      {moveError && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {moveError}
        </div>
      )}

      {error ? (
        <div role="alert" className="rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500">
          {error}{' '}
          <button type="button" onClick={() => void load()} className="underline font-medium">
            Retry
          </button>
        </div>
      ) : loading ? (
        <p className="text-sm text-ink-500">Loading the board…</p>
      ) : (
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {BOARD_VIEW_COLUMNS.map((column) => {
            const items = byColumn(column);
            return (
              <section
                key={column}
                aria-label={`${COLUMN_LABEL[column]} (${items.length})`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(column);
                }}
                onDragLeave={() => setDragOver((c) => (c === column ? null : c))}
                onDrop={(e) => onDropTo(column, e)}
                className={`rounded-lg border p-2.5 min-h-[8rem] transition-colors ${
                  dragOver === column ? 'border-accent-500 bg-accent-50' : 'border-control-border bg-surface-100'
                }`}
              >
                <h2 className="mb-3 flex items-center justify-between">
                  <span className={`lw-pill ${COLUMN_PILL[column]}`}><span className="lw-pill-dot" />{COLUMN_LABEL[column]}</span>
                  <span className="font-mono text-xs text-ink-500">{items.length}</span>
                </h2>
                <ul className="flex flex-col gap-2">
                  {items.map((row) => (
                    <BoardCard
                      key={row.case_id}
                      row={row}
                      busy={busyId === row.case_id}
                      onMove={(t) => chooseMove(row, t)}
                    />
                  ))}
                  {items.length === 0 && (
                    <li className="text-xs text-ink-500 italic px-1 py-2">No cases.</li>
                  )}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {pending && (
        <MoveModal
          pending={pending}
          busy={busyId === pending.caseId}
          onCancel={() => setPending(null)}
          onConfirm={(opts) => {
            const action: CaseTransition = pending.action === 'resolve' ? 'resolve' : 'decline';
            const p = pending;
            setPending(null);
            void commit(p.caseId, action, opts);
          }}
        />
      )}
    </div>
  );
}

const DUE_CLASS: Record<InboxPriority, string> = {
  high: 'text-danger-500',
  medium: 'text-ink-700',
  none: 'text-ink-500',
};

function formatDue(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function BoardCard({
  row,
  busy,
  onMove,
}: {
  row: PortalCaseRow;
  busy: boolean;
  onMove: (transition: CaseTransition) => void;
}) {
  const options = moveOptions(row.status as CaseStatus);
  const due = formatDue(row.first_contact_due);
  const priority = priorityForSla(row.first_contact_due);
  return (
    <li
      draggable={options.length > 0}
      onDragStart={(e) => {
        e.dataTransfer.setData(
          DND_MIME,
          JSON.stringify({ caseId: row.case_id, status: row.status }),
        );
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`rounded-md border border-control-border bg-white p-3 ${
        options.length > 0 ? 'cursor-grab active:cursor-grabbing' : ''
      } ${busy ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/portal/cases/${row.case_id}`}
          state={{ from: '/portal/board' }}
          className="block font-medium text-ink-900 hover:text-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm"
        >
          {row.claimant_name ?? 'Unnamed claimant'}
        </Link>
        <span className="shrink-0 text-xs text-ink-500 tabular-nums">
          {relativeAge(row.routed_at ?? row.created_at)}
        </span>
      </div>
      <p className="text-xs text-ink-500 font-mono mt-0.5">{row.case_number}</p>

      {row.case_name && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-ink-700">
          <Scale size={13} className="shrink-0 text-ink-500" aria-hidden="true" />
          <span className="truncate">{row.case_name}</span>
        </div>
      )}

      {(row.classification_title || row.jurisdiction_state) && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {row.classification_title && <span className="lw-pill purple">{row.classification_title}</span>}
          {row.jurisdiction_state && (
            <span className="lw-pill blue"><span className="lw-pill-dot" />{row.jurisdiction_state}</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-2 text-xs">
        <User size={13} className="shrink-0 text-ink-500" aria-hidden="true" />
        {row.assigned_lawyer_name ? (
          <span className="text-ink-700">{row.assigned_lawyer_name}</span>
        ) : (
          <span className="text-ink-500 italic">Unassigned</span>
        )}
      </div>

      {due && (
        <div className="mt-2.5 pt-2.5 border-t border-surface-200">
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${DUE_CLASS[priority]}`}>
            <Clock size={12} aria-hidden="true" />
            Contact · {due}
          </span>
        </div>
      )}

      {options.length > 0 && (
        <details className="mt-2 group">
          <summary className="inline-flex items-center justify-center min-h-[44px] px-3 rounded-md text-sm font-medium text-accent-600 bg-accent-50 cursor-pointer list-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Move…
          </summary>
          <div className="mt-2 flex flex-col gap-1.5" role="group" aria-label={`Move ${row.claimant_name ?? 'this case'}`}>
            {options.map((o) => (
              <button
                key={o.transition}
                type="button"
                disabled={busy}
                onClick={() => onMove(o.transition)}
                className={`inline-flex items-center justify-center min-h-[44px] px-3 rounded-md text-sm font-medium border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 ${
                  o.isDecline
                    ? 'border-control-border text-ink-700 hover:bg-surface-100'
                    : 'border-accent-500 text-white bg-accent-500 hover:bg-accent-600'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </details>
      )}
    </li>
  );
}

function MoveModal({
  pending,
  busy,
  onCancel,
  onConfirm,
}: {
  pending: Pending;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (opts: { reason?: string; resolutionType?: string }) => void;
}) {
  const [resolutionType, setResolutionType] = useState('');
  const [reason, setReason] = useState('');
  const firstFieldRef = useRef<HTMLSelectElement | HTMLTextAreaElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const isResolve = pending.action === 'resolve';
  const titleId = 'move-modal-title';

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    firstFieldRef.current?.focus();
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

  const canConfirm = isResolve ? resolutionType !== '' : true;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 id={titleId} className="font-display text-lg text-ink-900 mb-1">
          {isResolve ? 'Resolve case' : 'Decline case'}
        </h2>
        <p className="text-sm text-ink-500 mb-4">
          {isResolve ? 'Record the outcome for ' : 'Optionally note why you\u2019re passing on '}
          {pending.claimant}.
        </p>

        {isResolve ? (
          <div className="mb-4">
            <label htmlFor="res-type" className="block text-sm font-medium text-ink-700 mb-1">
              Resolution
            </label>
            <select
              id="res-type"
              ref={firstFieldRef as React.RefObject<HTMLSelectElement>}
              value={resolutionType}
              onChange={(e) => setResolutionType(e.target.value)}
              className="w-full min-h-[44px] rounded-md border border-control-border bg-white px-3 text-ink-900"
            >
              <option value="">Select a resolution…</option>
              {RESOLUTION_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mb-4">
            <label htmlFor="decline-reason" className="block text-sm font-medium text-ink-700 mb-1">
              Reason <span className="text-ink-500 font-normal">(optional)</span>
            </label>
            <textarea
              id="decline-reason"
              ref={firstFieldRef as React.RefObject<HTMLTextAreaElement>}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-control-border bg-white px-3 py-2 text-ink-900"
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-md border border-control-border text-ink-700 font-medium hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !canConfirm}
            onClick={() =>
              onConfirm(isResolve ? { resolutionType } : { reason: reason.trim() || undefined })
            }
            className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-md bg-accent-500 text-white font-medium hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
          >
            {isResolve ? 'Resolve' : 'Decline'}
          </button>
        </div>
      </div>
    </div>
  );
}
