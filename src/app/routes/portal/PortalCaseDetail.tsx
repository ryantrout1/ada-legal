/**
 * PortalCaseDetail — single case view in the firm workspace (Phase 2b).
 *
 * Reads the case by id (cases-backed): header (case number, stage, lane,
 * classification, jurisdiction, matched case, SLA), claimant contact, the Ada
 * intake (qualifying answers + transcript), and the activity timeline. Server
 * enforces the firm boundary + consent gate — an out-of-firm / unconsented id
 * returns 404 here. Accept / decline / resolve actions land in Phase 2c.
 *
 * Tokens + semantic HTML for WCAG 2.2 AAA.
 */

import { useCallback, useEffect, useState } from 'react';
import TaskPanel from './TaskPanel.js';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  fetchPortalCase,
  transitionPortalCase,
  addPortalCaseNote,
  type PortalCaseAction,
  type PortalCaseActivityEntry,
  PortalApiError,
  type PortalCaseDetailResponse,
} from '../../data/portalClient.js';
import MessageContent from '../../components/MessageContent.js';

const STAGE_LABEL: Record<string, string> = {
  new: 'New',
  accepted: 'Accepted',
  working: 'Working',
  resolved: 'Resolved',
  closed: 'Closed',
  declined: 'Declined',
  reclaimed: 'Reclaimed',
};

