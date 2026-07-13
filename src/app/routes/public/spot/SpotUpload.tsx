/**
 * SpotUpload — paid photo upload (Ada Spot 2b).
 *
 * Shown only after the server confirms paid-state. Uploads up to 10 photos
 * straight to Vercel Blob via @vercel/blob/client (the token endpoint
 * re-checks paid + cap server-side), then "Finish" flips the session to
 * uploaded and shows the async confirmation. Photos are normalized through the
 * shared downscale util (supported type + sane size); the free-tier bench
 * capture hook is not reused.
 */

import { useState } from 'react';
import { downscalePhoto } from '@/app/utils/downscalePhoto';

const MAX_PHOTOS = 10;

interface Props {
  spotSessionId: string;
  buyerEmail?: string | null;
}

export default function SpotUpload({ spotSessionId, buyerEmail }: Props) {
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_PHOTOS - count;

  async function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      const { upload } = await import('@vercel/blob/client');
      const files = Array.from(list).slice(0, remaining);
      for (const file of files) {
        const scaled = await downscalePhoto(file);
        await upload(`spot/${spotSessionId}/${Date.now()}-${scaled.name}`, scaled, {
          access: 'public',
          handleUploadUrl: '/api/spot/upload',
          contentType: scaled.type,
          clientPayload: JSON.stringify({ spotSessionId }),
        });
        setCount((c) => c + 1);
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
          {MAX_PHOTOS} photos. {count} added.
        </p>
      </div>

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
