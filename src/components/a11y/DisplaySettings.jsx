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

      /* === Community Voices — already dark, exempt from blanket === */
      #main-content .cv-dark-section,
      #main-content .cv-dark-section div,
      #main-content .cv-dark-section p,
      #main-content .cv-dark-section span {
        background-color: #0B1120 !important;
        background-image: unset !important;
      }
      #main-content .cv-dark-section [role="img"] {
        background-color: rgba(255,255,255,0.015) !important;
      }
                  #main-content .cv-dark-section [role="listitem"] {
        background-color: transparent !important;
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
      /* Protect settings panel buttons from blanket overrides */
      [role="dialog"][aria-label="Display preferences"] button {
        background-color: transparent !important;
        border-color: #334155 !important;
        color: #E2E8F0 !important;
      }
      [role="dialog"][aria-label="Display preferences"] button span {
        color: inherit !important;
      }
      [role="dialog"][aria-label="Display preferences"] button .ds-line {
        fill: #94A3B8 !important;
      }
      [role="dialog"][aria-label="Display preferences"] button[aria-pressed="true"] {
        border-color: #C2410C !important;
        background-color: #3C1810 !important;
        color: #C2410C !important;
      }
      [role="dialog"][aria-label="Display preferences"] button[aria-pressed="true"] span {
        color: #C2410C !important;
      }
      [role="dialog"][aria-label="Display preferences"] button[aria-pressed="true"] .ds-line-active {
        fill: white !important;
      }

      /* ============================================
         DARK MODE — ACCENT COLORS & BUTTONS
         Restore brand terracotta and orange accents
         to avoid flat gray-on-gray monotone.
         ============================================ */

      /* --- Eyebrow labels (uppercase section headers) --- */
      #main-content p[style*="letterSpacing"][style*="uppercase"],
      #main-content p[style*="letter-spacing"][style*="uppercase"],
      #main-content p[style*="textTransform"][style*="uppercase"] {
        color: #FB923C !important;
      }

      /* --- Hero accent line "Then enforce them." --- */
      #main-content h1 span[style*="color: #EA580C"],
      #main-content h1 span[style*="EA580C"],
      #main-content h2 span[style*="color: #EA580C"],
      #main-content h2 span[style*="EA580C"] {
        color: #D4572A !important;
      }

      /* --- Stat numbers in hero box (42, 52, 10, 60+) --- */
      #main-content p[style*="Fraunces"][style*="fontWeight: 800"],
      #main-content p[style*="Fraunces, serif"][style*="font-weight: 800"] {
        color: #FFFFFF !important;
      }

      /* --- Terracotta-colored text accents (step times, tag labels, etc.) --- */
      #main-content span[style*="color: #C2410C"],
      #main-content span[style*="color: var(--terra"],
      #main-content p[style*="color: #C45D3E"],
      #main-content p[style*="color: #C2410C"] {
        color: #FB923C !important;
      }

      /* --- Links — ensure distinct from body text --- */
      #main-content a {
        color: #FB923C !important;
        text-decoration: underline !important;
      }
      #main-content a:hover {
        color: #FFFFFF !important;
      }

      /* --- Primary CTA buttons (terracotta bg) — including <a> styled as buttons --- */
      a.landing-btn-primary,
      #main-content a.landing-btn-primary,
      #main-content a[style*="background: #C2410C"],
      #main-content a[style*="background: #C45D3E"],
      #main-content a[style*="background: '#C2410C'"],
      #main-content a[style*="background: '#C45D3E'"] {
        background-color: #C2410C !important;
        color: #FFFFFF !important;
        border: 1px solid #C2410C !important;
        text-decoration: none !important;
      }
      a.landing-btn-primary:hover,
      #main-content a.landing-btn-primary:hover,
      #main-content a[style*="background: #C2410C"]:hover,
      #main-content a[style*="background: #C45D3E"]:hover,
      #main-content a[style*="background: '#C2410C'"]:hover,
      #main-content a[style*="background: '#C45D3E'"]:hover {
        background-color: #D4572A !important;
        color: #FFFFFF !important;
        text-decoration: none !important;
      }

      /* --- Secondary / ghost buttons (outline style) --- */
      a.landing-btn-secondary,
      #main-content a.landing-btn-secondary {
        background-color: transparent !important;
        color: #CBD5E1 !important;
        border: 1px solid #94A3B8 !important;
        text-decoration: none !important;
      }
      a.landing-btn-secondary:hover,
      #main-content a.landing-btn-secondary:hover {
        border-color: #FFFFFF !important;
        color: #FFFFFF !important;
        background-color: rgba(255,255,255,0.05) !important;
        text-decoration: none !important;
      }

      /* --- Attorney CTA (outline terracotta) --- */
      #main-content a.landing-btn-attorney,
      a.landing-btn-attorney {
        background-color: transparent !important;
        color: #FB923C !important;
        border: 2px solid #FB923C !important;
        text-decoration: none !important;
      }
      #main-content a.landing-btn-attorney:hover,
      a.landing-btn-attorney:hover {
        background-color: rgba(251,146,60,0.1) !important;
        color: #FFFFFF !important;
        border-color: #FFFFFF !important;
        text-decoration: none !important;
      }

      /* --- Generic outline/ghost buttons --- */
      #main-content button[style*="background: transparent"],
      #main-content button[style*="background: none"],
      #main-content a[style*="background: transparent"][style*="border"],
      #main-content a[style*="border: 1px solid #475569"],
      #main-content a[style*="border: 2px solid #C2410C"] {
        border-color: #94A3B8 !important;
        color: #CBD5E1 !important;
        text-decoration: none !important;
      }
      #main-content button[style*="background: transparent"]:hover,
      #main-content button[style*="background: none"]:hover,
      #main-content a[style*="background: transparent"][style*="border"]:hover,
      #main-content a[style*="border: 1px solid #475569"]:hover,
      #main-content a[style*="border: 2px solid #C2410C"]:hover {
        border-color: #FFFFFF !important;
        color: #FFFFFF !important;
        background-color: rgba(255,255,255,0.05) !important;
      }

      /* --- All buttons: minimum visible border --- */
      #main-content button {
        border: 1px solid #4A5568 !important;
      }
      #main-content button:hover {
        border-color: #94A3B8 !important;
      }
      /* Preserve terracotta CTA button styling */
      #main-content button[style*="C2410C"],
      #main-content button[style*="background: var(--terra"] {
        background-color: #C2410C !important;
        color: #FFFFFF !important;
        border: 1px solid #C2410C !important;
      }
      #main-content button[style*="C2410C"]:hover,
      #main-content button[style*="background: var(--terra"]:hover {
        background-color: #D4572A !important;
      }

      /* --- Guide page CTA bar (Report a Violation below diagrams) --- */
      #main-content div[role="region"][aria-label*="violation"] a,
      #main-content div[style*="background: #1A1F2B"] a[style*="C2410C"],
      #main-content div[style*="background: '#1A1F2B'"] a[style*="C2410C"] {
        background-color: #C2410C !important;
        color: #FFFFFF !important;
        border: 1px solid #C2410C !important;
        text-decoration: none !important;
      }
      #main-content div[role="region"][aria-label*="violation"] a:hover {
        background-color: #D4572A !important;
      }

      /* --- Orange left-accent bars on cards — keep terracotta --- */
      #main-content [style*="border-left: 3px solid #C2410C"],
      #main-content [style*="borderLeft"][style*="C2410C"] {
        border-left-color: #C2410C !important;
      }

      /* --- Card accent top bars --- */
      #main-content div[style*="height: 4px"][style*="background"] {
        background-color: unset !important;
      }

      /* --- Section code badges (§406, §407) --- */
      #main-content span[style*="borderRadius"][style*="padding: 2px 8px"] {
        color: #CBD5E1 !important;
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

      /* === Chapter number badges — dark mode === */
      #main-content .chapter-num {
        background-color: #1E293B !important;
        border-color: #475569 !important;
        color: #FFB347 !important;
      }
      #main-content .chapter-link {
        background-color: #151A24 !important;
        border-color: #2A3344 !important;
      }

      /* === Global footer (non-landing, already dark) === */
      footer[role="contentinfo"],
      footer[role="contentinfo"] div,
      footer[role="contentinfo"] p,
      footer[role="contentinfo"] span,
      footer[role="contentinfo"] a {
        background-color: #0F1219 !important;
      }

      /* ============================================
         SVG DIAGRAMS — DARK MODE
         All 42 interactive diagrams use inline SVG
         with light fills. Override via CSS.
         ============================================ */

      /* SVG background rects (the big #FAFAF9 / white fills) */
      #main-content svg[role="img"] rect[fill="#FAFAF9"],
      #main-content svg[role="img"] rect[fill="#fafaf9"],
      #main-content svg[role="img"] rect[fill="white"],
      #main-content svg[role="img"] rect[fill="#FFFFFF"],
      #main-content svg[role="img"] rect[fill="#ffffff"] {
        fill: #1E293B !important;
      }

      /* Landing / floor / structural rects (light grays) */
      #main-content svg[role="img"] rect[fill="#E2E8F0"],
      #main-content svg[role="img"] rect[fill="#e2e8f0"] {
        fill: #2D3748 !important;
        stroke: #4A5568 !important;
      }
      #main-content svg[role="img"] rect[fill="#E7E5E4"],
      #main-content svg[role="img"] rect[fill="#e7e5e4"],
      #main-content svg[role="img"] rect[fill="#D6D3D1"],
      #main-content svg[role="img"] rect[fill="#d6d3d1"] {
        fill: #374151 !important;
        stroke: #4A5568 !important;
      }
      #main-content svg[role="img"] rect[fill="#F1F5F9"],
      #main-content svg[role="img"] rect[fill="#f1f5f9"],
      #main-content svg[role="img"] rect[fill="#F8FAFC"],
      #main-content svg[role="img"] rect[fill="#f8fafc"] {
        fill: #2D3748 !important;
      }

      /* Ramp / polygon fills */
      #main-content svg[role="img"] polygon[fill="#F1F5F9"],
      #main-content svg[role="img"] polygon[fill="#f1f5f9"] {
        fill: #2D3748 !important;
        stroke: #4A5568 !important;
      }

      /* Light-filled area rects (parking spaces etc) */
      #main-content svg[role="img"] rect[fill="#FEF2F2"],
      #main-content svg[role="img"] rect[fill="#F0FDF4"],
      #main-content svg[role="img"] rect[fill="#DBEAFE"],
      #main-content svg[role="img"] rect[fill="#FFFBF7"] {
        fill: #1E293B !important;
      }

      /* Dashed / structural lines */
      #main-content svg[role="img"] line[stroke="#CBD5E1"],
      #main-content svg[role="img"] line[stroke="#cbd5e1"],
      #main-content svg[role="img"] line[stroke="#E2E8F0"],
      #main-content svg[role="img"] line[stroke="#e2e8f0"] {
        stroke: #4A5568 !important;
      }

      /* Text labels in SVG */
      #main-content svg[role="img"] text[fill="#64748B"],
      #main-content svg[role="img"] text[fill="#94A3B8"],
      #main-content svg[role="img"] text[fill="#78716C"],
      #main-content svg[role="img"] text[fill="#57534E"],
      #main-content svg[role="img"] text[fill="#CBD5E1"],
      #main-content svg[role="img"] text[fill="#cbd5e1"] {
        fill: #94A3B8 !important;
      }

      /* Panel inset lines */
      #main-content svg[role="img"] rect[stroke="#CBD5E1"],
      #main-content svg[role="img"] rect[stroke="#cbd5e1"],
      #main-content svg[role="img"] rect[stroke="#A8A29E"],
      #main-content svg[role="img"] rect[stroke="#D6D3D1"],
      #main-content svg[role="img"] rect[stroke="#94A3B8"] {
        stroke: #4A5568 !important;
      }

      /* Inactive callout circles (white fill) */
      #main-content svg[role="img"] g[role="button"] circle[fill="white"] {
        fill: #1E293B !important;
      }

      /* Callout number text — lighten dark colors for dark backgrounds */
      #main-content svg[role="img"] g[role="button"] text[fill="#8B2E08"] { fill: #FB923C !important; }
      #main-content svg[role="img"] g[role="button"] text[fill="#14532D"] { fill: #4ADE80 !important; }
      #main-content svg[role="img"] g[role="button"] text[fill="#1E3A8A"] { fill: #60A5FA !important; }
      #main-content svg[role="img"] g[role="button"] text[fill="#5B21B6"] { fill: #A78BFA !important; }
      #main-content svg[role="img"] g[role="button"] text[fill="#78350F"] { fill: #FBBF24 !important; }
      #main-content svg[role="img"] g[role="button"] text[fill="#0C4A6E"] { fill: #38BDF8 !important; }
      #main-content svg[role="img"] g[role="button"] text[fill="#9D174D"] { fill: #F472B6 !important; }

      /* Also fix general dark text labels in diagrams */
      #main-content svg[role="img"] text[fill="#374151"],
      #main-content svg[role="img"] text[fill="#4B5563"] {
        fill: #94A3B8 !important;
      }

      /* Wall fills */
      #main-content svg[role="img"] rect[fill="#475569"] {
        fill: #64748B !important;
      }

      /* Door panel */
      #main-content svg[role="img"] rect[fill="#F8FAFC"] {
        fill: #2D3748 !important;
      }

      /* Diagram container div — override the blanket rule */
      #main-content svg[role="img"] {
        background-color: transparent !important;
      }

      /* === Pathway radio cards — dark mode === */
      #main-content [role="radio"] {
        background-color: #1E293B !important;
        border-color: #475569 !important;
      }
      #main-content [role="radio"][aria-checked="true"] {
        background-color: #2D1B0E !important;
        border-color: #C2410C !important;
      }

      /* === Feedback modal — dark mode === */
      .fb-panel {
        background-color: #1E293B !important;
        border: 1px solid #475569 !important;
      }
      .fb-submit-btn {
        background-color: #C2410C !important;
        border: none !important;
      }
      .fb-done-btn {
        background-color: #334155 !important;
        border: none !important;
      }
      .fb-success-icon-wrap {
        background-color: #064E3B !important;
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

      /* === Landing hero — force pure black === */
      .landing-hero-section,
      .landing-hero-section > div,
      .landing-hero-section div {
        background: #000000 !important;
        background-image: none !important;
        background-color: #000000 !important;
      }

      /* === All sections with dark navy inline bg === */
      section[style*="#1E293B"],
      div[style*="#1E293B"],
      [style*="background: #1E293B"],
      [style*="background: '#1E293B'"],
      [style*="background-color: #1E293B"] {
        background: #000000 !important;
        background-color: #000000 !important;
        background-image: none !important;
      }

      /* === Dark navy variants (slate-900, #1A1F2B, #0F172A) === */
      section[style*="#1A1F2B"],
      div[style*="#1A1F2B"],
      [style*="background: #1A1F2B"],
      [style*="background: '#1A1F2B'"],
      section[style*="#0F172A"],
      div[style*="#0F172A"],
      [style*="background: '#0F172A'"],
      section[style*="var(--slate-900)"],
      div[style*="var(--slate-900)"] {
        background: #000000 !important;
        background-color: #000000 !important;
        background-image: none !important;
      }

      /* === Remove all gradient overlays in high contrast === */
      div[style*="radial-gradient"],
      div[style*="linear-gradient"] {
        background: transparent !important;
        background-image: none !important;
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
      #main-content canvas,
      #main-content .brand-icon {
        background-color: unset !important;
        background-image: unset !important;
      }

      /* === Community Voices — already dark, exempt from blanket override === */
      #main-content .cv-dark-section,
      #main-content .cv-dark-section div,
      #main-content .cv-dark-section p,
      #main-content .cv-dark-section span {
        background-color: #0B1120 !important;
        background-image: unset !important;
        border-color: unset !important;
      }
      #main-content .cv-dark-section [role="img"] {
        background-color: rgba(255,255,255,0.015) !important;
        border-color: rgba(255,255,255,0.05) !important;
      }
                  #main-content .cv-dark-section [role="listitem"] {
        background-color: transparent !important;
        border-color: unset !important;
      }
      #main-content .cv-dark-section h2 { color: #FFFFFF !important; }
      #main-content .cv-dark-section p { color: #D0D0D0 !important; }
      #main-content .cv-dark-section span { color: #E0E0E0 !important; }
      #main-content .cv-dark-section button {
        background-color: rgba(255,255,255,0.04) !important;
        border-color: rgba(255,255,255,0.15) !important;
      }
      #main-content .cv-dark-section button span { color: #F0F0F0 !important; }

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

      /* === Ghost / outline buttons & link-buttons — HIGH CONTRAST === */
      #main-content a.landing-btn-primary,
      a.landing-btn-primary {
        background-color: #D4572A !important;
        color: #FFFFFF !important;
        border: 2px solid #FFFFFF !important;
      }
      #main-content a.landing-btn-primary:hover,
      a.landing-btn-primary:hover {
        background-color: #FFFFFF !important;
        color: #000000 !important;
        text-decoration: none !important;
      }

      #main-content a.landing-btn-secondary,
      a.landing-btn-secondary {
        background-color: transparent !important;
        color: #FFFFFF !important;
        border: 2px solid #FFFFFF !important;
      }
      #main-content a.landing-btn-secondary:hover,
      a.landing-btn-secondary:hover {
        background-color: #FFFFFF !important;
        color: #000000 !important;
        text-decoration: none !important;
      }

      /* Generic outline/ghost buttons */
      #main-content button[style*="background: transparent"],
      #main-content button[style*="background: none"],
      #main-content a[style*="background: transparent"],
      #main-content a[style*="border: 1px solid"] {
        border: 2px solid #FFFFFF !important;
        color: #FFFFFF !important;
      }
      #main-content button[style*="background: transparent"]:hover,
      #main-content button[style*="background: none"]:hover,
      #main-content a[style*="background: transparent"]:hover,
      #main-content a[style*="border: 1px solid"]:hover {
        background-color: #FFFFFF !important;
        color: #000000 !important;
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
      [role="dialog"][aria-label="Display preferences"] button[aria-pressed="true"] span {
        color: #FFFFFF !important;
      }
      [role="dialog"][aria-label="Display preferences"] button[aria-pressed="true"] .ds-line-active {
        fill: #FFFFFF !important;
      }
      [role="dialog"][aria-label="Display preferences"] button[aria-pressed="false"] {
        background-color: #1A1A1A !important;
        border: 2px solid #FFFFFF !important;
        color: #FFFFFF !important;
      }
      [role="dialog"][aria-label="Display preferences"] button[aria-pressed="false"] span {
        color: #FFFFFF !important;
      }
      [role="dialog"][aria-label="Display preferences"] button[aria-pressed="false"] .ds-line {
        fill: #D0D0D0 !important;
      }

      /* === Scrollbar high contrast === */
      ::-webkit-scrollbar {
        background: #000000;
      }
      ::-webkit-scrollbar-thumb {
        background: #FFFFFF;
        border-radius: 4px;
      }

      /* === Chapter number badges — high contrast === */
      #main-content .chapter-num {
        background-color: #000000 !important;
        border: 2px solid #FFB347 !important;
        color: #FFB347 !important;
      }
      #main-content .chapter-link {
        background-color: #1A1A1A !important;
        border: 2px solid #FFFFFF !important;
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

      /* ============================================
         SVG DIAGRAMS — HIGH CONTRAST MODE
         ============================================ */

      /* SVG background rects → pure black */
      #main-content svg[role="img"] rect[fill="#FAFAF9"],
      #main-content svg[role="img"] rect[fill="#fafaf9"],
      #main-content svg[role="img"] rect[fill="white"],
      #main-content svg[role="img"] rect[fill="#FFFFFF"],
      #main-content svg[role="img"] rect[fill="#ffffff"] {
        fill: #000000 !important;
      }

      /* Landing / floor / structural rects */
      #main-content svg[role="img"] rect[fill="#E2E8F0"],
      #main-content svg[role="img"] rect[fill="#e2e8f0"] {
        fill: #1A1A1A !important;
        stroke: #FFFFFF !important;
      }
      #main-content svg[role="img"] rect[fill="#E7E5E4"],
      #main-content svg[role="img"] rect[fill="#e7e5e4"],
      #main-content svg[role="img"] rect[fill="#D6D3D1"],
      #main-content svg[role="img"] rect[fill="#d6d3d1"] {
        fill: #1A1A1A !important;
        stroke: #FFFFFF !important;
      }
      #main-content svg[role="img"] rect[fill="#F1F5F9"],
      #main-content svg[role="img"] rect[fill="#f1f5f9"],
      #main-content svg[role="img"] rect[fill="#F8FAFC"],
      #main-content svg[role="img"] rect[fill="#f8fafc"] {
        fill: #1A1A1A !important;
      }

      /* Ramp / polygon fills */
      #main-content svg[role="img"] polygon[fill="#F1F5F9"],
      #main-content svg[role="img"] polygon[fill="#f1f5f9"] {
        fill: #1A1A1A !important;
        stroke: #FFFFFF !important;
      }

      /* Light-filled area rects */
      #main-content svg[role="img"] rect[fill="#FEF2F2"],
      #main-content svg[role="img"] rect[fill="#F0FDF4"],
      #main-content svg[role="img"] rect[fill="#DBEAFE"],
      #main-content svg[role="img"] rect[fill="#FFFBF7"] {
        fill: #000000 !important;
      }

      /* ALL structural lines → white */
      #main-content svg[role="img"] line[stroke="#CBD5E1"],
      #main-content svg[role="img"] line[stroke="#cbd5e1"],
      #main-content svg[role="img"] line[stroke="#E2E8F0"],
      #main-content svg[role="img"] line[stroke="#e2e8f0"],
      #main-content svg[role="img"] line[stroke="#94A3B8"],
      #main-content svg[role="img"] line[stroke="#64748B"] {
        stroke: #FFFFFF !important;
      }

      /* All SVG text → white or near-white */
      #main-content svg[role="img"] text[fill="#64748B"],
      #main-content svg[role="img"] text[fill="#374151"],
      #main-content svg[role="img"] text[fill="#94A3B8"],
      #main-content svg[role="img"] text[fill="#4B5563"],
      #main-content svg[role="img"] text[fill="#78716C"],
      #main-content svg[role="img"] text[fill="#4B4540"],
      #main-content svg[role="img"] text[fill="#57534E"],
      #main-content svg[role="img"] text[fill="#CBD5E1"],
      #main-content svg[role="img"] text[fill="#cbd5e1"] {
        fill: #D0D0D0 !important;
      }

      /* AAA: Lighten semantic callout text colors on black background */
      #main-content svg[role="img"] text[fill="#8B2E08"],
      #main-content svg[role="img"] text[fill="#C2410C"] {
        fill: #FF8C5A !important;
      }
      #main-content svg[role="img"] text[fill="#14532D"],
      #main-content svg[role="img"] text[fill="#16A34A"] {
        fill: #4ADE80 !important;
      }
      #main-content svg[role="img"] text[fill="#1E3A8A"],
      #main-content svg[role="img"] text[fill="#2563EB"] {
        fill: #60A5FA !important;
      }
      #main-content svg[role="img"] text[fill="#5B21B6"],
      #main-content svg[role="img"] text[fill="#7C3AED"] {
        fill: #A78BFA !important;
      }
      #main-content svg[role="img"] text[fill="#78350F"],
      #main-content svg[role="img"] text[fill="#D97706"] {
        fill: #FCD34D !important;
      }
      #main-content svg[role="img"] text[fill="#0C4A6E"],
      #main-content svg[role="img"] text[fill="#0891B2"], #main-content svg[role="img"] text[fill="#0EA5E9"] {
        fill: #22D3EE !important;
      }
      #main-content svg[role="img"] text[fill="#9D174D"],
      #main-content svg[role="img"] text[fill="#DB2777"] {
        fill: #F472B6 !important;
      }

      /* AAA: Active callout circles in HC — use black text */
      #main-content svg[role="img"] g[role="button"] text[fill="white"] {
        fill: #000000 !important;
      }

      /* Strokes on rects */
      #main-content svg[role="img"] rect[stroke="#CBD5E1"],
      #main-content svg[role="img"] rect[stroke="#cbd5e1"],
      #main-content svg[role="img"] rect[stroke="#A8A29E"],
      #main-content svg[role="img"] rect[stroke="#D6D3D1"],
      #main-content svg[role="img"] rect[stroke="#94A3B8"] {
        stroke: #FFFFFF !important;
      }

      /* Inactive callout circles → black fill, white border added */
      #main-content svg[role="img"] g[role="button"] circle[fill="white"] {
        fill: #000000 !important;
        stroke-width: 2.5 !important;
      }

      /* Callout number text — max contrast on black circles */
      #main-content svg[role="img"] g[role="button"] text[fill="#8B2E08"] { fill: #FB923C !important; }
      #main-content svg[role="img"] g[role="button"] text[fill="#14532D"] { fill: #4ADE80 !important; }
      #main-content svg[role="img"] g[role="button"] text[fill="#1E3A8A"] { fill: #60A5FA !important; }
      #main-content svg[role="img"] g[role="button"] text[fill="#5B21B6"] { fill: #C4B5FD !important; }
      #main-content svg[role="img"] g[role="button"] text[fill="#78350F"] { fill: #FCD34D !important; }
      #main-content svg[role="img"] g[role="button"] text[fill="#0C4A6E"] { fill: #7DD3FC !important; }
      #main-content svg[role="img"] g[role="button"] text[fill="#9D174D"] { fill: #F9A8D4 !important; }

      /* Outer focus/pulse circles get white border */
      #main-content svg[role="img"] g[role="button"] circle[fill="none"][stroke="transparent"] {
        stroke: #FFFFFF !important;
        stroke-width: 2 !important;
      }

      /* Wall fills */
      #main-content svg[role="img"] rect[fill="#475569"] {
        fill: #FFFFFF !important;
      }

      /* Door panel */
      #main-content svg[role="img"] rect[fill="#F8FAFC"] {
        fill: #1A1A1A !important;
        stroke: #FFFFFF !important;
      }

      /* Ensure SVG background transparent */
      #main-content svg[role="img"] {
        background-color: transparent !important;
      }

      /* Diagram container border override for HC */
      #main-content div[style*="border-radius: 12px"] svg[role="img"] {
        border: none !important;
      }

      /* === Pathway radio cards — high contrast === */
      #main-content [role="radio"] {
        background-color: #1A1A1A !important;
        border: 2px solid #FFFFFF !important;
      }
      #main-content [role="radio"][aria-checked="true"] {
        background-color: #1A1A1A !important;
        border: 2px solid #FFB347 !important;
      }
      #main-content [role="radio"] p {
        color: #F0F0F0 !important;
      }

      /* === Feedback modal — high contrast === */
      .fb-panel {
        background-color: #000000 !important;
        background: #000000 !important;
        border: 2px solid #FFFFFF !important;
      }
      .fb-submit-btn {
        background-color: #D4572A !important;
        color: #FFFFFF !important;
        border: 2px solid #FFFFFF !important;
      }
      .fb-submit-btn:hover {
        background-color: #FFFFFF !important;
        color: #000000 !important;
      }
      .fb-done-btn {
        background-color: #1A1A1A !important;
        color: #FFFFFF !important;
        border: 2px solid #FFFFFF !important;
      }
      .fb-close-btn {
        color: #FFFFFF !important;
        border: 2px solid #FFFFFF !important;
      }
      .fb-success-icon-wrap {
        background-color: #0A0A0A !important;
        border: 2px solid #16A34A !important;
      }
      .fb-error {
        color: #FF6B6B !important;
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
  // Design philosophy: Premium "reading room" aesthetic.
  // - Hero + dark CTAs → deep espresso brown (keeps drama, not flat)
  // - Light sections alternate cream (#FBF6EF) / linen (#F5EDE0)
  // - Rich amber accent replaces cool terracotta
  // - Warm gold for interactive elements instead of bright orange
  // - Subtle paper texture feel through layered background tones
  if (prefs.displayMode === 'warm') {
    css += `
      :root {
        --slate-50: #FBF6EF !important;
        --slate-100: #F5EDE0 !important;
        --slate-200: #E8DDD0 !important;
        --slate-300: #C7B9A6 !important;
        --slate-400: #9C8B78 !important;
        --slate-500: #786756 !important;
        --slate-600: #584A3B !important;
        --slate-700: #3D3128 !important;
        --slate-800: #2B221B !important;
        --slate-900: #1C1613 !important;
        --surface: #FBF6EF !important;
      }
      body {
        background-color: #F5EDE0 !important;
      }

      /* === Blanket background — warm cream === */
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
      #main-content ul, #main-content ol, #main-content li,
      #main-content table, #main-content tr, #main-content td, #main-content th {
        background-color: #FBF6EF !important;
        background-image: none !important;
      }

      /* === Dark sections → rich espresso brown (keeps depth) === */
      /* Uses .warm-keep-dark class for reliable targeting.
         The [style*=] attribute selectors are unreliable because
         React may serialize colors differently per browser. */
      #main-content .warm-keep-dark,
      #main-content .warm-keep-dark > div,
      #main-content .warm-keep-dark div {
        background-color: #231912 !important;
        background-image: none !important;
      }
      /* Re-exempt interactive inside dark sections */
      #main-content .warm-keep-dark button,
      #main-content .warm-keep-dark a,
      #main-content .warm-keep-dark svg,
      #main-content .warm-keep-dark img,
      #main-content .warm-keep-dark .brand-icon {
        background-color: unset !important;
        background-image: unset !important;
      }
      /* Commitment cards — warm glass on dark */
      #main-content .warm-keep-dark .landing-commitment-card {
        background-color: rgba(251,246,239,0.04) !important;
        border: 1px solid rgba(251,246,239,0.08) !important;
      }
      /* Dark section text */
      #main-content .warm-keep-dark h1,
      #main-content .warm-keep-dark h2,
      #main-content .warm-keep-dark h3 { color: #F5EDE0 !important; }
      #main-content .warm-keep-dark p,
      #main-content .warm-keep-dark span,
      #main-content .warm-keep-dark li { color: #C7B9A6 !important; }
      #main-content .warm-keep-dark a { color: #E8984A !important; }
      #main-content .warm-keep-dark button {
        color: #E8DDD0 !important;
        border-color: #584A3B !important;
      }
      /* CTA buttons in dark sections */
      #main-content .warm-keep-dark button[style*="C2410C"],
      #main-content .warm-keep-dark a[style*="C2410C"],
      #main-content .warm-keep-dark a[style*="terra-600"],
      #main-content .warm-keep-dark button[style*="terra-600"] {
        background-color: #B5520A !important;
        color: #FBF6EF !important;
      }

      /* Re-exempt interactive */
      #main-content button, #main-content a,
      #main-content [role="button"], #main-content [role="radio"],
      #main-content [role="tab"], #main-content [role="switch"],
      #main-content svg, #main-content img,
      #main-content .brand-icon {
        background-color: unset !important;
        background-image: unset !important;
      }

      /* === Text colors — warm ink tones === */
      h1, h2, h3, h4, h5, h6 { color: #2B221B !important; }
      p, li, dd, dt, td, th, label, figcaption, blockquote { color: #3D3128 !important; }
      span, small { color: #584A3B !important; }

      /* Links — warm amber instead of cool terracotta */
      a { color: #A0520A !important; }
      a:hover { color: #7C3D08 !important; }

      /* (Dark section text is now handled by .warm-keep-dark rules above) */

      /* === Landing hero — warm dark treatment (preserve drama) === */
      #main-content .landing-hero-section,
      #main-content .landing-hero-section > div,
      #main-content .landing-hero-section div {
        background: #231912 !important;
        background-image: none !important;
      }
      #main-content .landing-hero-section h1 { color: #FBF6EF !important; }
      #main-content .landing-hero-section h2 { color: #FBF6EF !important; }
      /* "Then enforce them" tagline — warm amber gold */
      #main-content .landing-hero-section h1 span,
      #main-content .landing-hero-section h2 span[style*="F97316"] { color: #E8984A !important; }
      #main-content .landing-hero-section p { color: #C7B9A6 !important; }
      #main-content .landing-hero-section span { color: #9C8B78 !important; }
      #main-content .landing-hero-section a:not([style*="C2410C"]) { color: #E8984A !important; }
      /* Hero stat cards — warm glass effect */
      #main-content .landing-hero-section div[style*="rgba(255,255,255,0.0"] {
        background: rgba(251,246,239,0.04) !important;
        border-color: rgba(251,246,239,0.08) !important;
      }
      /* Hero CTA button — warm amber */
      #main-content .landing-hero-section button[style*="C2410C"],
      #main-content .landing-hero-section a[style*="C2410C"] {
        background-color: #B5520A !important;
        color: #FBF6EF !important;
      }
      /* Hero secondary button */
      #main-content .landing-hero-section button[style*="transparent"],
      #main-content .landing-hero-section a[style*="transparent"] {
        color: #C7B9A6 !important;
        border-color: #584A3B !important;
      }
      /* Hero "ADA LEGAL LINK" accent bar */
      #main-content .landing-hero-section div[style*="width: '32px'"] {
        background: #B5520A !important;
      }

      /* === Stories section — linen background for alternation === */
      #main-content section[style*="#FAF7F2"],
      #main-content div[style*="#FAF7F2"],
      #main-content [style*="background: '#FAF7F2'"] {
        background-color: #F0E8D9 !important;
      }

      /* === Story cards / white cards → warm cream with subtle shadow === */
      #main-content div[style*="background: '#FFFFFF'"],
      #main-content div[style*="background: white"],
      #main-content [style*="background: #FFFFFF"] {
        background-color: #FBF6EF !important;
        border-color: #E8DDD0 !important;
        box-shadow: 0 2px 8px rgba(43,34,27,0.06) !important;
      }

      /* === HowItWorks section — pure white → cream === */
      #main-content section[style*="'#FFFFFF'"],
      #main-content div[style*="'#FFFFFF'"] {
        background-color: #FBF6EF !important;
      }

      /* === KnowYourRights section === */
      #main-content section[style*="#F8FAFC"],
      #main-content div[style*="#F8FAFC"],
      #main-content [style*="background: '#F8FAFC'"] {
        background-color: #F0E8D9 !important;
      }

      /* === ForAttorneys section === */
      #main-content section[style*="'#FAF7F2'"] {
        background-color: #F0E8D9 !important;
      }

      /* === Card elevation — make cards pop off backgrounds === */
      #main-content .kyr-card {
        background-color: #FBF6EF !important;
        border-color: #DDD2C3 !important;
        box-shadow: 0 2px 12px rgba(43,34,27,0.07) !important;
      }
      /* LawyerValueProps cards */
      #main-content div[style*="var(--surface)"] {
        box-shadow: 0 2px 12px rgba(43,34,27,0.07) !important;
        border-color: #DDD2C3 !important;
      }
      /* Pricing card */
      #main-content div[style*="var(--surface)"][style*="border"] {
        box-shadow: 0 4px 20px rgba(43,34,27,0.08) !important;
      }

      /* === Number step circles in HowItWorks === */
      #main-content .step-number-circle {
        background-color: #3D3128 !important;
        color: #FBF6EF !important;
      }

      /* === Chapter number badges — warm mode === */
      #main-content .chapter-num {
        background-color: #3D3128 !important;
        border-color: #5A4A3A !important;
        color: #F5EDE0 !important;
      }
      #main-content .chapter-link {
        background-color: #F0E8D9 !important;
        border-color: #DDD2C3 !important;
      }

      /* Step divider line — warm gradient */
      #main-content .landing-steps-line {
        background: linear-gradient(to right, #E8DDD0, #B5520A, #E8DDD0) !important;
      }

      /* === Accent color badges (like "Filing Ready") === */
      #main-content span[style*="background: '#FEF1EC'"],
      #main-content div[style*="background: '#FEF1EC'"] {
        background-color: #FAEBD7 !important;
      }

      /* === Tag pills / badges — give them visible borders === */
      #main-content span[style*="background: 'white'"],
      #main-content span[style*="background: '#FFFFFF'"],
      #main-content div[style*="background: 'white'"] {
        background-color: #FBF6EF !important;
        border: 1px solid #C7B9A6 !important;
      }

      /* === Community Voices — keep dark, warm-tinted === */
      #main-content .cv-dark-section,
      #main-content .cv-dark-section div,
      #main-content .cv-dark-section section,
      #main-content .cv-dark-section p,
      #main-content .cv-dark-section span {
        background-color: #1C1613 !important;
        background-image: none !important;
      }
      /* Map container */
      #main-content .cv-dark-section [role="img"] {
        background-color: rgba(251,246,239,0.02) !important;
        border-color: rgba(251,246,239,0.06) !important;
      }
      /* Progress bar track */
      #main-content .cv-dark-section [role="progressbar"] {
        background-color: rgba(251,246,239,0.06) !important;
      }
      /* Progress bar fill — UNSET so inline color works */
      #main-content .cv-dark-section [role="progressbar"] div {
        background-color: unset !important;
        background-image: unset !important;
      }
      /* Result list items — transparent */
      #main-content .cv-dark-section [role="listitem"] {
        background-color: transparent !important;
      }
      /* Text */
      #main-content .cv-dark-section h2 { color: #F5EDE0 !important; }
      #main-content .cv-dark-section p,
      #main-content .cv-dark-section span,
      #main-content .cv-dark-section [role="listitem"] span {
        color: #C7B9A6 !important;
      }
      /* Buttons */
      #main-content .cv-dark-section button {
        background-color: rgba(251,246,239,0.03) !important;
        border-color: rgba(251,246,239,0.08) !important;
        color: #E8DDD0 !important;
      }
      #main-content .cv-dark-section button span {
        color: #E8DDD0 !important;
      }

      /* === Header — rich dark warm === */
      header[role="banner"] { background-color: #231912 !important; }
      header[role="banner"] a, header[role="banner"] span,
      header[role="banner"] button, header[role="banner"] div { color: #F5EDE0 !important; }

      /* === Inputs — warm tinted === */
      input, select, textarea {
        background-color: #FFFCF7 !important;
        border-color: #C7B9A6 !important;
        color: #2B221B !important;
      }
      input::placeholder, textarea::placeholder { color: #9C8B78 !important; }

      /* === Card borders — warm === */
      #main-content [style*="border"] { border-color: #E8DDD0 !important; }

      /* === Footer — rich espresso === */
      footer[role="contentinfo"], footer[role="contentinfo"] div {
        background-color: #1C1613 !important;
      }
      footer[role="contentinfo"] p, footer[role="contentinfo"] span { color: #C7B9A6 !important; }
      footer[role="contentinfo"] a { color: #E8984A !important; }

      /* === Display settings panel === */
      [role="dialog"][aria-label="Display preferences"] {
        background-color: #FBF6EF !important;
        border-color: #E8DDD0 !important;
      }
      [role="dialog"][aria-label="Display preferences"] legend {
        color: #786756 !important;
      }
      [role="dialog"][aria-label="Display preferences"] button {
        background-color: transparent !important;
        border-color: #E8DDD0 !important;
        color: #3D3128 !important;
      }
      [role="dialog"][aria-label="Display preferences"] button span {
        color: inherit !important;
      }
      [role="dialog"][aria-label="Display preferences"] button .ds-line {
        fill: #786756 !important;
      }
      [role="dialog"][aria-label="Display preferences"] button[aria-pressed="true"] {
        border-color: #B5520A !important;
        background-color: #FAEBD7 !important;
        color: #B5520A !important;
      }
      [role="dialog"][aria-label="Display preferences"] button[aria-pressed="true"] span {
        color: #B5520A !important;
      }
      [role="dialog"][aria-label="Display preferences"] button[aria-pressed="true"] .ds-line-active {
        fill: white !important;
      }

      /* === CTA buttons — warm amber === */
      #main-content button[style*="C2410C"],
      #main-content a[style*="C2410C"] {
        background-color: #B5520A !important;
        color: #FFFFFF !important;
      }

      /* === Radio cards === */
      #main-content [role="radio"] {
        background-color: #FBF6EF !important;
        border-color: #E8DDD0 !important;
      }
      #main-content [role="radio"][aria-checked="true"] {
        background-color: #FAEBD7 !important;
        border-color: #B5520A !important;
      }

      /* === Feedback modal === */
      .fb-panel {
        background-color: #FBF6EF !important;
        border-color: #E8DDD0 !important;
      }
      .fb-title, .fb-success-title { color: #2B221B !important; }
      .fb-subtitle, .fb-success-body { color: #584A3B !important; }
      .fb-label { color: #3D3128 !important; }
      .fb-error {
        color: #C44040 !important;
      }

      /* ============================================
         WARM MODE — DIAGRAM SVG OVERRIDES
         Warm-tone the diagram backgrounds, fix
         contrast on structural lines and muted text.
         ============================================ */

      /* SVG backgrounds → warm cream (match page) */
      #main-content svg[role="img"] rect[fill="#FAFAF9"],
      #main-content svg[role="img"] rect[fill="#fafaf9"],
      #main-content svg[role="img"] rect[fill="white"],
      #main-content svg[role="img"] rect[fill="#FFFFFF"],
      #main-content svg[role="img"] rect[fill="#ffffff"] {
        fill: #FBF6EF !important;
      }
      #main-content svg[role="img"] rect[fill="#F8FAFC"],
      #main-content svg[role="img"] rect[fill="#f8fafc"],
      #main-content svg[role="img"] rect[fill="#F1F5F9"],
      #main-content svg[role="img"] rect[fill="#f1f5f9"] {
        fill: #F5EDE0 !important;
      }

      /* Structural area fills → warm light */
      #main-content svg[role="img"] rect[fill="#E2E8F0"],
      #main-content svg[role="img"] rect[fill="#e2e8f0"] {
        fill: #E8DDD0 !important;
        stroke: #C7B9A6 !important;
      }
      #main-content svg[role="img"] rect[fill="#E7E5E4"],
      #main-content svg[role="img"] rect[fill="#e7e5e4"],
      #main-content svg[role="img"] rect[fill="#D6D3D1"],
      #main-content svg[role="img"] rect[fill="#d6d3d1"] {
        fill: #DDD2C3 !important;
        stroke: #C7B9A6 !important;
      }

      /* Polygons → warm */
      #main-content svg[role="img"] polygon[fill="#F1F5F9"],
      #main-content svg[role="img"] polygon[fill="#f1f5f9"] {
        fill: #F5EDE0 !important;
        stroke: #C7B9A6 !important;
      }

      /* Callout area fills → warm tinted */
      #main-content svg[role="img"] rect[fill="#FEF2F2"] { fill: #FAEBD7 !important; }
      #main-content svg[role="img"] rect[fill="#F0FDF4"] { fill: #F0E8D9 !important; }
      #main-content svg[role="img"] rect[fill="#DBEAFE"] { fill: #E8DDD0 !important; }
      #main-content svg[role="img"] rect[fill="#FFFBF7"] { fill: #FBF6EF !important; }

      /* Structural lines → warm brown (3:1 on cream) */
      #main-content svg[role="img"] line[stroke="#CBD5E1"],
      #main-content svg[role="img"] line[stroke="#cbd5e1"],
      #main-content svg[role="img"] line[stroke="#E2E8F0"],
      #main-content svg[role="img"] line[stroke="#e2e8f0"] {
        stroke: #9C8B78 !important;
      }
      #main-content svg[role="img"] line[stroke="#94A3B8"],
      #main-content svg[role="img"] line[stroke="#64748B"] {
        stroke: #8A7B6A !important;
      }

      /* Rect strokes → warm */
      #main-content svg[role="img"] rect[stroke="#CBD5E1"],
      #main-content svg[role="img"] rect[stroke="#cbd5e1"],
      #main-content svg[role="img"] rect[stroke="#A8A29E"],
      #main-content svg[role="img"] rect[stroke="#D6D3D1"],
      #main-content svg[role="img"] rect[stroke="#94A3B8"],
      #main-content svg[role="img"] rect[stroke="#E2E8F0"] {
        stroke: #9C8B78 !important;
      }

      /* Muted text → warmer, higher contrast */
      #main-content svg[role="img"] text[fill="#94A3B8"],
      #main-content svg[role="img"] text[fill="#CBD5E1"],
      #main-content svg[role="img"] text[fill="#cbd5e1"] {
        fill: #786756 !important;
      }
      #main-content svg[role="img"] text[fill="#64748B"] {
        fill: #584A3B !important;
      }
      #main-content svg[role="img"] text[fill="#78716C"] {
        fill: #584A3B !important;
      }

      /* Neutral structural text → warm brown */
      #main-content svg[role="img"] text[fill="#4B5563"],
      #main-content svg[role="img"] text[fill="#374151"],
      #main-content svg[role="img"] text[fill="#4B4540"],
      #main-content svg[role="img"] text[fill="#57534E"] {
        fill: #3D3128 !important;
      }

      /* Wall fills → warm dark */
      #main-content svg[role="img"] rect[fill="#475569"] {
        fill: #584A3B !important;
      }
      #main-content svg[role="img"] rect[fill="#334155"] {
        fill: #3D3128 !important;
      }
      #main-content svg[role="img"] rect[fill="#1A1F2B"] {
        fill: #2B221B !important;
      }

      /* Ensure SVG background transparent */
      #main-content svg[role="img"] {
        background-color: transparent !important;
      }

      /* Diagram container border → warm */
      #main-content .ada-diagram-wrap {
        border-color: #E8DDD0 !important;
      }

      /* Reduce blue light — subtle warm tint on images */
      img:not([src*="logo"]) { filter: sepia(0.08) !important; }

      /* Secondary / ghost buttons on warm bg */
      .landing-btn-secondary,
      button.landing-btn-secondary,
      #main-content .landing-btn-secondary {
        color: #3D3128 !important;
        border-color: #C7B9A6 !important;
        background-color: transparent !important;
      }
      .landing-btn-secondary span {
        color: #A0520A !important;
      }
      .landing-btn-secondary:hover,
      button.landing-btn-secondary:hover {
        border-color: #B5520A !important;
        color: #2B221B !important;
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
  if (prefs.displayMode === 'high-contrast') {
    document.body.classList.add('hc-mode');
    document.body.classList.remove('dark-mode', 'warm-mode');
  } else if (prefs.displayMode === 'dark') {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('hc-mode', 'warm-mode');
  } else if (prefs.displayMode === 'warm') {
    document.body.classList.add('warm-mode');
    document.body.classList.remove('hc-mode', 'dark-mode');
  } else {
    document.body.classList.remove('hc-mode', 'dark-mode', 'warm-mode');
  }
};

function SpacingIcon({ level, active, isMobile }) {
  const gap = level === 'default' ? 3 : level === 'relaxed' ? 5 : 7;
  const color = active ? '#1E293B' : isMobile ? 'rgba(255,255,255,0.7)' : '#64748B';
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
  const borderColor = isMobile ? 'rgba(255,255,255,0.2)' : 'var(--slate-200, #E2E8F0)';
  const textPrimary = isMobile ? 'white' : 'var(--slate-700, #334155)';
  const textSecondary = isMobile ? 'rgba(255,255,255,0.6)' : '#64748B';
  const accentBg = isMobile ? 'rgba(194,65,12,0.2)' : '#FFF7ED';

  const labelStyle = {
    fontFamily: 'Manrope, sans-serif',
    fontSize: '0.7rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: textSecondary,
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '8px' }}>
          {[
            { key: 'default', icon: '🎨', label: 'Default' },
            { key: 'dark', icon: '🌙', label: 'Dark' },
            { key: 'warm', icon: '🌅', label: 'Warm' },
            { key: 'high-contrast', icon: null, label: 'Contrast', svg: true },
          ].map((m, i) => {
            const active = prefs.displayMode === m.key;
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
                  gap: '3px', padding: '8px 2px',
                  minHeight: '54px',
                  borderRadius: '10px',
                  border: active ? `2px solid ${accent}` : `1px solid ${borderColor}`,
                  background: active ? accentBg : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <span aria-hidden="true" style={{ fontSize: '1rem', lineHeight: 1 }}>
                  {m.svg ? (
                    <svg width="18" height="18" viewBox="0 0 18 18" style={{ display: 'block' }}>
                      <circle cx="9" cy="9" r="8" fill="none" stroke={active ? accent : textSecondary} strokeWidth="1.5" />
                      <path d="M9 1a8 8 0 0 1 0 16z" fill={active ? accent : textSecondary} />
                    </svg>
                  ) : m.icon}
                </span>
                <span style={{
                  fontSize: '0.65rem', fontWeight: active ? 700 : 600,
                  color: active ? accent : textSecondary,
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
                  border: active ? `2px solid ${accent}` : `1px solid ${borderColor}`,
                  background: active ? accentBg : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <span style={{
                  fontFamily: f.family,
                  fontSize: '1.15rem', fontWeight: 700,
                  color: active ? accent : textPrimary,
                  lineHeight: 1.2,
                }}>
                  Aa
                </span>
                <span style={{
                  fontSize: '0.72rem', fontWeight: active ? 700 : 600,
                  color: active ? accent : textPrimary,
                  fontFamily: 'Manrope, sans-serif', lineHeight: 1.2,
                }}>
                  {f.label}
                </span>
                <span style={{
                  fontSize: '0.6rem', fontWeight: 500,
                  color: textSecondary,
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
                    border: active ? `2px solid ${accent}` : `1px solid ${borderColor}`,
                    background: active ? accent : 'transparent',
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
                    border: active ? `2px solid ${accent}` : `1px solid ${borderColor}`,
                    background: active ? accent : 'transparent',
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
        <legend style={labelStyle}>Reading Level</legend>
        <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
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
                  border: active ? `2px solid ${accent}` : `1px solid ${borderColor}`,
                  background: active ? accent : 'transparent',
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