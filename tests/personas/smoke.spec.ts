/**
 * Sample persona test.
 *
 * Verifies the Phase A placeholder page loads and renders. This is the
 * template every future Layer 3 persona test will follow: real browser,
 * real deployed artifact, real user paths.
 *
 * Runs locally against `npm run dev` by default. Set
 * PLAYWRIGHT_TARGET=preview to run against the Vercel preview instead.
 *
 * Ref: docs/ARCHITECTURE.md §13 — Layer 3
 */

import { test, expect } from '@playwright/test';

test('placeholder page loads and displays ADA Legal Link branding', async ({ page }) => {
  await page.goto('/');

  // The H1 is the strongest identity signal while we have no UI yet.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ADA Legal Link');

  // Phase A copy is the "Coming soon" placeholder; this assertion catches any
  // accidental regression that puts real content here before Phase B starts.
  await expect(page.getByText(/Coming soon/i)).toBeVisible();

  // The redirect link to the current Base44 site is present (users who land on
  // the preview URL should be able to reach production).
  const link = page.getByRole('link', { name: /adalegallink\.com/ });
  await expect(link).toHaveAttribute('href', 'https://adalegallink.com');
});

test('page has accessible title and lang attribute', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/ADA Legal Link/);

  const lang = await page.locator('html').getAttribute('lang');
  expect(lang).toBe('en');
});
