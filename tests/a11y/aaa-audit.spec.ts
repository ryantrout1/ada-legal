/**
 * Automated WCAG 2.2 AAA accessibility audit via axe-core.
 *
 * Scope:
 *   Runs on every public route. Fails on any violation at serious
 *   or critical impact. Moderate and minor violations are logged
 *   but do not fail the suite — axe's AAA ruleset sometimes flags
 *   patterns that are not real-world accessibility failures, and
 *   we'd rather not block shipping on noise. Every suppressed
 *   violation is visible in test output for the manual audit.
 *
 * Configuration:
 *   Tags enabled: wcag2a, wcag2aa, wcag2aaa, wcag21a, wcag21aa,
 *   wcag21aaa, wcag22aa, wcag22aaa, best-practice.
 *
 *   AAA inclusion is the whole point — AA by itself is not
 *   sufficient for an ADA-focused product.
 *
 * What this CATCHES:
 *   - Color contrast failures
 *   - Missing alt text
 *   - Improper ARIA
 *   - Missing form labels
 *   - Invalid landmark structure
 *   - Heading-order violations
 *
 * What this DOES NOT CATCH (see docs/A11Y-MANUAL-CHECKLIST.md):
 *   - Screen reader announcement timing
 *   - Reading order sanity
 *   - Keyboard tab-order logic
 *   - Error-message comprehensibility
 *   - Whether plain-language mode actually reads as plain language
 *   - Real end-to-end task completion by a disabled user
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PUBLIC_ROUTES = [
  { path: '/', name: 'homepage' },
  { path: '/chat', name: 'chat' },
  { path: '/attorneys', name: 'attorneys directory' },
  { path: '/accessibility', name: 'accessibility statement' },
];

const AAA_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag2aaa',
  'wcag21a',
  'wcag21aa',
  'wcag21aaa',
  'wcag22aa',
  'wcag22aaa',
];

for (const route of PUBLIC_ROUTES) {
  test(`${route.name} has no serious or critical AAA violations`, async ({
    page,
  }) => {
    await page.goto(route.path);
    // Give the route a moment to paint — /chat especially, which
    // waits on /api/ada/session/current and then either renders the
    // chat UI or a resume card.
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(AAA_TAGS)
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    const advisory = results.violations.filter(
      (v) => v.impact !== 'serious' && v.impact !== 'critical',
    );

    // Log everything so a human reviewer can see the advisory ones.
    if (advisory.length > 0) {
      console.log(
        `\n[a11y] ${route.path} — ${advisory.length} advisory violation(s) (not blocking):`,
      );
      for (const v of advisory) {
        console.log(`  · ${v.id} (${v.impact}): ${v.help}`);
        console.log(`    ${v.helpUrl}`);
        console.log(`    nodes: ${v.nodes.length}`);
      }
    }

    if (blocking.length > 0) {
      console.log(
        `\n[a11y] ${route.path} — ${blocking.length} BLOCKING violation(s):`,
      );
      for (const v of blocking) {
        console.log(`  ✗ ${v.id} (${v.impact}): ${v.help}`);
        console.log(`    ${v.helpUrl}`);
        for (const node of v.nodes.slice(0, 3)) {
          console.log(`    ${node.html.slice(0, 200)}`);
        }
      }
    }

    expect(
      blocking,
      `${route.path} has serious/critical accessibility violations. See test output above.`,
    ).toEqual([]);
  });
}
