import React, { useState, useEffect } from 'react';

/**
 * BrandIcons — Bold Glyph icon system for ADA Legal Link
 * 
 * Each icon renders as an SVG inside a dark rounded container.
 * Colors adapt per display mode for WCAG 2.2 AAA compliance.
 * 
 * Container colors by mode:
 *   Default:  #1E293B bg, white stroke, #F97316 accent (5.22:1)
 *   Dark:     #000000 bg + #475569 border, white stroke, #FFB347 accent (11.79:1)
 *   Warm:     #3D3128 bg, #F5EDE0 stroke, #F97316 accent (4.49:1)
 *   Contrast: #000000 bg + white border, white stroke, #FFB347 accent (11.79:1)
 * 
 * Usage:
 *   <BrandIcon name="diagrams" size={48} />
 *   <BrandIcon name="privacy" size={40} variant="dark-bg" />
 */

// Detect display mode from body class
function getDisplayMode() {
  if (typeof document === 'undefined') return 'default';
  const body = document.body;
  if (body.classList.contains('display-high-contrast')) return 'contrast';
  if (body.classList.contains('display-dark')) return 'dark';
  if (body.classList.contains('display-warm')) return 'warm';
  return 'default';
}

// Hook that re-renders when body class changes (display mode switch)
function useDisplayMode() {
  const [mode, setMode] = useState(getDisplayMode);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setMode(getDisplayMode());
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return mode;
}

const MODE_COLORS = {
  default: {
    containerBg: '#1E293B',
    containerBorder: 'none',
    stroke: '#FFFFFF',
    accent: '#F97316',
  },
  dark: {
    containerBg: '#000000',
    containerBorder: '1px solid #475569',
    stroke: '#FFFFFF',
    accent: '#FFB347',
  },
  warm: {
    containerBg: '#3D3128',
    containerBorder: 'none',
    stroke: '#F5EDE0',
    accent: '#F97316',
  },
  contrast: {
    containerBg: '#000000',
    containerBorder: '2px solid #FFFFFF',
    stroke: '#FFFFFF',
    accent: '#FFB347',
  },
};

// For icons on already-dark backgrounds (CommitmentSection),
// we use a subtle tinted bg instead of the full dark container
const DARK_BG_COLORS = {
  default: {
    containerBg: 'rgba(249,115,22,0.12)',
    containerBorder: 'none',
    stroke: '#FFFFFF',
    accent: '#FB923C',
  },
  dark: {
    containerBg: 'rgba(255,179,71,0.12)',
    containerBorder: 'none',
    stroke: '#FFFFFF',
    accent: '#FFB347',
  },
  warm: {
    containerBg: 'rgba(249,115,22,0.12)',
    containerBorder: 'none',
    stroke: '#F5EDE0',
    accent: '#F97316',
  },
  contrast: {
    containerBg: 'rgba(255,179,71,0.15)',
    containerBorder: '1px solid #FFB347',
    stroke: '#FFFFFF',
    accent: '#FFB347',
  },
};

