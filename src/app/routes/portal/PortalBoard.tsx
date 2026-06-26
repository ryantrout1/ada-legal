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

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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

const COLUMN_PILL: Record<BoardColumn, string> = {
  new: 'terra',
  investigating: 'blue',
  demand_sent: 'amber',
  negotiating: 'purple',
  resolved: 'green',
};

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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPortalQueue();
      setRows([...data.groups.new, ...data.groups.working, ...data.groups.resolved]);
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
      } catch (err) {
        setMoveError(
          err instanceof PortalApiError ? err.message : 'That move could not be completed.',
        );
      } finally {
        setBusyId(null);
      }
    },
    [load],
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

  const byColumn = (column: BoardColumn) =>
    rows.filter((r) => columnForStatus(r.status as CaseStatus) === column);

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">My Matters</h1>
          <p className="text-sm text-ink-500">
            Drag a case to its next stage, or use each card&rsquo;s Move menu.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            aria-label="New matter — coming soon"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-lg border border-control-border bg-white text-ink-500 text-sm font-semibold cursor-not-allowed"
          >
            New matter
          </button>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {BOARD_COLUMNS.map((column) => {
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
                className={`rounded-lg border p-3 min-h-[8rem] transition-colors ${
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
      <Link
        to={`/portal/cases/${row.case_id}`}
        className="block font-medium text-ink-900 hover:text-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm"
      >
        {row.claimant_name ?? 'Unnamed claimant'}
      </Link>
      <p className="text-xs text-ink-500 font-mono mt-0.5">{row.case_number}</p>
      {row.classification_title && (
        <p className="text-xs text-ink-700 mt-1">
          {row.classification_title}
          {row.jurisdiction_state ? <span className="text-ink-500"> · {row.jurisdiction_state}</span> : null}
        </p>
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
