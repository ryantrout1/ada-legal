/**
 * SpotLanding — /spot (Ada Spot 1b).
 *
 * Standalone (outside PublicLayout — no nav/footer), single-purpose landing:
 * framing → take/upload up to 2 photos → free screening read → $79 CTA.
 * Ships dark (spot_enabled OFF); a live submit returns "unavailable" until an
 * admin enables it. AAA: 44px targets, visible focus, keyboard, CSS tokens.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSpotCapture, type SpotUpsell } from './spot/useSpotCapture';
import SpotResultView from './spot/SpotResultView';
import SpotProgressPanel from './spot/SpotProgressPanel';
import SpotCheckout from './spot/SpotCheckout';
import SpotUpload from './spot/SpotUpload';
import SpotReportView from './spot/SpotReportView';
import SpotIntro from './spot/SpotIntro';
import { downscalePhoto } from '@/app/utils/downscalePhoto';
import type { SpotReportContent } from '@/lib/spot/reportSchema';
import { SPOT_DEFAULT_MAX_PHOTOS, SPOT_DEFAULT_PRICE_USD } from '@/lib/spot/spotOffer';
import { SPOT_PHOTO_RETENTION_DAYS } from '@/lib/spot/retention';

const MAX_PHOTOS = 1;

/**
 * The accessible status channel for the free read.
 *
 * The read now streams (SpotProgressPanel renders content as it lands), but
 * that panel is aria-live="off" — scene, summary and each finding arrive
 * separately and announcing every one would machine-gun a screen reader.
 * This stays the calm channel: a handful of coarse, honest, elapsed-time
 * stages, each announced once. It never claims a finding — the analyzer
 * gives no intermediate signal to base a claim on. Copy pending Gina's
 * review.
 */
const READ_STAGES: Array<{ atMs: number; text: string }> = [
  { atMs: 0, text: 'Reading your photo…' },
  { atMs: 6_000, text: 'Checking it against ADA standards — parking, routes, entrances, restrooms…' },
  { atMs: 15_000, text: 'Writing up what it found…' },
  { atMs: 28_000, text: 'Almost there — a thorough read can take up to a minute.' },
];

function SpotReadProgress() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const timers = READ_STAGES.slice(1).map((s, i) =>
      window.setTimeout(() => setStage(i + 1), s.atMs),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);
  return (
    <p aria-live="polite" className="mt-3 text-center text-ink-900">
      {READ_STAGES[stage].text}
    </p>
  );
}

/** Test-drive only (?test=1): reachable when the admin flips spot_test_payment. */
const IS_TEST_MODE =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('test') === '1';

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

