/**
 * displayPrefs — storage convergence tests (M1 Phase 1).
 *
 * Encodes the /plan acceptance criteria:
 *  AC-1  A B44-shaped `ada-display-prefs` blob loads verbatim and maps to
 *        the internal data-* attribute vocabulary.
 *  AC-2  A legacy `ada-a11y` blob (+ `ada-reading-level-guide`) migrates
 *        into `ada-display-prefs` on first load; legacy keys are left in
 *        place; value mapping is exact (contrast↔high-contrast, size and
 *        spacing enum translation, lexie→lexend).
 *  AC-3  OS detect parity with B44: first visit honors
 *        prefers-contrast: more → high-contrast, else
 *        prefers-color-scheme: dark → dark; an explicitly chosen
 *        warm / low-vision mode is never overridden by an OS change.
 *
 * The module under test is pure + defensive (typeof window guards), so we
 * run it in the node environment with stubbed window/localStorage.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  DISPLAY_PREFS_KEY,
  LEGACY_A11Y_KEY,
  LEGACY_READING_KEY,
  DEFAULT_PREFS,
  loadPrefs,
  savePrefs,
  toDomAttrs,
  resolveOsMode,
  shouldFollowOsChange,
  type DisplayPrefs,
} from '../../src/app/lib/displayPrefs.js';

// ---------------------------------------------------------------------------
// Test harness: minimal window/localStorage/matchMedia stubs
// ---------------------------------------------------------------------------

function makeLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => void store.clear(),
    _dump: () => Object.fromEntries(store),
  };
}

type MediaFlags = { hc?: boolean; dark?: boolean };

function installWindow(media: MediaFlags = {}) {
  const localStorage = makeLocalStorage();
  const dispatched: Event[] = [];
  const win = {
    localStorage,
    dispatchEvent: (e: Event) => {
      dispatched.push(e);
      return true;
    },
    matchMedia: (q: string) => ({
      matches: q.includes('prefers-contrast')
        ? !!media.hc
        : q.includes('prefers-color-scheme: dark')
          ? !!media.dark
          : false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  };
  vi.stubGlobal('window', win);
  vi.stubGlobal('localStorage', localStorage);
  return { localStorage, dispatched };
}

beforeEach(() => {
  vi.unstubAllGlobals();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// AC-1 — B44 blob loads verbatim and maps to internal attrs
// ---------------------------------------------------------------------------

describe('AC-1: B44-shaped blob is honored verbatim', () => {
  it('loads every field from a saved B44 blob', () => {
    const { localStorage } = installWindow();
    localStorage.setItem(
      DISPLAY_PREFS_KEY,
      JSON.stringify({
        displayMode: 'high-contrast',
        fontSize: 'xl',
        lineSpacing: 'loose',
        fontFamily: 'opendyslexic',
        readingLevel: 'simple',
        undoWindow: '8',
      }),
    );
    const prefs = loadPrefs();
    expect(prefs).toEqual({
      displayMode: 'high-contrast',
      fontSize: 'xl',
      lineSpacing: 'loose',
      fontFamily: 'opendyslexic',
      readingLevel: 'simple',
      undoWindow: '8',
    });
  });

  it('maps B44 vocabulary to the internal data-* attribute values', () => {
    const prefs: DisplayPrefs = {
      displayMode: 'high-contrast',
      fontSize: 'xl',
      lineSpacing: 'loose',
      fontFamily: 'opendyslexic',
      readingLevel: 'simple',
      undoWindow: '8',
    };
    expect(toDomAttrs(prefs)).toEqual({
      display: 'contrast', // B44 'high-contrast' → internal 'contrast'
      font: 'opendyslexic',
      size: 'xl',
      spacing: 'loose',
      readingLevel: 'simple',
    });
  });

  it('maps default-valued fields to null attrs (attribute removed)', () => {
    expect(toDomAttrs(DEFAULT_PREFS)).toEqual({
      display: null,
      font: null,
      size: null,
      spacing: null,
      readingLevel: 'standard',
    });
  });

  it('keeps B44 lineSpacing "relaxed" as its own value', () => {
    const prefs = { ...DEFAULT_PREFS, lineSpacing: 'relaxed' as const };
    expect(toDomAttrs(prefs).spacing).toBe('relaxed');
  });

  it('migrates the historical lexie key to lexend and persists it', () => {
    const { localStorage } = installWindow();
    localStorage.setItem(
      DISPLAY_PREFS_KEY,
      JSON.stringify({ ...DEFAULT_PREFS, fontFamily: 'lexie' }),
    );
    const prefs = loadPrefs();
    expect(prefs.fontFamily).toBe('lexend');
    const persisted = JSON.parse(localStorage.getItem(DISPLAY_PREFS_KEY)!);
    expect(persisted.fontFamily).toBe('lexend');
  });

  it('coerces unknown field values to defaults without nuking valid ones', () => {
    const { localStorage } = installWindow();
    localStorage.setItem(
      DISPLAY_PREFS_KEY,
      JSON.stringify({
        displayMode: 'neon', // invalid
        fontSize: 'xl', // valid
        lineSpacing: 7, // invalid type
        fontFamily: 'atkinson', // valid
        readingLevel: 'phd', // invalid
        undoWindow: '8', // valid
      }),
    );
    const prefs = loadPrefs();
    expect(prefs.displayMode).toBe('default');
    expect(prefs.fontSize).toBe('xl');
    expect(prefs.lineSpacing).toBe('default');
    expect(prefs.fontFamily).toBe('atkinson');
    expect(prefs.readingLevel).toBe('standard');
    expect(prefs.undoWindow).toBe('8');
  });

  it('returns defaults on corrupted JSON', () => {
    const { localStorage } = installWindow();
    localStorage.setItem(DISPLAY_PREFS_KEY, '{not json');
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  });

  it('defaults undoWindow to off when absent (2026-07-21 product decision) but honors a saved B44 value', () => {
    const { localStorage } = installWindow();
    localStorage.setItem(
      DISPLAY_PREFS_KEY,
      JSON.stringify({ displayMode: 'dark' }),
    );
    expect(loadPrefs().undoWindow).toBe('off');

    localStorage.setItem(
      DISPLAY_PREFS_KEY,
      JSON.stringify({ displayMode: 'dark', undoWindow: '8' }),
    );
    expect(loadPrefs().undoWindow).toBe('8');
  });
});

// ---------------------------------------------------------------------------
// AC-2 — legacy ada-a11y (+ reading level key) migrates
// ---------------------------------------------------------------------------

describe('AC-2: legacy ada-a11y migration', () => {
  it('migrates a full legacy blob with exact value mapping and writes the new key', () => {
    const { localStorage } = installWindow();
    localStorage.setItem(
      LEGACY_A11Y_KEY,
      JSON.stringify({
        display: 'contrast',
        font: 'lexend',
        size: 'large',
        spacing: 'loose',
        undoWindow: '5',
      }),
    );
    localStorage.setItem(LEGACY_READING_KEY, 'professional');

    const prefs = loadPrefs();
    expect(prefs).toEqual({
      displayMode: 'high-contrast', // 'contrast' → B44 name
      fontSize: 'large',
      lineSpacing: 'loose',
      fontFamily: 'lexend',
      readingLevel: 'professional', // absorbed from separate key
      undoWindow: '5',
    });

    // New blob persisted…
    const persisted = JSON.parse(localStorage.getItem(DISPLAY_PREFS_KEY)!);
    expect(persisted.displayMode).toBe('high-contrast');
    // …and legacy keys left in place (rollback safety).
    expect(localStorage.getItem(LEGACY_A11Y_KEY)).not.toBeNull();
    expect(localStorage.getItem(LEGACY_READING_KEY)).toBe('professional');
  });

  it('maps legacy size small/medium → default and legacy spacing tight → default', () => {
    const { localStorage } = installWindow();
    localStorage.setItem(
      LEGACY_A11Y_KEY,
      JSON.stringify({ display: 'warm', size: 'small', spacing: 'tight' }),
    );
    const prefs = loadPrefs();
    expect(prefs.displayMode).toBe('warm');
    expect(prefs.fontSize).toBe('default'); // B44 has no small tier
    expect(prefs.lineSpacing).toBe('default'); // B44 has no tight tier
  });

  it('prefers an existing ada-display-prefs blob over legacy keys', () => {
    const { localStorage } = installWindow();
    localStorage.setItem(
      DISPLAY_PREFS_KEY,
      JSON.stringify({ ...DEFAULT_PREFS, displayMode: 'dark' }),
    );
    localStorage.setItem(
      LEGACY_A11Y_KEY,
      JSON.stringify({ display: 'warm' }),
    );
    expect(loadPrefs().displayMode).toBe('dark');
  });
});

// ---------------------------------------------------------------------------
// AC-3 — OS detect parity
// ---------------------------------------------------------------------------

describe('AC-3: OS preference detection', () => {
  it('first visit with prefers-contrast: more lands in high-contrast and persists it', () => {
    const { localStorage } = installWindow({ hc: true, dark: true });
    const prefs = loadPrefs();
    expect(prefs.displayMode).toBe('high-contrast'); // HC outranks dark
    const persisted = JSON.parse(localStorage.getItem(DISPLAY_PREFS_KEY)!);
    expect(persisted.displayMode).toBe('high-contrast');
  });

  it('first visit with prefers-color-scheme: dark (no HC) lands in dark', () => {
    installWindow({ dark: true });
    expect(loadPrefs().displayMode).toBe('dark');
  });

  it('first visit with neither preference stays default and writes nothing', () => {
    const { localStorage } = installWindow();
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
    expect(localStorage.getItem(DISPLAY_PREFS_KEY)).toBeNull();
  });

  it('resolveOsMode ranks high-contrast above dark', () => {
    expect(resolveOsMode({ hc: true, dark: true })).toBe('high-contrast');
    expect(resolveOsMode({ hc: false, dark: true })).toBe('dark');
    expect(resolveOsMode({ hc: false, dark: false })).toBe('default');
  });

  it('OS changes may only override auto-detectable modes, never warm/low-vision', () => {
    expect(shouldFollowOsChange('default')).toBe(true);
    expect(shouldFollowOsChange('dark')).toBe(true);
    expect(shouldFollowOsChange('high-contrast')).toBe(true);
    expect(shouldFollowOsChange('warm')).toBe(false);
    expect(shouldFollowOsChange('low-vision')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// savePrefs contract — persistence + change event (B44 parity)
// ---------------------------------------------------------------------------

describe('savePrefs', () => {
  it('writes the blob and dispatches ada-prefs-changed', () => {
    const { localStorage, dispatched } = installWindow();
    savePrefs({ ...DEFAULT_PREFS, displayMode: 'warm' });
    expect(JSON.parse(localStorage.getItem(DISPLAY_PREFS_KEY)!).displayMode).toBe(
      'warm',
    );
    expect(dispatched.some((e) => e.type === 'ada-prefs-changed')).toBe(true);
  });
});
