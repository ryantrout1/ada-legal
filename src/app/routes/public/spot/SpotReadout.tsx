/**
 * SpotReadout — /spot/r/:slug (Ada Spot 4a).
 *
 * The buyer's hosted report page (linked from the release email). Fetches the
 * public released-only endpoint and renders via SpotReportView. Honest
 * not-found state for a slug that isn't released. AAA: tokens, semantic
 * headings, no fabricated content.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SpotReportView from './SpotReportView';
import type { SpotReportContent } from '@/lib/spot/reportSchema';

export default function SpotReadout() {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState<SpotReportContent | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading');

  const [photos, setPhotos] = useState<string[]>([]);
  const [photosPurged, setPhotosPurged] = useState(false);

  useEffect(() => {
    if (!slug) {
      setState('notfound');
      return;
    }
    let cancelled = false;
    fetch(`/api/spot/report?slug=${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) return setState('notfound');
        if (!res.ok) return setState('error');
        const data = (await res.json()) as {
          content: SpotReportContent;
          photos?: string[];
          photosPurged?: boolean;
        };
        setContent(data.content);
        setPhotos(data.photos ?? []);
        setPhotosPurged(data.photosPurged ?? false);
        setState('ok');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    // spot-surface, not spot-accent. The first is typography — app.css
    // de-serifs Spot's own copy so a QR scan into /spot and the report that
    // follows read as one product. The second is the teal, which this app
    // deliberately does not take: the consumer palette is AA-level and the
    // floor here is AAA.
    <div className="spot-surface">
      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-10">
        <p className="mb-6 font-display text-lg text-ink-700">Spot</p>
        {state === 'loading' ? (
          <p aria-live="polite" className="text-ink-700">
            Loading your report…
          </p>
        ) : null}
        {state === 'notfound' ? (
          <div>
            <h1 className="font-display text-2xl text-ink-900">Report not available</h1>
            <p className="mt-2 text-ink-700">
              This report link isn&rsquo;t available. If you just paid, your report may still be in
              review — check the email we sent, or reach out and we&rsquo;ll help.
            </p>
          </div>
        ) : null}
        {state === 'error' ? (
          <p role="alert" className="text-danger-500">
            Something went wrong loading this report. Please try again shortly.
          </p>
        ) : null}
        {state === 'ok' && content ? (
          <SpotReportView content={content} photos={photos} photosPurged={photosPurged} />
        ) : null}
      </div>
    </div>
  );
}
