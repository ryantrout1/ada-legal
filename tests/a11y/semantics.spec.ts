import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { AUDIT_ROUTES } from './lib/routes.js';

/**
 * Screen-reader & keyboard STRUCTURE coverage.
 *
 * The main audit (aaa-audit.spec) runs axe with the WCAG A/AA/AAA tags, which
 * already cover the substrate a screen reader stands on: accessible names on
 * buttons/links, form labels, image alt text, valid ARIA, list markup, etc.
 * Those are gated as blocking there.
 *
 * What the WCAG tags DON'T include is axe's "best-practice" rules — and two of
 * them are exactly how a screen-reader or keyboard user navigates a page:
 *   • heading order (a sensible h1 → h2 → h3 outline, no skips)
 *   • landmark structure (one <main>, labelled nav, banner/contentinfo, and
 *     content living inside a landmark region)
 * plus a few keyboard-hygiene rules (no positive tabindex, focusable scroll
 * regions, skip link).
 *
 * Page structure is theme-independent, so this runs once per route (no theme
 * loop) and asserts there are no violations of the curated rule set below.
 * A machine can verify the STRUCTURE is sound; whether the spoken result is
 * coherent still needs a human on a real screen reader (see the manual pass).
 */

const STRUCTURE_RULES = [
  // headings
  'heading-order',
  'page-has-heading-one',
  'empty-heading',
  // landmarks
  'landmark-one-main',
  'landmark-main-is-top-level',
  'landmark-unique',
  'landmark-no-duplicate-main',
  'landmark-no-duplicate-banner',
  'landmark-no-duplicate-contentinfo',
  'landmark-complementary-is-top-level',
  'region', // all meaningful content should sit inside a landmark
  // keyboard hygiene
  'tabindex', // no positive tabindex (breaks focus order)
  'scrollable-region-focusable',
  'bypass', // skip-to-content mechanism
  'frame-title',
];

for (const route of AUDIT_ROUTES) {
  test(`${route.name} — screen-reader/keyboard structure`, async ({ page }) => {
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page }).withRules(STRUCTURE_RULES).analyze();

    const violations = results.violations.map((v) => ({
      rule: v.id,
      impact: v.impact,
      help: v.help,
      count: v.nodes.length,
      firstElement: v.nodes[0]?.target?.join(' ') ?? '',
    }));

    expect(
      violations,
      `Structure violations on ${route.path} ` +
        `(headings/landmarks/keyboard — how SR & keyboard users navigate):\n` +
        JSON.stringify(violations, null, 2),
    ).toEqual([]);
  });
}
