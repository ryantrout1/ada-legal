import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  LEGACY_READING_KEY,
  PREFS_CHANGED_EVENT,
  loadPrefs,
  savePrefs,
} from '../../lib/displayPrefs.js';

export type ReadingLevel = 'simple' | 'standard' | 'professional';

interface ReadingLevelContextValue {
  readingLevel: ReadingLevel;
  setReadingLevel: (next: ReadingLevel) => void;
}

const ReadingLevelContext = createContext<ReadingLevelContextValue | null>(null);

/**
 * M1 Phase 1: reading level lives inside the `ada-display-prefs` blob
 * (B44 contract) instead of its own key, so a B44 user's saved level
 * survives the cutover. loadPrefs() also migrates the old standalone
 * `ada-reading-level-guide` key on first read (left in place for
 * rollback safety — see displayPrefs.ts).
 */
function loadReadingLevel(): ReadingLevel {
  return loadPrefs().readingLevel;
}

function saveReadingLevel(level: ReadingLevel): void {
  savePrefs({ ...loadPrefs(), readingLevel: level });
  // Keep the legacy key in step while it still exists, so a rollback to
  // pre-M1 code sees the user's latest choice rather than a stale one.
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LEGACY_READING_KEY, level);
    } catch {
      // localStorage throws in private-mode Safari; safely ignore.
    }
  }
}

export function ReadingLevelProvider({ children }: { children: ReactNode }) {
  const [readingLevel, setReadingLevelState] = useState<ReadingLevel>(() =>
    loadReadingLevel(),
  );

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-reading-level', readingLevel);
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.documentElement.removeAttribute('data-reading-level');
      }
    };
  }, [readingLevel]);

  // External writes (the eyeball panel, another guide bar) announce via
  // ada-prefs-changed; re-read so every consumer stays in step (B44's
  // DisplaySettings ↔ ReadingLevelContext wiring, same event name).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onChanged = () => {
      const next = loadReadingLevel();
      setReadingLevelState((prev) => (prev === next ? prev : next));
    };
    window.addEventListener(PREFS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(PREFS_CHANGED_EVENT, onChanged);
  }, []);

  const setReadingLevel = (next: ReadingLevel): void => {
    setReadingLevelState(next);
    saveReadingLevel(next);
  };

  return (
    <ReadingLevelContext.Provider value={{ readingLevel, setReadingLevel }}>
      {children}
    </ReadingLevelContext.Provider>
  );
}

export function useReadingLevel(): ReadingLevelContextValue {
  const ctx = useContext(ReadingLevelContext);
  if (!ctx) {
    // Allow consumption outside the provider: fall back to stored or default,
    // but setReadingLevel becomes a no-op since there is no state to update.
    return {
      readingLevel: loadReadingLevel(),
      setReadingLevel: () => {
        // intentional no-op when used outside the provider
      },
    };
  }
  return ctx;
}
