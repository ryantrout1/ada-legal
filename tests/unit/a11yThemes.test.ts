/**
 * Unit test for the a11y audit theme matrix (Phase 1, AAA remediation).
 *
 * The audit drives display themes the SAME way the app does: data-*
 * attributes on <html> (see src/app/lib/displayPrefs.ts → applyToDom).
 * These tests pin the 5-theme set and the exact attribute each produces,
 * so the harness can't silently drift from production theming.
 *
 * Test-first: authored before tests/a11y/lib/themes.ts exists — red until
 * Phase 1 implementation lands.
 */

import { describe, it, expect } from 'vitest';
import { DISPLAY_THEMES, themeToDomAttr } from '../a11y/lib/themes.js';

describe('a11y audit — display theme matrix', () => {
  it('enumerates all 5 display themes', () => {
    expect(DISPLAY_THEMES.map((t) => t.id).sort()).toEqual(
      ['contrast', 'dark', 'default', 'low-vision', 'warm'].sort(),
    );
  });

  it('default theme sets NO data-display attribute (attribute-absent = default)', () => {
    // Mirrors displayPrefs.toDomAttrs: displayMode 'default' → null (removed).
    expect(themeToDomAttr('default')).toBeNull();
  });

  it('each non-default theme maps to its exact data-display value', () => {
    // These strings are the contract app.css keys off — must match
    // displayPrefs.toDomAttrs exactly (high-contrast renders as "contrast").
    expect(themeToDomAttr('dark')).toBe('dark');
    expect(themeToDomAttr('contrast')).toBe('contrast');
    expect(themeToDomAttr('warm')).toBe('warm');
    expect(themeToDomAttr('low-vision')).toBe('low-vision');
  });

  it('every theme has a human-readable label for report + test titles', () => {
    for (const t of DISPLAY_THEMES) {
      expect(typeof t.label).toBe('string');
      expect(t.label.length).toBeGreaterThan(0);
    }
  });
});
