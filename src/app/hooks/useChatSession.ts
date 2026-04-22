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
  });
  const didInitRef = useRef(false);

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

  const sendMessage = useCallback(
    async (
      userText: string,
      photoFile?: File,
      photoPreviewDataUrl?: string,
    ) => {
      if (!state.sessionId) return;
      if (state.busy) return;
      if (state.status !== 'active') return;
      const trimmed = userText.trim();
      if (!trimmed) return;

      // Optimistic: add the user bubble, flip to busy. The bubble
      // preview uses the data URL we captured when the user picked
      // the file — no network trip needed to render their own image.
      const userMsg: ChatMessage = {
        id: cryptoId(),
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
      }));

      try {
        // If the user attached a photo, upload it to Vercel Blob via
        // the client-direct-upload path (see /api/ada/upload-photo).
        // The function endpoint only issues a short-lived signed token —
        // the actual bytes travel directly from the browser to Vercel
        // Blob storage, bypassing our lambdas entirely. This is the
        // only way to handle multi-MB photos on Vercel's platform.
        let photoUrl: string | null = null;
        if (photoFile) {
          photoUrl = await uploadPhoto(state.sessionId, photoFile);
        }

        // The server-side message carries the photo as a blob URL if
        // present — Ada's prompt tells her to call analyze_photo when
        // she sees one, and analyze_photo accepts http(s) URLs.
        const serverMessage = photoUrl
          ? `${trimmed}\n\n[User attached a photo. blob_key: ${photoUrl}]`
          : trimmed;

        const resp = await fetch('/api/ada/turn', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
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
        const data = (await resp.json()) as TurnResponse;
        setState((s) => ({
          ...s,
          messages: [
            ...s.messages,
            {
              id: cryptoId(),
              role: 'assistant',
              content: data.assistant_message,
              timestamp: new Date().toISOString(),
              tools: data.tools_used,
            },
          ],
          status: data.status,
          readingLevel: data.reading_level,
          busy: false,
          error: null,
          // Surface the package slug when Ada ends a session.
          // Persists across turns so reloading the completed state
          // keeps showing the "Your summary is ready" card.
          packageSlug: data.package_slug ?? s.packageSlug,
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          busy: false,
          error: err instanceof Error ? err.message : 'Failed to send message',
        }));
      }
    },
    [state.sessionId, state.busy, state.status],
  );

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
