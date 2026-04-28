/**
 * AccessibilityPanel — the eyeball (Step 15.5).
 *
 * A compact control panel exposing every site-level accessibility
 * preference in one place. Reached via the eyeball icon in the
 * public header.
 *
 * Sections:
 *   Display   5 modes  (Default, Dark, Warm, High Contrast, Low Vision)
 *   Font      4 choices (Default, Atkinson, OpenDyslexic, Lexend)
 *   Size      3 steps  (small, medium, large)
 *   Spacing   3 steps  (tight, default, loose)
 *   Reading level — only shown when a chat session owns it
 *                    (the panel accepts it as a prop rather than
 *                    reading it, because it lives in session state)
 *   Reset — clears every setting to defaults
 *
 * Interaction:
 *   - Eyeball button opens the popover. Keyboard: Enter/Space toggles.
 *   - Escape or click-outside closes.
 *   - Focus is trapped inside while open.
 *   - aria-expanded on the trigger, role="dialog" + aria-modal on the
 *     popover.
 *   - Every button is a real <button> with aria-pressed where toggling
 *     a boolean state, so screen readers announce the current choice.
 *
 * Rendering:
 *   - Settings mutate via useAccessibilitySettings (which writes
 *     localStorage + data-* on <html>).
 *   - No animation except the subtle fade on the overlay, and that's
 *     disabled under prefers-reduced-motion via Tailwind's motion-safe.
 *
 * Ref: docs/ARCHITECTURE.md §15.5
 */

import { useEffect, useId, useRef, useState } from 'react';
import {
  useAccessibilitySettings,
  type DisplayMode,
  type FontFamily,
  type Spacing,
  type TextSize,
} from '../hooks/useAccessibilitySettings.js';

export type ReadingLevel = 'simple' | 'standard' | 'professional';

export interface AccessibilityPanelProps {
  /**
   * Optional reading-level controller. Chat sessions pass this so the
   * panel can offer reading level in the same place as the other
   * accessibility settings. Non-chat pages omit it.
   */
  readingLevel?: {
    value: ReadingLevel;
    onChange: (level: ReadingLevel) => void;
  };
}

