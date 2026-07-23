/**
 * displayPrefs — the single storage contract for display preferences
 * (M1 Phase 1, Base44 exit plan).
 *
 * WHY THIS SHAPE: after the M7 DNS cutover this app serves at
 * adalegallink.com, the same origin where every existing user's saved
 * preferences live under localStorage key `ada-display-prefs` in B44's
 * field vocabulary. This module stores that shape VERBATIM so returning
 * users keep their settings. Do not rename the key or any field.
 *
 * B44 contract (src/components/a11y/DisplaySettings.jsx @ 6b1e9ac):
 *   key `ada-display-prefs` = {
 *     displayMode:  'default' | 'dark' | 'high-contrast' | 'warm' | 'low-vision'
 *     fontSize:     'default' | 'large' | 'xl'
 *     lineSpacing:  'default' | 'relaxed' | 'loose'
 *     fontFamily:   'default' | 'atkinson' | 'opendyslexic' | 'lexend'
 *     readingLevel: 'simple' | 'standard' | 'professional'
 *     undoWindow:   'off' | '5' | '8' | '10'
 *   }
 *   plus the `ada-prefs-changed` window CustomEvent fired on every save,
 *   and the historical `lexie` → `lexend` fontFamily migration.
 *
 * DIVERGENCE FROM B44 (deliberate): undoWindow defaults to 'off' here —
 * the 2026-07-21 product decision post-dates B44's '8'. A returning B44
 * user with a SAVED '8' keeps it; only the absent-value default changed.
 *
 * APPLICATION MECHANISM (unchanged from the pre-M1 app): values map to
 * data-* attributes on <html> and app.css does all theming. B44's runtime
 * <style> injection is NOT ported — it carries AA-level hexes and would
 * regress the AAA-corrected token set. The one naming seam: B44's
 * 'high-contrast' renders as our data-display="contrast".
 *
 * LEGACY MIGRATION: this app previously wrote `ada-a11y` (+ reading level
 * in `ada-reading-level-guide`). First load without `ada-display-prefs`
 * translates those into the new blob. Legacy keys are left in place so a
 * rollback to the old code finds its data untouched.
 */

// ---------------------------------------------------------------------------
// Types — B44 vocabulary, stored verbatim
// ---------------------------------------------------------------------------

export type B44DisplayMode =
  | 'default'
  | 'dark'
  | 'high-contrast'
  | 'warm'
  | 'low-vision';
export type B44FontSize = 'default' | 'large' | 'xl';
export type B44LineSpacing = 'default' | 'relaxed' | 'loose';
export type B44FontFamily = 'default' | 'atkinson' | 'opendyslexic' | 'lexend';
export type B44ReadingLevel = 'simple' | 'standard' | 'professional';
export type B44UndoWindow = 'off' | '5' | '8' | '10';

export interface DisplayPrefs {
  displayMode: B44DisplayMode;
  fontSize: B44FontSize;
  lineSpacing: B44LineSpacing;
  fontFamily: B44FontFamily;
  readingLevel: B44ReadingLevel;
  undoWindow: B44UndoWindow;
}

/** Internal data-* vocabulary consumed by app.css. */
export interface DomAttrs {
  display: 'dark' | 'contrast' | 'warm' | 'low-vision' | null;
  font: 'atkinson' | 'opendyslexic' | 'lexend' | null;
  size: 'large' | 'xl' | null;
  spacing: 'relaxed' | 'loose' | null;
  readingLevel: B44ReadingLevel;
}

export const DISPLAY_PREFS_KEY = 'ada-display-prefs';
export const LEGACY_A11Y_KEY = 'ada-a11y';
export const LEGACY_READING_KEY = 'ada-reading-level-guide';
export const PREFS_CHANGED_EVENT = 'ada-prefs-changed';

export const DEFAULT_PREFS: DisplayPrefs = {
  displayMode: 'default',
  fontSize: 'default',
  lineSpacing: 'default',
  fontFamily: 'default',
  readingLevel: 'standard',
  undoWindow: 'off', // product decision 2026-07-21 (B44 shipped '8')
};

// ---------------------------------------------------------------------------
// Field validation — coerce anything unknown to the field default
// ---------------------------------------------------------------------------

