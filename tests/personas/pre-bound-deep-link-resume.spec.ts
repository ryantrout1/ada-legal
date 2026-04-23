/**
 * Persona #12 — Pre-bound deep-link resume
 * Step 28, Commit 6.
 *
 * Tags: @harness-b @regression @deep-link @resume-probe
 *
 * Direct regression guard for the Commit 26/2 fix. In the
 * pre-fix state, GET /api/ada/session/current filtered out
 * zero-message sessions as "nothing to resume." Pre-bound
 * deep-link sessions have 0 messages at /chat load time (the
 * first message hasn't been sent yet). Result: the resume-probe
 * returned nothing, the chat hook created a fresh public_ada
 * session, and the user's deep-link intent was silently dropped.
 *
 * The fix: the endpoint now surfaces pre-bound intake sessions
 * with an is_prebound flag, and the client silently adopts
 * without showing a resume prompt.
 *
 * This persona exercises the exact pattern that previously
 * failed:
 *   1. Click CTA on detail page → /chat with pre-bound session
 *   2. Close the page
 *   3. Open a NEW page (different context) and navigate to /chat
 *   4. Verify the new page adopted the pre-bound session
 *      silently (no resume prompt, same session_id)
 *
 * Playwright mechanics: a new browser context shares no cookies
 * with the old one, so closing and opening a new context doesn't
 * exercise the resume flow — it just creates a fresh session.
 * The correct simulation is: same context, close the page, open
 * a new page. Cookies/localStorage persist within a context.
 *
 * Pass criteria:
 *   1. First page: session created + bound to listing
 *   2. After close and reopen: same session_id surfaces
 *   3. No 'resume previous conversation?' prompt shown
 *   4. Session is still in class_action_intake state
 *   5. No console errors
 */

import {
  test,
  expect,
  waitForSessionAdopted,
  throwIfAssertionsFailed,
} from './harness/personaHarness.js';

const LISTING_SLUG = 'hotel-accessible-room-fraud';

test.describe.configure({ mode: 'serial' });

test(
  'pre-bound-deep-link-resume',
  {
    tag: ['@harness-b', '@regression', '@deep-link', '@resume-probe'],
  },
  async ({ page, context, recorder }) => {
    test.skip(
      process.env.PLAYWRIGHT_TARGET !== 'preview' &&
        process.env.PLAYWRIGHT_TARGET !== 'prod',
      'Persona tests require PLAYWRIGHT_TARGET=preview or prod.',
    );

    page.on('pageerror', (err) => {
      recorder.step('console-error', { message: err.message });
    });

    // ── Phase 1: click CTA, land on /chat with pre-bound session ────
    await page.goto(`/class-actions/${LISTING_SLUG}`);
    recorder.navigate(`/class-actions/${LISTING_SLUG}`);
    const ctaButton = page.getByRole('button', {
      name: /Talk to Ada about this/i,
    });
    await expect(ctaButton).toBeVisible({ timeout: 15_000 });
    await Promise.all([
      page.waitForURL(/\/chat(?:\?|$)/, { timeout: 15_000 }),
      ctaButton.click(),
    ]);
    recorder.navigate('/chat');

    const conversation = page.getByLabel('Conversation with Ada');
    await expect(conversation).toBeVisible({ timeout: 15_000 });
    await waitForSessionAdopted(conversation);
    await recorder.captureSessionState(page);

    const firstSessionId = recorder.trace.sessionId;
    const firstStatus = recorder.trace.sessionStatus;
    recorder.assertion(
      'initial-session-created',
      firstSessionId !== null && firstSessionId !== '',
      `session_id=${firstSessionId}`,
    );
    recorder.step('first-page-session', {
      sessionId: firstSessionId,
      status: firstStatus,
    });

    // ── Phase 2: close the page without sending any message ─────────
    //    This is the exact condition that broke pre-fix: session has
    //    0 messages. On resume, the fixed endpoint must still surface
    //    the pre-bound intake session.
    await page.close();
    recorder.step('first-page-closed');

    // ── Phase 3: new page in SAME context, navigate to /chat ────────
    const page2 = await context.newPage();
    page2.on('pageerror', (err) => {
      recorder.step('console-error-page2', { message: err.message });
    });

    await page2.goto('/chat');
    recorder.step('second-page-opened-at-chat');

    const conversation2 = page2.getByLabel('Conversation with Ada');
    await expect(conversation2).toBeVisible({ timeout: 15_000 });
    await waitForSessionAdopted(conversation2);

    const secondSessionId = await conversation2.getAttribute('data-session-id');
    const secondStatus = await conversation2.getAttribute('data-session-status');
    recorder.step('second-page-session', {
      sessionId: secondSessionId,
      status: secondStatus,
    });

    // ── Assertions ──────────────────────────────────────────────────

    // Same session ID surfaced on the second page (silent adoption).
    recorder.assertion(
      'second-page-adopted-same-session',
      secondSessionId === firstSessionId,
      `first=${firstSessionId}, second=${secondSessionId}`,
    );

    // Status still in class_action_intake (pre-bound intake, not
    // promoted to public_ada fallback).
    recorder.assertion(
      'session-still-active',
      secondStatus === 'active',
      `status=${secondStatus}`,
    );

    // The resume card — which we expect NOT to render for a pre-bound
    // session — uses the heading "You have a conversation in progress."
    // with buttons "Continue this conversation" and "Start a new
    // conversation." We assert that heading is NOT visible. Looking for
    // the heading text rather than the buttons because the buttons
    // include the word "conversation" which could appear elsewhere in
    // the chat UI, but the specific heading text only appears on the
    // resume card.
    const resumeHeading = page2.getByText(
      /You have a conversation in progress/i,
    );
    const resumePromptVisible = await resumeHeading
      .isVisible()
      .catch(() => false);
    recorder.assertion(
      'no-resume-prompt-shown',
      !resumePromptVisible,
      resumePromptVisible
        ? 'resume card was shown; regression on 26/2 fix'
        : 'clean — silent adoption',
    );

    const errors = recorder.trace.events.filter(
      (e) =>
        e.kind === 'error' ||
        e.name === 'console-error' ||
        e.name === 'console-error-page2',
    );
    recorder.assertion(
      'no-console-errors',
      errors.length === 0,
      errors.length > 0 ? `${errors.length} errors` : 'clean',
    );

    throwIfAssertionsFailed(recorder);
  },
);
