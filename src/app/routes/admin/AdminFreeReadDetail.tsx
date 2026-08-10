/**
 * AdminFreeReadDetail — one free read at /admin/spot/reads/:id.
 *
 * The free-reads list shows only metadata; the photo is now retained for
 * training. This is where a reviewer sees the pair — the FULL analysis Spot
 * produced, next to the photo the user uploaded.
 *
 * Deliberately NOT what the user saw. The public free read is a teaser now
 * (SpotTeaserView): three names, a count, and nothing else. This page keeps
 * rendering the whole thing through SpotResultView, because a reviewer
 * judging analyzer accuracy needs every finding — including the ones the
 * visitor was never shown.
 *
 * The photo is absent for reads taken before retention was turned on, and for
 * reads whose photo the 90-day sweep has since deleted; the page says which
 * rather than showing a broken image.
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SpotResultView from '../public/spot/SpotResultView';
import { mapSpotFindings } from '@/lib/spot/mapSpotFindings';
import type { PhotoAnalysisOutput } from '@/types/db';

interface FreeRead {
  id: string;
  createdAt: string;
  modelVersion: string | null;
  result: PhotoAnalysisOutput | null;
  photoUrl: string | null;
}

export default function AdminFreeReadDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const [read, setRead] = useState<FreeRead | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound' | 'error' | 'unauth'>(
    'loading',
  );

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const res = await fetch(`/api/admin/spot/read?id=${encodeURIComponent(id)}`, {
          credentials: 'include',
        });
        if (!live) return;
        if (res.status === 401) return setStatus('unauth');
        if (res.status === 404) return setStatus('notfound');
        if (!res.ok) return setStatus('error');
        const data = (await res.json()) as { read: FreeRead };
        setRead(data.read);
        setStatus('ready');
      } catch {
        if (live) setStatus('error');
      }
    })();
    return () => {
      live = false;
    };
  }, [id]);

  if (status === 'unauth') {
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

  return (
    <section>
      <Link
        to="/admin/spot"
        className="inline-flex min-h-[44px] items-center text-sm text-accent-600 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        ← Spot
      </Link>

      <header className="mt-3 mb-6">
        <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">Free read</h1>
        <p className="text-sm text-ink-500">
          What Spot told someone who never paid, and the photo they uploaded.
          {read ? (
            <>
              {' · '}
              {new Date(read.createdAt).toLocaleString()}
              {read.modelVersion ? ` · ${read.modelVersion.replace('claude-', '')}` : ''}
            </>
          ) : null}
        </p>
      </header>

      {status === 'loading' && (
        <p className="text-ink-700" aria-live="polite">
          Loading…
        </p>
      )}
      {status === 'notfound' && <p className="text-ink-700">That free read is no longer here.</p>}
      {status === 'error' && (
        <p role="alert" className="text-sm text-danger-500">
          Could not load the free read.
        </p>
      )}

      {status === 'ready' && read && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-label="Uploaded photo">
            <h2 className="mb-2 font-display text-lg text-ink-900">Photo</h2>
            {read.photoUrl ? (
              <img
                src={read.photoUrl}
                alt="The photo this person uploaded for their free screening"
                className="w-full rounded-md border border-surface-200"
              />
            ) : (
              // Absent by policy, not by error: reads before retention began
              // never stored one, and a stored one is deleted at 90 days.
              <p className="rounded-md border border-surface-200 bg-surface-100 px-4 py-3 text-sm text-ink-500">
                No photo for this read. It was either taken before photo retention was turned on, or
                its photo has passed the 90-day retention window and been deleted.
              </p>
            )}
          </section>

          <section aria-label="What Spot showed" className="spot-surface">
            <h2 className="mb-2 font-display text-lg text-ink-900">What Spot showed</h2>
            {read.result ? (
              <SpotResultView view={mapSpotFindings(read.result)} onRetry={() => {}} />
            ) : (
              <p className="text-sm text-ink-500">This read stored no analysis.</p>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