function UpsellCard({ upsell, onStart }: { upsell?: SpotUpsell; onStart: () => void }) {
  const price = upsell?.price_usd ?? SPOT_DEFAULT_PRICE_USD;
  const maxPhotos = upsell?.max_photos ?? SPOT_DEFAULT_MAX_PHOTOS;
  return (
    <section className="mt-6 rounded-lg border-2 border-accent-500 bg-accent-50 p-5" aria-labelledby="spot-cta-h">
      <h2 id="spot-cta-h" className="font-display text-xl font-extrabold text-ink-900">
        Want the full read on this spot?
      </h2>
      <p className="mt-2 text-ink-900">
        Take a few more angles of this same spot — up to {maxPhotos} photos — and we’ll read
        them together: what each finding is, which rule it points to, and what people usually do
        about it. ${price}, yours to keep.
      </p>
      {upsell?.anchor ? <p className="mt-1 text-sm text-ink-700">{upsell.anchor}</p> : null}
      <button
        type="button"
        onClick={onStart}
        className="mt-4 inline-flex min-h-[44px] items-center rounded-md bg-accent-500 px-5 py-2 font-display text-lg font-bold text-surface-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
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
  const [testReport, setTestReport] = useState<SpotReportContent | null>(null);
  const [testBusy, setTestBusy] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  async function runTestReport() {
    setTestBusy(true);
    setTestError(null);
    try {
      const photos = await Promise.all(files.map(async (f) => fileToDataUrl(await downscalePhoto(f))));
      const res = await fetch('/api/spot/simulate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos }),
      });
      if (!res.ok) {
        setTestError(res.status === 403 ? 'Test payments are not enabled.' : 'Report generation failed.');
        return;
      }
      const data = (await res.json()) as { content: SpotReportContent };
      setTestReport(data.content);
    } catch {
      setTestError('Report generation failed.');
    } finally {
      setTestBusy(false);
    }
  }

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  /**
   * Focus follows the uploader/CTA swap.
   *
   * Picking a photo unmounts the file input — which is exactly where focus is
   * sitting, since the OS picker returns it there. Removing a photo unmounts
   * the CTA the same way. Either way focus would drop to <body>, stranding
   * anyone on a screen reader, switch control, sip-and-puff or eye-gaze with
   * no place in the document. So focus moves to whichever control replaced
   * the one that vanished: the CTA after a pick, the uploader after a remove.
   * Only on an actual transition — never mid-analysis, never on first paint.
   */
  const screenRef = useRef<HTMLButtonElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const hadFiles = useRef(false);
  useEffect(() => {
    const hasFiles = files.length > 0;
    if (hasFiles !== hadFiles.current) {
      (hasFiles ? screenRef : uploadRef).current?.focus();
    }
    hadFiles.current = hasFiles;
  }, [files.length]);

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
      <div className="spot-surface">
        <div className="mx-auto max-w-2xl px-5 sm:px-8 py-10">
          <header className="mb-6">
            <h1 className="font-display text-3xl font-extrabold text-ink-900">Spot</h1>
          </header>
          {paidSessionId ? (
            <SpotUpload spotSessionId={paidSessionId} />
          ) : (
            <SpotCheckout onPaid={setPaidSessionId} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="spot-surface">
      <div className="mx-auto max-w-2xl px-5 sm:px-8 py-10">
        <header className="mb-6">
          <p className="font-display text-sm font-bold uppercase tracking-widest text-accent-600">
            Spot — from ADA Legal Link
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-ink-900">
            If someone can’t get in, you’ll probably never hear about it.
          </h1>
          <p className="mt-3 text-lg text-ink-900">They don’t complain. They just leave.</p>
          <p className="mt-3 text-lg text-ink-700">
            Take one photo — the door, the ramp, the restroom, the counter — and in about a
            minute we’ll tell you what they’d hit. Free.
          </p>
        </header>

        {showBlocked ? (
          <div className="rounded-lg border border-surface-200 bg-surface-100 p-5">
            <h2 className="font-display text-xl font-extrabold text-ink-900">You've used your free reads</h2>
            <p className="mt-2 text-ink-700">
              For the full report on this spot — more angles, what the rules require, and how to
              fix it — grab the paid report below.
            </p>
            <UpsellCard upsell={state.upsell} onStart={() => setCheckoutActive(true)} />
          </div>
        ) : (
          <>
            {!showResult ? (
              <>
              <div className="space-y-4">
                {/* Before a photo: the uploader is the only action. After one
                    is picked MAX_PHOTOS is reached and the input goes
                    disabled — leaving the label visible would render a
                    button that looks live and does nothing. Remove brings
                    it back. */}
                {files.length === 0 ? (
                  <>
                    <label
                      htmlFor="spot-photo-input"
                      className="block w-full min-h-[44px] cursor-pointer rounded-md border-2 border-accent-500 bg-accent-50 px-4 py-3 text-center font-display text-lg font-bold text-accent-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-accent-500 focus-within:ring-offset-2 focus-within:ring-offset-surface-50"
                    >
                      Take or upload a photo
                    </label>
                    <input
                      id="spot-photo-input"
                      ref={uploadRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      className="sr-only"
                      disabled={analyzing}
                      onChange={(e) => {
                        addFiles(e.target.files);
                        e.target.value = '';
                      }}
                    />
                    <p className="text-sm text-ink-500">
                      One photo — a quick spot-check. No account, no sales call. Photos auto-delete
                      after {SPOT_PHOTO_RETENTION_DAYS} days.
                    </p>
                  </>
                ) : null}

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

                {/* Only appears once there's something to screen — a
                    permanently disabled CTA under the uploader is noise. */}
                {files.length > 0 ? (
                  <button
                    type="button"
                    ref={screenRef}
                    disabled={analyzing}
                    onClick={() => run(files)}
                    className="min-h-[44px] w-full rounded-md bg-accent-500 px-5 py-3 font-display text-lg font-bold text-surface-50 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
                  >
                    {analyzing ? 'Reading your photos…' : 'Screen my photos'}
                  </button>
                ) : null}

                {analyzing ? <SpotReadProgress /> : null}
                {analyzing && state.progress ? (
                  <div className="mt-4">
                    <SpotProgressPanel view={state.progress} />
                  </div>
                ) : null}

                {state.status === 'error' ? (
                  <p role="alert" className="text-sm text-danger-500">
                    {state.error}
                  </p>
                ) : null}
              </div>
              {/* The pitch is for the person who scrolls instead of shooting.
                  While a read is in flight the progress panel owns the page —
                  marketing under a working spinner is noise. */}
              {!analyzing ? <SpotIntro /> : null}
              </>
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

                {IS_TEST_MODE ? (
                  <div className="mt-4 rounded-md border border-dashed border-control-border p-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-500">Test drive</p>
                    <button
                      type="button"
                      onClick={() => void runTestReport()}
                      disabled={testBusy || files.length === 0}
                      className="min-h-[44px] w-full rounded-md bg-accent-600 px-4 py-2 text-white disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
                    >
                      {testBusy ? 'Generating the full report…' : 'Simulate payment → generate the $79 report'}
                    </button>
                    {testError ? (
                      <p role="alert" className="mt-2 text-sm text-danger-500">
                        {testError}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {testReport ? (
                  <section className="mt-6" aria-live="polite">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-500">
                      Full report (test) — this is the $79 deliverable
                    </p>
                    <SpotReportView content={testReport} />
                  </section>
                ) : null}

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
