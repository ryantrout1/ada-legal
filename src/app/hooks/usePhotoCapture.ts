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
 *   What we DO share with the chat flow: the exact same backend
 *   pipeline. session-create → upload-photo (signed token) → turn
 *   with blob_keys annotation. /photo's whole purpose is to test the
 *   production analyzer in the wild, so we go through the same code
 *   path real users do — anything else would test something else.
 *
 * Flow:
 *   1. POST /api/ada/session with `is_test: true` + X-Ada-Field-Capture
 *      header. Server mints the ada_anon cookie if absent. We need
 *      the cookie before step 2 because /api/ada/upload-photo gates
 *      token issuance on a valid cookie.
 *   2. uploadPhoto(sessionId, file) — dynamic import of
 *      @vercel/blob/client, same as the chat path. Returns a public
 *      blob URL.
 *   3. POST /api/ada/turn with `{ session_id, message, photo_url }`.
 *      Using JSON mode (default Accept) — we don't need streaming
 *      for a one-shot capture; the page just shows the final analysis.
 *      Ada sees the photo annotation in the message and calls
 *      analyze_photo. Result comes back in `assistant_message` +
 *      `photo_findings`.
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

const DEFAULT_COMMENT = 'Field capture — no comment provided.';

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

        // Step 3: post the turn. Comment becomes the user message;
        // photo_url is propagated server-side into the blob_keys
        // annotation Ada sees as part of the user turn.
        setStatus('analyzing');
        const comment = input.comment.trim() || DEFAULT_COMMENT;
        const turnRes = await fetch('/api/ada/turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            session_id: sessionId,
            message: comment,
            photo_url: photoUrl,
          }),
        });
        if (!turnRes.ok) {
          throw new Error(`Analyzer failed (HTTP ${turnRes.status})`);
        }
        const turnJson = (await turnRes.json()) as {
          assistant_message?: string;
        };
        const assistantMessage = turnJson.assistant_message ?? '';

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
