/**
 * WCAG 2.2 AAA accessibility audit — attorney portal routes.
 *
 * Mirrors tests/a11y/aaa-audit.spec.ts: runs axe-core against each portal
 * route with the full AAA tag set and fails on any serious/critical
 * violation, logging advisory ones for the manual reviewer.
 *
 * SHELL (Phase 1): authored as `test.fixme` — the portal routes don't exist
 * yet, and per the design's approval notes the Clerk sign-in route needs an
 * `appearance` prop pass to reach AAA contrast/focus (out-of-the-box Clerk is
 * AA). Phase 4 (portal UI) flips these to live `test(...)`.
 *
 * Ref: .design/attorney-portal.md Phase 1 (test infra) → Phase 4 (UI),
 *      approval note 5 (Clerk AAA theming).
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PORTAL_ROUTES = [
  { path: '/portal/sign-in', name: 'portal sign-in' },
  { path: '/portal', name: 'portal queue (authed)' },
  { path: '/portal/cases/placeholder-id', name: 'portal case detail (authed)' },
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

for (const route of PORTAL_ROUTES) {
  test.fixme(`${route.name} has no serious or critical AAA violations`, async ({
    page,
  }) => {
    // TODO(Phase 4): for authed routes, establish a mocked Clerk session before
    // navigating. Sign-in route is public.
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page }).withTags(AAA_TAGS).analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );

    expect(
      blocking,
      `${route.path} has serious/critical accessibility violations. See test output above.`,
    ).toEqual([]);
  });
}
