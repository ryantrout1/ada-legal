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
  const root = document.documentElement;
  root.setAttribute('data-theme', prefs.displayMode);
  root.setAttribute('data-font-size', prefs.fontSize);
  root.setAttribute('data-font-family', prefs.fontFamily);

  if (prefs.fontFamily === 'atkinson') {
    if (!document.getElementById('atkinson-font-link')) {
      const link = document.createElement('link');
      link.id = 'atkinson-font-link';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap';
      document.head.appendChild(link);
    }
  }
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