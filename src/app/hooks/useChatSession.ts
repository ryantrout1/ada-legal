/**
 * useChatSession — the single source of truth for a Ch0 chat session.
 *
 * Responsibilities:
 *   - Create a session on mount (POST /api/ada/session)
 *   - Accumulate the message history client-side as user + assistant bubbles
 *   - Send a user message via POST /api/ada/turn, surface busy state
 *   - Track reading level (with state persisted server-side via future turn)
 *   - Surface errors without swallowing them
 *   - Expose a locked state when status=='completed' or 'abandoned'
 *
 * The hook owns the IO; the <ChatView /> component owns layout.
 *
 * Ref: docs/ARCHITECTURE.md §11
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type ReadingLevel = 'simple' | 'standard' | 'professional';
export type SessionStatus = 'active' | 'completed' | 'abandoned';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  /** Tools called by Ada during the turn that produced this assistant message. */
  tools?: string[];
  /** Optional preview for a user-uploaded photo (data URL). */
  photoPreview?: string;
}

export interface ChatState {
  sessionId: string | null;
  status: SessionStatus;
  readingLevel: ReadingLevel;
  messages: ChatMessage[];
  busy: boolean;
  error: string | null;
  /** True on mount until first session call resolves. */
  initializing: boolean;
  /**
   * A previously-started active conversation found via the anon cookie.
   * When non-null, the UI shows a "Continue your last conversation?"
   * card and waits for the user to choose resume or start-fresh.
   */
  resumable: {
    sessionId: string;
    readingLevel: ReadingLevel;
    messages: ChatMessage[];
  } | null;
  /**
   * The slug of the session package, set when Ada ends the session.
   * The UI renders a "Your summary is ready" card linking to /s/{slug}
   * when this is non-null. See Step 18 Commit 4 for package generation.
   */
  packageSlug: string | null;
  /**
   * Set when the user has hit Send but the network call hasn't fired
   * yet — the undo window. The optimistic user bubble is already in
   * messages[]; cancelling rolls it back. When null, no undo window
   * is open.
   *
   * pendingMessageId: the id of the optimistic user bubble in
   *   messages[]. Used on cancel to remove the right bubble.
   * sendAt: epoch ms when the network call will fire. UI shows a
   *   countdown derived from this.
   * draft: the textarea draft that produced this send, restored to
   *   the textarea on cancel.
   * photoPreview: data URL of the attached photo, restored on cancel.
   *
   * Photo upload happens during the window (no need to wait — Vercel
   * Blob uploads are independent and orphans on cancel are cheap).
   */
  pendingSend: {
    pendingMessageId: string;
    sendAt: number;
    draft: string;
    photoPreview?: string;
  } | null;
}

interface SessionCreateResponse {
  session_id: string;
  greeting: string;
  reading_level: ReadingLevel;
}

interface ResumeResponse {
  session: {
    session_id: string;
    status: SessionStatus;
    reading_level: ReadingLevel;
    messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
    /**
     * True when the server returned a pre-bound class_action_intake
     * session with 0 messages (deep-link from /class-actions/:slug).
     * The client should silently adopt this session without prompting
     * the user to "resume previous conversation." See Step 26 Commit 2.
     */
    is_prebound?: boolean;
  } | null;
}

interface TurnResponse {
  assistant_message: string;
  tools_used: string[];
  reading_level: ReadingLevel;
  status: SessionStatus;
  photo_findings?: unknown;
  /** Slug of the session package generated on session completion. */
  package_slug?: string | null;
}

const DEFAULT_LEVEL: ReadingLevel = 'standard';

