/**
 * PortalCaseDetail — the Matter Detail screen (Phase 5 §7.3).
 *
 * Rebuilt to the mockup's anatomy: a header card (matter id · Claimant v.
 * Defendant · status pills · meta grid), a tab row (Overview · Ada intake ·
 * Activity · Notes · Tasks · Documents · Communications), and a right rail
 * (Next step · Key dates · People · Defendant). Overview leads with the Ada
 * intake as a purple hero, then the activity timeline.
 *
 * Server enforces the firm boundary + consent gate (an out-of-firm/unconsented
 * id → 404). Honest-data discipline: SOL is attorney-set (never computed; "Not
 * set" until entered); Documents, Communications, Defendant, and team/People
 * beyond the claimant show honest "coming" states — no fabricated data.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  CalendarClock,
  Users,
  Building2,
  FileText,
  MessagesSquare,
  X,
  Plus,
  ExternalLink,
  Upload,
  Download,
} from 'lucide-react';
import TaskPanel from './TaskPanel.js';
import MessageContent from '../../components/MessageContent.js';
import {
  fetchPortalCase,
  fetchCaseTasks,
  transitionPortalCase,
  addPortalCaseNote,
  setCaseSolDate,
  setCaseDefendant,
  fetchCasePeople,
  addCasePerson,
  removeCasePerson,
  fetchCaseDocuments,
  addCaseDocument,
  uploadCaseDocument,
  caseDocumentDownloadUrl,
  removeCaseDocument,
  fetchFirmAttorneys,
  reassignCaseOwner,
  type PortalFirmAttorney,
  type PortalCaseAction,
  type PortalCaseActivityEntry,
  type PortalTask,
  type PortalDefendant,
  type PortalPerson,
  type PortalDocument,
  PortalApiError,
  type PortalCaseDetailResponse,
} from '../../data/portalClient.js';

const STAGE_LABEL: Record<string, string> = {
  new: 'New',
  investigating: 'Investigating',
  demand_sent: 'Demand sent',
  negotiating: 'Negotiating',
  resolved: 'Resolved',
  closed: 'Closed',
  declined: 'Declined',
  reclaimed: 'Reclaimed',
};
const STAGE_PILL: Record<string, string> = {
  new: 'terra',
  investigating: 'blue',
  demand_sent: 'amber',
  negotiating: 'purple',
  resolved: 'green',
  closed: 'gray',
  declined: 'gray',
  reclaimed: 'amber',
};

const TABS = ['Overview', 'Ada intake', 'Activity', 'Notes', 'Tasks', 'Documents', 'Communications'] as const;
type Tab = (typeof TABS)[number];

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  return new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
function monthDay(iso: string): { month: string; day: string } {
  const d = new Date(iso);
  return {
    month: d.toLocaleDateString(undefined, { month: 'short' }),
    day: d.toLocaleDateString(undefined, { day: '2-digit' }),
  };
}

export default function PortalCaseDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PortalCaseDetailResponse | null>(null);
  const [tasks, setTasks] = useState<PortalTask[]>([]);
  const [tab, setTab] = useState<Tab>('Overview');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauth, setUnauth] = useState(false);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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
      try {
        setTasks(await fetchCaseTasks(id));
      } catch {
        setTasks([]);
      }
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

  const notes = useMemo(() => (data ? data.activity.filter((a) => a.event_type === 'NOTE') : []), [data]);
  const timeline = useMemo(() => (data ? data.activity.filter((a) => a.event_type !== 'NOTE') : []), [data]);
  const openTasks = useMemo(
    () => tasks.filter((t) => !t.completed_at).sort((a, b) => (a.due_date ?? '~').localeCompare(b.due_date ?? '~')),
    [tasks],
  );

  if (unauth) return <Navigate to="/portal/sign-in" replace />;

  if (notFound) {
    return (
      <section role="alert" className="rounded-lg border border-control-border bg-white px-5 py-6">
        <h1 className="font-display text-2xl text-ink-900 mb-2">Case not found</h1>
        <p className="text-ink-700">
          This case isn’t available to your firm.{' '}
          <Link to="/portal" className="text-accent-500 underline">Back to the inbox</Link>
        </p>
      </section>
    );
  }

  if (loading && !data) return <p className="text-ink-500">Loading…</p>;
  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-danger-500 bg-danger-50 px-4 py-3 text-danger-500">
        {error}{' '}
        <button type="button" onClick={() => void load()} className="underline font-medium">Retry</button>
      </div>
    );
  }
  if (!data) return null;

  const tabCount = (t: Tab): number | null => {
    if (t === 'Ada intake') return data.qualifying_answers.length || null;
    if (t === 'Activity') return timeline.length || null;
    if (t === 'Notes') return notes.length || null;
    if (t === 'Tasks') return openTasks.length || null;
    return null;
  };

  const onTabKey = (e: React.KeyboardEvent, idx: number) => {
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (idx + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    if (next === null) return;
    e.preventDefault();
    const nt = TABS[next];
    setTab(nt);
    tabRefs.current[nt]?.focus();
  };

  return (
    <section>
      <nav className="mb-4">
        <Link to="/portal" className="inline-flex items-center gap-1.5 text-sm text-accent-500 hover:text-accent-600">
          <ArrowLeft size={15} aria-hidden="true" /> Back to inbox
        </Link>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Left column */}
        <div className="min-w-0">
          {/* Header card */}
          <div className="rounded-lg border border-control-border bg-white p-6 mb-4">
            <p className="text-ink-500 text-xs font-mono tracking-wider mb-2">
              {data.case_number} · OPENED {fmtDate(data.created_at).toUpperCase()}
            </p>
            <h1 className="font-display text-2xl text-ink-900 leading-tight">
              {data.claimant_name ?? 'Claimant'}
              {data.defendant?.name && (
                <span className="text-ink-500 font-normal"> v. {data.defendant.name}</span>
              )}
            </h1>

            <div className="flex flex-wrap gap-2 mt-4">
              <span className={`lw-pill ${STAGE_PILL[data.status] ?? 'gray'}`}>
                <span className="lw-pill-dot" />
                {STAGE_LABEL[data.status] ?? data.status}
              </span>
              {data.classification_title && <span className="lw-pill purple">{data.classification_title}</span>}
              {data.jurisdiction_state && (
                <span className="lw-pill blue"><span className="lw-pill-dot" />{data.jurisdiction_state}</span>
              )}
              {data.consent_to_share && <span className="lw-pill green">Consented</span>}
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-surface-200">
              <SolField caseId={data.case_id} solDate={data.sol_date} onSaved={load} />
              <MetaCell label="First contact due" value={fmtDate(data.first_contact_due)} />
              <MetaCell label="Source" value="ADA Legal Link · Ada" />
              <MetaCell label="Matched case" value={data.case_name ?? '—'} />
            </dl>
          </div>

          <ActionBar status={data.status} caseId={data.case_id} onDone={load} />

          {/* Tabs */}
          <div className="rounded-t-lg border border-control-border border-b-0 bg-white px-2 flex gap-0 overflow-x-auto" role="tablist" aria-label="Case sections">
            {TABS.map((t, idx) => {
              const count = tabCount(t);
              const on = tab === t;
              return (
                <button
                  key={t}
                  ref={(el) => { tabRefs.current[t] = el; }}
                  id={`case-tab-${idx}`}
                  role="tab"
                  aria-selected={on}
                  aria-controls="case-tabpanel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => setTab(t)}
                  onKeyDown={(e) => onTabKey(e, idx)}
                  className={`inline-flex items-center gap-2 min-h-[44px] px-3.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    on ? 'border-accent-500 text-accent-600' : 'border-transparent text-ink-500 hover:text-ink-700'
                  }`}
                >
                  {t}
                  {count != null && (
                    <span className="text-xs font-bold rounded-full bg-surface-100 px-1.5 text-ink-500">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div
            id="case-tabpanel"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby={`case-tab-${TABS.indexOf(tab)}`}
            className="rounded-b-lg border border-control-border bg-white p-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {tab === 'Overview' && <Overview data={data} timeline={timeline} />}
            {tab === 'Ada intake' && <AdaIntake data={data} />}
            {tab === 'Activity' && <ActivityTab timeline={timeline} />}
            {tab === 'Notes' && <NotesPanel caseId={data.case_id} notes={notes} onAdded={load} />}
            {tab === 'Tasks' && <TaskPanel caseId={data.case_id} />}
            {tab === 'Documents' && <DocumentsPanel caseId={data.case_id} />}
            {tab === 'Communications' && (
              <StubPanel icon={<MessagesSquare size={22} aria-hidden="true" />} title="Communications" blurb="A dedicated communications log is coming soon. Notes covers contact records in the meantime." />
            )}
          </div>
        </div>

        {/* Right rail */}
        <aside className="flex flex-col gap-4">
          <NextStep openTasks={openTasks} solDate={data.sol_date} />
          <OwnerCard
            caseId={data.case_id}
            ownerId={data.assigned_lawyer_id}
            ownerName={data.assigned_lawyer_name}
            onReassigned={load}
          />
          <KeyDates openTasks={openTasks} solDate={data.sol_date} firstContactDue={data.first_contact_due} />
          <PeopleCard caseId={data.case_id} claimant={data.claimant_name} email={data.claimant_email} phone={data.claimant_phone} />
          <DefendantCard caseId={data.case_id} defendant={data.defendant} onSaved={load} />
        </aside>
      </div>
    </section>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-500 text-[10px] uppercase tracking-wider font-bold mb-1">{label}</dt>
      <dd className="text-ink-900 text-sm font-semibold">{value}</dd>
    </div>
  );
}

function SolField({ caseId, solDate, onSaved }: { caseId: string; solDate: string | null; onSaved: () => Promise<void> | void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(solDate ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (next: string | null) => {
    setBusy(true);
    setError(null);
    try {
      await setCaseSolDate(caseId, next);
      setEditing(false);
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <dt className="text-ink-500 text-[10px] uppercase tracking-wider font-bold mb-1">Statute of limitations</dt>
      {editing ? (
        <div>
          <label htmlFor="sol-input" className="sr-only">Statute of limitations date</label>
          <input
            id="sol-input"
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full min-h-[36px] rounded-md border border-control-border bg-white px-2 text-ink-900 text-sm mb-1"
          />
          <div className="flex gap-1.5">
            <button type="button" disabled={busy || !value} onClick={() => void save(value)} className="text-xs font-semibold text-accent-600 underline disabled:opacity-50 min-h-[44px] pr-2">Save</button>
            {solDate && <button type="button" disabled={busy} onClick={() => void save(null)} className="text-xs text-ink-500 underline min-h-[44px] px-1">Clear</button>}
            <button type="button" disabled={busy} onClick={() => { setEditing(false); setValue(solDate ?? ''); }} className="text-xs text-ink-500 underline min-h-[44px] px-1">Cancel</button>
          </div>
          {error && <p role="alert" className="text-danger-500 text-xs mt-1">{error}</p>}
        </div>
      ) : (
        <dd className="text-ink-900 text-sm font-semibold flex items-center gap-2">
          {solDate ? fmtDate(solDate) : <span className="text-ink-500 font-normal">Not set</span>}
          <button type="button" onClick={() => setEditing(true)} className="text-xs text-accent-600 underline font-normal">
            {solDate ? 'Edit' : 'Set'}
          </button>
        </dd>
      )}
    </div>
  );
}

function Overview({ data, timeline }: { data: PortalCaseDetailResponse; timeline: PortalCaseActivityEntry[] }) {
  return (
    <div>
      {/* Ada intake hero */}
      <div className="relative rounded-lg border border-surface-200 bg-surface-50 p-5 pl-6 mb-6">
        <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-ada-500" aria-hidden="true" />
        <div className="flex items-center gap-2 text-ada-600 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles size={13} aria-hidden="true" /> Ada intake summary
        </div>
        {data.qualifying_answers.length === 0 ? (
          <p className="text-ink-700 text-sm">
            No structured intake answers were captured. See the <strong>Ada intake</strong> tab for the full conversation.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.qualifying_answers.map((a) => (
              <div key={a.question} className="rounded-md border border-surface-200 bg-white px-3 py-2.5">
                <div className="text-ink-500 text-[10px] uppercase tracking-wide font-bold mb-1">
                  {a.question.replace(/_/g, ' ')}
                </div>
                <div className="text-ink-900 text-sm font-medium">{a.answer}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 className="font-display text-base text-ink-900 mb-3">Recent activity</h2>
      <Timeline entries={timeline.slice(-6)} />
    </div>
  );
}

function AdaIntake({ data }: { data: PortalCaseDetailResponse }) {
  return (
    <div>
      {data.qualifying_answers.length > 0 && (
        <section aria-labelledby="qq-h" className="mb-6">
          <h2 id="qq-h" className="font-display text-base text-ink-900 mb-2">Intake answers</h2>
          <dl className="flex flex-col gap-2">
            {data.qualifying_answers.map((a) => (
              <div key={a.question} className="rounded-md border border-surface-200 bg-surface-50 px-4 py-3">
                <dt className="text-ink-500 text-xs uppercase tracking-wide mb-0.5">{a.question.replace(/_/g, ' ')}</dt>
                <dd className="text-ink-900">{a.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      <h2 className="font-display text-base text-ink-900 mb-2">Conversation</h2>
      {data.transcript.length === 0 ? (
        <p className="text-ink-500 text-sm">No transcript.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.transcript.map((m, i) => (
            <li key={i} className="rounded-md border border-surface-200 bg-surface-50 px-4 py-3">
              <div className="text-ink-500 text-xs uppercase tracking-wide mb-1">
                {m.role === 'assistant' ? 'Ada' : m.role === 'user' ? 'Claimant' : m.role}
              </div>
              <MessageContent content={m.content} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActivityTab({ timeline }: { timeline: PortalCaseActivityEntry[] }) {
  if (timeline.length === 0) return <p className="text-ink-500 text-sm">No activity yet.</p>;
  return <Timeline entries={[...timeline].reverse()} />;
}

function Timeline({ entries }: { entries: PortalCaseActivityEntry[] }) {
  if (entries.length === 0) return <p className="text-ink-500 text-sm">No activity yet.</p>;
  return (
    <ol className="relative pl-6">
      <span className="absolute left-[6px] top-1.5 bottom-1.5 w-px bg-surface-200" aria-hidden="true" />
      {entries.map((a, i) => (
        <li key={i} className="relative pb-4 last:pb-0">
          <span
            className={`absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-white border-2 ${
              a.actor_type === 'user' ? 'border-accent-500' : 'border-success-500'
            }`}
            aria-hidden="true"
          />
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-ink-900 text-sm">{a.summary ?? a.event_type}</span>
            <span className="text-ink-500 text-xs font-mono ml-auto whitespace-nowrap">{fmtDate(a.created_at)}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function DocumentsPanel({ caseId }: { caseId: string }) {
  const [docs, setDocs] = useState<PortalDocument[]>([]);
  const [adding, setAdding] = useState(false);
  const [filename, setFilename] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      setDocs(await fetchCaseDocuments(caseId));
    } catch {
      setDocs([]);
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await uploadCaseDocument(caseId, file);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const add = async () => {
    if (filename.trim() === '' || url.trim() === '') return;
    setBusy(true);
    setError(null);
    try {
      await addCaseDocument(caseId, { filename: filename.trim(), url: url.trim() });
      setFilename('');
      setUrl('');
      setAdding(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not attach the document');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await removeCaseDocument(caseId, id);
      await load();
    } catch {
      /* surfaced on reload */
    } finally {
      setBusy(false);
    }
  };

  const fieldCls = 'w-full min-h-[44px] rounded-md border border-control-border bg-white px-3 text-ink-900 text-sm';

  return (
    <section aria-labelledby="docs-h">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 id="docs-h" className="font-display text-base text-ink-900">Documents</h2>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => void onFile(e)}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-lg bg-accent-500 text-white text-sm font-semibold hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
          >
            <Upload size={15} aria-hidden="true" /> {uploading ? 'Uploading…' : 'Upload'}
          </button>
          {!adding && (
            <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-lg border border-control-border text-ink-700 text-sm font-semibold hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
              <Plus size={15} aria-hidden="true" /> Attach link
            </button>
          )}
        </div>
      </div>

      {error && !adding && <p role="alert" className="text-danger-500 text-xs mb-3">{error}</p>}

      {adding && (
        <div className="rounded-lg border border-surface-200 bg-surface-50 p-4 mb-4 flex flex-col gap-2">
          <div>
            <label htmlFor="doc-name" className="block text-ink-700 text-xs font-semibold mb-1">File name</label>
            <input id="doc-name" value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="demand-letter.pdf" className={fieldCls} />
          </div>
          <div>
            <label htmlFor="doc-url" className="block text-ink-700 text-xs font-semibold mb-1">Link</label>
            <input id="doc-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className={fieldCls} />
            <p className="text-ink-500 text-xs mt-1">Paste a link to the file in your document system or drive.</p>
          </div>
          {error && <p role="alert" className="text-danger-500 text-xs">{error}</p>}
          <div className="flex gap-2 mt-1">
            <button type="button" disabled={busy || filename.trim() === '' || url.trim() === ''} onClick={() => void add()} className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg bg-accent-500 text-white text-sm font-semibold hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">Attach</button>
            <button type="button" disabled={busy} onClick={() => { setAdding(false); setFilename(''); setUrl(''); setError(null); }} className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg border border-control-border text-ink-700 text-sm font-medium hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Cancel</button>
          </div>
        </div>
      )}

      {docs.length === 0 && !adding ? (
        <p className="text-ink-500 text-sm">No documents attached yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {docs.map((d) => {
            const isBlob = d.storageKind === 'blob';
            const href = isBlob ? caseDocumentDownloadUrl(caseId, d.id) : d.url;
            return (
            <li key={d.id} className="flex items-center gap-3 rounded-md border border-surface-200 bg-white px-4 py-3">
              <FileText size={18} className="text-ink-500 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-ink-900 text-sm font-semibold hover:text-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm truncate inline-flex items-center gap-1">
                  {d.filename}
                  {isBlob ? <Download size={12} aria-hidden="true" /> : <ExternalLink size={12} aria-hidden="true" />}
                </a>
                <div className="text-ink-500 text-xs mt-0.5">
                  {isBlob ? 'Uploaded' : 'Linked'} {fmtDate(d.uploadedAt)}
                </div>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove(d.id)}
                aria-label={`Remove ${d.filename}`}
                className="inline-flex items-center justify-center w-11 h-11 rounded-md text-ink-500 hover:text-danger-500 hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function StubPanel({ icon, title, blurb }: { icon: React.ReactNode; title: string; blurb: string }) {
  return (
    <div className="text-center py-10">
      <div className="inline-flex text-ink-500 mb-3">{icon}</div>
      <span className="block text-[11px] font-bold uppercase tracking-wider text-accent-500 mb-1">Coming soon</span>
      <h2 className="font-display text-lg text-ink-900 mb-1">{title}</h2>
      <p className="text-ink-500 text-sm max-w-sm mx-auto">{blurb}</p>
    </div>
  );
}

function NextStep({ openTasks, solDate }: { openTasks: PortalTask[]; solDate: string | null }) {
  const next = openTasks.find((t) => t.due_date) ?? openTasks[0];
  return (
    <div className="rounded-lg border border-accent-500/40 bg-accent-50 p-4">
      <div className="text-accent-600 text-[10px] uppercase tracking-wider font-bold mb-1">Next step</div>
      {next ? (
        <>
          <div className="text-ink-900 font-semibold text-sm leading-snug">{next.title}</div>
          {next.due_date && <div className="text-ink-500 text-xs mt-1.5">Due {fmtDate(next.due_date)}</div>}
        </>
      ) : solDate ? (
        <div className="text-ink-900 font-semibold text-sm leading-snug">
          Plan the matter before the SOL ({fmtDate(solDate)}).
        </div>
      ) : (
        <div className="text-ink-700 text-sm">Open the Tasks tab to plan next steps.</div>
      )}
    </div>
  );
}

function OwnerCard({
  caseId,
  ownerId,
  ownerName,
  onReassigned,
}: {
  caseId: string;
  ownerId: string | null;
  ownerName: string | null;
  onReassigned: () => Promise<void> | void;
}) {
  const [roster, setRoster] = useState<PortalFirmAttorney[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchFirmAttorneys()
      .then((r) => {
        if (live) setRoster(r);
      })
      .catch(() => {
        /* roster optional — the card still shows the current owner */
      });
    return () => {
      live = false;
    };
  }, []);

  const reassign = useCallback(
    async (attorneyId: string) => {
      if (!attorneyId || attorneyId === (ownerId ?? '')) return;
      setBusy(true);
      setError(null);
      try {
        await reassignCaseOwner(caseId, attorneyId);
        await onReassigned();
      } catch (err) {
        setError(err instanceof PortalApiError ? err.message : 'Could not reassign this matter.');
      } finally {
        setBusy(false);
      }
    },
    [caseId, ownerId, onReassigned],
  );

  return (
    <div className="rounded-lg border border-control-border bg-white p-5">
      <h3 className="text-ink-500 text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
        <Users size={14} aria-hidden="true" /> Owner
      </h3>
      <p className="text-sm font-semibold text-ink-900 mb-3">
        {ownerName ?? <span className="font-normal italic text-ink-500">Unassigned</span>}
      </p>
      <label className="block text-xs font-bold uppercase tracking-wide text-ink-500 mb-1">
        Reassign to
        <select
          value={ownerId ?? ''}
          disabled={busy}
          onChange={(e) => void reassign(e.target.value)}
          className="mt-1 w-full min-h-[44px] rounded-md border border-control-border bg-white px-3 text-sm font-semibold text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
        >
          <option value="" disabled>
            Choose an attorney…
          </option>
          {roster.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger-500">
          {error}
        </p>
      )}
    </div>
  );
}

function KeyDates({
  openTasks,
  solDate,
  firstContactDue,
}: {
  openTasks: PortalTask[];
  solDate: string | null;
  firstContactDue: string | null;
}) {
  const dates: { iso: string; title: string; meta?: string }[] = [];
  if (firstContactDue) dates.push({ iso: firstContactDue, title: 'First contact due' });
  for (const t of openTasks) if (t.due_date) dates.push({ iso: t.due_date, title: t.title });
  if (solDate) dates.push({ iso: solDate, title: 'Statute of limitations', meta: 'Attorney-set' });
  dates.sort((a, b) => a.iso.localeCompare(b.iso));

  return (
    <div className="rounded-lg border border-control-border bg-white p-5">
      <h3 className="text-ink-500 text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
        <CalendarClock size={14} aria-hidden="true" /> Key dates
      </h3>
      {dates.length === 0 ? (
        <p className="text-ink-500 text-sm">No key dates yet. Set the SOL or add a task with a due date.</p>
      ) : (
        <ul className="flex flex-col">
          {dates.map((d, i) => {
            const md = monthDay(d.iso);
            return (
              <li key={i} className="flex items-center gap-3 py-2.5 border-b border-surface-200 last:border-b-0">
                <div className="w-11 text-center shrink-0">
                  <div className="text-accent-500 text-[9px] font-bold uppercase tracking-wide">{md.month}</div>
                  <div className="font-display text-xl text-ink-900 leading-none">{md.day}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-ink-900 text-sm font-semibold leading-tight">{d.title}</div>
                  {d.meta && <div className="text-ink-500 text-xs mt-0.5">{d.meta}</div>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return '·';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

const ROLE_LABEL: Record<string, string> = {
  witness: 'Witness',
  expert: 'Expert',
  opposing_counsel: 'Opposing counsel',
  other: 'Other',
};
const ROLE_OPTIONS = ['witness', 'expert', 'opposing_counsel', 'other'] as const;

function PeopleCard({
  caseId,
  claimant,
  email,
  phone,
}: {
  caseId: string;
  claimant: string | null;
  email: string | null;
  phone: string | null;
}) {
  const [people, setPeople] = useState<PortalPerson[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>('witness');
  const [contact, setContact] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setPeople(await fetchCasePeople(caseId));
    } catch {
      setPeople([]);
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    if (name.trim() === '') return;
    setBusy(true);
    setError(null);
    try {
      const looksEmail = contact.includes('@');
      await addCasePerson(caseId, {
        name: name.trim(),
        role,
        email: looksEmail ? contact.trim() || null : null,
        phone: !looksEmail ? contact.trim() || null : null,
      });
      setName('');
      setContact('');
      setRole('witness');
      setAdding(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await removeCasePerson(caseId, id);
      await load();
    } catch {
      /* surfaced on reload */
    } finally {
      setBusy(false);
    }
  };

  const fieldCls = 'w-full min-h-[44px] rounded-md border border-control-border bg-white px-2 text-ink-900 text-sm';

  return (
    <div className="rounded-lg border border-control-border bg-white p-5">
      <h3 className="text-ink-500 text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
        <Users size={14} aria-hidden="true" /> People
      </h3>

      <div className="flex items-center gap-3 pb-3 border-b border-surface-200">
        <div className="w-8 h-8 rounded-full bg-ada-50 text-ada-600 flex items-center justify-center text-xs font-bold shrink-0" aria-hidden="true">
          {initials(claimant ?? 'Claimant')}
        </div>
        <div className="min-w-0">
          <div className="text-ink-900 text-sm font-semibold">{claimant ?? 'Claimant'}</div>
          <div className="text-ink-500 text-[11px] uppercase tracking-wide">Client</div>
          {(email || phone) && <div className="text-ink-500 text-xs mt-0.5 truncate">{email ?? phone}</div>}
        </div>
      </div>

      {people.length > 0 && (
        <ul className="flex flex-col">
          {people.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3 border-b border-surface-200 last:border-b-0">
              <div className="w-8 h-8 rounded-full bg-surface-100 text-ink-700 flex items-center justify-center text-xs font-bold shrink-0" aria-hidden="true">
                {initials(p.name ?? '?')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-ink-900 text-sm font-semibold truncate">{p.name ?? 'Unnamed'}</div>
                <div className="text-ink-500 text-[11px] uppercase tracking-wide">{ROLE_LABEL[p.role] ?? p.role}</div>
                {(p.email || p.phone) && <div className="text-ink-500 text-xs mt-0.5 truncate">{p.email ?? p.phone}</div>}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove(p.id)}
                aria-label={`Remove ${p.name ?? 'person'}`}
                className="inline-flex items-center justify-center w-11 h-11 rounded-md text-ink-500 hover:text-danger-500 hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-surface-200">
          <div>
            <label htmlFor="person-name" className="block text-ink-700 text-xs font-semibold mb-1">Name</label>
            <input id="person-name" value={name} onChange={(e) => setName(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label htmlFor="person-role" className="block text-ink-700 text-xs font-semibold mb-1">Role</label>
            <select id="person-role" value={role} onChange={(e) => setRole(e.target.value)} className={fieldCls}>
              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="person-contact" className="block text-ink-700 text-xs font-semibold mb-1">Email or phone <span className="font-normal text-ink-500">(optional)</span></label>
            <input id="person-contact" value={contact} onChange={(e) => setContact(e.target.value)} className={fieldCls} />
          </div>
          {error && <p role="alert" className="text-danger-500 text-xs">{error}</p>}
          <div className="flex gap-2 mt-1">
            <button type="button" disabled={busy || name.trim() === ''} onClick={() => void add()} className="inline-flex items-center justify-center min-h-[44px] px-3 rounded-lg bg-accent-500 text-white text-sm font-semibold hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">Add</button>
            <button type="button" disabled={busy} onClick={() => { setAdding(false); setName(''); setContact(''); setError(null); }} className="inline-flex items-center justify-center min-h-[44px] px-3 rounded-lg border border-control-border text-ink-700 text-sm font-medium hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Cancel</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="text-xs text-accent-600 underline mt-3">Add witness or contact</button>
      )}
    </div>
  );
}

function DefendantCard({
  caseId,
  defendant,
  onSaved,
}: {
  caseId: string;
  defendant: PortalDefendant | null;
  onSaved: () => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(defendant?.name ?? '');
  const [kind, setKind] = useState(defendant?.kind ?? '');
  const [address, setAddress] = useState(defendant?.address ?? '');
  const [notes, setNotes] = useState(defendant?.notes ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName(defendant?.name ?? '');
    setKind(defendant?.kind ?? '');
    setAddress(defendant?.address ?? '');
    setNotes(defendant?.notes ?? '');
  };

  const save = async (next: PortalDefendant | null) => {
    setBusy(true);
    setError(null);
    try {
      await setCaseDefendant(caseId, next);
      setEditing(false);
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const fieldCls = 'w-full min-h-[44px] rounded-md border border-control-border bg-white px-2 text-ink-900 text-sm';

  return (
    <div className="rounded-lg border border-control-border bg-white p-5">
      <h3 className="text-ink-500 text-xs font-bold uppercase tracking-wide mb-3 flex items-center gap-2">
        <Building2 size={14} aria-hidden="true" /> Defendant
      </h3>

      {editing ? (
        <div className="flex flex-col gap-2">
          <div>
            <label htmlFor="def-name" className="block text-ink-700 text-xs font-semibold mb-1">Name</label>
            <input id="def-name" value={name} onChange={(e) => setName(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label htmlFor="def-kind" className="block text-ink-700 text-xs font-semibold mb-1">Type <span className="font-normal text-ink-500">(optional)</span></label>
            <input id="def-kind" value={kind} onChange={(e) => setKind(e.target.value)} placeholder="business, government, individual…" className={fieldCls} />
          </div>
          <div>
            <label htmlFor="def-address" className="block text-ink-700 text-xs font-semibold mb-1">Address <span className="font-normal text-ink-500">(optional)</span></label>
            <input id="def-address" value={address} onChange={(e) => setAddress(e.target.value)} className={fieldCls} />
          </div>
          <div>
            <label htmlFor="def-notes" className="block text-ink-700 text-xs font-semibold mb-1">Notes <span className="font-normal text-ink-500">(optional)</span></label>
            <textarea id="def-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={fieldCls} />
          </div>
          {error && <p role="alert" className="text-danger-500 text-xs">{error}</p>}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              disabled={busy || name.trim() === ''}
              onClick={() => void save({ name: name.trim(), kind: kind.trim() || null, address: address.trim() || null, notes: notes.trim() || null })}
              className="inline-flex items-center justify-center min-h-[44px] px-3 rounded-lg bg-accent-500 text-white text-sm font-semibold hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
            >
              Save
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => { setEditing(false); reset(); }}
              className="inline-flex items-center justify-center min-h-[44px] px-3 rounded-lg border border-control-border text-ink-700 text-sm font-medium hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : defendant ? (
        <div>
          <div className="text-ink-900 text-sm font-semibold">{defendant.name}</div>
          {defendant.kind && <div className="text-ink-500 text-[11px] uppercase tracking-wide mt-0.5">{defendant.kind}</div>}
          {defendant.address && <div className="text-ink-700 text-xs mt-1.5">{defendant.address}</div>}
          {defendant.notes && <div className="text-ink-500 text-xs mt-1.5 whitespace-pre-wrap">{defendant.notes}</div>}
          <div className="flex gap-3 mt-3">
            <button type="button" onClick={() => setEditing(true)} className="text-xs text-accent-600 underline">Edit</button>
            <button type="button" disabled={busy} onClick={() => void save(null)} className="text-xs text-ink-500 underline">Clear</button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-ink-500 text-sm">Not recorded yet.</p>
          <button type="button" onClick={() => setEditing(true)} className="text-xs text-accent-600 underline mt-2">Add defendant</button>
        </div>
      )}
    </div>
  );
}

// ─── Lifecycle actions + notes (carried from Phase 2c/2d) ───────────────────

const RESOLUTION_TYPES = [
  { value: 'engaged', label: 'Engaged the client' },
  { value: 'referred_out', label: 'Referred out' },
  { value: 'not_viable', label: 'Not viable' },
  { value: 'claimant_unresponsive', label: 'Claimant unresponsive' },
  { value: 'claimant_declined', label: 'Claimant declined' },
] as const;

const BTN = 'inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors';
const BTN_PRIMARY = `${BTN} bg-accent-500 text-white hover:bg-accent-600`;
const BTN_SECONDARY = `${BTN} border border-control-border text-ink-900 hover:border-accent-500`;

function ActionBar({ status, caseId, onDone }: { status: string; caseId: string; onDone: () => Promise<void> | void }) {
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

  if (status === 'resolved' || status === 'closed' || status === 'declined' || status === 'reclaimed') return null;

  return (
    <div className="mb-4">
      {error && <p role="alert" className="text-danger-500 mb-2 text-sm">{error}</p>}

      {mode === 'idle' && (
        <div className="flex flex-wrap gap-2">
          {status === 'new' && <button type="button" disabled={busy} onClick={() => void run('accept')} className={BTN_PRIMARY}>Accept</button>}
          {status === 'investigating' && <button type="button" disabled={busy} onClick={() => void run('send_demand')} className={BTN_PRIMARY}>Send demand</button>}
          {status === 'demand_sent' && <button type="button" disabled={busy} onClick={() => void run('begin_negotiation')} className={BTN_PRIMARY}>Begin negotiation</button>}
          {(status === 'investigating' || status === 'demand_sent' || status === 'negotiating') && <button type="button" disabled={busy} onClick={() => setMode('resolving')} className={BTN_PRIMARY}>Resolve</button>}
          {(status === 'new' || status === 'investigating') && <button type="button" disabled={busy} onClick={() => setMode('declining')} className={BTN_SECONDARY}>Decline</button>}
        </div>
      )}

      {mode === 'declining' && (
        <div className="rounded-lg border border-control-border bg-white p-4 max-w-lg">
          <label htmlFor="decline-reason" className="block text-ink-900 font-medium mb-1">Why are you declining?</label>
          <textarea id="decline-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full rounded-md border border-control-border px-3 py-2 text-ink-900 mb-3" />
          <div className="flex gap-2">
            <button type="button" disabled={busy || reason.trim() === ''} onClick={() => void run('decline', { reason: reason.trim() })} className={`${BTN_PRIMARY} disabled:opacity-60`}>Confirm decline</button>
            <button type="button" disabled={busy} onClick={() => setMode('idle')} className={BTN_SECONDARY}>Cancel</button>
          </div>
        </div>
      )}

      {mode === 'resolving' && (
        <div className="rounded-lg border border-control-border bg-white p-4 max-w-lg">
          <label htmlFor="resolution-type" className="block text-ink-900 font-medium mb-1">How was this resolved?</label>
          <select id="resolution-type" value={resolutionType} onChange={(e) => setResolutionType(e.target.value)} className="w-full rounded-md border border-control-border px-3 py-2 text-ink-900 mb-3">
            {RESOLUTION_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => void run('resolve', { resolutionType })} className={BTN_PRIMARY}>Confirm resolve</button>
            <button type="button" disabled={busy} onClick={() => setMode('idle')} className={BTN_SECONDARY}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function NotesPanel({ caseId, notes, onAdded }: { caseId: string; notes: PortalCaseActivityEntry[]; onAdded: () => Promise<void> | void }) {
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
    <section aria-labelledby="notes-h">
      <h2 id="notes-h" className="font-display text-base text-ink-900 mb-3">Notes</h2>
      {notes.length > 0 && (
        <ul className="flex flex-col gap-2 mb-3">
          {notes.map((n, i) => (
            <li key={i} className="rounded-md border border-surface-200 bg-surface-50 px-4 py-3">
              <p className="text-ink-900 whitespace-pre-wrap">{n.summary}</p>
              <p className="text-ink-500 text-xs mt-1">{fmtDate(n.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="max-w-lg">
        <label htmlFor="new-note" className="sr-only">Add a note</label>
        <textarea id="new-note" value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="Add a note…" className="w-full rounded-md border border-control-border px-3 py-2 text-ink-900 mb-2" />
        {error && <p role="alert" className="text-danger-500 text-sm mb-2">{error}</p>}
        <button type="button" disabled={busy || body.trim() === ''} onClick={() => void add()} className={`${BTN_SECONDARY} disabled:opacity-60`}>Add note</button>
      </div>
    </section>
  );
}
