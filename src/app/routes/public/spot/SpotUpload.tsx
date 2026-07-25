/**
 * SpotUpload — paid photo upload (Ada Spot 2b).
 *
 * Shown only after the server confirms paid-state. Uploads up to MAX_PAID_PHOTOS
 * straight to Vercel Blob via @vercel/blob/client (the token endpoint
 * re-checks paid + cap server-side), then "Finish" flips the session to
 * uploaded and shows the async confirmation. Photos are normalized through the
 * shared downscale util (supported type + sane size); the free-tier bench
 * capture hook is not reused.
 */

import { useEffect, useRef, useState } from 'react';
import { downscalePhoto } from '@/app/utils/downscalePhoto';
import { MAX_PAID_PHOTOS } from '@/lib/spot/uploadGate';

/**
 * Paid sessions whose carried photo has already been uploaded.
 *
 * Module-level rather than a ref: a ref resets if this component remounts,
 * and a second run would spend another of the buyer's five slots on a
 * duplicate of the same photo. They paid for those slots.
 */
const carriedSessions = new Set<string>();

interface Props {
  spotSessionId: string;
  buyerEmail?: string | null;
  /**
   * The photo(s) already chosen during the free read, handed down by
   * SpotLanding. Best-effort: empty on a refresh or a returning link, and
   * the screen correctly starts at zero in that case.
   */
  initialFiles?: File[];
}

export default function SpotUpload({ spotSessionId, buyerEmail, initialFiles }: Props) {
  const [count, setCount] = useState(0);
  /**
   * Object URLs for the photos accepted so far, so the buyer can see what
   * they are sending. A count alone left them staring at "1 added" with no
   * way to tell WHICH photo it kept — and on the paid screen the carried
   * one arrives without them doing anything, so the number is the only
   * evidence it worked.
   *
   * No Remove here, unlike the free screen. These are already uploaded
   * against a paid session and there is no server-side delete; a button
   * that only cleared the thumbnail would lie about what gets analysed.
   */
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_PAID_PHOTOS - count;

  async function uploadOne(file: File) {
    const { upload } = await import('@vercel/blob/client');
    const scaled = await downscalePhoto(file);
    await upload(`spot/${spotSessionId}/${Date.now()}-${scaled.name}`, scaled, {
      access: 'public',
      handleUploadUrl: '/api/spot/upload',
      contentType: scaled.type,
      clientPayload: JSON.stringify({ spotSessionId }),
    });
    setCount((c) => c + 1);
    setPreviews((p) => [...p, URL.createObjectURL(file)]);
  }

  /**
   * Carry the free-read photo into the paid session.
   *
   * The free read is deliberately transient — no session, no blob, nothing
   * persisted — so there is no server-side artifact to hand over. But Stripe
   * here is Embedded Checkout, the user never navigates away, and SpotLanding
   * renders this component itself, so the original File objects are still in
   * its state. They only need re-uploading now that a paid session exists to
   * attach them to.
   *
   * Without this the buyer pays, lands on "0 added", and is asked to
   * photograph again the thing they just photographed — with Finish disabled
   * until they do.
   *
   * The guard is load-bearing: an effect that uploads must run exactly once
   * per paid session. StrictMode mounts twice in development, and a remount
   * would re-run it in production. Either way the buyer loses a slot to a
   * duplicate of a photo they already gave.
   */
  // Revoke on unmount only. Revoking whenever `previews` changes would
  // invalidate URLs still rendered on screen.
  const previewsRef = useRef<string[]>([]);
  previewsRef.current = previews;
  useEffect(() => () => previewsRef.current.forEach((u) => URL.revokeObjectURL(u)), []);

  useEffect(() => {
    if (carriedSessions.has(spotSessionId)) return;
    if (!initialFiles || initialFiles.length === 0) return;
    carriedSessions.add(spotSessionId);

    const files = initialFiles.slice(0, MAX_PAID_PHOTOS);
    setBusy(true);
    void (async () => {
      try {
        for (const file of files) await uploadOne(file);
      } catch {
        // Not fatal and deliberately quiet: the uploader below still works,
        // so the buyer can add the photo by hand. An error banner here would
        // be alarming about something they never asked for.
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles, spotSessionId]);

  async function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      const files = Array.from(list).slice(0, remaining);
      for (const file of files) {
        await uploadOne(file);
      }
    } catch {
      setError('One of your photos could not be uploaded. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/spot/finish-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotSessionId }),
      });
      if (!res.ok) throw new Error('finish failed');
      // Kick generation immediately (fast path) — fire-and-forget. Vercel
      // functions run to completion after client disconnect, so leaving
      // the page doesn't kill the run; if this request never leaves the
      // device, the cron sweeper picks the session up within 10 minutes.
      void fetch('/api/spot/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotSessionId }),
      }).catch(() => {
        /* sweeper backstop */
      });
      setDone(true);
    } catch {
      setError('Could not submit your photos. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-surface-200 bg-surface-100 p-5" aria-live="polite">
        <h2 className="font-display text-xl text-ink-900">Payment received — photos in</h2>
        <p className="mt-2 text-ink-900">
          Your report is being prepared and will be emailed
          {buyerEmail ? ` to ${buyerEmail}` : ''} shortly — typically within a few hours. You can
          close this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl text-ink-900">Add angles of your spot</h2>
        <p className="mt-1 text-sm text-ink-700">
          Photograph the <strong>same spot</strong> from a few angles — straight on, from the side,
          and a close-up of anything that looks like a step, door, threshold, or sign. Up to{' '}
          {MAX_PAID_PHOTOS} photos. {count} added.
        </p>
      </div>

      {previews.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3">
          {previews.map((url, i) => (
            <li key={url} className="rounded-md border border-surface-200 bg-surface-100 p-2">
              <img
                src={url}
                alt={`Photo ${i + 1} of ${previews.length} you are sending`}
                className="block w-full rounded-sm"
              />
            </li>
          ))}
        </ul>
      ) : null}

      <label
        htmlFor="spot-paid-input"
        className={`block w-full min-h-[44px] rounded-md border-2 border-accent-500 bg-accent-50 px-4 py-3 text-center font-display text-lg text-accent-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-accent-500 focus-within:ring-offset-2 focus-within:ring-offset-surface-50 ${
          remaining <= 0 || busy ? 'opacity-60' : 'cursor-pointer'
        }`}
      >
        {busy ? 'Uploading…' : 'Take or upload a photo'}
      </label>
      <input
        id="spot-paid-input"
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="sr-only"
        disabled={remaining <= 0 || busy}
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <button
        type="button"
        disabled={count === 0 || busy}
        onClick={() => void finish()}
        className="min-h-[44px] w-full rounded-md bg-accent-500 px-5 py-3 font-display text-lg text-surface-50 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
      >
        Finish &amp; send my report
      </button>

      {error ? (
        <p role="alert" className="text-sm text-danger-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
