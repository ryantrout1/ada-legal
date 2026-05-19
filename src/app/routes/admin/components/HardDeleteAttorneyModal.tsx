/**
 * HardDeleteAttorneyModal — permanently delete an archived attorney.
 *
 * Two-stage attorney removal:
 *   1. Archive (sets status='archived', existing flow — reversible).
 *   2. Hard delete (this modal — permanent, audit-logged).
 *
 * Defense in depth:
 *   - Server-side: DELETE ?hard=true refuses to fire unless the row's
 *     current status is 'archived'. SQL-level gate; not just UI.
 *   - Client-side: this modal only appears for archived rows AND
 *     requires typing the firm name verbatim. Friction by design —
 *     prevents accidental clicks, forces engagement with WHICH row is
 *     about to be destroyed (same affordance GitHub uses for repo
 *     delete).
 *
 * The modal owns the confirm-string state. Parent component owns the
 * "is the modal open" state and gets notified via onConfirmed when
 * the delete succeeds.
 *
 * Ref: /plan ADALL Admin Archive→Delete, Phase 2.
 */

import { useEffect, useRef, useState } from 'react';

export interface HardDeleteAttorneyModalProps {
  /** The attorney being deleted. Must be in archived status. */
  attorney: {
    id: string;
    name: string;
    /**
     * The required typed-confirm string. We use firm name (not
     * attorney name) because it's longer and harder to mistype, and
     * because it's the more recognizable label in the list view.
     * Can be null (attorney without a firm) — in that case we fall
     * back to the attorney name.
     */
    firmName: string | null;
  };
  /** Called when the user dismisses without deleting. */
  onCancel: () => void;
  /** Called after a successful delete. */
  onConfirmed: () => void;
}

export function HardDeleteAttorneyModal(props: HardDeleteAttorneyModalProps) {
  const { attorney, onCancel, onConfirmed } = props;
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Capture the element that had focus before the modal opened so we
  // can restore it on close. WAI-ARIA dialog pattern — keyboard users
  // shouldn't lose their place in the list.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    // Focus the typed-confirm input on mount so keyboard users can
    // start typing immediately. Cancel is the safe default; the input
    // is the primary surface — matches the GitHub repo-delete pattern.
    inputRef.current?.focus();
    return () => {
      previouslyFocusedRef.current?.focus?.();
    };
  }, []);

  // ESC closes the modal as a courtesy. Doesn't bypass the delete —
  // ESC just means "cancel," same as clicking Cancel.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !deleting) onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleting, onCancel]);

  // Focus trap — Tab and Shift-Tab loop within the dialog while open.
  // Required by WAI-ARIA for role="dialog" with aria-modal="true".
  // Matches the pattern in AccessibilityPanel.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = dialog.querySelectorAll<HTMLElement>(
        'input:not([disabled]), button:not([disabled])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The expected confirm string. We use firmName if present, else the
  // attorney name. Case-sensitive exact match. Trim trailing whitespace
  // from the user's input only — not from the expected string — so a
  // firm legitimately ending in whitespace isn't impossible to confirm.
  const expected = attorney.firmName ?? attorney.name;
  const matches = typed.trimEnd() === expected;

  async function handleDelete() {
    if (!matches || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const resp = await fetch(
        `/api/admin/attorneys/${encodeURIComponent(attorney.id)}?hard=true`,
        { method: 'DELETE', credentials: 'include' },
      );
      if (!resp.ok) {
        // Surface the server's error message if it sent one. Status
        // gate violations come back as 400 with a human-readable
        // message — let it show through.
        let message = `Delete failed (HTTP ${resp.status})`;
        try {
          const body = (await resp.json()) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          // Body wasn't JSON; keep the generic message.
        }
        throw new Error(message);
      }
      onConfirmed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setDeleting(false);
    }
  }

  return (
    <div
      // Modal backdrop + centering. role="dialog" announces the modal
      // to screen readers; aria-modal=true tells them the rest of the
      // page is inert. aria-labelledby points at the heading.
      role="dialog"
      aria-modal="true"
      aria-labelledby="hard-delete-attorney-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 px-4"
      onClick={(e) => {
        // Click on the backdrop (not the dialog) dismisses. Same
        // semantics as ESC. Disabled while deleting so we don't
        // race with the in-flight request.
        if (e.target === e.currentTarget && !deleting) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-md border border-surface-200 bg-white p-6 shadow-lg"
      >
        <h2
          id="hard-delete-attorney-title"
          className="font-display text-xl text-ink-900"
        >
          Permanently delete this attorney?
        </h2>
        <p className="mt-3 text-sm text-ink-700">
          This will permanently remove{' '}
          <span className="font-medium text-ink-900">{attorney.name}</span>
          {attorney.firmName ? (
            <>
              {' '}
              from{' '}
              <span className="font-medium text-ink-900">
                {attorney.firmName}
              </span>
            </>
          ) : null}
          . This cannot be undone. An entry is written to the audit log.
        </p>
        <p className="mt-4 text-sm text-ink-700">
          To confirm, type{' '}
          <span className="font-mono font-medium text-ink-900">{expected}</span>{' '}
          below.
        </p>
        <input
          ref={inputRef}
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={deleting}
          aria-label="Type the firm name to confirm"
          autoComplete="off"
          spellCheck={false}
          className="mt-2 block w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-sm text-ink-900 focus-visible:border-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:bg-surface-100"
        />

        {error && (
          <div
            role="alert"
            className="mt-3 rounded-md border border-danger-500 bg-danger-50 px-3 py-2 text-sm text-danger-500"
          >
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 rounded-md border border-surface-200 bg-white text-sm font-medium text-ink-700 hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!matches || deleting}
            className="px-4 py-2 rounded-md bg-danger-500 text-white text-sm font-medium hover:bg-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500 focus-visible:ring-offset-2 transition-colors disabled:cursor-not-allowed disabled:bg-surface-300"
          >
            {deleting ? 'Deleting…' : 'Permanently delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