export function useChatSession(initialLevel: ReadingLevel = DEFAULT_LEVEL) {
  const [state, setState] = useState<ChatState>({
    sessionId: null,
    status: 'active',
    readingLevel: initialLevel,
    messages: [],
    busy: false,
    error: null,
    initializing: true,
    resumable: null,
    packageSlug: null,
    pendingSend: null,
  });
  const didInitRef = useRef(false);

  // Timer for the deferred-send window. Held in a ref because we need
  // to clear it from cancelPendingMessage() and from cleanup.
  const pendingTimerRef = useRef<number | null>(null);

  // ─── Session creation ──────────────────────────────────────────────────────

  const createSession = useCallback(
    async (level: ReadingLevel) => {
      setState((s) => ({ ...s, initializing: true, error: null }));
      try {
        const resp = await fetch('/api/ada/session', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reading_level: level }),
        });
        if (!resp.ok) {
          const msg = await extractError(resp);
          throw new Error(msg || `Session creation failed (${resp.status})`);
        }
        const data = (await resp.json()) as SessionCreateResponse;
        setState((s) => ({
          ...s,
          sessionId: data.session_id,
          readingLevel: data.reading_level,
          initializing: false,
          error: null,
          messages: [
            {
              id: cryptoId(),
              role: 'assistant',
              content: data.greeting,
              timestamp: new Date().toISOString(),
            },
          ],
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          initializing: false,
          error: err instanceof Error ? err.message : 'Failed to start session',
        }));
      }
    },
    [],
  );

  // On mount, check if we have a resumable session (anon cookie
  // points at an active ada_sessions row). If so, offer it — don't
  // auto-resume. Accessibility principle: the user must always be in
  // control of state transitions. If no resumable session exists,
  // create a fresh one.
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    void (async () => {
      try {
        const resp = await fetch('/api/ada/session/current', {
          credentials: 'include',
        });
        if (resp.ok) {
          const data = (await resp.json()) as ResumeResponse;
          // Pre-bound intake session (deep-link from /class-actions/:slug).
          // 0 messages, but the session is already live on the server.
          // Adopt it silently — the user clicked a button, they expect
          // to continue, not be prompted with "resume previous."
          if (data.session && data.session.is_prebound) {
            setState((s) => ({
              ...s,
              sessionId: data.session!.session_id,
              readingLevel: data.session!.reading_level,
              initializing: false,
              messages: [],
            }));
            return;
          }
          if (data.session && data.session.messages.length > 0) {
            // Offer to resume. Don't create a new session yet.
            const mapped: ChatMessage[] = data.session.messages.map((m) => ({
              id: cryptoId(),
              role: m.role,
              content: m.content,
              timestamp: m.timestamp,
            }));
            setState((s) => ({
              ...s,
              initializing: false,
              resumable: {
                sessionId: data.session!.session_id,
                readingLevel: data.session!.reading_level,
                messages: mapped,
              },
            }));
            return;
          }
        }
      } catch {
        // Resume probe failed; fall through to new-session creation.
        // This is not a user-visible error — the worst case is we
        // just start fresh, which is the same outcome as a first
        // visit.
      }
      void createSession(initialLevel);
    })();
  }, [createSession, initialLevel]);

  // User accepted the resume offer — hydrate state from the resumable.
  const acceptResume = useCallback(() => {
    setState((s) => {
      if (!s.resumable) return s;
      return {
        ...s,
        sessionId: s.resumable.sessionId,
        readingLevel: s.resumable.readingLevel,
        messages: s.resumable.messages,
        resumable: null,
      };
    });
  }, []);

  // User declined — start fresh. The old session will be abandoned via
  // the normal completion-detection path once the new one gets traffic;
  // we don't eagerly mutate it server-side here.
  const discardResume = useCallback(
    (level: ReadingLevel) => {
      setState((s) => ({ ...s, resumable: null }));
      void createSession(level);
    },
    [createSession],
  );

  // ─── Send a message ────────────────────────────────────────────────────────

  /**
   * Send a user message to Ada. Optionally takes an undoWindowMs — when
   * > 0, defers the actual network call by that many milliseconds, during
   * which time cancelPendingMessage() can roll back the send. The user
   * bubble is added optimistically right away in either case so the user
   * sees their message went; on cancel the bubble is removed.
   *
   * Photo upload (when present) starts immediately during the window —
   * orphan blobs on cancel are cheap and waiting until after the window
   * would add 1-3s of perceived send latency on slow networks.
   */
  const sendMessage = useCallback(
    async (
      userText: string,
      photoFile?: File,
      photoPreviewDataUrl?: string,
      undoWindowMs: number = 0,
    ) => {
      if (!state.sessionId) return;
      if (state.busy) return;
      if (state.status !== 'active') return;
      const trimmed = userText.trim();
      if (!trimmed) return;

      // Allocate the user message id up front so we can reference it
      // both in the optimistic add and in cancelPendingMessage's
      // rollback path.
      const userMsgId = cryptoId();

      // Optimistic: add the user bubble, flip to busy. The bubble
      // preview uses the data URL we captured when the user picked
      // the file — no network trip needed to render their own image.
      const userMsg: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
        photoPreview: photoPreviewDataUrl,
      };
      setState((s) => ({
        ...s,
        messages: [...s.messages, userMsg],
        busy: true,
        error: null,
        // Open the undo window if undoWindowMs > 0. The UI keys off
        // pendingSend.sendAt to render the countdown affordance.
        pendingSend: undoWindowMs > 0
          ? {
              pendingMessageId: userMsgId,
              sendAt: Date.now() + undoWindowMs,
              draft: trimmed,
              photoPreview: photoPreviewDataUrl,
            }
          : null,
      }));

      // If no undo window: fire the network work immediately (the original
      // behavior). Otherwise: kick off photo upload now (parallelizes the
      // wait) and schedule the network call after undoWindowMs.
      if (undoWindowMs <= 0) {
        await commitSend(userMsgId, trimmed, photoFile);
        return;
      }

      // Pre-upload the photo during the undo window so the user doesn't
      // wait for it after the window closes. Stored in a ref so the
      // deferred commit can pick it up; if cancelled, the orphan blob
      // is harmless (Vercel Blob is cheap, and orphan cleanup can run
      // out-of-band if it ever matters).
      const photoUrlPromise = photoFile
        ? uploadPhoto(state.sessionId, photoFile)
        : Promise.resolve<string | null>(null);

      // Schedule the actual send. Stored in a ref so cancelPendingMessage
      // can clear it. If the timer fires, we resolve the photoUrl and
      // call the inner commit.
      pendingTimerRef.current = window.setTimeout(() => {
        pendingTimerRef.current = null;
        // Close the undo window in state, then commit.
        setState((s) => ({ ...s, pendingSend: null }));
        void photoUrlPromise.then((photoUrl) => {
          void commitSend(userMsgId, trimmed, undefined, photoUrl);
        });
      }, undoWindowMs);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.sessionId, state.busy, state.status],
  );

  /**
   * Commit a previously-prepared user message — actually fires the
   * /api/ada/turn call and streams the response. Two call sites:
   *
   * 1. sendMessage with undoWindowMs <= 0: called immediately.
   *    photoFile is provided, photoUrl is undefined; commitSend uploads.
   * 2. The undo-window timer: photoFile is undefined (uploaded
   *    in advance during the window); photoUrl is provided.
   *
   * Either way: same downstream pipeline. The optimistic user bubble
   * was already added by the caller; commitSend only handles the
   * assistant placeholder + streaming.
   */
  const commitSend = useCallback(
    async (
      _userMsgId: string,
      trimmed: string,
      photoFile?: File,
      preUploadedPhotoUrl?: string | null,
    ) => {
      if (!state.sessionId) return;

      // Allocated up front so the error handler can clean up an empty
      // placeholder on failure (no ghost assistant bubble after errors).
      let assistantId: string | null = null;

      try {
        let photoUrl: string | null = preUploadedPhotoUrl ?? null;
        if (!photoUrl && photoFile) {
          // Path 1: synchronous send (no undo window). Upload the photo
          // here. Vercel Blob direct-upload — see /api/ada/upload-photo
          // for the signed-token pattern; bytes travel browser→Blob,
          // bypassing our lambdas.
          photoUrl = await uploadPhoto(state.sessionId, photoFile);
        }

        // The server-side message carries the photo as a blob URL if
        // present — Ada's prompt tells her to call analyze_photo when
        // she sees one, and analyze_photo accepts http(s) URLs.
        const serverMessage = photoUrl
          ? `${trimmed}\n\n[User attached a photo. blob_key: ${photoUrl}]`
          : trimmed;

        // Insert an empty assistant placeholder NOW so the streamer has
        // a target to append into. The render path in Chat.tsx already
        // handles empty assistant content + populated tools by showing
        // "Working on it…", so the placeholder is invisible until either
        // text deltas land or the done frame populates tools.
        assistantId = cryptoId();
        const placeholderId = assistantId;
        setState((s) => ({
          ...s,
          messages: [
            ...s.messages,
            {
              id: placeholderId,
              role: 'assistant',
              content: '',
              timestamp: new Date().toISOString(),
            },
          ],
        }));

        const resp = await fetch('/api/ada/turn', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            // Tells the server to use the SSE branch. Non-SSE callers
            // (curl, scripts) keep getting JSON because they don't send
            // this header.
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({
            session_id: state.sessionId,
            message: serverMessage,
            // Sent separately (not just embedded in the message) so the
            // turn endpoint can persist the URL in session metadata for
            // later attorney-routing packages. Ada still sees the URL
            // in the message text so analyze_photo can find it.
            photo_url: photoUrl ?? undefined,
          }),
        });
        if (!resp.ok) {
          const msg = await extractError(resp);
          throw new Error(msg || `Turn failed (${resp.status})`);
        }

        // Defense-in-depth: if the server returned JSON despite our SSE
        // Accept header (proxy stripped the header, server fell back, or
        // similar edge case), parse the one-shot response and apply the
        // same final-state path as the SSE `done` handler. This keeps
        // the chat working even if the streaming transport breaks.
        const responseContentType = resp.headers.get('Content-Type') ?? '';
        if (!responseContentType.includes('text/event-stream')) {
          const data = (await resp.json()) as TurnResponse;
          setState((s) => ({
            ...s,
            messages: s.messages.map((m) =>
              m.id === placeholderId
                ? {
                    ...m,
                    content: data.assistant_message,
                    tools: data.tools_used,
                  }
                : m,
            ),
            status: data.status,
            readingLevel: data.reading_level,
            busy: false,
            error: null,
            packageSlug: data.package_slug ?? s.packageSlug,
          }));
          return;
        }

        if (!resp.body) {
          throw new Error('Stream unavailable');
        }

        await consumeSseStream(resp.body, {
          onTextDelta: (delta) => {
            setState((s) => ({
              ...s,
              messages: s.messages.map((m) =>
                m.id === placeholderId
                  ? { ...m, content: m.content + delta }
                  : m,
              ),
            }));
          },
          onDone: (final) => {
            setState((s) => ({
              ...s,
              messages: s.messages.map((m) =>
                m.id === placeholderId
                  ? {
                      ...m,
                      // The accumulated content from text deltas is the
                      // canonical user-visible string. Fall back to the
                      // server's assistant_message only if no deltas
                      // arrived (tool-call-only turn).
                      content: m.content.length > 0 ? m.content : final.assistant_message,
                      tools: final.tools_used,
                    }
                  : m,
              ),
              status: final.status,
              readingLevel: final.reading_level,
              busy: false,
              error: null,
              packageSlug: final.package_slug ?? s.packageSlug,
            }));
          },
          onError: (msg) => {
            throw new Error(msg);
          },
        });
      } catch (err) {
        const ghostId = assistantId;
        setState((s) => ({
          ...s,
          // If the placeholder never accumulated any content, drop it so
          // the user doesn't see a ghost empty bubble alongside the
          // error banner. Bubbles that did receive partial deltas before
          // the error are kept — the user's already seen them, and
          // erasing them mid-read would be jarring.
          messages: ghostId
            ? s.messages.filter(
                (m) => !(m.id === ghostId && m.content.length === 0),
              )
            : s.messages,
          busy: false,
          error: err instanceof Error ? err.message : 'Failed to send message',
        }));
      }
    },
    [state.sessionId],
  );

  /**
   * Cancel a pending undo-window send. Removes the optimistic user
   * bubble and clears busy state. Returns the {draft, photoPreview}
   * that produced the send so the UI can restore them to the textarea
   * + photo slot. Returns null when no send is pending.
   *
   * Idempotent — safe to call when there's nothing pending.
   */
  const cancelPendingMessage = useCallback((): {
    draft: string;
    photoPreview?: string;
  } | null => {
    if (pendingTimerRef.current !== null) {
      window.clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    let restored: { draft: string; photoPreview?: string } | null = null;
    setState((s) => {
      if (!s.pendingSend) return s;
      restored = {
        draft: s.pendingSend.draft,
        photoPreview: s.pendingSend.photoPreview,
      };
      return {
        ...s,
        messages: s.messages.filter(
          (m) => m.id !== s.pendingSend!.pendingMessageId,
        ),
        busy: false,
        pendingSend: null,
      };
    });
    return restored;
  }, []);

  // Cleanup any pending timer on unmount so we don't fire commits
  // against a stale session after the user navigates away.
  useEffect(() => {
    return () => {
      if (pendingTimerRef.current !== null) {
        window.clearTimeout(pendingTimerRef.current);
        pendingTimerRef.current = null;
      }
    };
  }, []);

  // ─── Reading level (client-side for this Ch0 slice) ───────────────────────
  // Ada's set_reading_level tool can change it server-side mid-conversation;
  // the user-facing picker here only changes level for the NEXT new session.
  // Changing mid-session requires telling Ada to change, which she routes
  // through the tool — that's documented in the UI.

  const startNewSession = useCallback(
    (level: ReadingLevel) => {
      didInitRef.current = true;
      void createSession(level);
    },
    [createSession],
  );

  return {
    state,
    sendMessage,
    cancelPendingMessage,
    startNewSession,
    acceptResume,
    discardResume,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cryptoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'id_' + Math.random().toString(36).slice(2);
}

async function extractError(resp: Response): Promise<string> {
  try {
    const data = (await resp.json()) as { error?: string };
    return data.error ?? '';
  } catch {
    return resp.statusText;
  }
}

interface SseHandlers {
  onTextDelta: (delta: string) => void;
  onDone: (final: TurnResponse) => void;
  onError: (message: string) => void;
}

/**
 * Read a Server-Sent Events stream from /api/ada/turn and dispatch
 * frames to the provided handlers. Returns when the stream closes.
 *
 * Frame format (matches what api/ada/turn.ts emits):
 *   event: text
 *   data: {"delta":"..."}
 *
 *   event: done
 *   data: {"assistant_message":"...", ...}
 *
 *   event: error
 *   data: {"error":"..."}
 *
 * Frames are separated by a blank line; we buffer partial bytes until
 * a full frame is available. Multi-line `data:` payloads aren't used
 * by our server (we JSON-encode and emit one line), so the parser
 * only needs to handle the single-line case.
 */
async function consumeSseStream(
  body: ReadableStream<Uint8Array>,
  handlers: SseHandlers,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Frames end with a blank line. Process every complete frame in
      // the buffer; leave the trailing partial frame for the next read.
      let frameEnd = buffer.indexOf('\n\n');
      while (frameEnd !== -1) {
        const frame = buffer.slice(0, frameEnd);
        buffer = buffer.slice(frameEnd + 2);
        dispatchFrame(frame, handlers);
        frameEnd = buffer.indexOf('\n\n');
      }
    }
    // Flush any trailing frame (some servers omit the final blank line).
    if (buffer.trim().length > 0) {
      dispatchFrame(buffer, handlers);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* already released */
    }
  }
}

