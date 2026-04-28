/**
 * Chat — the live conversation with Ada.
 *
 * Layout:
 *   [reading level picker]  [new conversation]  [status badge]
 *   ─────────────────────────────────────────────────────────
 *   │ assistant bubble: "I'm Ada. If a business..."      │
 *   │ user bubble: "a restaurant refused my service dog"  │
 *   │ assistant bubble: "That sounds like Title III..."   │
 *   │ ...                                                 │
 *   │ [Ada is thinking...] (when busy)                    │
 *   ─────────────────────────────────────────────────────────
 *   [Attach photo] [text input.....................] [Send]
 *
 * Accessibility:
 *   - aria-live="polite" on the message list so new assistant messages
 *     are announced to screen readers
 *   - Enter sends, Shift+Enter newline
 *   - The input gets focus on mount and after each send
 *   - All buttons have visible labels + accessible names
 *
 * Ref: docs/ARCHITECTURE.md §11
 */

import { forwardRef, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useChatSession, type ReadingLevel } from '../../hooks/useChatSession.js';
import { useSpeechInput } from '../../hooks/useSpeechInput.js';
import { useSpeechOutput } from '../../hooks/useSpeechOutput.js';
import { downscalePhoto } from '../../utils/downscalePhoto.js';

/**
 * Shape of a destructive chat action that's been queued for user
 * confirmation. Lifted to module scope so the ConfirmBar component
 * and the Chat component can share a single type rather than
 * redeclaring. See Chat.pendingAction + <ConfirmBar action={...}> below.
 */
type PendingAction =
  | { kind: 'switch-level'; level: ReadingLevel }
  | { kind: 'new-chat' };

