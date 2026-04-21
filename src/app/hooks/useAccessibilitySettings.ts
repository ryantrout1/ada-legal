/**
 * useAccessibilitySettings — the state behind the eyeball panel (Step 15.5).
 *
 * Holds four independent user preferences:
 *   display  — visual theme: default, dark, warm, contrast, low-vision
 *   font     — typeface: default, atkinson, opendyslexic, lexend
 *   size     — text size: small, medium, large
 *   spacing  — line/paragraph spacing: tight, default, loose
 *
 * Reading level is a separate concern owned by the chat session state
 * (it affects how Ada WRITES, not how the site is rendered). The
 * accessibility panel surfaces it for convenience but stores it in the
 * session, not localStorage.
 *
 * Persistence:
 *   - localStorage `ada-a11y` as the single source of truth. Written on
 *     every change; read on mount.
 *   - FOUC prevention: index.html runs a tiny sync script in <head> that
 *     reads the same localStorage key and sets data-* attributes BEFORE
 *     React mounts. The hook then re-syncs on mount, which is a no-op
 *     in the common case but handles the "localStorage changed in
 *     another tab" edge case.
 *
 * Rendering:
 *   - The hook sets data-display, data-font, data-size, data-spacing on
 *     <html>. All visual rules in app.css key off those attributes.
 *   - No inline styles, no CSS-in-JS. Everything is CSS variables +
 *     attribute selectors so the theme cascades naturally.
 *
 * Cross-tab sync: the 'storage' event fires in OTHER tabs when one tab
 * writes localStorage. We listen for it and re-sync so a user who
 * changes the theme on /chat sees /attorneys update too.
 */

import { useCallback, useEffect, useState } from 'react';

export type DisplayMode = 'default' | 'dark' | 'warm' | 'contrast' | 'low-vision';
export type FontFamily = 'default' | 'atkinson' | 'opendyslexic' | 'lexend';
export type TextSize = 'small' | 'medium' | 'large';
export type Spacing = 'tight' | 'default' | 'loose';

export interface AccessibilitySettings {
  display: DisplayMode;
  font: FontFamily;
  size: TextSize;
  spacing: Spacing;
}

export const DEFAULT_SETTINGS: AccessibilitySettings = {
  display: 'default',
  font: 'default',
  size: 'medium',
  spacing: 'default',
};

const STORAGE_KEY = 'ada-a11y';

function readStorage(): AccessibilitySettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AccessibilitySettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeStorage(s: AccessibilitySettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore — quota exceeded, private mode, etc.
  }
}

/**
 * Mirror the settings onto the <html> element as data-* attributes so
 * CSS in app.css can key off them. Matches the init script in index.html
 * exactly — this is the "re-sync" path that runs after React mounts.
 */
function applyToDom(s: AccessibilitySettings): void {
  if (typeof document === 'undefined') return;
  const h = document.documentElement;
  // Only set attributes when they differ from default, to keep the
  // DOM clean and the default path fully untouched.
  if (s.display !== 'default') h.setAttribute('data-display', s.display);
  else h.removeAttribute('data-display');
  if (s.font !== 'default') h.setAttribute('data-font', s.font);
  else h.removeAttribute('data-font');
  if (s.size !== 'medium') h.setAttribute('data-size', s.size);
  else h.removeAttribute('data-size');
  if (s.spacing !== 'default') h.setAttribute('data-spacing', s.spacing);
  else h.removeAttribute('data-spacing');
}

export interface UseAccessibilitySettingsResult {
  settings: AccessibilitySettings;
  setDisplay: (value: DisplayMode) => void;
  setFont: (value: FontFamily) => void;
  setSize: (value: TextSize) => void;
  setSpacing: (value: Spacing) => void;
  reset: () => void;
}

export function useAccessibilitySettings(): UseAccessibilitySettingsResult {
  const [settings, setSettings] = useState<AccessibilitySettings>(readStorage);

  // Apply on mount — covers the "localStorage changed in another tab"
  // case and re-syncs if the init script failed for some reason.
  useEffect(() => {
    applyToDom(settings);
  }, [settings]);

  // Cross-tab sync: when another tab writes ada-a11y, mirror it here.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      setSettings(readStorage());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((patch: Partial<AccessibilitySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeStorage(next);
      return next;
    });
  }, []);

  return {
    settings,
    setDisplay: (value) => update({ display: value }),
    setFont: (value) => update({ font: value }),
    setSize: (value) => update({ size: value }),
    setSpacing: (value) => update({ spacing: value }),
    reset: () => {
      writeStorage(DEFAULT_SETTINGS);
      setSettings(DEFAULT_SETTINGS);
    },
  };
}