const VALID: { [K in keyof DisplayPrefs]: readonly DisplayPrefs[K][] } = {
  displayMode: ['default', 'dark', 'high-contrast', 'warm', 'low-vision'],
  fontSize: ['default', 'large', 'xl'],
  lineSpacing: ['default', 'relaxed', 'loose'],
  fontFamily: ['default', 'atkinson', 'opendyslexic', 'lexend'],
  readingLevel: ['simple', 'standard', 'professional'],
  undoWindow: ['off', '5', '8', '10'],
};

function coerce(raw: unknown): DisplayPrefs {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<
    string,
    unknown
  >;
  const out: DisplayPrefs = { ...DEFAULT_PREFS };
  // Historical B44 migration: the Lexend font was once stored as 'lexie'.
  if (src.fontFamily === 'lexie') src.fontFamily = 'lexend';
  for (const key of Object.keys(VALID) as (keyof DisplayPrefs)[]) {
    const v = src[key];
    if (
      typeof v === 'string' &&
      (VALID[key] as readonly string[]).includes(v)
    ) {
      (out as unknown as Record<string, string>)[key] = v;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Legacy `ada-a11y` translation
// ---------------------------------------------------------------------------

/**
 * Map the pre-M1 internal vocabulary into the B44 contract.
 *   display 'contrast'      → 'high-contrast'
 *   size 'small' | 'medium' → 'default'   (B44 has no small tier)
 *   spacing 'tight'         → 'default'   (B44 has no tight tier)
 * Everything else is either identity or already invalid (→ default).
 */
function fromLegacy(
  legacy: Record<string, unknown>,
  legacyReadingLevel: string | null,
): DisplayPrefs {
  const display = legacy.display === 'contrast' ? 'high-contrast' : legacy.display;
  const size =
    legacy.size === 'small' || legacy.size === 'medium'
      ? 'default'
      : legacy.size;
  const spacing = legacy.spacing === 'tight' ? 'default' : legacy.spacing;
  return coerce({
    displayMode: display,
    fontSize: size,
    lineSpacing: spacing,
    fontFamily: legacy.font,
    readingLevel: legacyReadingLevel ?? undefined,
    undoWindow: legacy.undoWindow,
  });
}

// ---------------------------------------------------------------------------
// OS preference detection (B44 parity)
// ---------------------------------------------------------------------------

export function resolveOsMode(flags: {
  hc: boolean;
  dark: boolean;
}): B44DisplayMode {
  if (flags.hc) return 'high-contrast';
  if (flags.dark) return 'dark';
  return 'default';
}

/**
 * B44's override guard: an OS-level change may only move the mode when the
 * user's current mode is one auto-detect could have produced. An explicit
 * warm or low-vision choice is never clobbered.
 */
export function shouldFollowOsChange(mode: B44DisplayMode): boolean {
  return mode === 'default' || mode === 'dark' || mode === 'high-contrast';
}

function readOsFlags(): { hc: boolean; dark: boolean } {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return { hc: false, dark: false };
  }
  try {
    return {
      hc: window.matchMedia('(prefers-contrast: more)').matches,
      dark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    };
  } catch {
    return { hc: false, dark: false };
  }
}

// ---------------------------------------------------------------------------
// Load / save
// ---------------------------------------------------------------------------

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null; // storage access can throw under strict privacy settings
  }
}

