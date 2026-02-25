import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';

const DEFAULTS = {
  displayMode: 'default',
  fontSize: 'default',
  fontFamily: 'default'
};

export const loadPreferences = () => {
  try {
    const saved = localStorage.getItem('ada-display-prefs');
    return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
};

const savePreferences = (prefs) => {
  try {
    localStorage.setItem('ada-display-prefs', JSON.stringify(prefs));
  } catch {}
};

export const applyPreferences = (prefs) => {
  // Get or create the runtime style element (lives in <head>, outside React)
  let styleEl = document.getElementById('ada-prefs-runtime-style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'ada-prefs-runtime-style';
    document.head.appendChild(styleEl);
  }

  let css = '';

  // --- DARK MODE ---
  if (prefs.displayMode === 'dark') {
    css += `
      #main-content {
        filter: invert(0.88) hue-rotate(180deg) !important;
        background-color: #111111 !important;
      }
      #main-content img,
      #main-content svg,
      #main-content video,
      #main-content canvas,
      #main-content [style*="background-image"] {
        filter: invert(1) hue-rotate(180deg) !important;
      }
      footer[role="contentinfo"] {
        filter: invert(1) hue-rotate(180deg) !important;
      }
      html {
        color-scheme: dark;
      }
    `;
  }

  // --- HIGH CONTRAST MODE ---
  if (prefs.displayMode === 'high-contrast') {
    css += `
      :root {
        --slate-900: #FFFFFF !important;
        --slate-800: #FFFFFF !important;
        --slate-700: #FFFFFF !important;
        --slate-600: #FFFFFF !important;
        --slate-500: #E0E0E0 !important;
        --slate-400: #CCCCCC !important;
        --slate-300: #FFFFFF !important;
        --slate-200: #FFFFFF !important;
        --slate-100: #111111 !important;
        --slate-50: #000000 !important;
        --surface: #000000 !important;
        --terra-600: #FF6B35 !important;
        --terra-700: #FF6B35 !important;
        --terra-100: #1A0A00 !important;
        --terra-50: #0D0500 !important;
        --success-600: #4ADE80 !important;
        --success-100: #052E16 !important;
        --warning-600: #FBBF24 !important;
        --warning-100: #1C1001 !important;
        --error-600: #F87171 !important;
        --error-100: #2D0606 !important;
        --info-600: #60A5FA !important;
        --info-100: #0A1628 !important;
      }
      body {
        background-color: #000000 !important;
        color: #FFFFFF !important;
      }
      h1, h2, h3, h4, h5, h6 {
        color: #FFFFFF !important;
      }
      p, span, li, label, td, th, dt, dd, div {
        color: #FFFFFF !important;
      }
      a {
        color: #FF6B35 !important;
        text-decoration: underline !important;
      }
      a:hover {
        color: #FFB088 !important;
      }
      header[role="banner"] a {
        color: white !important;
      }
      input, select, textarea {
        border: 2px solid #FFFFFF !important;
        background-color: #111111 !important;
        color: #FFFFFF !important;
      }
      input:focus, select:focus, textarea:focus {
        border-color: #FF6B35 !important;
        outline-color: #FF6B35 !important;
      }
      button {
        border: 2px solid #FFFFFF !important;
      }
      *:focus-visible {
        outline: 3px solid #FF6B35 !important;
        outline-offset: 3px !important;
      }
    `;
  }

  // --- FONT SIZE ---
  if (prefs.fontSize === 'large') {
    css += `html { font-size: 125% !important; }`;
  } else if (prefs.fontSize === 'xl') {
    css += `html { font-size: 150% !important; }`;
  }

  // --- FONT FAMILY ---
  if (prefs.fontFamily === 'atkinson') {
    if (!document.getElementById('atkinson-font-link')) {
      const link = document.createElement('link');
      link.id = 'atkinson-font-link';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap';
      document.head.appendChild(link);
    }
    css += `
      body, input, select, textarea, button {
        font-family: 'Atkinson Hyperlegible', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      }
      h1, h2, h3, h4, h5, h6 {
        font-family: 'Atkinson Hyperlegible', Georgia, serif !important;
      }
    `;
  }

  // Write all CSS at once — replaces previous content entirely
  styleEl.textContent = css;
};

function OptionButton({ label, active, onClick, ariaPressed, style: extraStyle, variant }) {
  const isMobile = variant === 'inline';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ariaPressed}
      style={{
        flex: 1,
        padding: '10px 8px',
        minHeight: '44px',
        borderRadius: '8px',
        border: active
          ? '2px solid #C2410C'
          : isMobile
            ? '2px solid rgba(255,255,255,0.2)'
            : '2px solid var(--slate-200)',
        background: active ? '#C2410C' : 'transparent',
        color: active ? 'white' : isMobile ? 'white' : 'var(--slate-700)',
        fontFamily: 'Manrope, sans-serif',
        fontSize: '0.8125rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        ...extraStyle
      }}
    >
      {label}
    </button>
  );
}

