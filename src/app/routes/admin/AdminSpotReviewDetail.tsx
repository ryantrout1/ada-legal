/**
 * AdminSpotReviewDetail — one paid report at /admin/spot-review/:slug.
 *
 * Everything that acts on a report lives here, grouped by what the reviewer
 * is trying to do: decide, regenerate, share. On the old list every action
 * was a peer button in one flat row, so "Reject" sat the same distance from
 * the cursor as "Download PDF" and the model name was baked into the
 * regenerate label. Here the destructive pair is its own block, regenerate
 * carries its cost warning, and the report itself is on the same screen as
 * the decision about it.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SpotReportView from '../public/spot/SpotReportView';
import { SPOT_REPORT_MODELS } from '@/lib/spot/parseRegenerateBody';
import {
  fetchSpotReportBody,
  useAdminSpotReports,
  type SpotReportBody,
} from '../../hooks/useAdminSpotReports.js';

const BTN =
  'inline-flex min-h-[44px] items-center rounded-md border border-control-border px-4 py-1 text-sm text-ink-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50';

export default function AdminSpotReviewDetail() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { reports, loading, unauthenticated, error, busy, release, reject, resend, regenerate } =
    useAdminSpotReports();
  const [body, setBody] = useState<SpotReportBody | null>(null);
  const [model, setModel] = useState<string>(SPOT_REPORT_MODELS[0]);

  const row = reports.find((r) => r.slug === slug) ?? null;

  useEffect(() => {
    let live = true;
    void fetchSpotReportBody(slug).then((b) => {
      if (live) setBody(b);
    });
    return () => {
      live = false;
    };
  }, [slug]);

  if (unauthenticated) {
    return (
      <div
        role="alert"
        className="rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
      >
        Your session is not authenticated.{' '}
        <Link to="/admin/sign-in" className="underline">
          Sign in
        </Link>
        .
      </div>
    );
  }

  if (!row && !loading) {
    return (
      <section>
        <BackLink />
        <p className="mt-4 text-ink-700">That report is no longer in the queue.</p>
      </section>
    );
  }

  const released = row?.hitlStatus === 'released';
  const pending = row?.hitlStatus === 'pending_review';

  return (
    <section>
      <BackLink />

      <header className="mt-3 mb-6">
        <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">
          Session {row?.sessionId.slice(0, 8) ?? slug.slice(0, 8)}
        </h1>
        <p className="text-sm text-ink-500">
          {row ? (
            <>
              {row.buyerName || row.buyerEmail ? (
                <>Paid by {[row.buyerName, row.buyerEmail].filter(Boolean).join(' · ')}</>
              ) : (
                'No buyer on file — this report cannot be delivered.'
              )}
              {' · '}
              {new Date(row.createdAt).toLocaleString()}
              {row.modelVersion ? ` · ${row.modelVersion.replace('claude-', '')}` : ''}
            </>
          ) : (
            'Loading…'
          )}
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {error}
        </div>
      )}

      {pending && (
        <Block title="Decide">
          <button
            type="button"
            disabled={busy}
            className={BTN}
            onClick={() => void release(slug)}
          >
            Release and email
          </button>
          <button type="button" disabled={busy} className={BTN} onClick={() => void reject(slug)}>
            Reject
          </button>
        </Block>
      )}

      <Block title="Regenerate" note="Spends on the chosen model. Replaces the draft below.">
        {SPOT_REPORT_MODELS.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <span className="sr-only">Model</span>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="min-h-[44px] rounded-md border border-surface-200 bg-white px-3 py-1.5 text-ink-900"
            >
              {SPOT_REPORT_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m.replace('claude-', '')}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          disabled={busy || !row}
          className={BTN}
          onClick={async () => {
            if (!row) return;
            await regenerate(row.sessionId, model);
            setBody(await fetchSpotReportBody(slug));
          }}
        >
          Regenerate{SPOT_REPORT_MODELS.length > 1 ? '' : ` · ${model.replace('claude-', '')}`}
        </button>
      </Block>

      {/* Released only. The readout route and the PDF endpoint both serve
          released reports and 404 the rest, so offering either on a pending
          row would be a button that cannot work. A reviewer checks the
          preview below, releases, then downloads. */}
      <Block title="Share">
        {/* A link greyed out with pointer-events-none is still reachable by
            Tab and still fires on Enter, so an unreleased report would 404
            for a keyboard user and not for anyone else. Before release these
            are real disabled buttons instead. */}
        {released ? (
          <a
            className={BTN}
            href={`/spot/r/${encodeURIComponent(slug)}`}
            target="_blank"
            rel="noreferrer"
          >
            Claimant readout
          </a>
        ) : (
          <button type="button" disabled className={BTN}>
            Claimant readout
          </button>
        )}
        {released ? (
          <a className={BTN} href={`/api/spot/report.pdf?slug=${encodeURIComponent(slug)}`}>
            Download PDF
          </a>
        ) : (
          <button type="button" disabled className={BTN}>
            Download PDF
          </button>
        )}
        <button
          type="button"
          disabled={busy || !released}
          className={BTN}
          onClick={() => void resend(slug)}
        >
          {row?.sentAt ? 'Send again' : 'Send'}
        </button>
        {!released && (
          <p className="w-full text-xs text-ink-500">Available once the report is released.</p>
        )}
      </Block>

      <section className="spot-surface mt-8" aria-live="polite">
        <h2 className="mb-2 font-display text-xl text-ink-900">Draft report</h2>
        {body ? (
          <SpotReportView
            content={body.content}
            photos={body.photos}
            photosPurged={body.photosPurged}
          />
        ) : (
          <p className="text-ink-700">Loading the report…</p>
        )}
      </section>

      <div className="mt-8">
        <button type="button" className={BTN} onClick={() => navigate('/admin/spot-review')}>
          Back to the queue
        </button>
      </div>
    </section>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BackLink() {
  return (
    <Link
      to="/admin/spot-review"
      className="inline-flex min-h-[44px] items-center text-sm text-accent-600 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
    >
      ← Report review
    </Link>
  );
}

function Block({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 rounded-md border border-surface-200 bg-surface-100 p-3 sm:p-4">
      <h2 className="text-sm font-medium text-ink-900">{title}</h2>
      {note && <p className="mt-1 text-xs text-ink-500">{note}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
