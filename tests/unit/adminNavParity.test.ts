/**
 * M6 Phase 2 — admin nav structure.
 *
 * Gina uses this sidebar every day on Base44. The cutover is only
 * painless if the structure she has learned survives it, so this pins
 * B44's grouping (Overview / Ada / Directory / Business / System) and
 * B44's labels rather than leaving them to drift back toward the flat
 * list that was here before.
 *
 * It also pins the three deliberate divergences, so a later "sync from
 * B44" does not quietly undo them:
 *   - Cases and Photo Review are Vercel-only surfaces that must not be
 *     dropped for having no B44 counterpart (the M2/M3/M4 pattern)
 *   - Subscribers is dropped per decision o4
 *   - no nav entry may point at a route that does not exist
 *
 * Ref: /plan M6 Phase 2, AC3.
 */

import { describe, it, expect } from 'vitest';
import { readCode } from '../support/sourceText.js';

const layout = readCode('src/app/layouts/AdminLayout.tsx');
const app = readCode('src/app/App.tsx');

/** Nav targets declared in the layout, in source order. */
const navTargets = [...layout.matchAll(/to: '\/admin\/([a-z-]+)'/g)].map((m) => m[1]);

/** Route paths registered under the admin shell. */
const registeredRoutes = new Set(
  [...app.matchAll(/<Route path="([a-z-]+)"/g)].map((m) => m[1]),
);

describe('admin nav — B44 group structure', () => {
  it('declares the group sections B44 uses', () => {
    for (const group of ['Ada', 'Directory', 'Business', 'System']) {
      expect(layout, `nav group missing: ${group}`).toContain(`label: '${group}'`);
    }
  });

  it('keeps B44 labels where B44 has the page', () => {
    // "Intakes / Referrals" is B44's wording, not ours. Gina scans for it.
    expect(layout).toContain("label: 'Intakes / Referrals'");
    expect(layout).toContain("label: 'Sessions'");
    expect(layout).toContain("label: 'Firms'");
    expect(layout).toContain("label: 'Attorneys'");
    expect(layout).toContain("label: 'Analytics'");
    expect(layout).toContain("label: 'Settings'");
  });

  it('renders group headings as headings, not styled text', () => {
    // So the sidebar is navigable by heading in a screen reader rather
    // than requiring a walk through every link.
    expect(layout).toMatch(/<h2[^>]*>\s*\{section\.label\}/);
  });

  it('gives every nav link a 44px minimum target', () => {
    expect(layout, 'Gina navigates by knuckle — 44px is a hard floor').toContain(
      'min-h-[44px]',
    );
  });
});

describe('admin nav — Vercel-only surfaces survive', () => {
  it('keeps Cases and Photo Review, which B44 has no counterpart for', () => {
    // Built on this side, live, and easy to lose to a "faithful" sync.
    expect(navTargets, 'the placement queue was dropped').toContain('cases');
    expect(navTargets, 'photo review was dropped').toContain('photo-review');
  });
});

describe('admin nav — decision o4', () => {
  it('drops Subscribers from the nav', () => {
    expect(layout, 'Subscribers is a marketplace-era stub').not.toContain(
      "label: 'Subscribers'",
    );
    expect(navTargets).not.toContain('subscriptions');
  });
});

describe('admin nav — no dead links', () => {
  it('points every nav entry at a registered route', () => {
    const dead = navTargets.filter((t) => !registeredRoutes.has(t));
    expect(
      dead,
      `nav entries with no route: ${dead.join(', ')}`,
    ).toEqual([]);
  });

  it('does not link Dashboard or Feedback until Phase 3 builds them', () => {
    // A nav entry pointing at a missing page reads as a broken tool
    // rather than an unfinished one.
    expect(navTargets).not.toContain('dashboard');
    expect(navTargets).not.toContain('feedback');
  });
});
