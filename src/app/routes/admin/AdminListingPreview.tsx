/**
 * AdminListingPreview — exercise Ada against a listing in is_test mode.
 *
 * Routed at /admin/listings/:id/preview.
 *
 * How it works:
 *   1. On mount, POST /api/admin/listings/:id/preview/session creates
 *      an is_test=true session pre-bound to this listing with
 *      session_type='class_action_intake'. Ada starts already in
 *      intake mode for this case.
 *   2. Each user message hits /api/ada/turn exactly like the public
 *      chat does — no preview-specific turn handler. The is_test
 *      flag lives on the session row and is enforced server-side.
 *   3. When Ada finalizes, the is_test short-circuit in finalize_intake
 *      (Step 25 Commit 5) skips firm email, user email, and PDF
 *      generation. The admin sees 'finalized' conceptually, with no
 *      real-world side effects.
 *
 * Why a custom chat UI instead of reusing <Chat />:
 *   - Chat creates its own session on mount. We need to preload with
 *     the preview session id we minted on the admin endpoint.
 *   - We want a visible 'PREVIEW MODE' banner and a start-over button
 *     scoped to re-running this listing, not the global reset.
 *   - Photo upload, speech I/O, resumable conversation — those are
 *     public-UX features that aren't useful for admin QA.
 *
 * Ref: Step 25, Commit 5.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { Link, useParams } from 'react-router-dom';

type SessionStatus = 'active' | 'completed' | 'abandoned';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tools?: string[];
}

interface PreviewSessionResponse {
  session_id: string;
  listing_id: string;
  listing_title: string;
  reading_level: 'simple' | 'standard' | 'professional';
  is_test: boolean;
}

interface TurnResponse {
  assistant_message: string;
  tools_used: string[];
  reading_level: 'simple' | 'standard' | 'professional';
  status: SessionStatus;
}

export default function AdminListingPreview() {
  const { id } = useParams<{ id: string }>();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [listingTitle, setListingTitle] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<SessionStatus>('active');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauth, setUnauth] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Create the preview session on mount.
  const start = useCallback(async () => {
    if (!id) return;
    setInitializing(true);
    setError(null);
    setMessages([]);
    setStatus('active');
    try {
      const resp = await fetch(
        `/api/admin/listings/${encodeURIComponent(id)}/preview/session`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ reading_level: 'standard' }),
        },
      );
      if (resp.status === 401) {
        setUnauth(true);
        return;
      }
      if (resp.status === 404) {
        setNotFound(true);
        return;
      }
      if (!resp.ok) {
        const body = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${resp.status}`);
      }
      const data = (await resp.json()) as PreviewSessionResponse;
      setSessionId(data.session_id);
      setListingTitle(data.listing_title);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start preview');
    } finally {
      setInitializing(false);
    }
  }, [id]);

  useEffect(() => {
    void start();
  }, [start]);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  async function handleSend(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!sessionId || !draft.trim() || busy || status !== 'active') return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: draft.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    const sending = draft.trim();
    setDraft('');
    setBusy(true);
    setError(null);
    try {
      const resp = await fetch('/api/ada/turn', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_message: sending,
        }),
      });
      if (!resp.ok) {
        const body = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${resp.status}`);
      }
      const data = (await resp.json()) as TurnResponse;
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.assistant_message,
          timestamp: new Date().toISOString(),
          tools: data.tools_used,
        },
      ]);
      setStatus(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Turn failed');
      // Roll back the optimistic user message
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setDraft(sending);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  // ─── Render ─────────────────────────────────────────────────────

  if (unauth) {
    return (
      <div
        role="alert"
        className="rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
      >
        Your session is not authenticated.{' '}
        <Link to="/admin/sign-in" className="underline">
          Sign in
        </Link>
        .
      </div>
    );
  }
  if (notFound) {
    return (
      <section>
        <Link
          to="/admin/listings"
          className="text-xs uppercase tracking-wider font-mono text-ink-500 hover:text-accent-600 underline underline-offset-2"
        >
          ← Listings
        </Link>
        <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mt-2 mb-6">
          Listing not found
        </h1>
      </section>
    );
  }

  return (
    <section>
      <Link
        to={id ? `/admin/listings/${id}` : '/admin/listings'}
        className="text-xs uppercase tracking-wider font-mono text-ink-500 hover:text-accent-600 underline underline-offset-2"
      >
        ← Back to listing
      </Link>
      <header className="mt-2 mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">
            Preview
          </h1>
          {listingTitle && (
            <p className="text-sm text-ink-500">{listingTitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void start()}
          disabled={initializing || busy}
          className="px-4 py-2 rounded-md border border-surface-200 text-ink-700 text-sm font-medium hover:bg-surface-100 disabled:opacity-50"
        >
          Start over
        </button>
      </header>

      {/* Preview-mode banner */}
      <div
        role="status"
        className="mb-4 rounded-md border border-warning-500 bg-warning-50 px-4 py-3 text-sm text-warning-500"
      >
        <strong>Preview mode.</strong> This is a test session
        (<code className="font-mono text-xs">is_test=true</code>). No emails will be
        sent, no transcripts will be saved, and analytics will not record this
        conversation.
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {error}
        </div>
      )}

      {status !== 'active' && (
        <div
          role="status"
          className="mb-4 rounded-md border border-accent-500 bg-accent-50 px-4 py-3 text-sm text-accent-600"
        >
          Session is <strong>{status}</strong>. Click &ldquo;Start over&rdquo;
          above to begin a fresh preview.
        </div>
      )}

      {/* Message list */}
      <div
        aria-live="polite"
        aria-label="Conversation with Ada"
        className="rounded-md border border-surface-200 bg-white p-4 mb-4 min-h-[300px] max-h-[60vh] overflow-y-auto space-y-3"
      >
        {initializing && (
          <p className="text-ink-500 italic">Starting preview session…</p>
        )}
        {!initializing && messages.length === 0 && (
          <p className="text-ink-500 italic">
            Ada is ready. Send a message to begin the intake.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-md px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-accent-500 text-white'
                  : 'bg-surface-100 text-ink-900'
              }`}
            >
              {m.content}
              {m.tools && m.tools.length > 0 && (
                <div className="mt-2 pt-2 border-t border-surface-200/40 text-xs opacity-70 font-mono">
                  tools: {m.tools.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <p className="text-ink-500 italic text-sm">Ada is thinking…</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          disabled={busy || status !== 'active' || initializing}
          placeholder={
            status === 'active'
              ? 'Your message…'
              : 'Session ended — start over to continue'
          }
          rows={2}
          className="flex-1 rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900 text-sm disabled:bg-surface-100 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim() || status !== 'active' || initializing}
          className="px-5 py-2 rounded-md bg-accent-500 text-white font-medium hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </section>
  );
}
