/**
 * PhotoCapture — /photo
 *
 * Unlisted, no-auth field-test page used to validate Ada's photo
 * analyzer with real photos from real people in the wild. Distributed
 * by direct link to 5-6 testers (Ryan, Gina, Peter, plus a few field
 * friends with disabilities). Not linked from any other page.
 *
 * Each submission creates a real Ada session with is_test=true (gated
 * by X-Ada-Field-Capture header — see /plan: /photo Phase 1) so the
 * captures appear in the admin sessions UI alongside real sessions
 * but stay out of production analytics.
 *
 * Layout:
 *   ─────────────────────────────────────
 *   │ Ada Photo Field Test               │
 *   │ Internal — for testing only        │
 *   │                                    │
 *   │ [ 📷 Take a photo ]                │  (rear camera on mobile)
 *   │ [   thumbnail   ]                  │
 *   │                                    │
 *   │ What are we looking at? (optional) │
 *   │ ┌────────────────────────────────┐ │
 *   │ │ textarea                       │ │
 *   │ └────────────────────────────────┘ │
 *   │                                    │
 *   │ [   Send to Ada   ]                │
 *   ─────────────────────────────────────
 *
 * After submit, status takes over the surface:
 *   uploading → analyzing → saved (shows Ada's response) → reset
 *
 * Accessibility:
 *   - aria-live="polite" on the status region so changes are announced
 *   - aria-live="polite" on the analyzer-output region for the same
 *   - All buttons have visible labels and minimum 44x44 hit targets
 *   - Standalone route (no PublicLayout chrome) so the page is one
 *     focused task with nothing competing for attention
 *
 * Standalone routing: mounted OUTSIDE PublicLayout so there's no nav,
 * no footer, no accessibility panel — just the form. Internal tool.
 *
 * Ref: /plan: /photo field-test capture page, Phase 2.
 */

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { downscalePhoto } from '../../utils/downscalePhoto.js';
import {
  usePhotoCapture,
  type PhotoCaptureStatus,
} from '../../hooks/usePhotoCapture.js';

const MAX_RAW_BYTES = 20 * 1024 * 1024; // 20 MB — matches Chat.tsx

export default function PhotoCapture() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  // Local error state for client-side issues (file too big, downscale
  // failed, no photo at submit time). Separate from the hook's `error`
  // which covers network/server errors during submit.
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const { status, result, error: submitError, submit, reset } = usePhotoCapture();

  // Revoke the last preview object URL on unmount to avoid leaking
  // browser memory if the user navigates away without resetting.
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
    // We only want this cleanup to fire on unmount, not on every
    // photoPreview change — replace-time cleanup is handled inline
    // in handlePhotoSelect and handleReset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePhotoSelect(e: ChangeEvent<HTMLInputElement>) {
    setLocalError(null);
    const raw = e.target.files?.[0];
    if (!raw) return;
    if (raw.size > MAX_RAW_BYTES) {
      setLocalError(
        'That photo is bigger than 20 MB. Try a smaller one, or take a fresh photo with your camera app.',
      );
      // Clear any previously-selected photo too — the user's intent
      // was to replace it. Leaving the old one would let them submit
      // a stale photo while seeing the size error.
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoFile(null);
      setPhotoPreview(null);
      // Clear the input so the same file can be re-picked after the
      // user takes a different shot.
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (uploadInputRef.current) uploadInputRef.current.value = '';
      return;
    }
    try {
      const file = await downscalePhoto(raw);
      const previewUrl = URL.createObjectURL(file);
      // Revoke the prior preview URL when the user picks a different
      // photo without resetting. createObjectURL leaks memory until
      // the page unloads if we don't.
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoFile(file);
      setPhotoPreview(previewUrl);
    } catch {
      setLocalError(
        'Could not process that photo. Try a different one or use your camera app.',
      );
    }
  }

  async function handleSubmit() {
    if (!photoFile) {
      setLocalError('Please take or pick a photo before sending.');
      return;
    }
    setLocalError(null);
    await submit({ file: photoFile, comment });
  }

  function handleReset() {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setComment('');
    setLocalError(null);
    reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (uploadInputRef.current) uploadInputRef.current.value = '';
  }

  const busy = status === 'uploading' || status === 'analyzing';
  const showResult = status === 'saved' && result;
  const showError = status === 'error' && submitError;

  return (
    <>
      <Helmet>
        <title>Photo field test — ADA Legal Link</title>
        {/* Unlisted internal tool. Keep search engines out. */}
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <main
        // Match the public site's surface tokens so /photo doesn't look
        // jarringly different — same palette, same body font, but no
        // header/footer. Min-height-screen so the surface fills mobile
        // viewports even with short content.
        className="min-h-screen bg-surface-50 text-ink-900 font-body"
      >
        <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
          <header className="mb-6">
            <h1 className="font-display text-3xl text-ink-900">
              Ada Photo Field Test
            </h1>
            <p className="mt-2 text-sm text-ink-700">
              Internal tool. Take a photo of something Ada might be asked
              about — a ramp, a doorway, signage — and send it through so
              we can see what she says.
            </p>
          </header>

          {!showResult && !showError && (
            <PhotoCaptureForm
              photoPreview={photoPreview}
              comment={comment}
              status={status}
              busy={busy}
              localError={localError}
              fileInputRef={fileInputRef}
              uploadInputRef={uploadInputRef}
              onPhotoSelect={handlePhotoSelect}
              onCommentChange={setComment}
              onSubmit={handleSubmit}
            />
          )}

          {showResult && result && (
            <SavedView result={result} onReset={handleReset} />
          )}

          {showError && submitError && (
            <ErrorView error={submitError} onReset={handleReset} />
          )}
        </div>
      </main>
    </>
  );
}

