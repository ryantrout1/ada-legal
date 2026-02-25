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
      html {
        color-scheme: dark;
      }

      /* === Base page background === */
      body {
        background-color: #0F1219 !important;
      }

      /* === Swap CSS variables (catches components using var()) === */
      :root {
        --slate-50: #0F1219 !important;
        --slate-100: #151B24 !important;
        --slate-200: #374151 !important;
        --slate-300: #475569 !important;
        --slate-400: #94A3B8 !important;
        --slate-500: #CBD5E1 !important;
        --slate-600: #E2E8F0 !important;
        --slate-700: #E2E8F0 !important;
        --slate-800: #F1F5F9 !important;
        --slate-900: #F8FAFC !important;
        --surface: #1E293B !important;
      }

      /* ============================================
         BLANKET BACKGROUND OVERRIDE
         Force ALL container elements inside #main-content to dark.
         !important in <style> beats non-!important inline styles.
         Already-dark elements (#1E293B) → no visible change.
         Light elements (#FFF, #FAF7F2, etc) → forced dark.
         ============================================ */
      #main-content,
      #main-content > *,
      #main-content div,
      #main-content section,
      #main-content article,
      #main-content aside,
      #main-content figure,
      #main-content details,
      #main-content fieldset,
      #main-content nav,
      #main-content header:not([role="banner"]),
      #main-content footer:not([role="contentinfo"]),
      #main-content form,
      #main-content ul,
      #main-content ol,
      #main-content li,
      #main-content table,
      #main-content tr,
      #main-content td,
      #main-content th {
        background-color: #1E293B !important;
        background-image: none !important;
      }

      /* === Pills, tags, badges (spans used as visual containers) === */
      #main-content span[role="listitem"],
      #main-content span[style*="border-radius: 100px"],
      #main-content span[style*="border-radius: 9999px"],
      #main-content span[style*="borderRadius"] {
        background-color: #2D3748 !important;
        border-color: #4A5568 !important;
        color: #E2E8F0 !important;
      }

      /* === Section badge pills (WE HANDLE THIS, WE'LL GUIDE YOU) === */
      #main-content span[style*="padding: 3px"],
      #main-content span[style*="padding: 4px"] {
        background-color: #2D3748 !important;
        border-color: #4A5568 !important;
      }

      /* === Story card tag pills (Standards Guide, Search, Legal Guides) === */
      #main-content span[style*="border-radius: 9999px"] {
        background-color: #3C1810 !important;
        color: #F97316 !important;
      }

      /* === Re-exempt buttons and interactive elements === 
         Buttons, links, badges keep their original backgrounds.
         This goes AFTER the blanket rule so it wins by cascade. */
      #main-content button,
      #main-content a,
      #main-content [role="button"],
      #main-content [role="radio"],
      #main-content [role="tab"],
      #main-content [role="switch"],
      #main-content [role="checkbox"],
      #main-content [role="option"],
      #main-content [role="alert"],
      #main-content svg,
      #main-content img,
      #main-content video,
      #main-content canvas {
        background-color: unset !important;
        background-image: unset !important;
      }

      /* === Text colors === */
      h1, h2, h3, h4, h5, h6 {
        color: #F1F5F9 !important;
      }
      p, li, dd, dt, td, th, label, figcaption, blockquote {
        color: #E2E8F0 !important;
      }
      span, small {
        color: #CBD5E1 !important;
      }

      /* === Links — bright orange on dark === */
      a {
        color: #F97316 !important;
      }
      a:hover {
        color: #FB923C !important;
      }

      /* === Header background — force dark regardless of var() === */
      header[role="banner"] {
        background-color: #1E293B !important;
      }

      /* === Header already dark — keep text white === */
      header[role="banner"] a,
      header[role="banner"] span,
      header[role="banner"] button,
      header[role="banner"] div {
        color: white !important;
      }

      /* === Form inputs === */
      input, select, textarea {
        background-color: #151B24 !important;
        border-color: #475569 !important;
        color: #F1F5F9 !important;
      }
      input::placeholder, textarea::placeholder {
        color: #94A3B8 !important;
      }
      input:focus, select:focus, textarea:focus {
        border-color: #C2410C !important;
      }

      /* === Card/container borders — visible on dark === */
      #main-content [style*="border"] {
        border-color: #374151 !important;
      }

      /* === The settings dropdown === */
      [role="dialog"][aria-label="Display preferences"] {
        background-color: #1E293B !important;
        border-color: #374151 !important;
      }
      [role="dialog"][aria-label="Display preferences"] legend,
      [role="dialog"][aria-label="Display preferences"] p {
        color: #94A3B8 !important;
      }

      /* === Focus outlines — bright on dark === */
      *:focus-visible {
        outline-color: #F97316 !important;
      }

      /* === Scrollbar dark === */
      ::-webkit-scrollbar {
        background: #0F1219;
      }
      ::-webkit-scrollbar-thumb {
        background: #374151;
        border-radius: 4px;
      }

      /* === Global footer (non-landing, already dark) === */
      footer[role="contentinfo"],
      footer[role="contentinfo"] div,
      footer[role="contentinfo"] p,
      footer[role="contentinfo"] span,
      footer[role="contentinfo"] a {
        background-color: #0F1219 !important;
      }
    `;
  }

  // --- HIGH CONTRAST MODE ---
  if (prefs.displayMode === 'high-contrast') {
    css += `
      html {
        color-scheme: dark;
      }

      /* === CSS variable overrides === */
      :root {
        --slate-50: #000000 !important;
        --slate-100: #0A0A0A !important;
        --slate-200: #FFFFFF !important;
        --slate-300: #FFFFFF !important;
        --slate-400: #D0D0D0 !important;
        --slate-500: #D0D0D0 !important;
        --slate-600: #F0F0F0 !important;
        --slate-700: #F0F0F0 !important;
        --slate-800: #FFFFFF !important;
        --slate-900: #FFFFFF !important;
        --surface: #000000 !important;
        --terra-600: #FFB347 !important;
        --terra-700: #FFB347 !important;
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

      /* === Body background === */
      body {
        background-color: #000000 !important;
        color: #FFFFFF !important;
      }

      /* ============================================
         BLANKET BACKGROUND OVERRIDE — HIGH CONTRAST
         Force ALL containers to pure black / near-black.
         ============================================ */
      #main-content,
      #main-content > *,
      #main-content div,
      #main-content section,
      #main-content article,
      #main-content aside,
      #main-content figure,
      #main-content details,
      #main-content fieldset,
      #main-content nav,
      #main-content header:not([role="banner"]),
      #main-content footer:not([role="contentinfo"]),
      #main-content form,
      #main-content ul,
      #main-content ol,
      #main-content li,
      #main-content table,
      #main-content tr,
      #main-content td,
      #main-content th {
        background-color: #0A0A0A !important;
        background-image: none !important;
        border-color: #FFFFFF !important;
      }

      /* === Cards — slightly lighter black for depth === */
      #main-content [style*="border-radius"],
      #main-content [style*="borderRadius"] {
        background-color: #1A1A1A !important;
        border: 2px solid #FFFFFF !important;
      }

      /* === Pills, tags, badges === */
      #main-content span[role="listitem"],
      #main-content span[style*="border-radius: 100px"],
      #main-content span[style*="border-radius: 9999px"],
      #main-content span[style*="borderRadius"] {
        background-color: #1A1A1A !important;
        border: 2px solid #FFB347 !important;
        color: #FFB347 !important;
      }

      /* === Section badge pills === */
      #main-content span[style*="padding: 3px"],
      #main-content span[style*="padding: 4px"] {
        background-color: #1A1A1A !important;
        border: 2px solid #FFB347 !important;
        color: #FFB347 !important;
      }

      /* === Re-exempt interactive elements === */
      #main-content button,
      #main-content a,
      #main-content [role="button"],
      #main-content [role="radio"],
      #main-content [role="tab"],
      #main-content [role="switch"],
      #main-content [role="checkbox"],
      #main-content [role="option"],
      #main-content [role="alert"],
      #main-content svg,
      #main-content img,
      #main-content video,
      #main-content canvas {
        background-color: unset !important;
        background-image: unset !important;
      }

      /* === Text — MAXIMUM CONTRAST === */
      h1, h2, h3, h4, h5, h6 {
        color: #FFFFFF !important;
      }
      p, li, dd, dt, td, th, label, figcaption, blockquote {
        color: #F0F0F0 !important;
      }
      span, small {
        color: #D0D0D0 !important;
      }

      /* === Links — gold on black === */
      a {
        color: #FFD700 !important;
        text-decoration: underline !important;
      }
      a:hover {
        color: #FFFFFF !important;
      }

      /* === Terracotta accent text → warm orange === */
      [style*="color: #C2410C"],
      [style*="color: var(--terra-600)"],
      [style*="color: var(--terra-700)"] {
        color: #FFB347 !important;
      }

      /* === Header — pure black with white border === */
      header[role="banner"] {
        background-color: #000000 !important;
        border-bottom: 2px solid #FFFFFF !important;
      }
      header[role="banner"] a,
      header[role="banner"] span,
      header[role="banner"] button,
      header[role="banner"] div {
        color: #FFFFFF !important;
      }
      /* Active nav link gold */
      header[role="banner"] a[aria-current="page"] {
        color: #FFD700 !important;
        text-decoration: underline !important;
      }

      /* === Form inputs === */
      input, select, textarea {
        background-color: #1A1A1A !important;
        border: 2px solid #FFFFFF !important;
        color: #FFFFFF !important;
      }
      input::placeholder, textarea::placeholder {
        color: #D0D0D0 !important;
      }
      input:focus, select:focus, textarea:focus {
        border-color: #FFD700 !important;
      }

      /* === Buttons === */
      button {
        border: 2px solid #FFFFFF !important;
      }
      /* Primary CTA buttons (terracotta) */
      button[style*="background: var(--terra"],
      button[style*="background-color: var(--terra"],
      button[style*="C2410C"],
      button[style*="c2410c"],
      #main-content button[style*="C2410C"],
      #main-content button[style*="background: #C2410C"],
      #main-content button[style*="background-color: #C2410C"] {
        background-color: #D4572A !important;
        color: #FFFFFF !important;
        border: 2px solid #FFFFFF !important;
      }
      /* Button hover — invert */
      button:hover {
        background-color: #FFFFFF !important;
        color: #000000 !important;
      }

      /* === All borders visible === */
      #main-content [style*="border"] {
        border-color: #FFFFFF !important;
      }

      /* === Separators / dividers === */
      hr, [role="separator"] {
        border-color: #444444 !important;
        border-width: 2px !important;
      }

      /* === Card accent bars (left borders) === */
      [style*="border-left: 3px"],
      [style*="border-left: 4px"],
      [style*="borderLeft"] {
        border-left-width: 4px !important;
      }

      /* === Step number circles === */
      #main-content [style*="border-radius: 50%"],
      #main-content [style*="borderRadius: 50%"],
      #main-content [style*="border-radius: 9999px"][style*="width: 3"],
      #main-content [style*="border-radius: 9999px"][style*="width: 4"] {
        border: 2px solid #FFFFFF !important;
        background-color: #1A1A1A !important;
        color: #FFFFFF !important;
      }

      /* === Focus indicators — gold === */
      *:focus-visible {
        outline: 3px solid #FFD700 !important;
        outline-offset: 3px !important;
      }

      /* === Settings panel itself === */
      [role="dialog"][aria-label="Display preferences"] {
        background-color: #000000 !important;
        border: 2px solid #FFFFFF !important;
        color: #FFFFFF !important;
      }
      [role="dialog"][aria-label="Display preferences"] legend,
      [role="dialog"][aria-label="Display preferences"] p {
        color: #D0D0D0 !important;
      }
      [role="dialog"][aria-label="Display preferences"] button[aria-pressed="true"] {
        background-color: #D4572A !important;
        border: 2px solid #FFFFFF !important;
        color: #FFFFFF !important;
      }
      [role="dialog"][aria-label="Display preferences"] button[aria-pressed="false"] {
        background-color: #1A1A1A !important;
        border: 2px solid #FFFFFF !important;
        color: #FFFFFF !important;
      }

      /* === Scrollbar high contrast === */
      ::-webkit-scrollbar {
        background: #000000;
      }
      ::-webkit-scrollbar-thumb {
        background: #FFFFFF;
        border-radius: 4px;
      }

      /* === Footer === */
      footer[role="contentinfo"],
      footer[role="contentinfo"] div,
      footer[role="contentinfo"] p,
      footer[role="contentinfo"] span,
      footer[role="contentinfo"] a {
        background-color: #000000 !important;
      }
      footer[role="contentinfo"] {
        border-top: 2px solid #FFFFFF !important;
      }

      /* === WCAG compliance banner === */
      #main-content [style*="WCAG"],
      #main-content [style*="border-left: 4px solid #C2410C"] {
        background-color: #1A1A1A !important;
        border: 2px solid #FFB347 !important;
      }

      /* === Status badges === */
      [style*="border-radius: 100px"],
      [style*="border-radius: 9999px"] {
        border: 2px solid currentColor !important;
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