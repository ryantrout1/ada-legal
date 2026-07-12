/**
 * SpotReview — /spot-review (Ada Spot 3b).
 *
 * Internal admin preview: list generated reports, view one, and re-run
 * generation with a chosen model to run the Opus-4.8-vs-Fable-5 A/B. Own
 * standalone surface (like /photo, /review) — NOT the bench /admin/photo-review.
 * Calls the requireAdmin-gated /api/spot/admin/* endpoints with the Clerk
 * session cookie; shows a sign-in prompt on 401. AAA: 44px, focus, tokens.
 */

import { useCallback, useEffect, useState } from 'react';
import SpotReportView from '../public/spot/SpotReportView';
import { SPOT_REPORT_MODELS } from '@/lib/spot/parseRegenerateBody';
import type { SpotReportContent } from '@/lib/spot/reportSchema';

interface ReportRow {
  id: string;
  sessionId: string;
  slug: string;
  modelVersion: string | null;
  hitlStatus: string;
  sentAt: string | null;
  createdAt: string;
}

export default function SpotReview() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [selected, setSelected] = useState<{ slug: string; content: SpotReportContent } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/spot/admin/reports', { credentials: 'include' });
      if (res.status === 401) {
        setError('Sign in as an admin to view Ada Spot reports.');
        setReports([]);
        return;
      }
      if (!res.ok) throw new Error('load failed');
      const data = (await res.json()) as { reports: ReportRow[] };
      setReports(data.reports ?? []);
      setError(null);
    } catch {
      setError('Could not load reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function view(slug: string) {
    try {
      const res = await fetch(`/api/spot/admin/report?slug=${encodeURIComponent(slug)}`, { credentials: 'include' });
      if (!res.ok) return;
      const data = (await res.json()) as { report: { content: SpotReportContent } };
      setSelected({ slug, content: data.report.content });
    } catch {
      /* ignore — list stays */
    }
  }

  async function regenerate(sessionId: string, model: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/spot/admin/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId, model }),
      });
      if (!res.ok) {
        setError('Regeneration failed.');
        return;
      }
      await loadList();
    } finally {
      setBusy(false);
    }
  }

  async function act(path: 'release' | 'reject', slug: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/spot/admin/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) {
        setError(`${path} failed.`);
        return;
      }
      if (path === 'release') {
        const data = (await res.json()) as { released: boolean; sent: boolean };
        if (data.released && !data.sent) setError('Released, but the email did not send — retry release to resend.');
      }
      await loadList();
    } finally {
      setBusy(false);
    }
  }

  const btn =
    'min-h-[44px] rounded-md border border-control-border px-3 py-1 text-sm text-ink-700 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50';

  return (
    <div className="min-h-screen bg-surface-50 text-ink-900 font-body">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-6">
          <h1 className="font-display text-3xl text-ink-900">Ada Spot — report review</h1>
          <p className="mt-2 text-sm text-ink-700">
            Internal preview + model A/B. Regenerating spends on the chosen model.
          </p>
        </header>

        {error ? (
          <p role="alert" className="mb-4 text-sm text-danger-500">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-ink-700" aria-live="polite">
            Loading…
          </p>
        ) : (
          <div className="space-y-3">
            {reports.length === 0 && !error ? <p className="text-ink-700">No reports yet.</p> : null}
            {reports.map((r) => (
              <div key={r.id} className="rounded-md border border-surface-200 bg-surface-100 p-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-medium text-ink-900">{r.modelVersion ?? 'unknown model'}</span>
                  <span className="text-ink-500">{r.hitlStatus}</span>
                  {r.hitlStatus === 'released' ? (
                    <span className="text-ink-500">{r.sentAt ? 'emailed' : 'not emailed'}</span>
                  ) : null}
                  <span className="text-ink-500">{new Date(r.createdAt).toLocaleString()}</span>
                  <span className="text-ink-500">session {r.sessionId.slice(0, 8)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" className={btn} onClick={() => void view(r.slug)}>
                    View
                  </button>
                  {r.hitlStatus === 'released' ? (
                    <a
                      className={`${btn} inline-flex items-center`}
                      href={`/spot/r/${encodeURIComponent(r.slug)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open readout
                    </a>
                  ) : null}
                  {r.hitlStatus === 'pending_review' ? (
                    <>
                      <button type="button" disabled={busy} className={btn} onClick={() => void act('release', r.slug)}>
                        Release + email
                      </button>
                      <button type="button" disabled={busy} className={btn} onClick={() => void act('reject', r.slug)}>
                        Reject
                      </button>
                    </>
                  ) : null}
                  {SPOT_REPORT_MODELS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      disabled={busy}
                      className={btn}
                      onClick={() => void regenerate(r.sessionId, m)}
                    >
                      Regenerate · {m.replace('claude-', '')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {selected ? (
          <section className="mt-8" aria-live="polite">
            <h2 className="mb-2 font-display text-xl text-ink-900">Report {selected.slug.slice(0, 8)}</h2>
            <SpotReportView content={selected.content} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
