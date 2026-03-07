import React from 'react';
import { useReadingLevel } from '../a11y/ReadingLevelContext';

/**
 * GuideReadingLevelBar — inline reading level toggle for guide pages.
 * 
 * Identical to the bar in ChapterPageLayout but standalone so any
 * GuideSection-based page can include it. Place once at the top of
 * the guide-content div, before the first GuideSection.
 */
export default function GuideReadingLevelBar() {
  const { readingLevel, setReadingLevel } = useReadingLevel();

  const handleChange = (key) => {
    setReadingLevel(key);
    try {
      const prefs = JSON.parse(localStorage.getItem('ada-display-prefs') || '{}');
      prefs.readingLevel = key;
      localStorage.setItem('ada-display-prefs', JSON.stringify(prefs));
      window.dispatchEvent(new CustomEvent('ada-prefs-changed'));
    } catch {}
  };

  const levels = [
    { key: 'simple', label: 'Simple', desc: 'Plain language' },
    { key: 'standard', label: 'Standard', desc: 'Default view' },
    { key: 'professional', label: 'Legal', desc: 'Full citations' },
  ];

  return (
    <div role="group" aria-label="Reading level" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 12px',
      marginBottom: '20px',
      borderRadius: '8px',
      background: 'var(--page-bg-subtle)',
      border: '1px solid var(--border)',
      fontFamily: 'Manrope, sans-serif',
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--body)', whiteSpace: 'nowrap' }}>Reading level</span>
      <div style={{ display: 'flex', gap: '3px' }}>
        {levels.map(r => {
          const active = readingLevel === r.key;
          return (
            <button
              key={r.key}
              type="button"
              aria-pressed={String(active)}
              title={r.desc}
              onClick={() => handleChange(r.key)}
              style={{
                padding: '5px 14px',
                minHeight: '44px',
                borderRadius: '6px',
                border: active ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: active ? 'var(--accent)' : 'var(--page-bg)',
                color: active ? 'var(--btn-text)' : 'var(--body)',
                fontSize: '0.72rem', fontWeight: active ? 700 : 500,
                fontFamily: 'Manrope, sans-serif',
                cursor: 'pointer', transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {r.label}
            </button>
          );
        })}
      </div>
      <span style={{ fontSize: '0.65rem', color: 'var(--body-secondary)', marginLeft: 'auto' }}>
        {readingLevel === 'simple' && '📖 Plain-language summaries'}
        {readingLevel === 'standard' && '📄 Plain language + legal text'}
        {readingLevel === 'professional' && '⚖️ Includes legal citations'}
      </span>
    </div>
  );
}
