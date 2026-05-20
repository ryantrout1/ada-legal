/**
 * WCAG 2.2 AAA accessibility audit — attorney portal routes.
 *
 * Mirrors tests/a11y/aaa-audit.spec.ts: axe-core with the full AAA tag set,
 * fails on serious/critical violations.
 *
 * /portal/sign-in is public and audited live (approval note 5: the Clerk
 * `appearance` prop is themed to AAA). The authed routes (/portal queue and
 * /portal/cases/<id>) stay `test.fixme` — they need a seeded Clerk session,
 * which the repo's Playwright harness can't produce headless (same limitation
 * as admin-auth.spec.ts). They run on `preview` with a Clerk testing token.
 *
 * Ref: .design/attorney-portal.md Phase 4; approval note 5.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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

async function auditBlocking(page: import('@playwright/test').Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  const results = await new AxeBuilder({ page }).withTags(AAA_TAGS).analyze();
  return results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
}

test('portal sign-in has no serious or critical AAA violations', async ({ page }) => {
  const blocking = await auditBlocking(page, '/portal/sign-in');
  expect(
    blocking,
    '/portal/sign-in has serious/critical accessibility violations (Clerk appearance must be AAA-themed).',
  ).toEqual([]);
});

test.fixme('portal queue (authed) has no serious or critical AAA violations', async ({ page }) => {
  const blocking = await auditBlocking(page, '/portal');
  expect(blocking).toEqual([]);
});

test.fixme('portal case detail (authed) has no serious or critical AAA violations', async ({ page }) => {
  const blocking = await auditBlocking(page, '/portal/cases/placeholder-id');
  expect(blocking).toEqual([]);
});
