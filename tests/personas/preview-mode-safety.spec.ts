/**
 * Persona #5 — Preview-mode safety
 * Step 28, Commit 2.
 *
 * Tags: @harness-a @regression @preview
 *
 * This persona is a regression guard for the is_test short-circuit
 * shipped in Step 25 Commit 5 (finalize_intake skips all external
 * side effects when session.is_test === true). It's the one that
 * cost the most design effort and the one most likely to silently
 * regress if someone refactors finalize_intake's guard logic.
 *
 * Full validation of "no email actually sent" requires server-side
 * observation (admin intakes list + absence of Resend invocation).
 * This persona runs the CLIENT-SIDE portion: navigate to the admin
 * preview page, run through a qualified intake, confirm the banner
 * renders and the session reaches completed.
 *
 * The admin-side confirmation (is_test=true on the completed intake
 * row, no handoff metadata, no email receipt) is deferred to a
 * Harness B persona that exercises the admin auth flow. Here we
 * just verify the PREVIEW UI path works and the session lifecycle
 * completes without error.
 *
 * Scenario:
 *   Admin navigates to /admin/listings/:id/preview. The preview page
 *   creates an is_test session via POST /api/admin/listings/:id/preview/session
 *   and embeds the chat UI. Banner says "PREVIEW MODE". Admin types
 *   a simulated user story and Ada walks intake. Session eventually
 *   transitions to completed.
 *
 * Preconditions:
 *   - Target must be preview or prod
 *   - Admin Clerk session must already be established in the browser.
 *     For automation this means the test env needs admin cookies set
 *     externally OR the persona signs in programmatically. This
 *     persona does NOT handle sign-in — the admin flow assumes the
 *     runner has the Clerk session cookie already.
 *   - Pilot listing seed must exist
 *
 * Pass criteria:
 *   1. Preview page loads without a 401 (admin authenticated)
 *   2. PREVIEW MODE banner is visible
 *   3. Session is created (session_id present)
 *   4. At least one assistant response comes back successfully
 *   5. No console errors
 *
 * What we explicitly don't assert here:
 *   - is_test flag on the session (requires admin intakes API query
 *     — deferred to is-test-admin-verification persona in Harness B)
 *   - Absence of email sends (server-side observation)
 *   - Full intake to completion (may be long; not the point of this
 *     regression test)
 */

import { test, expect } from './harness/personaHarness.js';

const TURN_TIMEOUT_MS = 90_000;

test.describe.configure({ mode: 'serial' });

