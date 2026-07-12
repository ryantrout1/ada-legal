/**
 * SpotLanding — /spot (Ada Spot 1b).
 *
 * Standalone (outside PublicLayout — no nav/footer), single-purpose landing:
 * framing → take/upload up to 2 photos → free screening read → $79 CTA.
 * Ships dark (spot_enabled OFF); a live submit returns "unavailable" until an
 * admin enables it. AAA: 44px targets, visible focus, keyboard, CSS tokens.
 */

import { useEffect, useMemo, useState } from 'react';
import { useSpotCapture, type SpotUpsell } from './spot/useSpotCapture';
import SpotResultView from './spot/SpotResultView';
import SpotCheckout from './spot/SpotCheckout';

const MAX_PHOTOS = 2;

function UpsellCard({ upsell, onStart }: { upsell?: SpotUpsell; onStart: () => void }) {
  const price = upsell?.price_usd ?? 79;
  const maxPhotos = upsell?.max_photos ?? 10;
  return (
    <section className="mt-6 rounded-lg border-2 border-accent-500 bg-accent-50 p-5" aria-labelledby="spot-cta-h">
      <h2 id="spot-cta-h" className="font-display text-xl text-ink-900">
        Want the full picture?
      </h2>
      <p className="mt-2 text-ink-900">
        Get a remediation-focused report on up to {maxPhotos} photos — what to fix and how — for
        ${price}.
      </p>
      {upsell?.anchor ? <p className="mt-1 text-sm text-ink-700">{upsell.anchor}</p> : null}
      <button
        type="button"
        onClick={onStart}
        className="mt-4 inline-flex min-h-[44px] items-center rounded-md bg-accent-500 px-5 py-2 font-display text-lg text-surface-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
      >
        Get the ${price} report
      </button>
    </section>
  );
}

export default function SpotLanding() {
  const { state, run, reset } = useSpotCapture();
  const [files, setFiles] = useState<File[]>([]);
  const [checkoutActive, setCheckoutActive] = useState(false);
  const [paidSessionId, setPaidSessionId] = useState<string | null>(null);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)].slice(0, MAX_PHOTOS));
  };
  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));
  const startOver = () => {
    setFiles([]);
    reset();
  };

  const analyzing = state.status === 'analyzing';
  const showResult = state.status === 'done' && state.tier !== 'blocked';
  const showBlocked = state.status === 'done' && state.tier === 'blocked';

  // Payment flow takes over the page once the CTA is pressed.
  if (paidSessionId || checkoutActive) {
    return (
      <div className="min-h-screen bg-surface-50 text-ink-900 font-body">
        <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
          <header className="mb-6">
            <h1 className="font-display text-3xl text-ink-900">Ada Spot</h1>
          </header>
          {paidSessionId ? (
            <div className="rounded-lg border border-surface-200 bg-surface-100 p-5" aria-live="polite">
              <h2 className="font-display text-xl text-ink-900">Payment received</h2>
              <p className="mt-2 text-ink-900">
                Next you'll add your photos — that upload step is being finalized.
              </p>
            </div>
          ) : (
            <SpotCheckout onPaid={setPaidSessionId} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 text-ink-900 font-body">
      <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
        <header className="mb-6">
          <h1 className="font-display text-3xl text-ink-900">Ada Spot</h1>
          <p className="mt-2 text-ink-700">
            See what a visitor with a disability might run into at your entrance — free, from a
            couple of photos.
          </p>
        </header>

        {showBlocked ? (
          <div className="rounded-lg border border-surface-200 bg-surface-100 p-5">
            <h2 className="font-display text-xl text-ink-900">You've used your free reads</h2>
            <p className="mt-2 text-ink-700">
              For a full, remediation-focused report on more photos, grab the paid report below.
            </p>
            <UpsellCard upsell={state.upsell} onStart={() => setCheckoutActive(true)} />
          </div>
        ) : (
          <>
            {!showResult ? (
              <div className="space-y-4">
                <label
                  htmlFor="spot-photo-input"
                  className="block w-full min-h-[44px] cursor-pointer rounded-md border-2 border-accent-500 bg-accent-50 px-4 py-3 text-center font-display text-lg text-accent-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-accent-500 focus-within:ring-offset-2 focus-within:ring-offset-surface-50"
                >
                  Take or upload a photo
                </label>
                <input
                  id="spot-photo-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="sr-only"
                  disabled={files.length >= MAX_PHOTOS || analyzing}
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
                <p className="text-sm text-ink-500">Up to {MAX_PHOTOS} photos.</p>

                {previews.length > 0 ? (
                  <ul className="grid grid-cols-2 gap-3">
                    {previews.map((url, i) => (
                      <li key={url} className="rounded-md border border-surface-200 bg-surface-100 p-2">
                        <img src={url} alt={`Selected photo ${i + 1}`} className="block w-full rounded-sm" />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="mt-2 min-h-[44px] w-full rounded-md border border-control-border px-3 py-1 text-sm text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <button
                  type="button"
                  disabled={files.length === 0 || analyzing}
                  onClick={() => run(files)}
                  className="min-h-[44px] w-full rounded-md bg-accent-500 px-5 py-3 font-display text-lg text-surface-50 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
                >
                  {analyzing ? 'Reading your photos…' : 'Screen my photos'}
                </button>

                {state.status === 'error' ? (
                  <p role="alert" className="text-sm text-danger-500">
                    {state.error}
                  </p>
                ) : null}
              </div>
            ) : null}

            {showResult && state.view ? (
              <>
                {state.tier === 'soft_gated' ? (
                  <p className="mb-4 rounded-md border border-surface-200 bg-surface-100 px-4 py-3 text-sm text-ink-700">
                    This one's on us — you're near the end of your free reads. For more photos and a
                    remediation report, see below.
                  </p>
                ) : null}
                <SpotResultView view={state.view} onRetry={startOver} />
                <UpsellCard upsell={state.upsell} onStart={() => setCheckoutActive(true)} />
                <button
                  type="button"
                  onClick={startOver}
                  className="mt-4 min-h-[44px] rounded-md border border-control-border px-4 py-2 text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
                >
                  Screen another spot
                </button>
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
