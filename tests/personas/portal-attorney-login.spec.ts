/**
 * Persona — attorney portal sign-in (criterion 1).
 *
 * Drives a vetted attorney through Clerk sign-in and onto the portal queue
 * page at /portal. Mirrors the admin-auth pattern (tests/personas/admin-auth.spec.ts):
 * we assert on the redirect + Clerk-rendered sign-in card, then (once the
 * portal ships) the authenticated landing on the queue.
 *
 * SHELL (Phase 1): authored as `test.fixme` — the portal routes, the
 * Clerk-scoped PortalShell, and the seeded test attorney do not exist yet.
 * Phase 4 (portal UI) flips these to live `test(...)` and fills the bodies.
 *
 * Ref: .design/attorney-portal.md Phase 1 (test infra) → Phase 4 (UI).
 */

import { test, expect } from '@playwright/test';

test.fixme('unauthenticated /portal redirects to /portal/sign-in', async ({ page }) => {
  await page.goto('/portal');
  await page.waitForURL(/\/portal\/sign-in/, { timeout: 10_000 });
  expect(page.url()).toContain('/portal/sign-in');
});

test.fixme('/portal/sign-in renders the Clerk sign-in card', async ({ page }) => {
  await page.goto('/portal/sign-in');
  await expect(page.locator('.cl-signIn-root, .cl-rootBox')).toBeVisible({
    timeout: 10_000,
  });
});

test.fixme('seeded attorney signs in and lands on the portal queue', async ({ page }) => {
  // TODO(Phase 4): sign in as the seeded test attorney (portalSeed) via Clerk,
  // then assert the queue landing renders for the attorney's firm.
  await page.goto('/portal/sign-in');
  // ...Clerk sign-in steps with the seeded test attorney credentials...
  await page.waitForURL(/\/portal(\/)?$/, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: /queue|matched cases/i })).toBeVisible();
});
