/**
 * Persona — attorney portal sign-in (criterion 1) + queue→case-detail (2, 3).
 *
 * The unauthenticated redirect + Clerk sign-in card render run on any target
 * (no real session needed) — mirrors tests/personas/admin-auth.spec.ts.
 *
 * The authed flow (sign in as a seeded test attorney, see the queue, open a
 * case) stays `test.fixme`: like admin-auth.spec.ts, the repo's Playwright
 * harness can't drive Clerk's full email/OAuth sign-in loop. It runs on the
 * `preview` target against a pre-seeded test attorney + Clerk testing token —
 * the Phase 4 runtime verification recipe (see .implementation log).
 *
 * Ref: .design/attorney-portal.md Phase 4.
 */

import { test, expect } from '@playwright/test';

test('unauthenticated /portal redirects to /portal/sign-in', async ({ page }) => {
  await page.goto('/portal');
  await page.waitForURL(/\/portal\/sign-in/, { timeout: 10_000 });
  expect(page.url()).toContain('/portal/sign-in');
});

test('/portal/sign-in renders the Clerk sign-in card', async ({ page }) => {
  await page.goto('/portal/sign-in');
  await expect(page.locator('.cl-signIn-root, .cl-rootBox')).toBeVisible({
    timeout: 10_000,
  });
});

test.fixme('seeded attorney signs in, sees the queue, and opens a case', async ({ page }) => {
  // Runtime (preview): authenticate as the seeded test attorney via a Clerk
  // testing token, then assert the queue renders for the attorney's firm and a
  // queue row navigates to the case detail (render-level criteria 2 + 3).
  await page.goto('/portal');
  await expect(page.getByRole('heading', { name: /your queue/i })).toBeVisible();
  await page.getByRole('link', { name: /v\.|claimant/i }).first().click();
  await page.waitForURL(/\/portal\/cases\//);
  await expect(page.getByRole('heading', { level: 2, name: /claimant contact/i })).toBeVisible();
});
