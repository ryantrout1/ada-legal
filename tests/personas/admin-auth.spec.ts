/**
 * Layer 3 tests for the /admin auth flow.
 *
 * Verifies:
 *   - Unauthenticated users hitting /admin get redirected to /admin/sign-in
 *   - /admin/sign-in renders Clerk's sign-in UI
 *
 * We don't test the full sign-in flow here (that would require creating a
 * real Clerk test user and solving the email/OAuth loop). Those tests land
 * later in Phase B alongside admin-specific features.
 */

import { test, expect } from '@playwright/test';

test('unauthenticated /admin redirects to /admin/sign-in', async ({ page }) => {
  await page.goto('/admin');

  // React Router's <Navigate replace> lands us on the sign-in route.
  // Give Clerk a moment to hydrate (isLoaded transitions from false to true).
  await page.waitForURL(/\/admin\/sign-in/, { timeout: 10_000 });

  expect(page.url()).toContain('/admin/sign-in');
});

test('/admin/sign-in renders the Clerk sign-in card', async ({ page }) => {
  await page.goto('/admin/sign-in');

  // Clerk injects its own DOM; we assert on Clerk-specific selectors rather
  // than our own copy, because Clerk controls that copy.
  await expect(page.locator('.cl-signIn-root, .cl-rootBox')).toBeVisible({
    timeout: 10_000,
  });
});
