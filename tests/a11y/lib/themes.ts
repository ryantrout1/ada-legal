/**
 * themes.ts — the display-theme matrix the AAA audit sweeps.
 *
 * The app themes purely via data-* attributes on <html> (see
 * src/app/lib/displayPrefs.ts → toDomAttrs / applyToDom); all colour lives
 * in app.css keyed off data-display. The audit drives themes the SAME way,
 * so it measures exactly what a user sees. Contrast is a function of the
 * display theme only — font / size / spacing change glyphs and layout, not
 * colour — so this 5-value set is the whole contrast axis.
 *
 * The mapping here mirrors displayPrefs.toDomAttrs exactly:
 *   displayMode 'default'       → data-display absent (null)
 *   'high-contrast'             → data-display="contrast"
 *   'dark' | 'warm' | 'low-vision' → data-display="<same>"
 *
 * A vitest unit test (tests/unit/a11yThemes.test.ts) pins this against the
 * app's own vocabulary so the harness can't drift from production.
 */

import type { Page } from '@playwright/test';

export type ThemeId = 'default' | 'dark' | 'contrast' | 'warm' | 'low-vision';

export interface DisplayTheme {
  id: ThemeId;
  label: string;
}

export const DISPLAY_THEMES: readonly DisplayTheme[] = [
  { id: 'default', label: 'Default' },
  { id: 'dark', label: 'Dark' },
  { id: 'contrast', label: 'Contrast' },
  { id: 'warm', label: 'Warm' },
  { id: 'low-vision', label: 'Low Vision' },
] as const;

/**
 * The data-display attribute value a theme produces, or null when the
 * attribute must be ABSENT (Default). Matches displayPrefs.toDomAttrs.
 */
export function themeToDomAttr(id: ThemeId): string | null {
  return id === 'default' ? null : id;
}

/**
 * Apply a theme to a live page the way the app does: set (or remove)
 * data-display on <html>. Applied after navigation so the CSS re-themes
 * in place. Kept in an addInitScript-friendly shape too, but the app's
 * own boot script already runs, so a post-load set is sufficient and
 * lets us re-theme without a reload.
 */
export async function applyThemeToPage(page: Page, id: ThemeId): Promise<void> {
  const attr = themeToDomAttr(id);
  await page.evaluate((value) => {
    const html = document.documentElement;
    if (value === null) html.removeAttribute('data-display');
    else html.setAttribute('data-display', value);
  }, attr);
}
