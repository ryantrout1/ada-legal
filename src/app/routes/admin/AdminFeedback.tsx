/**
 * AdminFeedback — the feedback inbox.
 *
 * Replaces B44's AdminFeedbackV2, which was a placeholder because
 * feedback was never actually collected there. It is collected now
 * (M5), so this is a real page over real rows.
 *
 * TESTIMONIAL CONSENT IS THE POINT OF THE LAYOUT. A submission can be
 * marked as a testimonial and still carry consent = false. Those are
 * shown — Gina wants to know someone said something kind — but they are
 * visibly marked NOT QUOTABLE, because the failure mode here is putting
 * a disabled person's words on a marketing page without their agreement.
 */

import { useEffect, useState } from 'react';

interface FeedbackRow {
  id: string;
  feedback_type: string;
  message: string;
  name: string | null;
  email: string | null;
  display_name: string | null;
  location: string | null;
  testimonial_consent: boolean;
  status: 'new' | 'reviewed' | 'archived';
  page: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  suggestion: 'Suggestion',
  bug_report: 'Bug report',
  question: 'Question',
  general_feedback: 'General feedback',
  testimonial: 'Testimonial',
};

type Filter = 'new' | 'reviewed' | 'archived' | 'all';

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'new', label: 'Needs attention' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'Everything' },
];

const EMPTY_BY_FILTER: Record<Filter, string> = {
  new: 'Nothing waiting. Anything new will show up here.',
  reviewed: 'Nothing marked reviewed yet.',
  archived: 'Nothing archived yet.',
  all: 'No feedback yet.',
};

export default function AdminFeedback() {
  const [rows, setRows] = useState<FeedbackRow[] | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>('new');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    (async () => {
      try {
        const resp = await fetch(`/api/admin/feedback?status=${filter}`, {
          credentials: 'include',
        });
        if (!resp.ok) throw new Error(String(resp.status));
        const body = (await resp.json()) as {
          feedback?: FeedbackRow[];
          counts?: Record<string, number>;
        };
        if (!cancelled) {
          setRows(body.feedback ?? []);
          setCounts(body.counts ?? {});
        }
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  /**
   * Move one message. On success it leaves the current view, because
   * every view except Everything is defined by the status it just left.
   * On failure the message stays put and says why — a button that looks
   * like it worked and did not is worse than one that refuses.
   */
  async function setStatus(id: string, status: FeedbackRow['status']) {
    setBusyId(id);
    setActionError(null);
    try {
      const resp = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!resp.ok) {
        const body = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${resp.status}`);
      }
      const updated = (await resp.json()) as { feedback: FeedbackRow };
      setRows((prev) =>
        (prev ?? []).flatMap((r) =>
          r.id !== id ? [r] : filter === 'all' ? [{ ...r, status: updated.feedback.status }] : [],
        ),
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update that message.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 mb-1">Feedback</h1>
      <p className="text-ink-700 text-sm mb-4">
        What people have told us through the site.
      </p>

      <div
        role="group"
        aria-label="Which feedback to show"
        className="flex flex-wrap gap-2 mb-6"
      >
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={
              'min-h-[44px] rounded-md border px-4 text-sm font-semibold ' +
              (filter === f.value
                ? 'border-accent-600 bg-accent-50 text-accent-600'
                : 'border-control-border bg-surface-0 text-ink-700')
            }
          >
            {f.label}
            {f.value !== 'all' && (counts[f.value] ?? 0) > 0 && (
              <span className="ml-2 font-normal">{counts[f.value]}</span>
            )}
          </button>
        ))}
      </div>

      {actionError && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {actionError}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-md border border-surface-200 bg-white p-4 text-sm">
          Couldn&rsquo;t load feedback.
        </div>
      )}

      {rows !== null && rows.length === 0 && (
        <div className="rounded-md border border-surface-200 bg-white p-6 text-sm text-ink-700">
          {EMPTY_BY_FILTER[filter]}
        </div>
      )}

      <ul className="list-none p-0 m-0 flex flex-col gap-3">
        {(rows ?? []).map((r) => (
          <li
            key={r.id}
            className="rounded-lg border border-surface-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-500">
                {TYPE_LABELS[r.feedback_type] ?? r.feedback_type}
              </span>
              {r.feedback_type === 'testimonial' && (
                <span
                  className={
                    'text-[0.7rem] font-semibold px-2 py-0.5 rounded-full border ' +
                    (r.testimonial_consent
                      ? 'text-success-700 border-success-500'
                      : 'text-ink-700 border-surface-300')
                  }
                >
                  {r.testimonial_consent ? 'OK to quote' : 'Not quotable — no consent'}
                </span>
              )}
              <span className="text-xs text-ink-500 ml-auto">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-ink-900 text-sm leading-relaxed whitespace-pre-wrap m-0">
              {r.message}
            </p>
            <p className="text-xs text-ink-500 mt-2 m-0">
              {[r.display_name || r.name, r.location, r.email, r.page]
                .filter(Boolean)
                .join(' · ') || 'Anonymous'}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {r.status !== 'reviewed' && (
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => void setStatus(r.id, 'reviewed')}
                  className="min-h-[44px] rounded-md border border-control-border bg-surface-0 px-4 text-sm font-semibold text-ink-900 disabled:opacity-60"
                >
                  Reviewed
                </button>
              )}
              {r.status !== 'archived' && (
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => void setStatus(r.id, 'archived')}
                  className="min-h-[44px] rounded-md border border-control-border bg-surface-0 px-4 text-sm font-semibold text-ink-900 disabled:opacity-60"
                >
                  Archive
                </button>
              )}
              {r.status !== 'new' && (
                // Archived is out of the way, not gone. Putting a message
                // back is the whole reason nothing here deletes.
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => void setStatus(r.id, 'new')}
                  className="min-h-[44px] rounded-md border border-control-border bg-surface-0 px-4 text-sm text-ink-700 disabled:opacity-60"
                >
                  Put back
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