export default function Chat() {
  const { state, sendMessage, startNewSession, acceptResume, discardResume } =
    useChatSession('standard');
  const [draft, setDraft] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoFilename, setPhotoFilename] = useState<string | null>(null);

  // Pending destructive action awaiting user confirmation.
  // Replaces the native window.confirm() dialogs that were accessibility-
  // suboptimal (inconsistent screen reader handling, context break for
  // cognitive-support users). When non-null, the ConfirmBar renders inline
  // below the chat header instead.
  //
  // Two shapes:
  //   switch-level: user tapped a different reading level mid-conversation.
  //                 Confirming re-bakes Ada's system prompt and starts a
  //                 new session; cancelling leaves the picker on the
  //                 current level untouched.
  //   new-chat: user tapped the "New" button with messages present.
  //             Confirming wipes the current thread; cancelling is a no-op.
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  // Element that triggered the pending action, so we can restore focus
  // when the user cancels. Matches the ARIA practice of always returning
  // keyboard focus to the originating control on dialog dismiss.
  const pendingTriggerRef = useRef<HTMLElement | null>(null);

  const speechInput = useSpeechInput();
  const speechOutput = useSpeechOutput();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirmBarRef = useRef<HTMLDivElement>(null);

  // When dictation lands text, merge it into the draft. This is kept
  // additive — if the user has typed, dictation appends rather than
  // overwrites — so the two input methods compose.
  const lastSpeechCommitRef = useRef<string>('');
  useEffect(() => {
    if (!speechInput.listening && speechInput.transcript && !speechInput.error) {
      // Commit the transcript once it stops changing AND listening is off.
      const newText = speechInput.transcript.trim();
      if (newText && newText !== lastSpeechCommitRef.current) {
        setDraft((prev) => (prev.trim() ? `${prev.trim()} ${newText}` : newText));
        lastSpeechCommitRef.current = newText;
        speechInput.reset();
      }
    }
  }, [speechInput.listening, speechInput.transcript, speechInput.error, speechInput]);

  // Auto-scroll to the bottom of the message list when new messages arrive.
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [state.messages, state.busy]);

  // Focus input after every send.
  useEffect(() => {
    if (!state.busy && state.status === 'active' && !state.initializing) {
      inputRef.current?.focus();
    }
  }, [state.busy, state.status, state.initializing]);

  // Auto-grow the textarea to fit its content, capped at maxHeight.
  // Without this the textarea stays one line no matter how much a user
  // types — rows={1} is a starting value, browsers don't grow the
  // element automatically. The cap matches the CSS maxHeight so the
  // scroll region doesn't disappear off-screen on very long drafts.
  //
  // Also manages overflow-y so the scrollbar only appears when content
  // actually exceeds the max height. Without this, the textarea
  // renders a visible scrollbar all the time (the up/down spinner
  // control on the right edge of the element).
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const MAX = 200;
    const content = el.scrollHeight;
    const next = Math.min(content, MAX);
    el.style.height = `${next}px`;
    el.style.overflowY = content > MAX ? 'auto' : 'hidden';
  }, [draft]);

  // Speak each new assistant message when TTS is enabled. Tracks the
  // last-spoken message id so we don't re-speak on every render. Gated
  // on busy=false so we wait for the SSE stream to finish before
  // speaking — speaking partial content as deltas arrive would re-fire
  // every chunk and produce garbled audio.
  const lastSpokenIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!speechOutput.enabled) return;
    if (state.busy) return;
    const lastMsg = [...state.messages].reverse().find((m) => m.role === 'assistant');
    if (!lastMsg) return;
    if (!lastMsg.content.trim()) return;
    if (lastSpokenIdRef.current === lastMsg.id) return;
    lastSpokenIdRef.current = lastMsg.id;
    speechOutput.speak(lastMsg.content);
  }, [state.messages, state.busy, speechOutput]);

  const locked = state.status !== 'active';

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() && !photoPreview) return;
    const messageText = draft.trim() || 'Here is a photo for you to review.';
    sendMessage(
      messageText,
      photoFile ?? undefined,
      photoPreview ?? undefined,
    );
    setDraft('');
    setPhotoPreview(null);
    setPhotoFile(null);
    setPhotoFilename(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;
    if (rawFile.size > 20 * 1024 * 1024) {
      // 20 MB hard ceiling on what we'll even try to process. Above
      // that the downscale itself would use too much memory on low-end
      // phones. In practice modern phone photos are 3–8 MB so this
      // ceiling is generous.
      alert('Photo must be smaller than 20 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Downscale to 1920px longest side, JPEG 0.75. Typical output is
    // 200–500 KB — uploads in under a second on any real connection,
    // Haiku vision gets the same effective input resolution anyway.
    const file = await downscalePhoto(rawFile);

    const dataUrl = await fileToDataUrl(file);
    setPhotoPreview(dataUrl);
    setPhotoFile(file);
    setPhotoFilename(rawFile.name);
  }

  function clearPhoto() {
    setPhotoPreview(null);
    setPhotoFile(null);
    setPhotoFilename(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleLevelChange(level: ReadingLevel, triggerEl?: HTMLElement | null) {
    if (state.readingLevel === level) return;

    // If the user hasn't typed anything yet, there's nothing to preserve —
    // swap the level silently. Common case: user lands on /chat, reads
    // Ada's opener, and realizes they want a different reading level
    // before they start. No friction needed.
    const hasUserContent = state.messages.some((m) => m.role === 'user');
    if (!hasUserContent) {
      startNewSession(level);
      setDraft('');
      clearPhoto();
      return;
    }

    // Mid-conversation: queue the switch as a pending action and let the
    // inline ConfirmBar surface the choice. Capture the triggering
    // button so we can restore focus if the user cancels.
    pendingTriggerRef.current = triggerEl ?? null;
    setPendingAction({ kind: 'switch-level', level });
  }

  function handleNewConversation(triggerEl?: HTMLElement | null) {
    // No messages at all, or only Ada's opener with no user turn:
    // restarting doesn't lose anything the user contributed, so just
    // do it. This matches the reading-level policy above.
    const hasUserContent = state.messages.some((m) => m.role === 'user');
    if (!hasUserContent) {
      startNewSession(state.readingLevel);
      setDraft('');
      clearPhoto();
      return;
    }
    pendingTriggerRef.current = triggerEl ?? null;
    setPendingAction({ kind: 'new-chat' });
  }

  // Apply a pending action once the user confirms, then clear pending
  // state. Centralised so the ConfirmBar's Confirm handler has a single
  // call site; keeps the different action kinds from leaking across
  // component boundaries.
  function confirmPending() {
    if (!pendingAction) return;
    if (pendingAction.kind === 'switch-level') {
      startNewSession(pendingAction.level);
    } else if (pendingAction.kind === 'new-chat') {
      startNewSession(state.readingLevel);
    }
    setDraft('');
    clearPhoto();
    setPendingAction(null);
    pendingTriggerRef.current = null;
  }

  // Cancel the pending action. Focus returns to the button that
  // originally opened the confirmation (ARIA practice: always put
  // keyboard focus back on the dismiss-triggering control).
  function cancelPending() {
    const trigger = pendingTriggerRef.current;
    setPendingAction(null);
    pendingTriggerRef.current = null;
    // Queue focus restore on the next frame so the ConfirmBar has
    // unmounted before we try to move focus — otherwise focus can
    // land inside the now-unmounting bar.
    queueMicrotask(() => {
      trigger?.focus();
    });
  }

  // Global ESC handler while a confirmation is pending. Using the
  // window listener (not a form/dialog keydown) means ESC works from
  // anywhere — the reading-level picker, the textarea, wherever the
  // user's focus landed after triggering the action.
  //
  // The cancel logic is inlined here (not calling cancelPending)
  // because that function is redeclared on every render — including
  // it in deps would re-register the listener on every keystroke.
  // This effect depends only on the pending/not-pending transition.
  useEffect(() => {
    if (!pendingAction) return;
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      const trigger = pendingTriggerRef.current;
      setPendingAction(null);
      pendingTriggerRef.current = null;
      queueMicrotask(() => {
        trigger?.focus();
      });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingAction]);

  // If we discovered a resumable session, short-circuit the full chat
  // UI and show a resume-offer screen. Accessibility principle: never
  // auto-resume — always give the user explicit control over whether
  // to continue or start fresh. This matters for cognitive, trauma-
  // related, and shared-device reasons.
  if (state.resumable) {
    const { readingLevel: resumeLevel, messages: resumeMessages } = state.resumable;
    const lastMsg = resumeMessages[resumeMessages.length - 1];
    const preview =
      lastMsg.content.length > 200
        ? lastMsg.content.slice(0, 200).trim() + '…'
        : lastMsg.content;
    return (
      <section className="max-w-2xl mx-auto px-5 sm:px-8 py-10">
        <header className="mb-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent-500 mb-3">
            Welcome back
          </p>
          <h1 className="font-display text-3xl sm:text-4xl text-ink-900 mb-2">
            You have a conversation in progress.
          </h1>
          <p className="text-ink-700 leading-relaxed">
            Pick up where you left off, or start over. What you already told me
            stays saved until you tell me you're done.
          </p>
        </header>

        <article
          className="rounded-md border border-surface-200 bg-surface-100 p-4 sm:p-5 mb-6"
          aria-label="Preview of your previous conversation"
        >
          <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-500 mb-2">
            Last message from {lastMsg.role === 'assistant' ? 'Ada' : 'you'}
          </p>
          <p className="text-ink-900 whitespace-pre-wrap">{preview}</p>
          <p className="text-xs text-ink-500 mt-3">
            {resumeMessages.length} message{resumeMessages.length === 1 ? '' : 's'}
            {' · '}reading level: {resumeLevel}
          </p>
        </article>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={acceptResume}
            className="px-5 py-3 rounded-md bg-accent-500 text-white font-medium hover:bg-accent-600 transition-colors"
          >
            Continue this conversation
          </button>
          <button
            type="button"
            onClick={() => discardResume(resumeLevel)}
            className="px-5 py-3 rounded-md border border-surface-300 bg-white text-ink-700 hover:bg-surface-100 transition-colors"
          >
            Start a new conversation
          </button>
        </div>

        <p className="text-sm text-ink-500 mt-6">
          If this isn't you — maybe someone else used this browser — hit{' '}
          <strong>Start a new conversation</strong>. Nothing from the other
          conversation carries over.
        </p>
      </section>
    );
  }

  return (
    <section className="max-w-3xl w-full mx-auto px-5 sm:px-8 py-4 sm:py-6 flex flex-col h-[calc(100dvh-var(--chat-chrome,8rem))] min-h-[400px]">
      {/* Header row: reading level (left), icon-only session controls (right).
          Reading level stays prominent — visibility is the point, it's the
          single most important accommodation on this page. Session controls
          (Speak, Download, New conversation) shrink to icon buttons because
          they're secondary actions; "Conversation active" text was removed
          as noise — the user can see they're conversing. */}
      <header className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-surface-200">
        <ReadingLevelPicker
          value={state.readingLevel}
          onChange={handleLevelChange}
          disabled={state.busy || state.initializing}
        />
        <div className="flex items-center gap-1.5">
          {speechOutput.isSupported && (
            <button
              type="button"
              onClick={() => speechOutput.setEnabled(!speechOutput.enabled)}
              aria-label={
                speechOutput.enabled
                  ? 'Turn off Ada reading messages aloud'
                  : 'Turn on Ada reading messages aloud'
              }
              aria-pressed={speechOutput.enabled}
              title={speechOutput.enabled ? 'Stop reading aloud' : 'Read Ada\u2019s messages aloud'}
              className={
                'inline-flex items-center gap-1.5 h-9 px-3 rounded-md border text-xs font-medium transition-colors ' +
                (speechOutput.enabled
                  ? 'border-accent-500 bg-accent-50 text-accent-600'
                  : 'border-surface-200 text-ink-700 hover:border-surface-300 hover:text-ink-900 hover:bg-surface-100')
              }
            >
              {/* Custom "Speak" glyph: a filled speech head (Pac-Man-ish
                  oval with a wedge mouth) emitting two curved waves.
                  Waves grow stronger when active. Drawn at 16px with
                  2px strokes so details survive at small size. */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 12 A6 6 0 1 1 12 17.5 L8 21 L8 16.5 A6 6 0 0 1 4 12 Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  fill={speechOutput.enabled ? 'currentColor' : 'none'}
                  fillOpacity={speechOutput.enabled ? 0.15 : 0}
                />
                <path
                  d="M16 8.5 Q19 12 16 15.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  opacity={speechOutput.enabled ? 1 : 0.35}
                />
                <path
                  d="M19 5.5 Q23.5 12 19 18.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  opacity={speechOutput.enabled ? 1 : 0}
                />
              </svg>
              <span>{speechOutput.enabled ? 'Speaking' : 'Speak'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => downloadConversation(state.messages)}
            disabled={state.messages.length === 0}
            aria-label="Download this conversation as a text file"
            title="Download this conversation"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-surface-200 text-xs font-medium text-ink-700 hover:border-surface-300 hover:text-ink-900 hover:bg-surface-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {/* Custom "Save" glyph: a page with two content lines
                plus a save-tray beneath. Suggests "preserve this
                record" rather than a generic arrow download. */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect
                x="6"
                y="2.5"
                width="12"
                height="14"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <line x1="9" y1="7.5" x2="15" y2="7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              <line x1="9" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              <path
                d="M3 19 L21 19 L19 21.75 L5 21.75 Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
                fill="currentColor"
                fillOpacity="0.2"
              />
            </svg>
            <span>Save</span>
          </button>
          <button
            type="button"
            onClick={(e) => handleNewConversation(e.currentTarget)}
            disabled={state.initializing}
            aria-label="Start a new conversation"
            title="Start a new conversation"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-surface-200 text-xs font-medium text-ink-500 hover:border-surface-300 hover:text-ink-900 hover:bg-surface-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Custom "New" glyph: an empty speech bubble (chat thread)
                with a four-point spark at its upper-right, meaning
                "fresh start." Visually matched to Speak/Save for
                consistency; slightly muted text color is the only
                de-emphasis, enough to hint this is the lesser-used
                action without looking incomplete. */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M3 6 A3 3 0 0 1 6 3 L14 3 A3 3 0 0 1 17 6 L17 12 A3 3 0 0 1 14 15 L9 15 L5.5 18.5 L5.5 15 A3 3 0 0 1 3 12 Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
                fill="none"
              />
              <g stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <line x1="20" y1="3.5" x2="20" y2="7.5" />
                <line x1="18" y1="5.5" x2="22" y2="5.5" />
              </g>
            </svg>
            <span>New</span>
          </button>
        </div>
      </header>

      {/* Live region for session status (visually hidden).
          Removed the visible "Conversation active" text per UX review,
          but screen readers still benefit from knowing status changes. */}
      <div className="sr-only" aria-live="polite">
        {state.status === 'active' ? '' : `Conversation ${state.status}`}
      </div>

      {/* Inline confirmation bar for destructive actions.
          Replaces the native window.confirm() dialog that was triggered
          by mid-conversation reading-level switches and the 'New' button.
          Native confirm is an accessibility regression for this
          audience: inconsistent screen reader handling, hard context
          break for cognitive-support users, OS-chrome styling that
          doesn't match the page. This bar is inline, keyboard-
          navigable (Tab to confirm, ESC to cancel), and uses the site
          palette. See confirmPending/cancelPending above. */}
      {pendingAction && (
        <ConfirmBar
          ref={confirmBarRef}
          action={pendingAction}
          pendingLevelLabel={
            pendingAction.kind === 'switch-level'
              ? readingLevelLabel(pendingAction.level)
              : null
          }
          onConfirm={confirmPending}
          onCancel={cancelPending}
        />
      )}

      {/* Error banner with recovery actions.
          On error we show what happened, then concrete next steps: try
          again with the last user message, start over, or save what we
          have so far so the user doesn't lose work. Voice rule: name
          what happened, don't apologize. See docs/ADA_VOICE_GUIDE.md. */}
      {state.error && (
        <div
          role="alert"
          className="mb-3 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm"
        >
          <p className="text-danger-500 mb-3">
            <strong>Something didn't go through.</strong> {state.error}
          </p>
          <div className="flex flex-wrap gap-2">
            {(() => {
              const lastUser = [...state.messages]
                .reverse()
                .find((m) => m.role === 'user');
              return lastUser ? (
                <button
                  type="button"
                  onClick={() => void sendMessage(lastUser.content)}
                  disabled={state.busy || locked}
                  className="px-3 py-1.5 rounded-md border border-danger-500 bg-danger-50 text-danger-500 hover:bg-danger-100 text-sm font-medium disabled:opacity-50"
                >
                  Try again
                </button>
              ) : null;
            })()}
            <button
              type="button"
              onClick={() => {
                startNewSession(state.readingLevel);
                setDraft('');
                clearPhoto();
              }}
              className="px-3 py-1.5 rounded-md border border-surface-300 bg-white text-ink-700 hover:bg-surface-100 text-sm"
            >
              Start fresh
            </button>
            {state.messages.length > 0 && (
              <button
                type="button"
                onClick={() => downloadConversation(state.messages)}
                className="px-3 py-1.5 rounded-md border border-surface-300 bg-white text-ink-700 hover:bg-surface-100 text-sm"
              >
                Save what we have
              </button>
            )}
          </div>
        </div>
      )}

      {/* Message list */}
      <div
        ref={listRef}
        aria-live="polite"
        aria-label="Conversation with Ada"
        data-session-id={state.sessionId ?? ''}
        data-session-status={state.status}
        data-busy={state.busy ? 'true' : 'false'}
        className="flex-1 overflow-y-auto space-y-4 pr-1"
      >
        {state.initializing && (
          <p className="text-ink-500 italic">Starting up…</p>
        )}
        {state.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {state.busy && <TypingIndicator />}
      </div>

      {/* End-of-conversation summary card.
         Rendered when Ada has completed the session AND a package was
         generated. The card is the bridge from chat to artifact — the
         user taps through to /s/{slug} where their summary lives. */}
      {state.status === 'completed' && state.packageSlug && (
        <aside
          className="mt-4 border border-accent-500 bg-accent-50 rounded-lg p-5"
          aria-labelledby="summary-ready-heading"
        >
          <h2
            id="summary-ready-heading"
            className="font-display text-lg text-ink-900 mb-2"
          >
            Your summary is ready
          </h2>
          <p className="text-ink-700 leading-relaxed mb-4">
            Ada put together a summary of everything you discussed, plus
            what people usually do next. You can view it, share the link,
            print it, or save it as a PDF.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`/s/${state.packageSlug}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-accent-500 text-white hover:bg-accent-600 transition-colors"
              aria-label="Open your summary page"
            >
              Open my summary
            </a>
            <button
              type="button"
              onClick={async () => {
                const url = `${window.location.origin}/s/${state.packageSlug}`;
                try {
                  if (navigator.share) {
                    await navigator.share({
                      url,
                      title: 'My ADA Legal Link summary',
                    });
                  } else if (navigator.clipboard) {
                    await navigator.clipboard.writeText(url);
                  }
                } catch {
                  // User cancelled share or clipboard unavailable — noop
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded border border-surface-300 bg-white text-ink-700 hover:border-accent-500 hover:text-accent-600 transition-colors"
              aria-label="Share or copy the link to your summary"
            >
              Share link
            </button>
          </div>
        </aside>
      )}

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="mt-4 pt-4 border-t border-surface-200"
        aria-label="Message Ada"
      >
        {photoPreview && (
          <div className="mb-3 flex items-start gap-3 rounded-md border border-surface-200 bg-surface-100 p-3">
            <img
              src={photoPreview}
              alt={photoFilename ?? 'Photo preview'}
              className="h-16 w-16 rounded object-cover"
            />
            <div className="flex-1 text-sm">
              <p className="text-ink-900 font-medium">
                {photoFilename ?? 'Photo attached'}
              </p>
              <p className="text-ink-500 text-xs mt-0.5">
                I'll look at this when you send.
              </p>
            </div>
            <button
              type="button"
              onClick={clearPhoto}
              aria-label="Remove attached photo"
              className="flex-none inline-flex items-center justify-center w-11 h-11 -mr-1 rounded-md text-ink-500 hover:bg-surface-200 hover:text-accent-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-100 transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            </button>
          </div>
        )}

        {/* Textarea on its own row so it can take the full width on
            mobile. Action buttons live in a row beneath it. This is
            the entry point for the most important interaction on the
            site — describe what happened — and on a phone it needs to
            be roomy enough to actually type into. */}
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={
            locked
              ? 'This conversation has wrapped up. Start a fresh one to keep going.'
              : 'Tell Ada what happened...'
          }
          disabled={state.busy || locked || state.initializing}
          aria-label="Your message"
          className="w-full resize-none rounded-md border border-surface-200 bg-white px-3 py-2.5 text-ink-900 placeholder-ink-500 disabled:bg-surface-100 disabled:text-ink-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50 transition-shadow"
          style={{ minHeight: '44px', maxHeight: '200px', overflowY: 'hidden' }}
        />

        {/* Action row: Photo + Mic on the left, Send on the right.
            Photo's text label collapses below sm so the icon stands
            alone on phones — same pattern the mic button already
            uses. The hidden file input stays inside the label so the
            htmlFor association keeps working. */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label
              htmlFor="photo-upload"
              className="flex-none cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-md border border-surface-200 bg-surface-100 px-3 py-2.5 text-sm text-ink-700 hover:bg-surface-200 hover:text-accent-600 transition-colors focus-within:outline-2 focus-within:outline-accent-500"
            >
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="2" y="3" width="12" height="10" rx="1" />
                <circle cx="6" cy="7" r="1.5" />
                <path d="M2 11l3-3 4 4" />
              </svg>
              <span className="sr-only sm:not-sr-only">Photo</span>
            </label>
            <input
              ref={fileInputRef}
              id="photo-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handlePhotoSelect}
              disabled={state.busy || locked}
            />

            {speechInput.isSupported && (
              <button
                type="button"
                onClick={() =>
                  speechInput.listening ? speechInput.stop() : speechInput.start()
                }
                disabled={state.busy || locked || state.initializing}
                aria-label={
                  speechInput.listening
                    ? 'Stop dictating (press to stop the microphone)'
                    : 'Dictate your message (press to start the microphone)'
                }
                aria-pressed={speechInput.listening}
                className={
                  'flex-none inline-flex items-center justify-center rounded-md border px-3 py-2.5 transition-colors ' +
                  (speechInput.listening
                    ? 'border-danger-500 bg-danger-50 text-danger-500 animate-pulse motion-reduce:animate-none'
                    : 'border-surface-200 bg-surface-100 text-ink-700 hover:bg-surface-200 hover:text-accent-600')
                }
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="2" width="6" height="11" rx="3" />
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="8" y1="22" x2="16" y2="22" />
                </svg>
                <span className="sr-only">
                  {speechInput.listening ? 'Listening' : 'Microphone'}
                </span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={state.busy || locked || state.initializing || (!draft.trim() && !photoPreview)}
            className="flex-none inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:bg-surface-300 disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 rounded-md transition-colors"
          >
            Send
          </button>
        </div>

        <p className="mt-2 text-xs text-ink-500">
          Enter to send. Shift+Enter for a new line. Ada is not a lawyer; this
          is informational only.{' '}
          <a
            href="/about-ada"
            className="text-accent-500 hover:text-accent-600 underline underline-offset-2"
          >
            Why is she called Ada?
          </a>
        </p>
      </form>
    </section>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReadingLevelPicker({
  value,
  onChange,
  disabled,
}: {
  value: ReadingLevel;
  onChange: (level: ReadingLevel, triggerEl: HTMLElement) => void;
  disabled: boolean;
}) {
  const levels: { id: ReadingLevel; label: string; description: string }[] = [
    {
      id: 'simple',
      label: 'Simple',
      description:
        'Plain language, short sentences, no legal terms. For a clearer, slower conversation.',
    },
    {
      id: 'standard',
      label: 'Standard',
      description:
        'Everyday conversation. This is where most people start.',
    },
    {
      id: 'professional',
      label: 'Professional',
      description:
        'Precise legal language. For attorneys, advocates, or anyone already familiar with ADA terminology.',
    },
  ];
  return (
    <div role="group" aria-label="Reading level" className="flex items-center gap-1 text-sm">
      <span className="text-xs text-ink-500 mr-2 font-mono uppercase tracking-wider">
        Reading level:
      </span>
      <div className="inline-flex rounded-md border border-surface-200 overflow-hidden">
        {levels.map((l, i) => {
          const active = value === l.id;
          return (
            <button
              key={l.id}
              type="button"
              onClick={(e) => onChange(l.id, e.currentTarget)}
              disabled={disabled}
              aria-pressed={active}
              title={l.description}
              className={
                (active
                  ? 'bg-accent-500 text-white '
                  : 'bg-surface-100 text-ink-700 hover:bg-surface-200 ') +
                'px-3 py-1.5 text-xs transition-colors ' +
                (i === 0 ? 'border-r border-surface-200' : '') +
                (i === 1 ? 'border-r border-surface-200' : '')
              }
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: import('@/app/hooks/useChatSession').ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div
      data-role={isUser ? 'user' : 'assistant'}
      data-message-id={message.id}
      className={
        'flex ' + (isUser ? 'justify-end' : 'justify-start')
      }
    >
      <div
        className={
          'max-w-[85%] rounded-lg px-4 py-3 ' +
          (isUser
            ? 'bg-accent-500 text-white'
            : 'bg-surface-100 text-ink-900 border border-surface-200')
        }
      >
        <p
          className={
            'font-mono text-[0.6875rem] font-semibold tracking-wide mb-1 ' +
            (isUser ? 'text-accent-50' : 'text-ink-500')
          }
        >
          {isUser ? 'You' : 'Ada'}
        </p>
        {message.photoPreview && (
          <img
            src={message.photoPreview}
            alt="Photo you attached"
            className="mb-2 max-h-48 rounded"
          />
        )}
        {message.content.trim().length > 0 ? (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : message.role === 'assistant' && message.tools && message.tools.length > 0 ? (
          <p className="whitespace-pre-wrap leading-relaxed text-ink-500 italic">
            Working on it…
          </p>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div
      className="flex justify-start"
      role="status"
      aria-live="polite"
      aria-label="Ada is thinking"
    >
      <div className="bg-surface-100 border border-surface-200 rounded-lg px-4 py-3 inline-flex items-center gap-1">
        <span
          className="w-1.5 h-1.5 rounded-full bg-ink-500 animate-pulse motion-reduce:animate-none"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-ink-500 animate-pulse motion-reduce:animate-none"
          style={{ animationDelay: '200ms' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-ink-500 animate-pulse motion-reduce:animate-none"
          style={{ animationDelay: '400ms' }}
        />
        {/* When motion is reduced, the dots don't animate — so show text
            that's always readable so the screen reader + low-vision user
            both know what's happening. */}
        <span className="sr-only motion-reduce:not-sr-only motion-reduce:ml-1 text-xs text-ink-500">
          Ada is thinking…
        </span>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Save the current conversation to the user's device as a plain-text file.
 *
 * Real problem this solves: people with memory conditions, ADHD, anxiety,
 * cognitive fatigue — or anyone seeking an attorney — need to take the
 * conversation home with them. The browser is a bad place to keep an
 * important record. This gives them a real artifact.
 *
 * Format: plain text, one message per block, timestamps in the user's
 * local time. No HTML, no markdown, no dependencies. Opens in every
 * text editor and email client.
 */
function downloadConversation(
  messages: import('@/app/hooks/useChatSession').ChatMessage[],
): void {
  if (messages.length === 0) return;

  const now = new Date();
  const header =
    'Conversation with Ada — ADA Legal Link\n' +
    `Downloaded: ${now.toLocaleString()}\n` +
    'Ada provides information about disability rights. Ada is not a lawyer.\n' +
    '──────────────────────────────────────────────────────────\n\n';

  const body = messages
    .map((m) => {
      const who = m.role === 'assistant' ? 'Ada' : 'You';
      const when = (() => {
        try {
          return new Date(m.timestamp).toLocaleTimeString();
        } catch {
          return m.timestamp;
        }
      })();
      return `[${when}] ${who}:\n${m.content}`;
    })
    .join('\n\n');

  const text = header + body + '\n';

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ada-conversation-${now.toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── ConfirmBar ───────────────────────────────────────────────────────────

/**
 * Inline, accessible confirmation surface that replaces window.confirm()
 * for destructive chat actions.
 *
 * Why inline instead of a modal dialog:
 * - The audience includes people with cognitive and sensory challenges
 *   for whom a focus-stealing modal is a harder context break than the
 *   action itself. Inline means "here is a question about the thing
 *   you just tapped, right where you tapped it."
 * - Matches the in-page design system (surfaces, radius, accent) so
 *   the control feels like part of the product, not a browser popup.
 * - Keyboard: Tab reaches the Confirm button first (autofocus); ESC
 *   cancels from anywhere on the page (see window keydown listener
 *   in the Chat component).
 * - Screen readers: role="alertdialog" + aria-labelledby is the
 *   ARIA-correct pattern for a modal confirmation. The bar is visually
 *   inline, but it is semantically modal (it blocks the action until
 *   the user chooses). aria-modal is intentionally omitted because
 *   we are NOT trapping focus — users can Tab out to re-read message
 *   history before deciding.
 *
 * Props:
 *   action              the pending action shape (drives prompt copy)
 *   pendingLevelLabel   human label for the level we'd switch to
 *                       ("Simple", "Standard", "Professional"); only
 *                       present on switch-level actions, null otherwise
 *   onConfirm           apply the action
 *   onCancel            dismiss, restore focus to the trigger
 */
const ConfirmBar = forwardRef<
  HTMLDivElement,
  {
    action: PendingAction;
    pendingLevelLabel: string | null;
    onConfirm: () => void;
    onCancel: () => void;
  }
>(function ConfirmBar({ action, pendingLevelLabel, onConfirm, onCancel }, ref) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Autofocus the confirm action when the bar appears. This is the
  // WAI-ARIA practice for alertdialog (focus an actionable control in
  // the dialog on open) and also matches the user's mental model:
  // they just tapped the trigger meaning "yes, do this" — the fastest
  // path to completion is Enter.
  useEffect(() => {
    confirmButtonRef.current?.focus();
  }, []);

  const title =
    action.kind === 'switch-level'
      ? `Switch to ${pendingLevelLabel} reading level?`
      : 'Start a fresh conversation?';

  const body =
    action.kind === 'switch-level'
      ? 'Switching reading level starts a new conversation. What you have so far will end.'
      : 'Starting fresh ends this conversation. What you have so far will go away.';

  const confirmLabel =
    action.kind === 'switch-level' ? 'Switch' : 'Start fresh';

  return (
    <div
      ref={ref}
      role="alertdialog"
      aria-labelledby="confirm-bar-title"
      aria-describedby="confirm-bar-body"
      className="mb-4 rounded-md border-2 border-accent-500 bg-accent-50 px-4 py-3"
    >
      <p
        id="confirm-bar-title"
        className="font-display text-base text-ink-900"
      >
        {title}
      </p>
      <p id="confirm-bar-body" className="mt-1 text-sm text-ink-700">
        {body}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          ref={confirmButtonRef}
          type="button"
          onClick={onConfirm}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium transition-colors"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-surface-200 bg-surface-100 hover:bg-surface-200 text-ink-700 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <p className="ml-auto text-xs text-ink-500">
          Press <kbd className="font-mono">Esc</kbd> to cancel.
        </p>
      </div>
    </div>
  );
});

// Display label for a ReadingLevel. Kept here (not in useChatSession)
// because this is presentation copy, not engine copy — it only lives
// on the chat screen. If more screens need the label later, promote
// to a shared module.
function readingLevelLabel(level: ReadingLevel): string {
  switch (level) {
    case 'simple':
      return 'Simple';
    case 'standard':
      return 'Standard';
    case 'professional':
      return 'Professional';
  }
}
