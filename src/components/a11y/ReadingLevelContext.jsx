import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadPreferences } from './DisplaySettings';

/**
 * ReadingLevelContext
 * 
 * Global provider for reading level preference across all guide/chapter/pathway pages.
 * Three levels:
 *   - 'simple'       - 5th-grade reading level, plain-language summaries
 *   - 'standard'     - 8th-grade plain language + legal text side-by-side (default)
 *   - 'professional' - Legal text primary, plain language collapsible
 * 
 * Usage in any component:
 *   import { useReadingLevel } from '../a11y/ReadingLevelContext';
 *   const { readingLevel } = useReadingLevel();
 */

const ReadingLevelContext = createContext({
  readingLevel: 'standard',
  setReadingLevel: () => {},
});

export function ReadingLevelProvider({ children }) {
  const [readingLevel, setReadingLevel] = useState(() => {
    try {
      const prefs = loadPreferences();
      return prefs.readingLevel || 'standard';
    } catch {
      return 'standard';
    }
  });

  // Listen for preference changes from DisplaySettings
  useEffect(() => {
    const handlePrefsChanged = () => {
      try {
        const prefs = loadPreferences();
        const next = prefs.readingLevel || 'standard';
        setReadingLevel(prev => prev !== next ? next : prev);
      } catch { /* ignore */ }
    };

    // Custom event from DisplaySettings (instant, same-tab)
    window.addEventListener('ada-prefs-changed', handlePrefsChanged);
    // Storage event for cross-tab sync
    const handleStorage = (e) => {
      if (e.key === 'ada-display-prefs') handlePrefsChanged();
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('ada-prefs-changed', handlePrefsChanged);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Set data attribute on <html> for CSS-only consumers
  useEffect(() => {
    document.documentElement.setAttribute('data-reading-level', readingLevel);
  }, [readingLevel]);

  const value = React.useMemo(() => ({
    readingLevel,
    setReadingLevel,
  }), [readingLevel]);

  return (
    <ReadingLevelContext.Provider value={value}>
      {children}
    </ReadingLevelContext.Provider>
  );
}

export function useReadingLevel() {
  return useContext(ReadingLevelContext);
}

export default ReadingLevelContext;
