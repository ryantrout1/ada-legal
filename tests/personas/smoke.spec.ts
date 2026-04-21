/**
 * Public homepage smoke test.
 *
 * Runs locally against `npm run dev` by default. Set PLAYWRIGHT_TARGET=preview
 * to run against the Vercel preview deployment.
 *
 * Ref: docs/ARCHITECTURE.md §11, §13
 */

import { test, expect } from '@playwright/test';

test('homepage renders hero with Ada CTA', async ({ page }) => {
  await page.goto('/');

  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toContainText('Know the law');
  await expect(h1).toContainText('Know your rights');

  const cta = page.getByRole('link', { name: /Talk to Ada/i }).first();
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAttribute('href', '/chat');
});

test('homepage has correct document title + lang attribute', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/ADA Legal Link/);
  const lang = await page.locator('html').getAttribute('lang');
  expect(lang).toBe('en');
});

test('skip-to-content link is first focusable element', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: /Skip to main content/i });
  await expect(skipLink).toBeFocused();
});

test('footer legal links are present', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Privacy' }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('link', { name: 'Privacy' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Terms' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Accessibility' })).toBeVisible();
});

test('/chat loads from CTA navigation and shows the chat UI', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Talk to Ada/i }).first().click();

  await expect(page).toHaveURL(/\/chat$/);

  // Reading-level picker is visible
  await expect(page.getByRole('group', { name: /Reading level/i })).toBeVisible();

  // The 'Standard' button is pressed by default
  await expect(
    page.getByRole('button', { name: 'Standard' }),
  ).toHaveAttribute('aria-pressed', 'true');

  // Input is present (will be enabled once the session is created)
  await expect(page.getByLabel('Your message')).toBeVisible();
});
