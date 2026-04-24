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

test('reading-level switch on empty chat: silent swap, no ConfirmBar', async ({ page }) => {
  // Guardrail: if a window.confirm() ever fires, fail loudly. Native
  // dialogs were the regression we fixed; this test locks in the fix.
  let nativeConfirmFired = false;
  page.on('dialog', async (d) => {
    nativeConfirmFired = true;
    await d.dismiss();
  });

  await page.goto('/chat');
  await expect(page.getByRole('group', { name: /Reading level/i })).toBeVisible();

  // Wait for the input to enable — the session has to initialise before
  // the picker does anything interesting.
  await expect(page.getByLabel('Your message')).toBeEnabled({ timeout: 15000 });

  // Tap Simple with no user messages yet. Expected: silent swap.
  await page.getByRole('button', { name: 'Simple' }).click();

  // No ConfirmBar should appear.
  await expect(page.getByRole('alertdialog')).toHaveCount(0);

  // Simple is now pressed.
  await expect(
    page.getByRole('button', { name: 'Simple' }),
  ).toHaveAttribute('aria-pressed', 'true');

  expect(nativeConfirmFired).toBe(false);
});

test('reading-level switch mid-conversation: ConfirmBar appears; Cancel leaves picker unchanged', async ({ page }) => {
  let nativeConfirmFired = false;
  page.on('dialog', async (d) => {
    nativeConfirmFired = true;
    await d.dismiss();
  });

  await page.goto('/chat');
  await expect(page.getByLabel('Your message')).toBeEnabled({ timeout: 15000 });

  // Send a message so we have user content — this is the trigger that
  // escalates a level-switch from silent to confirm-required.
  const input = page.getByLabel('Your message');
  await input.fill('Testing the confirm flow. A restaurant refused my service dog.');
  await page.getByRole('button', { name: 'Send' }).click();

  // Wait for the message to actually land in the list.
  await expect(
    page.getByText(/Testing the confirm flow/i).first(),
  ).toBeVisible({ timeout: 15000 });

  // Now tap a different level. ConfirmBar should appear.
  await page.getByRole('button', { name: 'Simple' }).click();

  const bar = page.getByRole('alertdialog');
  await expect(bar).toBeVisible();
  await expect(bar).toContainText(/Switch to Simple/i);

  // Picker stays on Standard until confirmed.
  await expect(
    page.getByRole('button', { name: 'Standard' }),
  ).toHaveAttribute('aria-pressed', 'true');

  // Cancel dismisses the bar.
  await bar.getByRole('button', { name: 'Cancel' }).click();
  await expect(bar).toHaveCount(0);

  // Picker is still on Standard.
  await expect(
    page.getByRole('button', { name: 'Standard' }),
  ).toHaveAttribute('aria-pressed', 'true');

  expect(nativeConfirmFired).toBe(false);
});

test('reading-level switch mid-conversation: ESC key cancels', async ({ page }) => {
  let nativeConfirmFired = false;
  page.on('dialog', async (d) => {
    nativeConfirmFired = true;
    await d.dismiss();
  });

  await page.goto('/chat');
  await expect(page.getByLabel('Your message')).toBeEnabled({ timeout: 15000 });

  const input = page.getByLabel('Your message');
  await input.fill('ESC key test. A bank refused to help me.');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(
    page.getByText(/ESC key test/i).first(),
  ).toBeVisible({ timeout: 15000 });

  await page.getByRole('button', { name: 'Professional' }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();

  // ESC anywhere on page cancels.
  await page.keyboard.press('Escape');

  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Standard' }),
  ).toHaveAttribute('aria-pressed', 'true');

  expect(nativeConfirmFired).toBe(false);
});

test('New conversation button: ConfirmBar appears when there is user content', async ({ page }) => {
  let nativeConfirmFired = false;
  page.on('dialog', async (d) => {
    nativeConfirmFired = true;
    await d.dismiss();
  });

  await page.goto('/chat');
  await expect(page.getByLabel('Your message')).toBeEnabled({ timeout: 15000 });

  await page.getByLabel('Your message').fill('New conversation test.');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(
    page.getByText(/New conversation test/i).first(),
  ).toBeVisible({ timeout: 15000 });

  await page.getByRole('button', { name: /Start a new conversation/i }).click();

  const bar = page.getByRole('alertdialog');
  await expect(bar).toBeVisible();
  await expect(bar).toContainText(/Start a fresh conversation/i);

  // Cancel and ensure messages survive.
  await bar.getByRole('button', { name: 'Cancel' }).click();
  await expect(bar).toHaveCount(0);
  await expect(page.getByText(/New conversation test/i).first()).toBeVisible();

  expect(nativeConfirmFired).toBe(false);
});
