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

export default function AdminFeedback() {
  const [rows, setRows] = useState<FeedbackRow[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch('/api/admin/feedback', { credentials: 'include' });
        if (!resp.ok) throw new Error(String(resp.status));
        const body = (await resp.json()) as { feedback?: FeedbackRow[] };
        if (!cancelled) setRows(body.feedback ?? []);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 mb-1">Feedback</h1>
      <p className="text-ink-700 text-sm mb-6">
        What people have told us through the site.
      </p>

      {error && (
        <div role="alert" className="rounded-md border border-surface-200 bg-white p-4 text-sm">
          Couldn&rsquo;t load feedback.
        </div>
      )}

      {rows !== null && rows.length === 0 && (
        <div className="rounded-md border border-surface-200 bg-white p-6 text-sm text-ink-700">
          No feedback yet.
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
          </li>
        ))}
      </ul>
    </div>
  );
}
