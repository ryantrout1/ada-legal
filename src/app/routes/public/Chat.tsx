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
import { useChatSession, type ReadingLevel } from '@/app/hooks/useChatSession';

export default function Chat() {
  const { state, sendMessage, startNewSession } = useChatSession('standard');
  const [draft, setDraft] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFilename, setPhotoFilename] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const locked = state.status !== 'active';

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() && !photoPreview) return;
    const messageText = draft.trim() || 'Here is a photo for you to review.';
    sendMessage(messageText, photoPreview ?? undefined);
    setDraft('');
    setPhotoPreview(null);
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
    setPhotoFilename(file.name);
  }

  function clearPhoto() {
    setPhotoPreview(null);
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

      {/* Error banner */}
      {state.error && (
        <div
          role="alert"
          className="mb-3 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {state.error}
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
  const levels: { id: ReadingLevel; label: string }[] = [
    { id: 'simple', label: 'Simple' },
    { id: 'standard', label: 'Standard' },
    { id: 'professional', label: 'Professional' },
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
    <div className="flex justify-start" aria-label="Ada is thinking">
      <div className="bg-surface-100 border border-surface-200 rounded-lg px-4 py-3 inline-flex items-center gap-1">
        <span
          className="w-1.5 h-1.5 rounded-full bg-ink-500 animate-pulse"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-ink-500 animate-pulse"
          style={{ animationDelay: '200ms' }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-ink-500 animate-pulse"
          style={{ animationDelay: '400ms' }}
        />
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