interface PhotoCaptureFormProps {
  photoPreview: string | null;
  comment: string;
  status: PhotoCaptureStatus;
  busy: boolean;
  localError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  uploadInputRef: React.RefObject<HTMLInputElement | null>;
  onPhotoSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onCommentChange: (value: string) => void;
  onSubmit: () => void;
}

function PhotoCaptureForm(props: PhotoCaptureFormProps) {
  const {
    photoPreview,
    comment,
    status,
    busy,
    localError,
    fileInputRef,
    uploadInputRef,
    onPhotoSelect,
    onCommentChange,
    onSubmit,
  } = props;

  return (
    <div className="space-y-6">
      {/*
        The native file input is hidden but accessible — we trigger it
        via a styled button instead so we can hit the 44x44 minimum
        without fighting browser-default sizing. `capture="environment"`
        opens the rear camera directly on phones; desktop falls back
        to the file picker.
      */}
      {/*
        Two paths to a photo. The camera input keeps capture="environment"
        so phones open the rear camera straight away. The upload input
        omits capture, so the same tap on a phone offers Photo Library /
        Files instead — needed for photos taken elsewhere (e.g. someone
        emailed a batch to test). On desktop both just open the file
        picker. Hidden inputs triggered by styled 48px labels.
      */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPhotoSelect}
        className="sr-only"
        id="photo-input"
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        onChange={onPhotoSelect}
        className="sr-only"
        id="photo-upload-input"
      />
      <div className="grid grid-cols-2 gap-3">
        <label
          htmlFor="photo-input"
          className="flex min-h-[48px] cursor-pointer items-center justify-center rounded-md border-2 border-accent-500 bg-accent-50 px-4 py-3 text-center font-display text-base text-accent-600 transition-colors hover:bg-accent-50/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-accent-500 focus-within:ring-offset-2 focus-within:ring-offset-surface-50"
        >
          {photoPreview ? 'Retake photo' : '📷 Take a photo'}
        </label>
        <label
          htmlFor="photo-upload-input"
          className="flex min-h-[48px] cursor-pointer items-center justify-center rounded-md border-2 border-accent-500 px-4 py-3 text-center font-display text-base text-accent-600 transition-colors hover:bg-accent-50/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-accent-500 focus-within:ring-offset-2 focus-within:ring-offset-surface-50"
        >
          🖼️ Upload a photo
        </label>
      </div>

      {photoPreview && (
        <div className="rounded-md border border-surface-200 bg-surface-100 p-2">
          {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
          <img
            src={photoPreview}
            alt="Preview of the photo you just took"
            className="block w-full rounded-sm"
          />
        </div>
      )}

      <div>
        <label
          htmlFor="comment"
          className="block font-display text-base text-ink-900"
        >
          What are we looking at? <span className="text-ink-500">(optional)</span>
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          rows={4}
          placeholder="Anything Ada should know about this photo — what's wrong, what's right, what to look for."
          className="mt-2 block w-full rounded-md border border-surface-200 bg-surface-50 px-3 py-2 text-base text-ink-900 placeholder:text-ink-500 focus-visible:border-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
        />
      </div>

      {localError && (
        <div
          role="alert"
          className="rounded-md border border-accent-500 bg-accent-50 px-3 py-2 text-sm text-ink-900"
        >
          {localError}
        </div>
      )}

      {/* aria-live polite so screen-reader users get the status
          progression ('uploading' → 'analyzing') without an
          interruption. */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="min-h-[24px] text-sm text-ink-700"
      >
        {status === 'uploading' && 'Uploading your photo…'}
        {status === 'analyzing' && 'Ada is looking at it…'}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={busy}
        className="block w-full min-h-[48px] rounded-md bg-accent-500 px-4 py-3 font-display text-lg text-surface-50 transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50 disabled:cursor-not-allowed disabled:bg-surface-300"
      >
        {busy ? 'Working…' : 'Send to Ada'}
      </button>
    </div>
  );
}

interface SavedViewProps {
  result: {
    sessionId: string;
    assistantMessage: string;
    photoUrl: string;
  };
  onReset: () => void;
}

function SavedView({ result, onReset }: SavedViewProps) {
  return (
    <div className="space-y-4">
      <div
        // aria-live so the result is announced when it lands. Polite so
        // it doesn't interrupt a screen reader mid-sentence.
        aria-live="polite"
        className="rounded-md border border-success-500 bg-success-50 px-3 py-2 text-sm text-ink-900"
      >
        Saved. The session is now reviewable in admin.
      </div>

      <section>
        <h2 className="font-display text-xl text-ink-900">Ada said</h2>
        <div className="mt-2 whitespace-pre-wrap rounded-md border border-surface-200 bg-surface-100 px-3 py-3 text-base text-ink-900">
          {result.assistantMessage || '(no response text)'}
        </div>
      </section>

      <p className="font-mono text-xs text-ink-500 break-all">
        session: {result.sessionId}
      </p>

      <button
        type="button"
        onClick={onReset}
        className="block w-full min-h-[48px] rounded-md bg-accent-500 px-4 py-3 font-display text-lg text-surface-50 transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
      >
        Capture another
      </button>
    </div>
  );
}

interface ErrorViewProps {
  error: string;
  onReset: () => void;
}

function ErrorView({ error, onReset }: ErrorViewProps) {
  return (
    <div className="space-y-4">
      <div
        role="alert"
        className="rounded-md border border-accent-500 bg-accent-50 px-3 py-3 text-sm text-ink-900"
      >
        <p className="font-display text-base">Something went wrong.</p>
        <p className="mt-1">{error}</p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="block w-full min-h-[48px] rounded-md bg-accent-500 px-4 py-3 font-display text-lg text-surface-50 transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50"
      >
        Try again
      </button>
    </div>
  );
}
