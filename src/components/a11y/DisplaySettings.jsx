import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';

const DEFAULTS = {
  displayMode: 'default',
  fontSize: 'default',
  lineSpacing: 'default',
  fontFamily: 'default',
  readingLevel: 'standard'
};

export const loadPreferences = () => {
  try {
    const saved = localStorage.getItem('ada-display-prefs');
    if (saved) {
      return { ...DEFAULTS, ...JSON.parse(saved) };
    }
    // COGA: Auto-detect OS preferences for first-time visitors
    const prefersHC = window.matchMedia?.('(prefers-contrast: more)')?.matches;
    if (prefersHC) {
      const autoPrefs = { ...DEFAULTS, displayMode: 'high-contrast' };
      localStorage.setItem('ada-display-prefs', JSON.stringify(autoPrefs));
      return autoPrefs;
    }
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
    if (prefersDark) {
      const autoPrefs = { ...DEFAULTS, displayMode: 'dark' };
      localStorage.setItem('ada-display-prefs', JSON.stringify(autoPrefs));
      return autoPrefs;
    }
    return { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
};

const savePreferences = (prefs) => {
  try {
    localStorage.setItem('ada-display-prefs', JSON.stringify(prefs));
  } catch {}
  // Notify ReadingLevelContext and any other listeners of preference changes
  try { window.dispatchEvent(new CustomEvent('ada-prefs-changed')); } catch {}
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

  // --- DEFAULT TOKEN DEFINITIONS ---
  // Always applied. Non-default modes override these values below.
  css += `
    :root {
      --page-bg:          #FFFFFF;
      --page-bg-alt:      #FAF7F2;
      --page-bg-subtle:   #F8FAFC;
      --heading:          #1E293B;
      --body:             #3D4A5C;
      --body-secondary:   #4B5563;
      --section-label:    #9A3412;
      --link:             #9A3412;
      --card-bg:          #FFFFFF;
      --card-border:      #E2E8F0;
      --card-bg-tinted:   #FEF1EC;
      --card-bg-warm:     #FFF7ED;
      --border:           #E2E8F0;
      --border-lighter:   #F1F5F9;
      /* Dark sections */
      --dark-bg:          #1E293B;
      --dark-bg-alt:      #1A1F2B;
      --dark-bg-deep:     #0F1219;
      --dark-bg-footer:   #141820;
      --dark-heading:     #FFFFFF;
      --dark-body:        #E2E8F0;
      --dark-body-secondary: #CBD5E1;
      --dark-muted:       #B0BEC5;
      --dark-label:       #FDBA74;
      --dark-highlight:   #FB923C;
      --dark-card-bg:     #1A1F2B;
      --dark-card-border: #2A3344;
      --dark-border:      #475569;
      --glass-bg:         rgba(255,255,255,0.04);
      --glass-border:     rgba(255,255,255,0.06);
      /* Accents */
      --accent:           #C2410C;
      --accent-light:     #FB923C;
      --accent-lighter:   #FDBA74;
      --accent-success:   #7DCEA0;
      --btn-text:         #FFFFFF;
    }
  `;

  // --- DESIGN TOKEN OVERRIDES ---
  // Each mode sets CSS custom properties on :root.
  // All public-facing components use var(--token) instead of hardcoded colors.
  // No blanket selectors, no !important on element rules — tokens only.

  if (prefs.displayMode === 'dark') {
    css += `
      html { color-scheme: dark; }
      body { background-color: var(--page-bg) !important; }
      :root {
        /* Light section tokens */
        --page-bg:          #111827 !important;
        --page-bg-alt:      #111827 !important;
        --page-bg-subtle:   #0F1520 !important;
        --heading:          #F1F5F9 !important;
        --body:             #CBD5E1 !important;
        --body-secondary:   #94A3B8 !important;
        --section-label:    #FDBA74 !important;
        --link:             #FB923C !important;
        --card-bg:          #0F1520 !important;
        --card-border:      #1E2736 !important;
        --card-bg-tinted:   #1C1210 !important;
        --card-bg-warm:     #1A1208 !important;
        --border:           #1E2736 !important;
        --border-lighter:   #151C28 !important;
        /* Dark section tokens */
        --dark-bg:          #0B0E14 !important;
        --dark-bg-alt:      #0B0E14 !important;
        --dark-bg-deep:     #0B0E14 !important;
        --dark-bg-footer:   #0B0E14 !important;
        --dark-card-bg:     #111827 !important;
        --dark-card-border: #1E2736 !important;
        --dark-border:      #1E293B !important;
        /* Accent tokens */
        --accent:           #C2410C !important;
        --accent-light:     #FB923C !important;
        --accent-lighter:   #FDBA74 !important;
        --accent-success:   #7DCEA0 !important;
        --btn-text:         #FFFFFF !important;
      }
    `;
  } else if (prefs.displayMode === 'high-contrast') {
    css += `
      html { color-scheme: dark; }
      body { background-color: var(--page-bg) !important; }
      :root {
        /* Light section tokens */
        --page-bg:          #000000 !important;
        --page-bg-alt:      #000000 !important;
        --page-bg-subtle:   #0A0A0A !important;
        --heading:          #FFFFFF !important;
        --body:             #FFFFFF !important;
        --body-secondary:   #E0E0E0 !important;
        --section-label:    #FFB347 !important;
        --link:             #FFB347 !important;
        --card-bg:          #0A0A0A !important;
        --card-border:      #FFFFFF !important;
        --card-bg-tinted:   #1A0A00 !important;
        --card-bg-warm:     #1A0A00 !important;
        --border:           #FFFFFF !important;
        --border-lighter:   #FFFFFF !important;
        /* Dark section tokens */
        --dark-bg:          #000000 !important;
        --dark-bg-alt:      #000000 !important;
        --dark-bg-deep:     #000000 !important;
        --dark-bg-footer:   #000000 !important;
        --dark-card-bg:     #0A0A0A !important;
        --dark-card-border: #FFFFFF !important;
        --dark-border:      #FFFFFF !important;
        /* Accent tokens */
        --accent:           #FFB347 !important;
        --accent-light:     #FFB347 !important;
        --accent-lighter:   #FDE68A !important;
        --accent-success:   #4ADE80 !important;
        --btn-text:         #000000 !important;
      }
    `;
  }

  // --- FONT SIZE ---
  // Strategy: Use CSS zoom on #main-content to scale ALL content
  // (including rem-based text) without affecting nav/footer/settings.
  // 
  // Why zoom instead of font-size?
  // - html { font-size: 125% } scales rem units globally → nav/footer reflow
  // - #main-content { font-size: 125% } doesn't affect rem units (rem = root only)
  // - #main-content { zoom: 1.25 } scales EVERYTHING visually, scoped to content
  //
  // zoom affects layout dimensions, so we compensate width to prevent
  // horizontal overflow. This fixes WCAG 2.2 SC 3.2.2 (On Input).
  if (prefs.fontSize === 'large' || prefs.fontSize === 'xl') {
    const zoomMain = prefs.fontSize === 'large' ? '1.125' : '1.25';
    const zoomDiag = prefs.fontSize === 'large' ? '1.15' : '1.3';
    const mozW = prefs.fontSize === 'large' ? '86.96%' : '76.92%';
    css += `
      #main-content {
        zoom: ${zoomMain} !important;
      }

      /* ============================================
         DIAGRAM SCALING — ${prefs.fontSize.toUpperCase()}
         Additional zoom on diagram wrappers on top of
         the main-content zoom for extra readability.
         ============================================ */
      .ada-diagram-wrap {
        zoom: ${zoomDiag} !important;
        -moz-transform: scale(${zoomDiag}) !important;
        -moz-transform-origin: top left !important;
      }
      @-moz-document url-prefix() {
        .ada-diagram-wrap {
          width: ${mozW} !important;
        }
      }
    `;
  }

  if (prefs.lineSpacing === 'relaxed') {
    css += `
      #main-content p, #main-content li, #main-content td, #main-content dd { line-height: 2 !important; }
      footer[role="contentinfo"] p, footer[role="contentinfo"] li,
      footer[role="contentinfo"] a, footer[role="contentinfo"] span { line-height: 2 !important; }
    `;
  } else if (prefs.lineSpacing === 'loose') {
    css += `
      #main-content p, #main-content li, #main-content td, #main-content dd { line-height: 2.5 !important; }
      footer[role="contentinfo"] p, footer[role="contentinfo"] li,
      footer[role="contentinfo"] a, footer[role="contentinfo"] span { line-height: 2.5 !important; }
    `;
  }


  // --- WARM/SEPIA MODE ---
  // - Hero + dark CTAs → deep espresso brown (keeps drama, not flat)
  // - Light sections alternate cream (#FBF6EF) / linen (#F5EDE0)
  // - Rich amber accent replaces cool terracotta
  // - Warm gold for interactive elements instead of bright orange
  // - Subtle paper texture feel through layered background tones
  if (prefs.displayMode === 'warm') {
    css += `
      body { background-color: var(--page-bg) !important; }
      :root {
        /* Light section tokens */
        --page-bg:          #FBF7F0 !important;
        --page-bg-alt:      #F5EDE0 !important;
        --page-bg-subtle:   #F0E8DA !important;
        --heading:          #3D2B1F !important;
        --body:             #5C4033 !important;
        --body-secondary:   #7A6455 !important;
        --section-label:    #8B3A1F !important;
        --link:             #7C2D12 !important;
        --card-bg:          #FFF8F0 !important;
        --card-border:      #D4C4A8 !important;
        --card-bg-tinted:   #FFF0E6 !important;
        --card-bg-warm:     #FFF3E0 !important;
        --border:           #D4C4A8 !important;
        --border-lighter:   #E8DCC8 !important;
        /* Dark section tokens */
        --dark-bg:          #231912 !important;
        --dark-bg-alt:      #1E150E !important;
        --dark-bg-deep:     #1A110A !important;
        --dark-bg-footer:   #1A110A !important;
        --dark-card-bg:     #2A1E14 !important;
        --dark-card-border: #3D2B1F !important;
        --dark-border:      #4A3728 !important;
        /* Accent tokens */
        --accent:           #C2410C !important;
        --accent-light:     #FB923C !important;
        --accent-lighter:   #FDBA74 !important;
        --accent-success:   #7DCEA0 !important;
        --btn-text:         #FFFFFF !important;
      }
      img:not([src*="logo"]) { filter: sepia(0.08) !important; }
    `;
  }


  // --- LOW VISION MODE ---
  // Design philosophy: Maximum legibility for macular degeneration, glaucoma, cataracts.
  // RNIB / UK accessibility standard: #FFD700 (gold) on #000000 (pure black) = 19.6:1 contrast.
  if (prefs.displayMode === 'low-vision') {
    css += `
      html { color-scheme: dark; }
      body { background-color: #000000 !important; }
      :root {
        --page-bg:          #000000 !important;
        --page-bg-alt:      #0A0A00 !important;
        --page-bg-subtle:   #000000 !important;
        --heading:          #FFD700 !important;
        --body:             #FFFFFF !important;
        --body-secondary:   #FFE566 !important;
        --section-label:    #FFD700 !important;
        --link:             #FFD700 !important;
        --card-bg:          #111100 !important;
        --card-border:      #FFD700 !important;
        --card-bg-tinted:   #111100 !important;
        --card-bg-warm:     #111100 !important;
        --border:           #FFD700 !important;
        --border-lighter:   #B8960C !important;
        --dark-bg:          #000000 !important;
        --dark-bg-alt:      #000000 !important;
        --dark-bg-deep:     #000000 !important;
        --dark-bg-footer:   #000000 !important;
        --dark-card-bg:     #111100 !important;
        --dark-card-border: #FFD700 !important;
        --dark-border:      #FFD700 !important;
        --accent:           #FFD700 !important;
        --accent-light:     #FFE566 !important;
        --accent-lighter:   #FFF3A3 !important;
        --accent-success:   #00FF88 !important;
        --btn-text:         #000000 !important;
      }
    `;
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
      * {
        font-family: 'Atkinson Hyperlegible', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      }
    `;
  } else if (prefs.fontFamily === 'opendyslexic') {
    if (!document.getElementById('opendyslexic-font-link')) {
      const link = document.createElement('link');
      link.id = 'opendyslexic-font-link';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.cdnfonts.com/css/opendyslexic';
      document.head.appendChild(link);
    }
    css += `
      * {
        font-family: 'OpenDyslexic', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      }
    `;
  } else if (prefs.fontFamily === 'lexie') {
    if (!document.getElementById('lexie-font-link')) {
      const link = document.createElement('link');
      link.id = 'lexie-font-link';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&display=swap';
      document.head.appendChild(link);
    }
    css += `
      * {
        font-family: 'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      }
    `;
  }

  // Write all CSS at once — replaces previous content entirely
  styleEl.textContent = css;

  // Force high-contrast class on body for JS-based overrides
  document.documentElement.setAttribute('data-reading-level', prefs.readingLevel || 'standard');
  if (prefs.displayMode === 'high-contrast') {
    document.body.classList.add('hc-mode');
    document.body.classList.remove('dark-mode', 'warm-mode', 'low-vision-mode');
  } else if (prefs.displayMode === 'dark') {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('hc-mode', 'warm-mode', 'low-vision-mode');
  } else if (prefs.displayMode === 'warm') {
    document.body.classList.add('warm-mode');
    document.body.classList.remove('hc-mode', 'dark-mode', 'low-vision-mode');
  } else if (prefs.displayMode === 'low-vision') {
    document.body.classList.add('low-vision-mode');
    document.body.classList.remove('hc-mode', 'dark-mode', 'warm-mode');
  } else {
    document.body.classList.remove('hc-mode', 'dark-mode', 'warm-mode', 'low-vision-mode');
  }
};

function SpacingIcon({ level, active, isMobile }) {
  const gap = level === 'default' ? 3 : level === 'relaxed' ? 5 : 7;
  const color = active ? '#1E293B' : isMobile ? '#CBD5E1' : '#64748B';
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" style={{ flexShrink: 0 }} className="ds-spacing-icon">
      <rect x="2" y={3} width="14" height="2" rx="1" className={active ? 'ds-line-active' : 'ds-line'} style={{ fill: color }} />
      <rect x="2" y={3 + 2 + gap} width="14" height="2" rx="1" className={active ? 'ds-line-active' : 'ds-line'} style={{ fill: color }} />
      <rect x="2" y={3 + 4 + gap * 2} width="10" height="2" rx="1" className={active ? 'ds-line-active' : 'ds-line'} style={{ fill: color }} />
    </svg>
  );
}

const FONT_OPTIONS = [
  { key: 'default', label: 'Default', desc: 'Standard site fonts', family: 'Georgia, serif' },
  { key: 'atkinson', label: 'Atkinson', desc: 'Designed for low vision', family: "'Atkinson Hyperlegible', sans-serif" },
  { key: 'opendyslexic', label: 'OpenDyslexic', desc: 'Designed for dyslexia', family: "'OpenDyslexic', sans-serif" },
  { key: 'lexie', label: 'Lexend', desc: 'Reduces reading fatigue', family: "'Lexend', sans-serif" },
];

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
  const accent = '#C2410C';
  const accentLight = '#FB923C';
  const accentFill = isMobile ? '#7C2D12' : '#C2410C';
  const borderColor = isMobile ? 'rgba(255,255,255,0.25)' : 'var(--slate-200, #E2E8F0)';
  const textPrimary = isMobile ? '#FFFFFF' : 'var(--slate-700, #334155)';
  const textSecondary = isMobile ? '#CBD5E1' : '#64748B';
  const textMuted = isMobile ? '#94A3B8' : '#64748B';
  const accentBg = isMobile ? 'rgba(251,146,60,0.15)' : '#FFF7ED';

  const labelStyle = {
    fontFamily: 'Manrope, sans-serif',
    fontSize: '0.7rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: isMobile ? '#E2E8F0' : textSecondary,
    margin: 0,
    padding: 0,
    border: 'none'
  };

  const content = (
    <>
      <div style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }} aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* ═══════ DISPLAY MODE ═══════ */}
      <fieldset style={{ border: 'none', margin: 0, padding: 0, marginBottom: '18px' }}>
        <legend style={labelStyle}>Display</legend>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '8px' }}>
          {[
            { key: 'default', label: 'Default' },
            { key: 'dark', label: 'Dark' },
            { key: 'warm', label: 'Warm' },
            { key: 'high-contrast', label: 'Contrast' },
            { key: 'low-vision', label: 'Low Vision' },
          ].map((m, i) => {
            const active = prefs.displayMode === m.key;
            const activeColor = m.key === 'low-vision' ? '#FFD700' : accentLight;
            const activeBg = m.key === 'low-vision' ? 'rgba(255,215,0,0.12)' : accentBg;
            return (
              <button
                key={m.key}
                ref={i === 0 ? firstFocusRef : undefined}
                type="button"
                aria-pressed={String(active)}
                onClick={() => updatePref('displayMode', m.key, `Display changed to ${m.label}`)}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '5px', padding: '10px 2px',
                  minHeight: '58px',
                  borderRadius: '10px',
                  border: active ? `2px solid ${activeColor}` : `1px solid ${borderColor}`,
                  background: active ? activeBg : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px' }}>
                  {m.key === 'default' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="4.5" fill={active ? '#FB923C' : '#CBD5E1'} />
                      <circle cx="10.8" cy="10.8" r="1.5" fill={active ? '#FDE68A' : '#F1F5F9'} opacity="0.7" />
                      {[0,45,90,135,180,225,270,315].map((angle, j) => {
                        const rad = angle * Math.PI / 180;
                        const x1 = 12 + 7.2 * Math.cos(rad), y1 = 12 + 7.2 * Math.sin(rad);
                        const x2 = 12 + 9.8 * Math.cos(rad), y2 = 12 + 9.8 * Math.sin(rad);
                        return <line key={j} x1={x1} y1={y1} x2={x2} y2={y2} stroke={active ? '#FB923C' : '#CBD5E1'} strokeWidth="2" strokeLinecap="round" />;
                      })}
                    </svg>
                  )}
                  {m.key === 'dark' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M15 3a9 9 0 1 0 5.2 15.5A7.5 7.5 0 0 1 15 3z" fill={active ? '#FDBA74' : '#CBD5E1'} />
                      <circle cx="17" cy="6.5" r="1.2" fill={active ? '#FDE68A' : '#E2E8F0'} opacity="0.8" />
                      <circle cx="20" cy="10" r="0.8" fill={active ? '#FDE68A' : '#E2E8F0'} opacity="0.6" />
                    </svg>
                  )}
                  {m.key === 'warm' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <ellipse cx="12" cy="20" rx="9" ry="2" fill={active ? '#92400E' : '#475569'} opacity="0.3" />
                      <rect x="10.5" y="13" width="3" height="6" rx="1.5" fill={active ? '#D97706' : '#94A3B8'} />
                      <ellipse cx="12" cy="8" rx="4" ry="6" fill={active ? '#FB923C' : '#CBD5E1'} opacity="0.7" />
                      <ellipse cx="12" cy="7" rx="2.5" ry="4.5" fill={active ? '#FDBA74' : '#E2E8F0'} opacity="0.9" />
                      <ellipse cx="12" cy="6.5" rx="1.2" ry="2.5" fill={active ? '#FDE68A' : '#F1F5F9'} />
                    </svg>
                  )}
                  {m.key === 'high-contrast' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9.5" stroke={active ? accentLight : '#CBD5E1'} strokeWidth="2" fill="none" />
                      <path d="M12 2.5a9.5 9.5 0 0 1 0 19z" fill={active ? accentLight : '#CBD5E1'} />
                    </svg>
                  )}
                  {m.key === 'low-vision' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <ellipse cx="12" cy="12" rx="9" ry="5.5" stroke={active ? '#FFD700' : '#CBD5E1'} strokeWidth="2" />
                      <circle cx="12" cy="12" r="3" fill={active ? '#FFD700' : '#CBD5E1'} />
                      <circle cx="12" cy="12" r="1.2" fill={active ? '#000000' : '#F1F5F9'} />
                      <line x1="12" y1="2" x2="12" y2="4" stroke={active ? '#FFD700' : '#CBD5E1'} strokeWidth="2" strokeLinecap="round" />
                      <line x1="12" y1="20" x2="12" y2="22" stroke={active ? '#FFD700' : '#CBD5E1'} strokeWidth="2" strokeLinecap="round" />
                      <line x1="2" y1="12" x2="4" y2="12" stroke={active ? '#FFD700' : '#CBD5E1'} strokeWidth="2" strokeLinecap="round" />
                      <line x1="20" y1="12" x2="22" y2="12" stroke={active ? '#FFD700' : '#CBD5E1'} strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  )}
                </span>
                <span style={{
                  fontSize: '0.7rem', fontWeight: active ? 700 : 600,
                  color: active ? activeColor : textPrimary,
                  fontFamily: 'Manrope, sans-serif', lineHeight: 1.2,
                }}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* ═══════ FONT FAMILY — 2x2 grid ═══════ */}
      <fieldset style={{ border: 'none', margin: 0, padding: 0, marginBottom: '18px' }}>
        <legend style={labelStyle}>Font</legend>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px' }}>
          {FONT_OPTIONS.map(f => {
            const active = prefs.fontFamily === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={String(active)}
                onClick={() => updatePref('fontFamily', f.key, `Font changed to ${f.label} — ${f.desc}`)}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '2px', padding: '10px 6px',
                  minHeight: '64px',
                  borderRadius: '10px',
                  border: active ? `2px solid ${accentLight}` : `1px solid ${borderColor}`,
                  background: active ? accentBg : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <span style={{
                  fontFamily: f.family,
                  fontSize: '1.15rem', fontWeight: 700,
                  color: active ? accentLight : textPrimary,
                  lineHeight: 1.2,
                }}>
                  Aa
                </span>
                <span style={{
                  fontSize: '0.72rem', fontWeight: active ? 700 : 600,
                  color: active ? accentLight : textPrimary,
                  fontFamily: 'Manrope, sans-serif', lineHeight: 1.2,
                }}>
                  {f.label}
                </span>
                <span style={{
                  fontSize: '0.62rem', fontWeight: 500,
                  color: active ? '#FDBA74' : textSecondary,
                  fontFamily: 'Manrope, sans-serif', lineHeight: 1.3,
                }}>
                  {f.desc}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* ═══════ SIZE + SPACING — side by side ═══════ */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
        {/* Text Size */}
        <fieldset style={{ flex: 1, border: 'none', margin: 0, padding: 0 }}>
          <legend style={labelStyle}>Size</legend>
          <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
            {[
              { key: 'default', sz: '0.8rem', ariaLabel: 'Default text size' },
              { key: 'large', sz: '1rem', ariaLabel: 'Large text size' },
              { key: 'xl', sz: '1.2rem', ariaLabel: 'Extra large text size' },
            ].map(s => {
              const active = prefs.fontSize === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={String(active)}
                  aria-label={s.ariaLabel}
                  onClick={() => updatePref('fontSize', s.key, s.ariaLabel)}
                  style={{
                    flex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '6px 4px',
                    minHeight: '44px',
                    borderRadius: '8px',
                    border: active ? `2px solid ${accentLight}` : `1px solid ${borderColor}`,
                    background: active ? accentFill : 'transparent',
                    color: active ? 'white' : textPrimary,
                    fontSize: s.sz, fontWeight: 700,
                    fontFamily: 'Manrope, sans-serif',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  A
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Line Spacing */}
        <fieldset style={{ flex: 1, border: 'none', margin: 0, padding: 0 }}>
          <legend style={labelStyle}>Spacing</legend>
          <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
            {[
              { key: 'default', ariaLabel: 'Default line spacing' },
              { key: 'relaxed', ariaLabel: 'Relaxed line spacing' },
              { key: 'loose', ariaLabel: 'Loose line spacing' },
            ].map(s => {
              const active = prefs.lineSpacing === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={String(active)}
                  aria-label={s.ariaLabel}
                  onClick={() => updatePref('lineSpacing', s.key, s.ariaLabel)}
                  style={{
                    flex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '6px 4px',
                    minHeight: '44px',
                    borderRadius: '8px',
                    border: active ? `2px solid ${accentLight}` : `1px solid ${borderColor}`,
                    background: active ? accentFill : 'transparent',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <SpacingIcon level={s.key} active={active} isMobile={isMobile} />
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* ═══════ READING LEVEL ═══════ */}
      <fieldset style={{ border: 'none', margin: 0, padding: 0, marginBottom: '16px' }}>
        <legend style={labelStyle}>ADA Guide Reading Level</legend>
        <p style={{ fontSize: '0.65rem', color: textSecondary, margin: '2px 0 8px', lineHeight: 1.4 }}>Controls how content is written in the ADA Standards Guide</p>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { key: 'simple', label: 'Simple', announce: 'Reading level changed to simple — plain language summaries' },
            { key: 'standard', label: 'Standard', announce: 'Reading level changed to standard' },
            { key: 'professional', label: 'Legal', announce: 'Reading level changed to professional — includes legal citations' },
          ].map(r => {
            const active = prefs.readingLevel === r.key;
            return (
              <button
                key={r.key}
                type="button"
                aria-pressed={String(active)}
                onClick={() => updatePref('readingLevel', r.key, r.announce)}
                style={{
                  flex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '8px 4px',
                  minHeight: '44px',
                  borderRadius: '8px',
                  border: active ? `2px solid ${accentLight}` : `1px solid ${borderColor}`,
                  background: active ? accentFill : 'transparent',
                  color: active ? 'white' : textPrimary,
                  fontSize: '0.75rem', fontWeight: 600,
                  fontFamily: 'Manrope, sans-serif',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* ═══════ RESET ═══════ */}
      <button
        type="button"
        onClick={resetAll}
        aria-label="Reset all display preferences to defaults"
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '6px', padding: '8px',
          minHeight: '44px',
          borderRadius: '8px',
          border: `1px solid ${borderColor}`,
          background: 'transparent',
          color: textSecondary,
          fontSize: '0.75rem', fontWeight: 600,
          fontFamily: 'Manrope, sans-serif',
          cursor: 'pointer',
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
          fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          color: '#FB923C', margin: '0 0 12px'
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
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        padding: '20px',
        zIndex: 1000
      }}
    >
      {content}
    </div>
  );
}