export default function PortalCaseDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PortalCaseDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauth, setUnauth] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchPortalCase(id);
      if (!detail) {
        setNotFound(true);
        return;
      }
      setData(detail);
    } catch (err) {
      if (err instanceof PortalApiError && err.status === 401) setUnauth(true);
      else setError(err instanceof Error ? err.message : 'Failed to load the case');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (unauth) return <Navigate to="/portal/sign-in" replace />;

  if (notFound) {
    return (
      <section role="alert" className="rounded-md border border-surface-200 bg-white px-5 py-6">
        <h1 className="font-display text-2xl text-ink-900 mb-2">Case not found</h1>
        <p className="text-ink-700">
          This case isn’t available to your firm.{' '}
          <Link to="/portal" className="text-accent-500 underline">
            Back to queue
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section>
      <nav className="mb-4 text-sm">
        <Link to="/portal" className="text-accent-500 underline">
          ← Back to queue
        </Link>
      </nav>

      {loading && <p className="text-ink-500">Loading…</p>}
      {error && (
        <div
          role="alert"
          className="rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-danger-500 mb-4"
        >
          {error}
        </div>
      )}

      {data && (
        <>
          <header className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-2xl sm:text-3xl text-ink-900">
                {data.claimant_name ?? 'Claimant'}
              </h1>
              <span className="text-xs font-mono uppercase tracking-wide rounded-full border border-surface-200 px-2 py-0.5 text-ink-700">
                {STAGE_LABEL[data.status] ?? data.status}
              </span>
            </div>
            <p className="text-ink-500 text-sm font-mono">{data.case_number}</p>
          </header>

          <ActionBar status={data.status} caseId={data.case_id} onDone={load} />

          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 mb-8 max-w-2xl">
            <Meta label="Matched case" value={data.case_name} />
            <Meta
              label="Claim"
              value={data.classification_title ? `Title ${data.classification_title}` : null}
            />
            <Meta label="Jurisdiction" value={data.jurisdiction_state} />
            <Meta label="Email" value={data.claimant_email} />
            <Meta label="Phone" value={data.claimant_phone} />
            <Meta
              label="First contact due"
              value={data.first_contact_due ? new Date(data.first_contact_due).toLocaleString() : null}
            />
          </dl>

          {data.qualifying_answers.length > 0 && (
            <section aria-labelledby="qq-h" className="mb-8">
              <h2 id="qq-h" className="font-display text-lg text-ink-900 mb-2">
                Intake answers
              </h2>
              <dl className="flex flex-col gap-2">
                {data.qualifying_answers.map((a) => (
                  <div key={a.question} className="rounded-md border border-surface-200 bg-white px-4 py-3">
                    <dt className="text-ink-500 text-xs uppercase tracking-wide mb-0.5">
                      {a.question.replace(/_/g, ' ')}
                    </dt>
                    <dd className="text-ink-900">{a.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section aria-labelledby="transcript-h" className="mb-8">
            <h2 id="transcript-h" className="font-display text-lg text-ink-900 mb-2">
              Ada intake
            </h2>
            {data.transcript.length === 0 ? (
              <p className="text-ink-500 text-sm">No transcript.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {data.transcript.map((m, i) => (
                  <li key={i} className="rounded-md border border-surface-200 bg-white px-4 py-3">
                    <div className="text-ink-500 text-xs uppercase tracking-wide mb-1">
                      {m.role === 'assistant' ? 'Ada' : m.role === 'user' ? 'Claimant' : m.role}
                    </div>
                    <MessageContent content={m.content} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <TaskPanel caseId={data.case_id} />

          <NotesPanel
            caseId={data.case_id}
            notes={data.activity.filter((a) => a.event_type === 'NOTE')}
            onAdded={load}
          />

          {data.activity.filter((a) => a.event_type !== 'NOTE').length > 0 && (
            <section aria-labelledby="activity-h">
              <h2 id="activity-h" className="font-display text-lg text-ink-900 mb-2">
                Activity
              </h2>
              <ul className="flex flex-col gap-1.5">
                {data.activity
                  .filter((a) => a.event_type !== 'NOTE')
                  .map((a, i) => (
                    <li key={i} className="flex items-baseline gap-3 text-sm">
                      <span className="text-ink-500 font-mono text-xs whitespace-nowrap">
                        {new Date(a.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-ink-700">{a.summary ?? a.event_type}</span>
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </>
      )}
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-ink-500 text-xs uppercase tracking-wide">{label}</dt>
      <dd className="text-ink-900">{value ?? '—'}</dd>
    </div>
  );
}

const RESOLUTION_TYPES = [
  { value: 'engaged', label: 'Engaged the client' },
  { value: 'referred_out', label: 'Referred out' },
  { value: 'not_viable', label: 'Not viable' },
  { value: 'claimant_unresponsive', label: 'Claimant unresponsive' },
  { value: 'claimant_declined', label: 'Claimant declined' },
] as const;

const BTN = 'inline-flex items-center justify-center min-h-[44px] px-4 rounded-md font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors';
const BTN_PRIMARY = `${BTN} bg-accent-500 text-white hover:bg-accent-600 focus-visible:outline-accent-600`;
const BTN_SECONDARY = `${BTN} border border-surface-200 text-ink-900 hover:border-accent-500 focus-visible:outline-accent-600`;

function ActionBar({
  status,
  caseId,
  onDone,
}: {
  status: string;
  caseId: string;
  onDone: () => Promise<void> | void;
}) {
  const [mode, setMode] = useState<'idle' | 'declining' | 'resolving'>('idle');
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');
  const [resolutionType, setResolutionType] = useState<string>(RESOLUTION_TYPES[0].value);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: PortalCaseAction, opts?: { reason?: string; resolutionType?: string }) => {
    setBusy(true);
    setError(null);
    try {
      await transitionPortalCase(caseId, action, opts);
      setMode('idle');
      setReason('');
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  // No actions for terminal / declined cases.
  if (status === 'resolved' || status === 'closed' || status === 'declined' || status === 'reclaimed') {
    return null;
  }

  return (
    <div className="mb-8">
      {error && (
        <p role="alert" className="text-danger-500 mb-2 text-sm">
          {error}
        </p>
      )}

      {mode === 'idle' && (
        <div className="flex flex-wrap gap-2">
          {status === 'new' && (
            <button type="button" disabled={busy} onClick={() => void run('accept')} className={BTN_PRIMARY}>
              Accept
            </button>
          )}
          {status === 'accepted' && (
            <button type="button" disabled={busy} onClick={() => void run('begin_work')} className={BTN_PRIMARY}>
              Start work
            </button>
          )}
          {status === 'working' && (
            <button type="button" disabled={busy} onClick={() => setMode('resolving')} className={BTN_PRIMARY}>
              Resolve
            </button>
          )}
          {(status === 'new' || status === 'accepted') && (
            <button type="button" disabled={busy} onClick={() => setMode('declining')} className={BTN_SECONDARY}>
              Decline
            </button>
          )}
        </div>
      )}

      {mode === 'declining' && (
        <div className="rounded-md border border-surface-200 bg-white p-4 max-w-lg">
          <label htmlFor="decline-reason" className="block text-ink-900 font-medium mb-1">
            Why are you declining?
          </label>
          <textarea
            id="decline-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-surface-200 px-3 py-2 text-ink-900 mb-3"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || reason.trim() === ''}
              onClick={() => void run('decline', { reason: reason.trim() })}
              className={`${BTN_PRIMARY} disabled:opacity-60`}
            >
              Confirm decline
            </button>
            <button type="button" disabled={busy} onClick={() => setMode('idle')} className={BTN_SECONDARY}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === 'resolving' && (
        <div className="rounded-md border border-surface-200 bg-white p-4 max-w-lg">
          <label htmlFor="resolution-type" className="block text-ink-900 font-medium mb-1">
            How was this resolved?
          </label>
          <select
            id="resolution-type"
            value={resolutionType}
            onChange={(e) => setResolutionType(e.target.value)}
            className="w-full rounded-md border border-surface-200 px-3 py-2 text-ink-900 mb-3"
          >
            {RESOLUTION_TYPES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void run('resolve', { resolutionType })}
              className={BTN_PRIMARY}
            >
              Confirm resolve
            </button>
            <button type="button" disabled={busy} onClick={() => setMode('idle')} className={BTN_SECONDARY}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NotesPanel({
  caseId,
  notes,
  onAdded,
}: {
  caseId: string;
  notes: PortalCaseActivityEntry[];
  onAdded: () => Promise<void> | void;
}) {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    const text = body.trim();
    if (!text) return;
    setBusy(true);
    setError(null);
    try {
      await addPortalCaseNote(caseId, text);
      setBody('');
      await onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the note');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="notes-h" className="mb-8">
      <h2 id="notes-h" className="font-display text-lg text-ink-900 mb-2">
        Notes
      </h2>

      {notes.length > 0 && (
        <ul className="flex flex-col gap-2 mb-3">
          {notes.map((n, i) => (
            <li key={i} className="rounded-md border border-surface-200 bg-white px-4 py-3">
              <p className="text-ink-900 whitespace-pre-wrap">{n.summary}</p>
              <p className="text-ink-500 text-xs mt-1">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="max-w-lg">
        <label htmlFor="new-note" className="sr-only">
          Add a note
        </label>
        <textarea
          id="new-note"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Add a note…"
          className="w-full rounded-md border border-surface-200 px-3 py-2 text-ink-900 mb-2"
        />
        {error && (
          <p role="alert" className="text-danger-500 text-sm mb-2">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={busy || body.trim() === ''}
          onClick={() => void add()}
          className={`${BTN_SECONDARY} disabled:opacity-60`}
        >
          Add note
        </button>
      </div>
    </section>
  );
}
