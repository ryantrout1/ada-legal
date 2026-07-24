/**
 * AdminIntakeDetail — one completed intake, in full.
 *
 * Adopted from Base44's AdminIntakeDetail (@ 6b1e9ac), which had no
 * counterpart on this side: AdminIntakes listed rows that led nowhere.
 *
 * Reads /api/admin/intakes/[id], which already returned everything this
 * needs — the session, its classification, extracted fields, full
 * conversation history, the quality check, and the matched firm and
 * listing. No endpoint change was required.
 *
 * The transcript reuses MessageContent, the same renderer the attorney
 * portal uses for Ada transcripts, so an intake reads identically to
 * an admin and to the lawyer who receives it. Divergent renderers are
 * how two people end up describing the same conversation differently.
 *
 * Ada-generated content is visually distinct from claimant speech
 * throughout — an admin skimming for what the claimant actually said
 * should never have to work out who is talking.
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import MessageContent from '../../components/MessageContent.js';

interface Message {
  role: string;
  content: string;
}

interface IntakeSession {
  session_id: string;
  session_type: string | null;
  status: string | null;
  reading_level: string | null;
  classification: Record<string, unknown> | null;
  conversation_history: Message[] | null;
  extracted_fields: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  is_test: boolean | null;
  listing_id: string | null;
}

interface QualityCheck {
  passed: boolean;
  failures: string[] | null;
  warnings: string[] | null;
  checked_at: string | null;
}

interface Payload {
  session: IntakeSession;
  quality_check: QualityCheck | null;
  firm: { id: string; name: string } | null;
  listing: { id: string; case_name?: string; slug?: string } | null;
}

const card = 'rounded-lg border border-surface-200 bg-white p-4 mb-4';
const label =
  'font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-500 mb-2 block';

function Facts({ data }: { data: Record<string, unknown> | null }) {
  const entries = Object.entries(data ?? {}).filter(
    ([, v]) => v !== null && v !== undefined && v !== '',
  );
  if (entries.length === 0) {
    return <p className="text-sm text-ink-500 m-0">Nothing recorded.</p>;
  }
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 m-0 text-sm">
      {entries.map(([k, v]) => (
        <span key={k} style={{ display: 'contents' }}>
          <dt className="text-ink-500 font-medium">{k}</dt>
          <dd className="m-0 text-ink-900 break-words">
            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
          </dd>
        </span>
      ))}
    </dl>
  );
}

export default function AdminIntakeDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch(`/api/admin/intakes/${encodeURIComponent(id)}`, {
          credentials: 'include',
        });
        if (resp.status === 404) throw new Error('That intake no longer exists.');
        if (!resp.ok) throw new Error(`Couldn't load the intake (${resp.status}).`);
        const body = (await resp.json()) as Payload;
        if (!cancelled) setData(body);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div>
        <Link to="/admin/intakes" className="text-sm underline text-accent-600">
          ← Back to intakes
        </Link>
        <div role="alert" className={`${card} mt-4`}>
          {error}
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-sm text-ink-500">Loading intake…</p>;

  const { session, quality_check: qc, firm, listing } = data;
  const messages = Array.isArray(session.conversation_history)
    ? session.conversation_history
    : [];

  return (
    <div>
      <Link to="/admin/intakes" className="text-sm underline text-accent-600">
        ← Back to intakes
      </Link>

      <header className="mt-3 mb-4">
        <h1 className="font-display text-2xl text-ink-900 m-0">Intake</h1>
        <p className="font-mono text-xs text-ink-500 mt-1 m-0">{session.session_id}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {session.status && (
            <span className="text-xs px-2 py-1 rounded-full border border-surface-300 text-ink-700">
              {session.status}
            </span>
          )}
          {session.reading_level && (
            <span className="text-xs px-2 py-1 rounded-full border border-surface-300 text-ink-700">
              Reading level: {session.reading_level}
            </span>
          )}
          {session.is_test && (
            // Test rows look exactly like real ones otherwise, and
            // mistaking one for a real claimant wastes real work.
            <span className="text-xs px-2 py-1 rounded-full border border-warning-500 text-warning-500 font-semibold">
              TEST SESSION
            </span>
          )}
        </div>
      </header>

      {(firm || listing) && (
        <section className={card}>
          <span className={label}>Match</span>
          <p className="text-sm text-ink-900 m-0">
            {listing?.case_name ?? listing?.slug ?? 'No litigation matched'}
            {firm ? ` · routed to ${firm.name}` : ' · no firm assigned'}
          </p>
        </section>
      )}

      {qc && (
        <section className={card}>
          <span className={label}>Quality check</span>
          <p className="text-sm m-0 mb-2">
            <span
              className={
                qc.passed ? 'text-success-500 font-semibold' : 'text-danger-500 font-semibold'
              }
            >
              {qc.passed ? 'Passed' : 'Failed'}
            </span>
            {qc.checked_at && (
              <span className="text-ink-500"> · {new Date(qc.checked_at).toLocaleString()}</span>
            )}
          </p>
          {(qc.failures ?? []).length > 0 && (
            <ul className="text-sm text-ink-900 pl-5 m-0 mb-2">
              {qc.failures!.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
          {(qc.warnings ?? []).length > 0 && (
            <ul className="text-sm text-ink-700 pl-5 m-0">
              {qc.warnings!.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className={card}>
        <span className={label}>Classification</span>
        <Facts data={session.classification} />
      </section>

      <section className={card}>
        <span className={label}>What Ada extracted</span>
        <Facts data={session.extracted_fields} />
      </section>

      <section className={card}>
        <span className={label}>Conversation ({messages.length} messages)</span>
        {messages.length === 0 ? (
          <p className="text-sm text-ink-500 m-0">No transcript recorded.</p>
        ) : (
          <ol className="list-none p-0 m-0 flex flex-col gap-3">
            {messages.map((m, i) => {
              const isAda = m.role !== 'user';
              return (
                <li
                  key={i}
                  className={
                    'rounded-md p-3 text-sm ' +
                    (isAda
                      ? 'bg-surface-100 border border-surface-200'
                      : 'bg-white border border-accent-600/30')
                  }
                >
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink-500 block mb-1">
                    {isAda ? 'Ada' : 'Claimant'}
                  </span>
                  <MessageContent content={m.content ?? ''} />
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
