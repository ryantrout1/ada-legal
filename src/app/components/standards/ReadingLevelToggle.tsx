/**
 * ReadingLevelToggle — three-button picker for simple / standard /
 * professional voice. Reads from and writes to ReadingLevelContext, which
 * persists the choice to localStorage and stamps data-reading-level on
 * <html>.
 *
 * Originally an inline block inside ChapterPageLayout (standards guide).
 * Extracted so the same control can sit at the top of class-action
 * detail pages, attorney pages, and any future page where the user may
 * want to dial the reading level up or down.
 *
 * Visual styling intentionally matches the standards-guide toggle so
 * that someone navigating from the guide to a class-action page sees
 * the same control in the same location-style. Uses the same CSS
 * variables (--accent, --border, --page-bg, etc.) defined in
 * GuideStyles and propagated through the public layout.
 */

import { useReadingLevel, type ReadingLevel } from './ReadingLevelContext.js';

interface ReadingLevelToggleProps {
  /**
   * Wrapper className applied to the outer container. Lets pages
   * adjust spacing without forking the component (e.g. less margin on
   * compact pages, more on prose-heavy ones).
   */
  className?: string;
}

const LEVELS: Array<{
  key: ReadingLevel;
  label: string;
  desc: string;
  hint: string;
}> = [
  {
    key: 'simple',
    label: 'Simple',
    desc: 'Plain language',
    hint: '📖 Plain-language summaries',
  },
  {
    key: 'standard',
    label: 'Standard',
    desc: 'Default view',
    hint: '📄 Plain language + legal text',
  },
  {
    key: 'professional',
    label: 'Legal',
    desc: 'Full citations',
    hint: '⚖️ Includes legal citations',
  },
];

export function ReadingLevelToggle({ className }: ReadingLevelToggleProps) {
  const { readingLevel, setReadingLevel } = useReadingLevel();
  const activeHint = LEVELS.find((l) => l.key === readingLevel)?.hint ?? '';

  return (
    <div
      role="group"
      aria-label="Reading level"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        borderRadius: '8px',
        background: 'var(--page-bg-subtle)',
        border: '1px solid var(--border)',
        fontFamily: 'var(--font-body), Manrope, sans-serif',
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          color: 'var(--body)',
          whiteSpace: 'nowrap',
        }}
      >
        Reading level
      </span>
      <div style={{ display: 'flex', gap: '3px' }}>
        {LEVELS.map((r) => {
          const active = readingLevel === r.key;
          return (
            <button
              key={r.key}
              type="button"
              aria-pressed={active}
              title={r.desc}
              onClick={() => setReadingLevel(r.key)}
              style={{
                padding: '5px 14px',
                minHeight: '44px',
                borderRadius: '6px',
                border: active
                  ? '2px solid var(--accent)'
                  : '1px solid var(--border)',
                background: active ? 'var(--accent)' : 'var(--page-bg)',
                color: active ? 'var(--btn-text)' : 'var(--body)',
                fontSize: '0.72rem',
                fontWeight: active ? 700 : 500,
                fontFamily: 'var(--font-body), Manrope, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {r.label}
            </button>
          );
        })}
      </div>
      <span
        style={{
          fontSize: '0.65rem',
          color: 'var(--body-secondary)',
          marginLeft: 'auto',
        }}
      >
        {activeHint}
      </span>
    </div>
  );
}
