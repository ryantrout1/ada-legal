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
}

interface SessionCreateResponse {
  session_id: string;
  greeting: string;
  reading_level: ReadingLevel;
}

interface TurnResponse {
  assistant_message: string;
  tools_used: string[];
  reading_level: ReadingLevel;
  status: SessionStatus;
  photo_findings?: unknown;
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

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    void createSession(initialLevel);
  }, [createSession, initialLevel]);

  // ─── Send a message ────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (userText: string, photoDataUrl?: string) => {
      if (!state.sessionId) return;
      if (state.busy) return;
      if (state.status !== 'active') return;
      const trimmed = userText.trim();
      if (!trimmed) return;

      // Optimistic: add the user bubble, flip to busy.
      const userMsg: ChatMessage = {
        id: cryptoId(),
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
        photoPreview: photoDataUrl,
      };
      setState((s) => ({
        ...s,
        messages: [...s.messages, userMsg],
        busy: true,
        error: null,
      }));

      // The server-side message carries the photo as a blob_key if present —
      // Ada's prompt tells her to call analyze_photo when she sees one.
      const serverMessage = photoDataUrl
        ? `${trimmed}\n\n[User attached a photo. blob_key: ${photoDataUrl}]`
        : trimmed;

      try {
        const resp = await fetch('/api/ada/turn', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: state.sessionId,
            message: serverMessage,
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
