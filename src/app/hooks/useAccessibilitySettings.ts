/**
 * useAccessibilitySettings — the state behind the eyeball panel.
 *
 * M1 Phase 1 (Base44 exit plan): storage moved to the shared
 * `displayPrefs` module — localStorage key `ada-display-prefs`, B44 field
 * vocabulary stored verbatim so B44 users' saved prefs survive the M7
 * cutover. This hook keeps its ORIGINAL public API (legacy enums:
 * display 'contrast', size small/medium/large, spacing tight/…): the
 * panel and chat consume it unchanged; the B44↔legacy translation lives
 * at the storage boundary.
 *
 * Canonical state is the B44 blob. Setters translate a legacy value into
 * its B44 counterpart and patch ONLY that field, so a stored value the
 * legacy enums can't express (e.g. fontSize 'xl', lineSpacing 'relaxed')
 * survives unrelated changes untouched.
 *
 * Rendering is unchanged: data-* attributes on <html>, all theming in
 * app.css (see displayPrefs.applyToDom). Cross-tab sync via the
 * 'storage' event; same-tab external writes (ReadingLevelProvider,
 * GuideReadingLevelBar) via the 'ada-prefs-changed' event. OS-level
 * display changes are followed per B44's guard (never overriding an
 * explicit warm / low-vision choice).
 */

import { useCallback, useEffect, useState } from 'react';
import {
  DISPLAY_PREFS_KEY,
  DEFAULT_PREFS,
  PREFS_CHANGED_EVENT,
  applyToDom,
  loadPrefs,
  savePrefs,
  watchOsPreferences,
  type B44DisplayMode,
  type DisplayPrefs,
} from '../lib/displayPrefs.js';

export type DisplayMode = 'default' | 'dark' | 'warm' | 'contrast' | 'low-vision';
export type FontFamily = 'default' | 'atkinson' | 'opendyslexic' | 'lexend';
/** 'xl' and 'relaxed' are read-side values (B44 vocabulary) the panel
 *  cannot set yet — the Phase 2 panel-parity pass adds the controls. */
export type TextSize = 'small' | 'medium' | 'large' | 'xl';
export type Spacing = 'tight' | 'default' | 'relaxed' | 'loose';

/**
 * UndoWindow — how long the chat keeps a "Sent · Undo (Xs)" affordance
 * after the user sends a message. Off disables the feature entirely
 * (message goes immediately, no recall). 5 / 8 / 10 are values in
 * seconds.
 *
 * Default is Off (per product decision 2026-07-21). The undo affordance
 * remains available for anyone who turns it on (5 / 8 / 10s); those
 * values still suit this audience — motor difficulties, cognitive load,
 * or distress all benefit from time to catch a mistake — but it is no
 * longer on by default. When enabled, 8s is the recommended middle
 * setting: 5s is tight for the audience, 10s+ starts to feel like dead
 * air to users who aren't using undo.
 *
 * When on, this only affects perceived latency for users who watch the
 * input area after sending — most see the typing indicator and look away
 * to read the response, so the pre-pause is invisible to them.
 */
export type UndoWindow = 'off' | '5' | '8' | '10';

export interface AccessibilitySettings {
  display: DisplayMode;
  font: FontFamily;
  size: TextSize;
  spacing: Spacing;
  undoWindow: UndoWindow;
}

export const DEFAULT_SETTINGS: AccessibilitySettings = {
  display: 'default',
  font: 'default',
  size: 'medium',
  spacing: 'default',
  undoWindow: 'off',
};

// ---------------------------------------------------------------------------
// B44 ↔ legacy translation (storage boundary only)
// ---------------------------------------------------------------------------

function toLegacy(prefs: DisplayPrefs): AccessibilitySettings {
  return {
    display: prefs.displayMode === 'high-contrast' ? 'contrast' : prefs.displayMode,
    font: prefs.fontFamily,
    // B44 'default' is the legacy 'medium' resting state; small/large/xl pass through.
    size: prefs.fontSize === 'default' ? 'medium' : prefs.fontSize,
    spacing: prefs.lineSpacing,
    undoWindow: prefs.undoWindow,
  };
}

function displayToB44(value: DisplayMode): B44DisplayMode {
  return value === 'contrast' ? 'high-contrast' : value;
}

function sizeToB44(value: TextSize): DisplayPrefs['fontSize'] {
  // 'medium' is the B44 'default' resting state; 'small' is our
  // superset tier and passes through (see displayPrefs.ts).
  if (value === 'medium') return 'default';
  return value;
}

function spacingToB44(value: Spacing): DisplayPrefs['lineSpacing'] {
  // 'tight' is our superset tier and passes through (see displayPrefs.ts).
  return value;
}

export interface UseAccessibilitySettingsResult {
  settings: AccessibilitySettings;
  setDisplay: (value: DisplayMode) => void;
  setFont: (value: FontFamily) => void;
  setSize: (value: TextSize) => void;
  setSpacing: (value: Spacing) => void;
  setUndoWindow: (value: UndoWindow) => void;
  reset: () => void;
}

export function useAccessibilitySettings(): UseAccessibilitySettingsResult {
  const [prefs, setPrefs] = useState<DisplayPrefs>(loadPrefs);

  // Mirror onto <html> whenever prefs change — re-syncs after the
  // index.html boot script and covers external updates.
  useEffect(() => {
    applyToDom(prefs);
  }, [prefs]);

  // Cross-tab sync: another tab wrote the blob.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    function onStorage(e: StorageEvent) {
      if (e.key !== DISPLAY_PREFS_KEY) return;
      setPrefs(loadPrefs());
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Same-tab external writes (ReadingLevelProvider, guide bars) announce
  // via ada-prefs-changed; re-read so this hook's view stays canonical.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onChanged = () => setPrefs((prev) => {
      const next = loadPrefs();
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
    });
    window.addEventListener(PREFS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(PREFS_CHANGED_EVENT, onChanged);
  }, []);

  // Follow OS display changes (B44 parity, guarded inside the watcher).
  useEffect(() => {
    return watchOsPreferences((mode) => {
      setPrefs((prev) => {
        const next = { ...prev, displayMode: mode };
        savePrefs(next);
        return next;
      });
    });
  }, []);

  const patch = useCallback((partial: Partial<DisplayPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...partial };
      savePrefs(next);
      return next;
    });
  }, []);

  return {
    settings: toLegacy(prefs),
    setDisplay: (value) => patch({ displayMode: displayToB44(value) }),
    setFont: (value) => patch({ fontFamily: value }),
    setSize: (value) => patch({ fontSize: sizeToB44(value) }),
    setSpacing: (value) => patch({ lineSpacing: spacingToB44(value) }),
    setUndoWindow: (value) => patch({ undoWindow: value }),
    reset: () => {
      const next = { ...DEFAULT_PREFS };
      savePrefs(next);
      setPrefs(next);
    },
  };
}

/**
 * Convert UndoWindow to a milliseconds duration. 'off' returns 0 which
 * the chat sendMessage path treats as "skip the undo affordance, send
 * immediately". Used by useChatSession.
 */
export function undoWindowToMs(value: UndoWindow): number {
  switch (value) {
    case 'off': return 0;
    case '5': return 5_000;
    case '8': return 8_000;
    case '10': return 10_000;
  }
}
