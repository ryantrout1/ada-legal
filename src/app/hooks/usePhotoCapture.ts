/**
 * usePhotoCapture — orchestrates a single field-capture submit.
 *
 * Why a separate hook (not useChatSession):
 *   useChatSession is a heavy conversational engine — SSE streaming,
 *   undo windows, resume-from-disk, optimistic bubbles, multi-turn
 *   state. /photo is a one-shot form: take photo, type comment, hit
 *   submit, see the analyzer output, done. Reusing useChatSession
 *   would bring in a pile of behavior we don't want here and a
 *   conversational UI affordance we'd have to actively suppress.
 *
 *   What we DO share with the chat flow: session-create → upload-photo
 *   (signed token). From there /photo intentionally diverges. Ada's live
 *   chat reads photos via native vision and does not run the structured
 *   analyzer; /photo's purpose is to exercise that structured analyzer —
 *   the one the admin review/labeling queue is built around — so it calls
 *   the dedicated /api/ada/analyze-photo endpoint, which persists a
 *   photo_analyses row for review.
 *
 * Flow:
 *   1. POST /api/ada/session with `is_test: true` + X-Ada-Field-Capture
 *      header. Server mints the ada_anon cookie if absent. We need
 *      the cookie before step 2 because /api/ada/upload-photo gates
 *      token issuance on a valid cookie.
 *   2. uploadPhoto(sessionId, file) — dynamic import of
 *      @vercel/blob/client, same as the chat path. Returns a public
 *      blob URL.
 *   3. POST /api/ada/analyze-photo with `{ session_id, photo_url,
 *      context_hint }`. The endpoint (is_test-gated) runs the structured
 *      analyzer, persists a photo_analyses row, and returns the
 *      analyzer's summary in `assistant_message`.
 *
 * Status state machine:
 *   idle → uploading → analyzing → saved
 *                            ↘
 *                              error (any step)
 *
 * Reset:
 *   `reset()` returns to idle. The session_id is dropped — each
 *   capture is its own session, which matches the "one capture =
 *   one reviewable session in admin" goal.
 *
 * Ref: /plan: /photo field-test capture page, Phase 2.
 */

import { useCallback, useRef, useState } from 'react';

export type PhotoCaptureStatus =
  | 'idle'
  | 'uploading'
  | 'analyzing'
  | 'saved'
  | 'error';

export interface PhotoCaptureSubmitInput {
  file: File;
  comment: string;
}

export interface PhotoCaptureResult {
  sessionId: string;
  assistantMessage: string;
  photoUrl: string;
}

interface UsePhotoCaptureReturn {
  status: PhotoCaptureStatus;
  result: PhotoCaptureResult | null;
  error: string | null;
  submit: (input: PhotoCaptureSubmitInput) => Promise<void>;
  /** Save the tester's post-analysis comment. Returns true on success. */
  submitFeedback: (comment: string) => Promise<boolean>;
  reset: () => void;
}

export function usePhotoCapture(): UsePhotoCaptureReturn {
  const [status, setStatus] = useState<PhotoCaptureStatus>('idle');
  const [result, setResult] = useState<PhotoCaptureResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Guard against accidental double-submit (double-tap on the submit
  // button while uploading). A ref instead of state so the check is
  // synchronous and doesn't rely on a re-render.
  const inFlightRef = useRef(false);
  // Latest captured session id, kept in a ref so submitFeedback can read
  // it without a stale closure after the result lands.
  const sessionIdRef = useRef<string | null>(null);

  const submit = useCallback(
    async (input: PhotoCaptureSubmitInput) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setError(null);
      setResult(null);

      try {
        // Step 1: create the field-capture session.
        setStatus('uploading');
        const sessionRes = await fetch('/api/ada/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Gate that pairs with body.is_test — see
            // src/lib/fieldCaptureFlag.ts and Phase 1 of this plan.
            'X-Ada-Field-Capture': '1',
          },
          credentials: 'same-origin',
          body: JSON.stringify({ is_test: true }),
        });
        if (!sessionRes.ok) {
          throw new Error(
            `Could not start a session (HTTP ${sessionRes.status})`,
          );
        }
        const sessionJson = (await sessionRes.json()) as {
          session_id?: string;
        };
        const sessionId = sessionJson.session_id;
        if (!sessionId) {
          throw new Error('Session created without a session_id');
        }

        // Step 2: upload the photo through the same @vercel/blob/client
        // direct-upload helper the chat uses. Dynamic import keeps the
        // 60-something-KB blob client out of the route's initial bundle.
        const { upload } = await import('@vercel/blob/client');
        const ext = extensionForType(input.file.type);
        const pathname = `photos/${sessionId}/${Date.now()}.${ext}`;
        const uploadResult = await upload(pathname, input.file, {
          access: 'public',
          handleUploadUrl: '/api/ada/upload-photo',
          contentType: input.file.type,
        });
        const photoUrl = uploadResult.url;

        // Step 3: run the structured analyzer. Unlike the chat turn,
        // this persists a photo_analyses row that surfaces in the admin
        // review queue, and returns the analyzer's summary as
        // assistant_message. A typed comment, if any, is passed as a
        // context hint to focus the analysis.
        setStatus('analyzing');
        const contextHint = input.comment.trim() || undefined;
        const analyzeRes = await fetch('/api/ada/analyze-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            session_id: sessionId,
            photo_url: photoUrl,
            context_hint: contextHint,
          }),
        });
        if (!analyzeRes.ok) {
          throw new Error(`Analyzer failed (HTTP ${analyzeRes.status})`);
        }
        const analyzeJson = (await analyzeRes.json()) as {
          assistant_message?: string;
        };
        const assistantMessage = analyzeJson.assistant_message ?? '';

        sessionIdRef.current = sessionId;
        setResult({ sessionId, assistantMessage, photoUrl });
        setStatus('saved');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Something went wrong.';
        setError(message);
        setStatus('error');
      } finally {
        inFlightRef.current = false;
      }
    },
    [],
  );

  const submitFeedback = useCallback(async (comment: string): Promise<boolean> => {
    const sessionId = sessionIdRef.current;
    const trimmed = comment.trim();
    if (!sessionId || !trimmed) return false;
    try {
      const res = await fetch('/api/ada/photo-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ session_id: sessionId, comment: trimmed }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
    sessionIdRef.current = null;
  }, []);

  return { status, result, error, submit, submitFeedback, reset };
}

function extensionForType(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      // downscalePhoto always emits image/jpeg, so this fallback is
      // mostly defensive — but it's a real safety net if a future
      // refactor changes the preprocessor.
      return 'jpg';
  }
}
