/**
 * Chat — the live conversation with Ada.
 *
 * Layout:
 *   [reading level picker]  [new conversation]  [status badge]
 *   ─────────────────────────────────────────────────────────
 *   │ assistant bubble: "Hi, I'm Ada..."                  │
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

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useChatSession, type ReadingLevel } from '../../hooks/useChatSession.js';
import { useSpeechInput } from '../../hooks/useSpeechInput.js';
import { useSpeechOutput } from '../../hooks/useSpeechOutput.js';

export default function Chat() {
  const { state, sendMessage, startNewSession, acceptResume, discardResume } =
    useChatSession('standard');
  const [draft, setDraft] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoFilename, setPhotoFilename] = useState<string | null>(null);

  const speechInput = useSpeechInput();
  const speechOutput = useSpeechOutput();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Speak each new assistant message when TTS is enabled. Tracks the
  // last-spoken message id so we don't re-speak on every render.
  const lastSpokenIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!speechOutput.enabled) return;
    const lastMsg = [...state.messages].reverse().find((m) => m.role === 'assistant');
    if (!lastMsg) return;
    if (lastSpokenIdRef.current === lastMsg.id) return;
    lastSpokenIdRef.current = lastMsg.id;
    speechOutput.speak(lastMsg.content);
  }, [state.messages, speechOutput]);

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
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('Photo must be smaller than 8 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setPhotoPreview(dataUrl);
    setPhotoFile(file);
    setPhotoFilename(file.name);
  }

  function clearPhoto() {
    setPhotoPreview(null);
    setPhotoFile(null);
    setPhotoFilename(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleLevelChange(level: ReadingLevel) {
    if (state.readingLevel === level) return;
    if (window.confirm('Changing reading level will start a new conversation. Continue?')) {
      startNewSession(level);
      setDraft('');
      clearPhoto();
    }
  }

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
            Continue where you left off, or start a new conversation. Your
            previous one will stay saved until you tell Ada you're done.
          </p>
        </header>

        <article
          className="rounded-md border border-surface-200 bg-surface-100 p-4 sm:p-5 mb-6"
          aria-label="Preview of your previous conversation"
        >
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink-500 mb-2">
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
          If this isn't you, click <strong>Start a new conversation</strong>.
          Shared devices, public computers, or anyone else using this browser
          will see a fresh start.
        </p>
      </section>
    );
  }

  return (
    <section className="max-w-3xl mx-auto px-5 sm:px-8 py-6 sm:py-10 flex flex-col h-[calc(100vh-140px)] min-h-[560px]">
      {/* Header row: reading level + status */}
      <header className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-surface-200">
        <ReadingLevelPicker
          value={state.readingLevel}
          onChange={handleLevelChange}
          disabled={state.busy || state.initializing}
        />
        <div className="flex items-center gap-3 text-xs text-ink-500">
          {state.status === 'active' ? (
            <span aria-live="polite">Conversation active</span>
          ) : (
            <span className="text-accent-600" aria-live="polite">
              Conversation {state.status}
            </span>
          )}
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
              className={
                'inline-flex items-center gap-1 px-2 py-1 rounded border transition-colors ' +
                (speechOutput.enabled
                  ? 'border-accent-500 bg-accent-50 text-accent-600'
                  : 'border-surface-200 text-ink-500 hover:border-surface-300 hover:text-ink-700')
              }
            >
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                {speechOutput.enabled && (
                  <>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </>
                )}
              </svg>
              <span>{speechOutput.enabled ? 'Speaking' : 'Speak'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => downloadConversation(state.messages)}
            disabled={state.messages.length === 0}
            aria-label="Download this conversation as a text file"
            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-surface-200 text-ink-500 hover:border-surface-300 hover:text-ink-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                state.messages.length === 0 ||
                window.confirm('Start a new conversation? The current one will end.')
              ) {
                startNewSession(state.readingLevel);
                setDraft('');
                clearPhoto();
              }
            }}
            className="text-accent-500 hover:text-accent-600 underline underline-offset-2 disabled:opacity-50"
            disabled={state.initializing}
          >
            New conversation
          </button>
        </div>
      </header>

      {/* Error banner with recovery actions.
          On error we show the message, then concrete next steps: try again
          with the last user message, start a new conversation, or save
          what we have so far so the user doesn't lose work. */}
      {state.error && (
        <div
          role="alert"
          className="mb-3 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm"
        >
          <p className="text-danger-500 mb-3">
            <strong>Something went wrong.</strong> {state.error}
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
              Start over
            </button>
            {state.messages.length > 0 && (
              <button
                type="button"
                onClick={() => downloadConversation(state.messages)}
                className="px-3 py-1.5 rounded-md border border-surface-300 bg-white text-ink-700 hover:bg-surface-100 text-sm"
              >
                Download what we have
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
        className="flex-1 overflow-y-auto space-y-4 pr-1"
      >
        {state.initializing && (
          <p className="text-ink-500 italic">Starting a new conversation…</p>
        )}
        {state.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {state.busy && <TypingIndicator />}
      </div>

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
                Ada will analyze this when you send the message.
              </p>
            </div>
            <button
              type="button"
              onClick={clearPhoto}
              className="text-ink-500 hover:text-accent-600 text-sm"
              aria-label="Remove attached photo"
            >
              Remove
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <label
            htmlFor="photo-upload"
            className="flex-none cursor-pointer inline-flex items-center gap-1.5 rounded-md border border-surface-200 bg-surface-50 px-3 py-2.5 text-sm text-ink-700 hover:bg-surface-100 hover:text-accent-600 transition-colors focus-within:outline-2 focus-within:outline-accent-500"
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
            Photo
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
                  : 'border-surface-200 bg-surface-50 text-ink-700 hover:bg-surface-100 hover:text-accent-600')
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

          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={
              locked
                ? 'This conversation has ended. Start a new one to continue.'
                : 'Tell Ada what happened...'
            }
            disabled={state.busy || locked || state.initializing}
            aria-label="Your message"
            className="flex-1 resize-none rounded-md border border-surface-200 bg-white px-3 py-2.5 text-ink-900 placeholder-ink-500 disabled:bg-surface-100 disabled:text-ink-500"
            style={{ minHeight: '44px', maxHeight: '200px' }}
          />

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
          is informational only.
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
  onChange: (level: ReadingLevel) => void;
  disabled: boolean;
}) {
  const levels: { id: ReadingLevel; label: string; description: string }[] = [
    {
      id: 'simple',
      label: 'Simple',
      description:
        'Plain language. Short sentences. No legal terms. For anyone who wants a clearer, slower conversation.',
    },
    {
      id: 'standard',
      label: 'Standard',
      description:
        'Conversational everyday language. The default.',
    },
    {
      id: 'professional',
      label: 'Professional',
      description:
        'Legal and technical terms. For attorneys, advocates, and people familiar with ADA law.',
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
              onClick={() => onChange(l.id)}
              disabled={disabled}
              aria-pressed={active}
              title={l.description}
              className={
                (active
                  ? 'bg-accent-500 text-white '
                  : 'bg-surface-50 text-ink-700 hover:bg-surface-100 ') +
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
            'font-mono text-[10px] uppercase tracking-wider mb-1 ' +
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
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        {message.tools && message.tools.length > 0 && (
          <p className="mt-2 text-[10px] text-ink-500 font-mono">
            tools: {message.tools.join(', ')}
          </p>
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