function writeBlob(prefs: DisplayPrefs): void {
  const ls = storage();
  if (!ls) return;
  try {
    ls.setItem(DISPLAY_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // quota / private mode — settings still apply for this page view
  }
}

/**
 * Read the canonical prefs. Resolution order:
 *   1. `ada-display-prefs` (B44 blob) — validated field-by-field; the
 *      lexie→lexend migration is persisted back when it fires.
 *   2. Legacy `ada-a11y` (+ `ada-reading-level-guide`) — translated,
 *      persisted to the new key, legacy keys left untouched.
 *   3. First visit — OS auto-detect; persisted ONLY when it detects a
 *      non-default mode (B44 behavior: no blob is written for a plain
 *      default first visit).
 */
export function loadPrefs(): DisplayPrefs {
  const ls = storage();
  if (!ls) return { ...DEFAULT_PREFS };

  let raw: string | null = null;
  try {
    raw = ls.getItem(DISPLAY_PREFS_KEY);
  } catch {
    return { ...DEFAULT_PREFS };
  }

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const hadLexie = !!parsed && parsed.fontFamily === 'lexie';
      const prefs = coerce(parsed);
      if (hadLexie) writeBlob(prefs);
      return prefs;
    } catch {
      return { ...DEFAULT_PREFS };
    }
  }

  // Legacy migration path
  let legacyRaw: string | null = null;
  try {
    legacyRaw = ls.getItem(LEGACY_A11Y_KEY);
  } catch {
    legacyRaw = null;
  }
  if (legacyRaw) {
    try {
      const legacy = JSON.parse(legacyRaw) as Record<string, unknown>;
      let legacyReading: string | null = null;
      try {
        legacyReading = ls.getItem(LEGACY_READING_KEY);
      } catch {
        legacyReading = null;
      }
      const prefs = fromLegacy(legacy, legacyReading);
      writeBlob(prefs); // legacy keys deliberately left in place
      return prefs;
    } catch {
      // fall through to OS detect on corrupted legacy data
    }
  }

  // First visit — OS auto-detect (B44 parity)
  const detected = resolveOsMode(readOsFlags());
  if (detected !== 'default') {
    const prefs: DisplayPrefs = { ...DEFAULT_PREFS, displayMode: detected };
    writeBlob(prefs);
    return prefs;
  }
  return { ...DEFAULT_PREFS };
}

/** Persist prefs and announce the change (B44's ada-prefs-changed event). */
export function savePrefs(prefs: DisplayPrefs): void {
  writeBlob(prefs);
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(PREFS_CHANGED_EVENT));
    } catch {
      // CustomEvent unavailable — nothing to announce
    }
  }
}

// ---------------------------------------------------------------------------
// DOM mapping
// ---------------------------------------------------------------------------

/**
 * Translate stored B44 vocabulary into the internal data-* attribute
 * values app.css keys off. `null` means "remove the attribute" (default).
 */
export function toDomAttrs(prefs: DisplayPrefs): DomAttrs {
  return {
    display:
      prefs.displayMode === 'default'
        ? null
        : prefs.displayMode === 'high-contrast'
          ? 'contrast'
          : prefs.displayMode,
    font: prefs.fontFamily === 'default' ? null : prefs.fontFamily,
    size: prefs.fontSize === 'default' ? null : prefs.fontSize,
    spacing: prefs.lineSpacing === 'default' ? null : prefs.lineSpacing,
    readingLevel: prefs.readingLevel,
  };
}

/**
 * Mirror prefs onto <html>. data-reading-level is owned by
 * ReadingLevelProvider while it is mounted; this only writes it when the
 * attribute is absent (pre-mount / non-provider pages) so the two writers
 * never fight.
 */
export function applyToDom(prefs: DisplayPrefs): void {
  if (typeof document === 'undefined') return;
  const h = document.documentElement;
  const attrs = toDomAttrs(prefs);
  const set = (name: string, value: string | null) => {
    if (value === null) h.removeAttribute(name);
    else h.setAttribute(name, value);
  };
  set('data-display', attrs.display);
  set('data-font', attrs.font);
  set('data-size', attrs.size);
  set('data-spacing', attrs.spacing);
  if (!h.hasAttribute('data-reading-level')) {
    h.setAttribute('data-reading-level', attrs.readingLevel);
  }
}

// ---------------------------------------------------------------------------
// OS change watcher
// ---------------------------------------------------------------------------

/**
 * Follow OS-level display changes while the app is open, honoring the
 * override guard. Returns an unsubscribe function.
 */
export function watchOsPreferences(
  onModeChange: (mode: B44DisplayMode) => void,
): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  let darkMq: MediaQueryList;
  let hcMq: MediaQueryList;
  try {
    darkMq = window.matchMedia('(prefers-color-scheme: dark)');
    hcMq = window.matchMedia('(prefers-contrast: more)');
  } catch {
    return () => {};
  }
  const handle = () => {
    const current = loadPrefs();
    if (!shouldFollowOsChange(current.displayMode)) return;
    const next = resolveOsMode({ hc: hcMq.matches, dark: darkMq.matches });
    if (next === current.displayMode) return;
    onModeChange(next);
  };
  try {
    darkMq.addEventListener('change', handle);
    hcMq.addEventListener('change', handle);
  } catch {
    return () => {};
  }
  return () => {
    try {
      darkMq.removeEventListener('change', handle);
      hcMq.removeEventListener('change', handle);
    } catch {
      // already gone
    }
  };
}