test(
  'preview-mode-safety',
  {
    tag: ['@harness-a', '@regression', '@preview'],
  },
  async ({ page, recorder }) => {
    test.skip(
      process.env.PLAYWRIGHT_TARGET !== 'preview' &&
        process.env.PLAYWRIGHT_TARGET !== 'prod',
      'Persona tests require PLAYWRIGHT_TARGET=preview or prod.',
    );

    page.on('pageerror', (err) => {
      recorder.step('console-error', { message: err.message });
    });

    // ── Resolve the pilot listing id via the public API ─────────────
    // We need the listing_id to build the preview URL. Read it from
    // the public listings endpoint, which is unauthenticated.
    const resp = await page.request.get(
      '/api/public/listings?category=ada_title_iii',
    );
    if (!resp.ok()) {
      recorder.assertion(
        'pilot-listing-reachable',
        false,
        `GET /api/public/listings returned ${resp.status()}`,
      );
      throw new Error('Public listings endpoint not reachable');
    }
    const body = (await resp.json()) as {
      listings: Array<{ listing_id: string; slug: string }>;
    };
    const pilot = body.listings.find(
      (l) => l.slug === 'hotel-accessible-room-fraud',
    );
    if (!pilot) {
      recorder.assertion(
        'pilot-listing-present',
        false,
        'hotel-accessible-room-fraud not in active listings',
      );
      throw new Error('Pilot listing not seeded on target');
    }
    recorder.assertion('pilot-listing-reachable', true);
    recorder.step('resolved-pilot-listing', { listingId: pilot.listing_id });

    // ── Navigate to the admin preview ───────────────────────────────
    await page.goto(`/admin/listings/${pilot.listing_id}/preview`);
    recorder.navigate(`/admin/listings/${pilot.listing_id}/preview`);

    // If admin auth is not established, the page redirects to sign-in
    // OR renders a "not authenticated" alert. Detect either.
    const signInHeading = page.getByRole('heading', { name: /sign in/i });
    const unauthAlert = page.getByText(
      /not authenticated/i,
    );
    const previewHeading = page.getByRole('heading', { name: /^Preview$/ });

    // Wait up to 10s for one of the three to appear.
    await Promise.race([
      signInHeading.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {}),
      unauthAlert.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {}),
      previewHeading.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {}),
    ]);

    if (await signInHeading.isVisible().catch(() => false)) {
      recorder.step('admin-not-authenticated-sign-in-redirect');
      recorder.assertion(
        'admin-authenticated',
        false,
        'redirected to sign-in; run persona in browser context with Clerk admin session',
      );
      throw new Error(
        'Admin auth required for preview-mode persona. Set up Clerk admin ' +
          'session in the Playwright browser context.',
      );
    }
    if (await unauthAlert.isVisible().catch(() => false)) {
      recorder.assertion(
        'admin-authenticated',
        false,
        'unauthenticated alert displayed',
      );
      throw new Error('Admin not authenticated on target.');
    }

    recorder.assertion('admin-authenticated', true);
    await expect(previewHeading).toBeVisible({ timeout: 10_000 });

    // ── Preview mode banner visible ─────────────────────────────────
    const banner = page.getByText(/Preview mode\./i);
    await expect(banner).toBeVisible({ timeout: 10_000 });
    recorder.assertion('preview-banner-visible', true);

    // ── Wait for the preview session to initialize ──────────────────
    // Preview page has its own session-creation flow; it posts to
    // /api/admin/listings/:id/preview/session on mount. We wait for
    // the chat input to become enabled as the ready signal.
    const input = page.getByPlaceholder(/Your message/i);
    await expect(input).toBeEnabled({ timeout: 20_000 });
    recorder.assertion('preview-session-ready', true);

    // ── Send one user turn and confirm Ada responds ─────────────────
    const userMsg =
      "I booked an accessible roll-in shower room at the Marriott " +
      "Phoenix Airport. They gave me a step-in tub instead.";
    recorder.userTurn(userMsg);
    await input.fill(userMsg);
    await page.getByRole('button', { name: /^Send$/i }).click();

    // The admin preview page uses its own UI (not the public Chat
    // component) so selectors differ. Any bubble with class
    // bg-surface-100 is an assistant bubble in the preview UI.
    // A more robust approach: wait for the page's busy state to
    // clear by waiting for a "Ada is thinking…" to disappear OR a
    // new bubble to appear.
    await page.waitForFunction(
      () => {
        const thinking = document.body.innerText.includes(
          'Ada is thinking',
        );
        return !thinking;
      },
      { timeout: TURN_TIMEOUT_MS },
    );
    recorder.step('first-assistant-response-received');

    // Record the assistant turn text. We look for any element that
    // contains non-trivial text AFTER the user's message bubble.
    // Best-effort: grab the last assistant-styled bubble.
    const adaBubbles = page.locator('.bg-surface-100');
    const lastBubble = adaBubbles.last();
    if (await lastBubble.count()) {
      const adaText = (await lastBubble.textContent()) ?? '';
      recorder.assistantTurn(adaText.trim());
    }

    // ── Assertions ──────────────────────────────────────────────────

    recorder.assertion(
      'ada-responded',
      recorder.trace.turns.some(
        (t) => t.role === 'assistant' && t.content.length > 0,
      ),
    );

    const errors = recorder.trace.events.filter(
      (e) => e.kind === 'error' || e.name === 'console-error',
    );
    recorder.assertion(
      'no-console-errors',
      errors.length === 0,
      errors.length > 0 ? `${errors.length} errors captured` : 'clean',
    );

    if (recorder.trace.assertions.failed > 0) {
      throw new Error(
        `${recorder.trace.assertions.failed} persona assertion(s) failed. See ` +
          `test-results/personas/<run>/${recorder.trace.slug}/assertions.log`,
      );
    }
  },
);
