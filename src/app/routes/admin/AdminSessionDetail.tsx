/**
 * AdminSessionDetail — full view of a single session.
 *
 * Shows: metadata summary, classification, extracted fields, and the
 * complete conversation. Conversation content is sensitive — it lives
 * in UI state only and is never logged (DO_NOT_TOUCH rule 8).
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { ReadingLevel, SessionStatus } from '../../hooks/useAdminSessions.js';

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system' | 'tool_result';
  content: string | unknown;
  timestamp?: string;
}

interface SessionDetail {
  session_id: string;
  org_id: string;
  session_type: string;
  status: SessionStatus;
  reading_level: ReadingLevel;
  classification: {
    title?: string;
    tier?: string;
    reasoning?: string;
    standard?: string;
  } | null;
  conversation_history: ConversationMessage[];
  extracted_fields: Record<string, { value?: unknown; confidence?: number }>;
  metadata: Record<string, unknown>;
  accessibility_settings: Record<string, unknown>;
  is_test: boolean;
  anon_session_id: string | null;
  user_id: string | null;
}

interface QualityIssue {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface QualityCheck {
  passed: boolean;
  failures: QualityIssue[];
  warnings: QualityIssue[];
  checked_at: string;
}

export default function AdminSessionDetail() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [qualityCheck, setQualityCheck] = useState<QualityCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`/api/admin/sessions/${encodeURIComponent(id)}`, {
          credentials: 'include',
        });
        if (!resp.ok) {
          const msg = resp.status === 404 ? 'Session not found' : `HTTP ${resp.status}`;
          throw new Error(msg);
        }
        const data = (await resp.json()) as {
          session: SessionDetail;
          quality_check: QualityCheck | null;
        };
        setSession(data.session);
        setQualityCheck(data.quality_check);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <p className="text-ink-500 italic">Loading session…</p>;
  }
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
      >
        {error}{' '}
        <Link to="/admin/sessions" className="underline">
          Back to sessions
        </Link>
      </div>
    );
  }
  if (!session) return null;

  return (
    <section>
      <Link
        to="/admin/sessions"
        className="text-xs uppercase tracking-wider font-mono text-ink-500 hover:text-accent-600 underline underline-offset-2"
      >
        ← Sessions
      </Link>
      <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mt-2 mb-4">
        Session detail
      </h1>

      {/* Metadata summary */}
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 text-sm">
        <MetaField label="Status" value={session.status} />
        <MetaField label="Reading level" value={session.reading_level} />
        <MetaField label="Type" value={session.session_type} />
        <MetaField label="Test" value={session.is_test ? 'yes' : 'no'} />
      </dl>

      {/* Quality check (only present for completed sessions) */}
      {qualityCheck && <QualityCheckCard check={qualityCheck} />}

      {/* Classification */}
      {session.classification && (
        <section className="mb-6 rounded-md border border-surface-200 bg-surface-100 p-4">
          <h2 className="font-display text-lg text-ink-900 mb-2">Classification</h2>
          <dl className="text-sm space-y-1.5">
            {session.classification.title && (
              <InlineField label="Title" value={session.classification.title} />
            )}
            {session.classification.tier && (
              <InlineField label="Tier" value={session.classification.tier} />
            )}
            {session.classification.standard && (
              <InlineField label="Standard" value={session.classification.standard} />
            )}
            {session.classification.reasoning && (
              <div>
                <dt className="text-xs uppercase tracking-wider font-mono text-ink-500 mb-0.5">
                  Reasoning
                </dt>
                <dd className="text-ink-700 whitespace-pre-wrap">
                  {session.classification.reasoning}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {/* Extracted fields */}
      {Object.keys(session.extracted_fields).length > 0 && (
        <section className="mb-6">
          <h2 className="font-display text-lg text-ink-900 mb-2">
            Extracted fields
          </h2>
          <div className="overflow-x-auto rounded-md border border-surface-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-surface-100 text-left text-xs uppercase tracking-wider font-mono text-ink-500">
                <tr>
                  <th className="px-3 py-2">Field</th>
                  <th className="px-3 py-2">Value</th>
                  <th className="px-3 py-2 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(session.extracted_fields).map(([name, info]) => (
                  <tr key={name} className="border-t border-surface-200">
                    <td className="px-3 py-2 font-mono text-xs text-ink-700">{name}</td>
                    <td className="px-3 py-2 text-ink-900">
                      {formatValue(info?.value)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-ink-500">
                      {typeof info?.confidence === 'number'
                        ? info.confidence.toFixed(2)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Conversation */}
      <section>
        <h2 className="font-display text-lg text-ink-900 mb-2">
          Conversation
          <span className="ml-2 text-xs font-mono text-ink-500 font-normal">
            {session.conversation_history.length} messages
          </span>
        </h2>
        <div className="space-y-3">
          {session.conversation_history.map((msg, i) => (
            <MessageRow key={i} message={msg} />
          ))}
        </div>
      </section>
    </section>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// ─── Sub-components ───────────────────────────────────────────────────────────

function QualityCheckCard({ check }: { check: QualityCheck }) {
  const hasFailures = check.failures.length > 0;
  const hasWarnings = check.warnings.length > 0;
  return (
    <section
      className={
        'mb-6 rounded-md border p-4 ' +
        (check.passed
          ? 'border-success-500 bg-success-50'
          : 'border-danger-500 bg-danger-50')
      }
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-lg text-ink-900">Quality check</h2>
        <span
          className={
            'inline-block px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-mono ' +
            (check.passed
              ? 'bg-success-500 text-white'
              : 'bg-danger-500 text-white')
          }
        >
          {check.passed ? 'Passed' : 'Failed'}
        </span>
      </div>

      {!hasFailures && !hasWarnings && (
        <p className="text-sm text-ink-700">No issues detected.</p>
      )}

      {hasFailures && (
        <div className="mb-3">
          <p className="text-xs uppercase tracking-wider font-mono text-danger-500 mb-1">
            Failures ({check.failures.length})
          </p>
          <ul className="space-y-1.5 list-none p-0 m-0">
            {check.failures.map((f) => (
              <IssueRow key={f.code} issue={f} severity="failure" />
            ))}
          </ul>
        </div>
      )}

      {hasWarnings && (
        <div>
          <p className="text-xs uppercase tracking-wider font-mono text-warning-500 mb-1">
            Warnings ({check.warnings.length})
          </p>
          <ul className="space-y-1.5 list-none p-0 m-0">
            {check.warnings.map((w) => (
              <IssueRow key={w.code} issue={w} severity="warning" />
            ))}
          </ul>
        </div>
      )}

      <p className="text-[10px] font-mono text-ink-500 mt-3">
        Checked {new Date(check.checked_at).toLocaleString()}
      </p>
    </section>
  );
}

function IssueRow({
  issue,
  severity,
}: {
  issue: QualityIssue;
  severity: 'failure' | 'warning';
}) {
  const dotColor = severity === 'failure' ? 'bg-danger-500' : 'bg-warning-500';
  return (
    <li className="flex gap-2 text-sm">
      <span
        className={`${dotColor} w-1.5 h-1.5 rounded-full mt-1.5 flex-none`}
        aria-hidden="true"
      />
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <code className="text-xs font-mono text-ink-500">{issue.code}</code>
        </div>
        <p className="text-ink-900">{issue.message}</p>
      </div>
    </li>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider font-mono text-ink-500">
        {label}
      </dt>
      <dd className="text-ink-900">{value}</dd>
    </div>
  );
}

function InlineField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-xs uppercase tracking-wider font-mono text-ink-500 w-24">
        {label}
      </dt>
      <dd className="text-ink-900 flex-1">{value}</dd>
    </div>
  );
}

function MessageRow({ message }: { message: ConversationMessage }) {
  const role = message.role;
  const borderColor =
    role === 'user'
      ? 'border-l-accent-500'
      : role === 'assistant'
      ? 'border-l-ink-900'
      : 'border-l-ink-500';

  const displayContent = formatContent(message.content);

  return (
    <div className={`border-l-4 ${borderColor} pl-3 py-1`}>
      <div className="flex items-baseline gap-2 mb-0.5">
        <span className="text-xs uppercase tracking-wider font-mono text-ink-500">
          {role}
        </span>
        {message.timestamp && (
          <span className="text-[10px] text-ink-500 font-mono">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
      <div className="text-sm text-ink-900 whitespace-pre-wrap">
        {displayContent}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatContent(content: unknown): string {
  if (typeof content === 'string') return content;
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return String(content);
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
