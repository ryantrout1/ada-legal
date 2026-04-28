/**
 * CurrentReadingLevel — small pill + aria-live announcement showing
 * the active reading level. Pairs with any reading-level picker as
 * an explicit current-state indicator. Users with low working memory,
 * visual processing differences, or who use screen readers benefit
 * from explicit "currently at X" affordances rather than having to
 * infer state from picker styling.
 *
 * Three placements expected:
 *   - Standards Guide chapter pages (next to ReadingLevelToggle)
 *   - ClassActionDetail pages (next to ReadingLevelToggle)
 *   - Chat header (next to ReadingLevelPicker)
 *
 * Reads from ReadingLevelContext directly so callers don't have to
 * thread the value through props. The aria-live region announces
 * level changes once per change (polite, not assertive — the change
 * is intentional and not urgent).
 *
 * Round 3 AAA+COGA Group A, item #38 (A5).
 */

import { useEffect, useRef, useState } from 'react';
import { useReadingLevel, type ReadingLevel } from './ReadingLevelContext.js';

const LABELS: Record<ReadingLevel, string> = {
  simple: 'Simple',
  standard: 'Standard',
  professional: 'Legal',
};

interface CurrentReadingLevelProps {
  /** Optional className applied to the wrapper for spacing tweaks. */
  className?: string;
  /**
   * Optional override of the reading-level value. Used by chat where
   * the active session's reading level can briefly diverge from the
   * site-wide context (mid-conversation, before a ConfirmBar switch
   * is confirmed). When provided, the pill reflects this value
   * instead of context. The aria-live announcement still fires on
   * change. Default behavior (no prop): use ReadingLevelContext.
   */
  value?: ReadingLevel;
}

export function CurrentReadingLevel({ className, value }: CurrentReadingLevelProps) {
  const ctx = useReadingLevel();
  const effective = value ?? ctx.readingLevel;
  const label = LABELS[effective];

  // Announce level changes after the first render so the initial mount
  // doesn't fire a stale announcement when navigating to the page.
  const firstRenderRef = useRef(true);
  const [liveMessage, setLiveMessage] = useState('');

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    setLiveMessage(`Reading level changed to ${label}.`);
    // Clear after a beat so re-selecting the same level (which won't
    // change readingLevel) re-fires correctly the next time the user
    // makes a real change.
    const t = window.setTimeout(() => setLiveMessage(''), 1500);
    return () => window.clearTimeout(t);
  }, [effective, label]);

  return (
    <span className={className}>
      <span
        aria-hidden="true"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-50 text-accent-600 text-xs font-medium"
      >
        <span className="font-mono uppercase tracking-wider text-[0.625rem] text-ink-500">
          Currently
        </span>
        <span>{label}</span>
      </span>
      {/* Visually hidden live region. Screen readers announce on change. */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </span>
    </span>
  );
}
