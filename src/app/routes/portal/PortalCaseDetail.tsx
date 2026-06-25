/**
 * PortalCaseDetail — single matched-case view (criterion 3) + mark-handled
 * (criterion 6).
 *
 * Renders the full case package: claimant contact, matched case, qualifying-
 * question answers, and the conversation transcript. A "Mark handled" action
 * POSTs to the handle endpoint (idempotent; permanent per DO2). Server enforces
 * the firm boundary — an out-of-firm id returns 404 here.
 *
 * Tokens + semantic HTML for WCAG 2.2 AAA.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  fetchPortalCase,
  markPortalCaseHandled,
  PortalApiError,
  type PortalCaseDetailResponse,
} from '../../data/portalClient.js';
import MessageContent from '../../components/MessageContent.js';

export default function PortalCaseDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PortalCaseDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauth, setUnauth] = useState(false);
  const [handling, setHandling] = useState(false);

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
      if (err instanceof PortalApiError && err.status === 401) {
        setUnauth(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load the case');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const onMarkHandled = useCallback(async () => {
    if (!id) return;
    setHandling(true);
    setError(null);
    try {
      await markPortalCaseHandled(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark handled');
    } finally {
      setHandling(false);
    }
  }, [id, load]);

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
        <div role="alert" className="rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-danger-500 mb-4">
          {error}
        </div>
      )}

      {!loading && data && (
        <article className="flex flex-col gap-6">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">
                {data.case_name}
              </h1>
              {data.handled_by_this_firm ? (
                <span className="text-sm text-ink-500 font-mono uppercase tracking-wide">
                  Handled by your firm
                </span>
              ) : null}
            </div>
            {!data.handled_by_this_firm && (
              <button
                type="button"
                onClick={() => void onMarkHandled()}
                disabled={handling}
                className="rounded-md bg-accent-500 px-4 py-2 text-white hover:bg-accent-600 disabled:opacity-60"
              >
                {handling ? 'Marking…' : 'Mark handled'}
              </button>
            )}
          </header>

          <section aria-labelledby="contact-h">
            <h2 id="contact-h" className="font-display text-lg text-ink-900 mb-2">
              Claimant contact
            </h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-ink-500">Name</dt>
              <dd className="text-ink-900">{data.user_name ?? '—'}</dd>
              <dt className="text-ink-500">Email</dt>
              <dd className="text-ink-900">{data.user_email ?? '—'}</dd>
              <dt className="text-ink-500">Phone</dt>
              <dd className="text-ink-900">{data.user_phone ?? '—'}</dd>
            </dl>
          </section>

          <section aria-labelledby="qq-h">
            <h2 id="qq-h" className="font-display text-lg text-ink-900 mb-2">
              Qualifying answers
            </h2>
            {data.qualifying_answers.length === 0 ? (
              <p className="text-ink-500 text-sm">No qualifying answers recorded.</p>
            ) : (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                {data.qualifying_answers.map((a) => (
                  <div key={a.question} className="contents">
                    <dt className="text-ink-500">{a.question}</dt>
                    <dd className="text-ink-900">{a.answer}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section aria-labelledby="transcript-h">
            <h2 id="transcript-h" className="font-display text-lg text-ink-900 mb-2">
              Conversation transcript
            </h2>
            {data.transcript.length === 0 ? (
              <p className="text-ink-500 text-sm">No transcript.</p>
            ) : (
              <ol className="flex flex-col gap-2">
                {data.transcript.map((m, i) => (
                  <li key={i} className="rounded-md border border-surface-200 bg-white px-3 py-2 text-sm">
                    <span className="text-ink-500 font-mono text-xs uppercase tracking-wide">
                      {m.role}
                    </span>
                    <div className="text-ink-900 mt-0.5">
                      <MessageContent content={m.content} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </article>
      )}
    </section>
  );
}