function dispatchFrame(frame: string, handlers: SseHandlers): void {
  let event = 'message';
  let dataLine = '';
  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLine = line.slice(5).trim();
    }
  }
  if (!dataLine) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(dataLine);
  } catch {
    // Malformed payload — skip rather than crashing the stream.
    return;
  }

  switch (event) {
    case 'text': {
      const delta = (parsed as { delta?: unknown }).delta;
      if (typeof delta === 'string') handlers.onTextDelta(delta);
      return;
    }
    case 'done':
      handlers.onDone(parsed as TurnResponse);
      return;
    case 'error': {
      const errMsg = (parsed as { error?: unknown }).error;
      handlers.onError(typeof errMsg === 'string' ? errMsg : 'Stream error');
      return;
    }
    default:
      // Unknown event — ignore. Forward-compatible with future event types.
      return;
  }
}

/**
 * Upload a photo directly to Vercel Blob using the client-direct
 * pattern. Returns the public blob URL that Ada's analyze_photo tool
 * can fetch server-side.
 *
 * How it works:
 *   1. @vercel/blob/client's upload() calls /api/ada/upload-photo
 *      to get a short-lived signed token (tiny JSON round-trip)
 *   2. The browser then streams the file bytes DIRECTLY to Vercel
 *      Blob storage — our serverless function never sees the bytes
 *   3. Result is the public blob URL
 *
 * The pathname we construct ("photos/<session>/<ts>.<ext>") is
 * session-namespaced so moderation/cleanup can prefix-match later.
 * addRandomSuffix is disabled on the server so the pathname we pass
 * is the pathname we get back. Content type is derived from the
 * file's MIME type.
 */
async function uploadPhoto(sessionId: string, file: File): Promise<string> {
  // Dynamic import keeps @vercel/blob/client out of the critical-path
  // bundle for users who never attach a photo.
  const { upload } = await import('@vercel/blob/client');

  const ext = extensionForType(file.type);
  const pathname = `photos/${sessionId}/${Date.now()}.${ext}`;

  const result = await upload(pathname, file, {
    access: 'public',
    handleUploadUrl: '/api/ada/upload-photo',
    contentType: file.type,
  });

  return result.url;
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
      // Fallback — Vercel Blob will still accept it if the server
      // allowedContentTypes list permits it; otherwise it'll 400
      // at token generation time with a clear error.
      return 'bin';
  }
}
