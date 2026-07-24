/**
 * Admin chrome parity — the admin carries the same site bar as the
 * consumer site, including the display-settings control.
 *
 * WHY. Base44's admin renders inside the site layout, so Gina has the
 * nav and the accessibility eye on every admin page. Ours had neither
 * until Phase 2: the surface she uses daily was the one place she could
 * not reach her own display settings, on a project whose stated floor
 * is WCAG 2.2 AAA. That is not a styling gap, it is the control being
 * missing from the person it exists for.
 *
 * The bar is DECLARED in AdminLayout rather than inherited by wrapping
 * /admin in PublicLayout, because wrapping would nest a second <main>,
 * a second skip link and a duplicate #main-content id. The cost of that
 * choice is two copies of the link list, so this file makes them agree
 * by reading both sources.
 *
 * Ref: /plan admin visual parity, Phase 2.
 */

import { describe, it, expect } from 'vitest';
import { readCode } from '../support/sourceText.js';

const ADMIN = readCode('src/app/layouts/AdminLayout.tsx');
const PUBLIC = readCode('src/app/layouts/PublicLayout.tsx');

/** Every `to="/path"` that is a primary site destination. */
function siteLinks(code: string): string[] {
  const found = new Set<string>();
  for (const path of ['/standards-guide', '/attorneys', '/lawsuits']) {
    if (code.includes(`'${path}'`) || code.includes(`"${path}"`)) found.add(path);
  }
  return [...found].sort();
}

describe('admin chrome — the accessibility control is present', () => {
  it('mounts AccessibilityPanel', () => {
    expect(ADMIN, 'the display-settings control is missing from the admin').toMatch(
      /<AccessibilityPanel\s+onDark\s*\/>/,
    );
  });

  it('mounts ReadingLevelProvider above it', () => {
    // Without the provider useReadingLevel falls back to a no-op setter,
    // so the reading-level control renders and silently does nothing —
    // worse than absent, because it looks like it worked.
    expect(ADMIN, 'reading-level control would be a silent no-op').toContain(
      '<ReadingLevelProvider>',
    );
  });

  it('mounts LiveAnnouncer above it', () => {
    // useAnnounce defaults to a no-op, so preference changes would not
    // be announced to a screen reader.
    expect(ADMIN, 'preference changes would not be announced').toContain('<LiveAnnouncer>');
  });
});

describe('admin chrome — nav matches the consumer site', () => {
  it('carries the same primary destinations as PublicLayout', () => {
    expect(siteLinks(ADMIN)).toEqual(siteLinks(PUBLIC));
  });

  it('links back to the site root', () => {
    expect(ADMIN).toMatch(/to="\/"[\s\S]{0,200}ADA Legal/);
  });
});

describe('admin chrome — does not collide with PublicLayout', () => {
  it('does not introduce a second #main-content', () => {
    // The admin main is #admin-main. If /admin were ever wrapped in
    // PublicLayout instead, this id would appear twice in one document
    // and the skip link would become ambiguous.
    expect(ADMIN).not.toContain('id="main-content"');
    expect(ADMIN).toContain('id="admin-main"');
  });

  it('keeps exactly one skip link', () => {
    const matches = ADMIN.match(/Skip to main content/g) ?? [];
    expect(matches).toHaveLength(1);
  });
});