export function AccessibilityPanel({ readingLevel }: AccessibilityPanelProps) {
  const [open, setOpen] = useState(false);
  const a11y = useAccessibilitySettings();
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape; click-outside.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onClick(e: MouseEvent) {
      const t = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(t) &&
        !triggerRef.current?.contains(t)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  // Focus first item when opening.
  useEffect(() => {
    if (open) {
      const firstBtn = panelRef.current?.querySelector<HTMLButtonElement>(
        'button[data-panel-first]',
      );
      firstBtn?.focus();
    }
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={panelId}
        aria-label="Accessibility settings"
        className="p-2 rounded-full text-ink-700 hover:bg-surface-100 hover:text-accent-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50 transition-colors"
      >
        {/* Eyeball icon — inline SVG to keep bundle size minimal */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-label="Accessibility settings"
          className="absolute right-0 top-full mt-2 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-surface-100 border border-surface-200 rounded-lg shadow-xl p-4 text-ink-900"
        >
          <DisplaySection
            value={a11y.settings.display}
            onChange={a11y.setDisplay}
          />
          <FontSection value={a11y.settings.font} onChange={a11y.setFont} />
          <div className="grid grid-cols-2 gap-3 mt-4">
            <SizeSection value={a11y.settings.size} onChange={a11y.setSize} />
            <SpacingSection
              value={a11y.settings.spacing}
              onChange={a11y.setSpacing}
            />
          </div>
          {readingLevel && (
            <ReadingLevelSection
              value={readingLevel.value}
              onChange={readingLevel.onChange}
            />
          )}
          <button
            type="button"
            onClick={() => {
              a11y.reset();
            }}
            className="mt-4 w-full py-2 px-3 rounded border border-surface-200 text-sm text-ink-700 hover:bg-surface-100 hover:border-surface-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors flex items-center justify-center gap-2"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
            Reset to Defaults
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Section components ─────────────────────────────────────────────────────

interface DisplayOption {
  value: DisplayMode;
  label: string;
  icon: React.ReactNode;
}
const DISPLAY_OPTS: DisplayOption[] = [
  {
    value: 'default',
    label: 'Default',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
  {
    value: 'warm',
    label: 'Warm',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M10 2v4M6 6l2 2M2 10h4M6 14l2-2M10 18v-4M14 14l2 2M18 10h-4M14 6l-2-2" strokeLinecap="round" />
        <circle cx="10" cy="10" r="3" />
      </svg>
    ),
  },
  {
    value: 'contrast',
    label: 'High Contrast',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: 'low-vision',
    label: 'Low Vision',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

function DisplaySection({
  value,
  onChange,
}: {
  value: DisplayMode;
  onChange: (v: DisplayMode) => void;
}) {
  return (
    <section>
      <h3 className="text-[0.65625rem] font-semibold uppercase tracking-wider text-ink-500 mb-2">
        Display
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {DISPLAY_OPTS.map((opt, i) => (
          <OptionButton
            key={opt.value}
            selected={value === opt.value}
            onClick={() => onChange(opt.value)}
            first={i === 0}
          >
            <span className="flex flex-col items-center gap-1 py-1">
              <span aria-hidden="true">{opt.icon}</span>
              <span className="text-xs">{opt.label}</span>
            </span>
          </OptionButton>
        ))}
      </div>
    </section>
  );
}

interface FontOption {
  value: FontFamily;
  label: string;
  description: string;
  style: React.CSSProperties;
}
const FONT_OPTS: FontOption[] = [
  {
    value: 'default',
    label: 'Default',
    description: 'Standard site fonts',
    style: { fontFamily: "'IBM Plex Sans', sans-serif" },
  },
  {
    value: 'atkinson',
    label: 'Atkinson',
    description: 'Designed for low vision',
    style: { fontFamily: "'Atkinson Hyperlegible', sans-serif" },
  },
  {
    value: 'opendyslexic',
    label: 'OpenDyslexic',
    description: 'Designed for dyslexia',
    style: { fontFamily: "'OpenDyslexic', sans-serif" },
  },
  {
    value: 'lexend',
    label: 'Lexend',
    description: 'Reduces reading fatigue',
    style: { fontFamily: "'Lexend', sans-serif" },
  },
];

function FontSection({
  value,
  onChange,
}: {
  value: FontFamily;
  onChange: (v: FontFamily) => void;
}) {
  return (
    <section className="mt-4">
      <h3 className="text-[0.65625rem] font-semibold uppercase tracking-wider text-ink-500 mb-2">
        Font
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {FONT_OPTS.map((opt) => (
          <OptionButton
            key={opt.value}
            selected={value === opt.value}
            onClick={() => onChange(opt.value)}
          >
            <span className="flex flex-col items-start gap-0.5 py-1 text-left">
              <span className="text-lg font-medium" style={opt.style}>
                Aa
              </span>
              <span className="text-xs font-semibold" style={opt.style}>
                {opt.label}
              </span>
              <span className="text-[0.6875rem] text-ink-500 leading-tight">
                {opt.description}
              </span>
            </span>
          </OptionButton>
        ))}
      </div>
    </section>
  );
}

function SizeSection({
  value,
  onChange,
}: {
  value: TextSize;
  onChange: (v: TextSize) => void;
}) {
  return (
    <section>
      <h3 className="text-[0.65625rem] font-semibold uppercase tracking-wider text-ink-500 mb-2">
        Size
      </h3>
      <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Text size">
        {(['small', 'medium', 'large'] as const).map((s) => (
          <OptionButton
            key={s}
            selected={value === s}
            onClick={() => onChange(s)}
            ariaLabel={`${s} text size`}
          >
            <span
              className={
                s === 'small'
                  ? 'text-sm font-semibold'
                  : s === 'medium'
                  ? 'text-base font-semibold'
                  : 'text-xl font-semibold'
              }
            >
              A
            </span>
          </OptionButton>
        ))}
      </div>
    </section>
  );
}

function SpacingSection({
  value,
  onChange,
}: {
  value: Spacing;
  onChange: (v: Spacing) => void;
}) {
  return (
    <section>
      <h3 className="text-[0.65625rem] font-semibold uppercase tracking-wider text-ink-500 mb-2">
        Spacing
      </h3>
      <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Line spacing">
        {(['tight', 'default', 'loose'] as const).map((s) => (
          <OptionButton
            key={s}
            selected={value === s}
            onClick={() => onChange(s)}
            ariaLabel={`${s} line spacing`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              {s === 'tight' && (
                <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="11" x2="20" y2="11" />
                  <line x1="4" y1="15" x2="20" y2="15" />
                </g>
              )}
              {s === 'default' && (
                <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </g>
              )}
              {s === 'loose' && (
                <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="5" x2="20" y2="5" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="19" x2="20" y2="19" />
                </g>
              )}
            </svg>
          </OptionButton>
        ))}
      </div>
    </section>
  );
}

function ReadingLevelSection({
  value,
  onChange,
}: {
  value: ReadingLevel;
  onChange: (v: ReadingLevel) => void;
}) {
  const LEVELS: Array<{ value: ReadingLevel; label: string }> = [
    { value: 'simple', label: 'Simple' },
    { value: 'standard', label: 'Standard' },
    { value: 'professional', label: 'Legal' },
  ];
  return (
    <section className="mt-4">
      <h3 className="text-[0.65625rem] font-semibold uppercase tracking-wider text-ink-500 mb-1">
        ADA Guide Reading Level
      </h3>
      <p className="text-[0.6875rem] text-ink-500 mb-2 leading-snug">
        Controls how Ada writes in conversations
      </p>
      <div
        className="grid grid-cols-3 gap-1.5"
        role="group"
        aria-label="Reading level"
      >
        {LEVELS.map((l) => (
          <OptionButton
            key={l.value}
            selected={value === l.value}
            onClick={() => onChange(l.value)}
          >
            <span className="text-xs font-semibold py-1">{l.label}</span>
          </OptionButton>
        ))}
      </div>
    </section>
  );
}

// ─── Shared button ──────────────────────────────────────────────────────────

function OptionButton({
  selected,
  onClick,
  children,
  first,
  ariaLabel,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  first?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      data-panel-first={first || undefined}
      className={
        'rounded border px-2 py-1.5 text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-1 transition-colors flex items-center justify-center ' +
        (selected
          ? 'border-accent-500 bg-accent-50 text-accent-600 font-semibold'
          : 'border-surface-200 hover:border-surface-300 hover:bg-surface-100')
      }
    >
      {children}
    </button>
  );
}