export default function DisplaySettings({ variant = 'dropdown', isOpen, onClose }) {
  const [prefs, setPrefs] = useState(loadPreferences);
  const [announcement, setAnnouncement] = useState('');
  const panelRef = useRef(null);
  const firstFocusRef = useRef(null);

  const updatePref = useCallback((key, value, announceText) => {
    setPrefs(prev => {
      const next = { ...prev, [key]: value };
      savePreferences(next);
      applyPreferences(next);
      return next;
    });
    setAnnouncement(announceText);
  }, []);

  const resetAll = useCallback(() => {
    savePreferences(DEFAULTS);
    applyPreferences(DEFAULTS);
    setPrefs({ ...DEFAULTS });
    setAnnouncement('All display preferences reset to defaults');
  }, []);

  // Focus trap + escape for dropdown
  useEffect(() => {
    if (variant !== 'dropdown' || !isOpen) return;

    const timer = setTimeout(() => {
      firstFocusRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll('button, [tabindex]');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [variant, isOpen, onClose]);

  // Click outside for dropdown
  useEffect(() => {
    if (variant !== 'dropdown' || !isOpen) return;
    const handle = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [variant, isOpen, onClose]);

  const isMobile = variant === 'inline';
  const labelStyle = {
    fontFamily: 'Manrope, sans-serif',
    fontSize: '0.75rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: isMobile ? 'rgba(255,255,255,0.6)' : '#475569',
    margin: 0,
    padding: 0,
    border: 'none'
  };

  const content = (
    <>
      <div style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }} aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Display Mode */}
      <fieldset style={{ border: 'none', margin: 0, padding: 0, marginBottom: '16px' }}>
        <legend style={labelStyle}>Display Mode</legend>
        <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
          <OptionButton ref={firstFocusRef} variant={variant} label="Default" active={prefs.displayMode === 'default'} ariaPressed={String(prefs.displayMode === 'default')}
            onClick={() => updatePref('displayMode', 'default', 'Display mode changed to default')} />
          <OptionButton variant={variant} label="Dark" active={prefs.displayMode === 'dark'} ariaPressed={String(prefs.displayMode === 'dark')}
            onClick={() => updatePref('displayMode', 'dark', 'Display mode changed to dark')} />
          <OptionButton variant={variant} label="High Contrast" active={prefs.displayMode === 'high-contrast'} ariaPressed={String(prefs.displayMode === 'high-contrast')}
            onClick={() => updatePref('displayMode', 'high-contrast', 'Display mode changed to high contrast')} />
        </div>
      </fieldset>

      {/* Font Size */}
      <fieldset style={{ border: 'none', margin: 0, padding: 0, marginBottom: '16px' }}>
        <legend style={labelStyle}>Font Size</legend>
        <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
          <OptionButton variant={variant} label={<span><span style={{ fontSize: '0.8rem' }}>Aa</span> Default</span>} active={prefs.fontSize === 'default'} ariaPressed={String(prefs.fontSize === 'default')}
            onClick={() => updatePref('fontSize', 'default', 'Font size changed to default')} />
          <OptionButton variant={variant} label={<span><span style={{ fontSize: '1rem' }}>Aa</span> Large</span>} active={prefs.fontSize === 'large'} ariaPressed={String(prefs.fontSize === 'large')}
            onClick={() => updatePref('fontSize', 'large', 'Font size changed to large')} />
          <OptionButton variant={variant} label={<span><span style={{ fontSize: '1.15rem' }}>Aa</span> XL</span>} active={prefs.fontSize === 'xl'} ariaPressed={String(prefs.fontSize === 'xl')}
            onClick={() => updatePref('fontSize', 'xl', 'Font size changed to extra large')} />
        </div>
      </fieldset>

      {/* Font Family */}
      <fieldset style={{ border: 'none', margin: 0, padding: 0, marginBottom: '16px' }}>
        <legend style={labelStyle}>Font Family</legend>
        <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
          <OptionButton variant={variant} label="Default" active={prefs.fontFamily === 'default'} ariaPressed={String(prefs.fontFamily === 'default')}
            onClick={() => updatePref('fontFamily', 'default', 'Font changed to default')} />
          <OptionButton variant={variant} label={<span style={{ fontFamily: "'Atkinson Hyperlegible', sans-serif" }}>Atkinson Hyperlegible</span>}
            active={prefs.fontFamily === 'atkinson'} ariaPressed={String(prefs.fontFamily === 'atkinson')}
            onClick={() => updatePref('fontFamily', 'atkinson', 'Font changed to Atkinson Hyperlegible')} />
        </div>
      </fieldset>

      {/* Reset */}
      <button
        type="button"
        onClick={resetAll}
        aria-label="Reset all display preferences to defaults"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          width: '100%', padding: '8px', minHeight: '44px',
          background: 'transparent',
          border: isMobile ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--slate-200)',
          borderRadius: '8px', cursor: 'pointer',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
          color: isMobile ? 'rgba(255,255,255,0.7)' : '#475569',
          transition: 'background 0.15s'
        }}
      >
        <RotateCcw size={14} /> Reset to Defaults
      </button>
    </>
  );

  if (isMobile) {
    return (
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          color: 'rgba(255,255,255,0.4)', margin: '0 0 12px'
        }}>
          Display Settings
        </p>
        {content}
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Display preferences"
      aria-modal="true"
      style={{
        position: 'absolute',
        right: 0,
        top: 'calc(100% + 8px)',
        width: '320px',
        backgroundColor: 'var(--surface, white)',
        border: '1px solid var(--slate-200)',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        padding: '20px',
        zIndex: 1000
      }}
    >
      {content}
    </div>
  );
}