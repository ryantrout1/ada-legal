import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ReadingLevel = 'simple' | 'standard' | 'professional';

const READING_LEVEL_KEY = 'ada-reading-level-guide';

interface ReadingLevelContextValue {
  readingLevel: ReadingLevel;
  setReadingLevel: (next: ReadingLevel) => void;
}

const ReadingLevelContext = createContext<ReadingLevelContextValue | null>(null);

function loadReadingLevel(): ReadingLevel {
  if (typeof window === 'undefined') return 'standard';
  const stored = window.localStorage.getItem(READING_LEVEL_KEY);
  if (stored === 'simple' || stored === 'standard' || stored === 'professional') {
    return stored;
  }
  return 'standard';
}

function saveReadingLevel(level: ReadingLevel): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(READING_LEVEL_KEY, level);
  } catch {
    // localStorage throws in private-mode Safari; safely ignore.
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
