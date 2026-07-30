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
  const [selected, setSelected] = useState<{
    slug: string;
    content: SpotReportContent;
    photos: string[];
    photosPurged: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/spot/admin/reports', { credentials: 'include' });
      if (res.status === 401) {
        // Inside /admin now, so a 401 means genuinely signed out rather
        // than a cookie nothing was refreshing. The shell provides the way
        // back in; this page used to state the requirement and offer no
        // route to satisfying it.
        setError('Signed out. Reload after signing in to view Spot reports.');
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
      const data = (await res.json()) as {
        report: { content: SpotReportContent };
        photos?: string[];
        photosPurged?: boolean;
      };
      setSelected({
        slug,
        content: data.report.content,
        photos: data.photos ?? [],
        photosPurged: data.photosPurged ?? false,
      });
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

  const DELIVERY_MESSAGE: Record<string, string> = {
    // Retrying will never fix this one — say so rather than inviting a loop.
    no_buyer_email:
      'Released, but there is no email address on file for this buyer. Resending will not help until an address is found.',
    send_failed: 'Released, but the email did not send. Use Resend to try again.',
  };

  async function resend(slug: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/spot/admin/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) {
        setError('Resend failed.');
        return;
      }
      const data = (await res.json()) as { sent: boolean; reason?: string };
      if (!data.sent) {
        setError(DELIVERY_MESSAGE[data.reason ?? ''] ?? 'The email did not send.');
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
        const data = (await res.json()) as { released: boolean; sent: boolean; reason?: string };
        if (data.released && !data.sent) {
          // The old copy here said "retry release to resend", which did
          // nothing: release matches only pending_review, so a second call
          // returned released:false without reaching any send.
          setError(DELIVERY_MESSAGE[data.reason ?? ''] ?? 'Released, but the email did not send.');
        }
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
          <h1 className="font-display text-3xl text-ink-900">Spot — report review</h1>
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
                  {/* Only for released reports, and worded as what it is.
                      Before this the only lever on a released-but-unsent
                      report was Release, which could not send. */}
                  {r.hitlStatus === 'released' ? (
                    <button type="button" disabled={busy} className={btn} onClick={() => void resend(r.slug)}>
                      {r.sentAt ? 'Send again' : 'Resend'}
                    </button>
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
          // The surface class goes here rather than on the page: a reviewer
          // has to be looking at the buyer's document, but the admin chrome
          // around it is not Spot.
          <section className="spot-surface mt-8" aria-live="polite">
            <h2 className="mb-2 font-display text-xl text-ink-900">Report {selected.slug.slice(0, 8)}</h2>
            <SpotReportView
              content={selected.content}
              photos={selected.photos}
              photosPurged={selected.photosPurged}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}