// SVG icon definitions — 26x26 viewBox
const ICON_PATHS = {
  // StoriesSection icons
  diagrams: (s, a) => (
    <>
      <rect x="3" y="3" width="20" height="20" rx="2" stroke={s} strokeWidth="1.5" fill="none" />
      <line x1="3" y1="10" x2="23" y2="10" stroke={s} strokeWidth="1.5" />
      <line x1="10" y1="10" x2="10" y2="23" stroke={s} strokeWidth="1.5" />
      <circle cx="16.5" cy="16.5" r="3.5" fill={a} />
      <circle cx="6.5" cy="6.5" r="1.5" fill={a} />
    </>
  ),
  search: (s, a) => (
    <>
      <circle cx="11" cy="11" r="6.5" stroke={s} strokeWidth="1.5" fill="none" />
      <line x1="16" y1="16" x2="22" y2="22" stroke={a} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  legalOptions: (s, a) => (
    <>
      <line x1="13" y1="2" x2="13" y2="8" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5" y1="8" x2="21" y2="8" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 8L3 14" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M21 8L23 14" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 14 Q6.5 19 10 14Z" fill={a} />
      <path d="M16 14 Q19.5 19 23 14Z" fill={a} />
      <line x1="13" y1="8" x2="13" y2="23" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="23" x2="17" y2="23" stroke={s} strokeWidth="2" strokeLinecap="round" />
    </>
  ),

  // KnowYourRightsSection icons
  titleIII: (s, a) => (
    <>
      <rect x="4" y="7" width="18" height="14" rx="2" stroke={s} strokeWidth="1.5" fill="none" />
      <path d="M8 7V5a5 5 0 0 1 10 0v2" stroke={s} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <rect x="8" y="11" width="10" height="2" rx="1" fill={a} />
      <rect x="8" y="15" width="6" height="2" rx="1" fill={a} opacity="0.6" />
    </>
  ),
  titleII: (s, a) => (
    <>
      <path d="M13 3L3 9v1.5h20V9L13 3z" fill={a} stroke={s} strokeWidth="1" />
      <rect x="5" y="11" width="2.5" height="8" rx="0.5" fill={s} />
      <rect x="11.75" y="11" width="2.5" height="8" rx="0.5" fill={s} />
      <rect x="18.5" y="11" width="2.5" height="8" rx="0.5" fill={s} />
      <rect x="2" y="19" width="22" height="3" rx="1" stroke={s} strokeWidth="1.5" fill="none" />
    </>
  ),
  titleI: (s, a) => (
    <>
      <rect x="5" y="3" width="16" height="20" rx="2" stroke={s} strokeWidth="1.5" fill="none" />
      <circle cx="13" cy="9" r="3" fill={a} />
      <path d="M8 18c0-2.8 2.2-5 5-5s5 2.2 5 5" fill={a} opacity="0.6" stroke={s} strokeWidth="1" />
    </>
  ),

  // KYR filing icons (smaller, 20x20 viewBox)
  filing: (s, a) => (
    <>
      <line x1="10" y1="2" x2="10" y2="6" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4" y1="6" x2="16" y2="6" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 6L2.5 10" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 6L17.5 10" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2.5 10 Q5 13.5 7.5 10Z" fill={a} />
      <path d="M12.5 10 Q15 13.5 17.5 10Z" fill={a} />
      <line x1="10" y1="6" x2="10" y2="18" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="18" x2="13" y2="18" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  clipboard: (s, a) => (
    <>
      <rect x="3" y="4" width="14" height="16" rx="2" stroke={s} strokeWidth="1.5" fill="none" />
      <rect x="6" y="2" width="8" height="3" rx="1" stroke={s} strokeWidth="1" fill={a} opacity="0.4" />
      <line x1="6" y1="10" x2="14" y2="10" stroke={a} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="13.5" x2="11" y2="13.5" stroke={a} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </>
  ),
  clock: (s, a) => (
    <>
      <circle cx="10" cy="10" r="8" stroke={s} strokeWidth="1.5" fill="none" />
      <line x1="10" y1="5" x2="10" y2="10" stroke={a} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="10" x2="14" y2="13" stroke={a} strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),

  // CommunityVoices icons
  heart: (s, a) => (
    <>
      <path d="M13 21.35l-1.45-1.32C6.11 15.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 4.42 22 7.5c0 3.78-4.11 7.86-9.55 12.54L13 21.35z" fill={a} stroke={s} strokeWidth="1" />
    </>
  ),

  // CommitmentSection icons
  accessible: (s, a) => (
    <>
      <circle cx="13" cy="13" r="10" stroke={s} strokeWidth="1.5" fill="none" />
      <circle cx="13" cy="7" r="2.5" fill={a} />
      <path d="M13 10v4" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9 13h8" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 22l3-8 3 8" stroke={a} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  privacy: (s, a) => (
    <>
      <rect x="4" y="11" width="18" height="12" rx="2" stroke={s} strokeWidth="1.5" fill="none" />
      <path d="M8 11V7a5 5 0 0 1 10 0v4" stroke={s} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="13" cy="17" r="2.5" fill={a} />
      <line x1="13" y1="19.5" x2="13" y2="21" stroke={a} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  vetted: (s, a) => (
    <>
      <path d="M13 3l9 4.5v6.5c0 5.5-4 9-9 10.5-5-1.5-9-5-9-10.5V7.5L13 3z" stroke={s} strokeWidth="1.5" fill="none" />
      <path d="M9 14l3 3 5.5-6.5" stroke={a} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  free: (s, a) => (
    <>
      <circle cx="13" cy="13" r="10" stroke={s} strokeWidth="1.5" fill="none" />
      <text x="13" y="18" textAnchor="middle" fill={a} fontSize="14" fontWeight="800" fontFamily="Manrope, sans-serif">$0</text>
    </>
  ),
  transparent: (s, a) => (
    <>
      <rect x="3" y="5" width="20" height="16" rx="2" stroke={s} strokeWidth="1.5" fill="none" />
      <line x1="3" y1="10" x2="23" y2="10" stroke={s} strokeWidth="1.5" />
      <rect x="6" y="13" width="5" height="4" rx="1" fill={a} />
      <rect x="6" y="19" width="11" height="1" rx="0.5" fill={a} opacity="0.5" />
      <rect x="14" y="13" width="6" height="1" rx="0.5" fill={s} opacity="0.4" />
      <rect x="14" y="16" width="4" height="1" rx="0.5" fill={s} opacity="0.4" />
    </>
  ),
  exclusive: (s, a) => (
    <>
      <circle cx="9" cy="10" r="4.5" stroke={s} strokeWidth="1.5" fill="none" />
      <circle cx="17" cy="10" r="4.5" stroke={s} strokeWidth="1.5" fill="none" />
      <line x1="13" y1="6" x2="13" y2="14" stroke={a} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="6" y1="20" x2="20" y2="20" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 3" />
      <text x="13" y="24.5" textAnchor="middle" fill={a} fontSize="7" fontWeight="700" fontFamily="Manrope, sans-serif">1:1</text>
    </>
  ),
};

/**
 * BrandIcon component
 * @param {string} name - Icon name (see ICON_PATHS keys)
 * @param {number} size - Container size in px (default 48)
 * @param {string} variant - 'default' | 'dark-bg' (for icons on dark backgrounds)
 * @param {number} borderRadius - Container border radius factor (default 0.25)
 * @param {number} viewBox - SVG viewBox size (default 26)
 */
export default function BrandIcon({ name, size = 48, variant = 'default', borderRadius, viewBox = 26 }) {
  const mode = useDisplayMode();
  const colors = variant === 'dark-bg' ? DARK_BG_COLORS[mode] : MODE_COLORS[mode];
  const iconFn = ICON_PATHS[name];
  if (!iconFn) return null;

  const svgSize = Math.round(size * 0.52);
  const radius = borderRadius !== undefined ? borderRadius : Math.round(size * 0.25);

  return (
    <div
      aria-hidden="true"
      className="brand-icon"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: colors.containerBg,
        border: colors.containerBorder,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {iconFn(colors.stroke, colors.accent)}
      </svg>
    </div>
  );
}

// Re-export for convenience
export { ICON_PATHS, MODE_COLORS, DARK_BG_COLORS, getDisplayMode };
