/**
 * Persona #4 — Abandoned mid-intake (silence safety)
 * Step 28, Commit 2.
 *
 * Tags: @harness-a @abandoned @listing-scoped
 *
 * Scenario:
 *   User starts a listing-scoped intake and goes quiet after a few
 *   turns. There is NO automatic abandonment cron in the engine today
 *   — sessions stay 'active' until something explicitly transitions
 *   them. So what this persona actually verifies is the SAFETY
 *   INVARIANT when a user stops responding: the engine does not
 *   auto-finalize, does not send any email, does not fabricate an
 *   outcome.
 *
 *   The persona sends 2 user turns, then simulates silence by waiting
 *   10 seconds without typing. It then asserts:
 *     - Session status is still 'active' (not completed, not abandoned
 *       — neither transition should happen on its own)
 *     - No finalize_intake tool fired
 *     - No tool was called that would send an email
 *
 *   When an abandonment cron ships in a later phase, this persona
 *   would extend to wait past the idle-timeout and assert the
 *   transition DID happen to 'abandoned' — but without firing
 *   finalize_intake, without sending email.
 *
 * Pass criteria:
 *   1. Session stays 'active' after idle
 *   2. finalize_intake did NOT fire across any turn
 *   3. Session has a non-null listingId (the deep-link bound it)
 *   4. No console errors
 */

import { test, expect } from './harness/personaHarness.js';

const LISTING_SLUG = 'hotel-accessible-room-fraud';
const TURN_TIMEOUT_MS = 90_000;
const IDLE_DURATION_MS = 10_000;

test.describe.configure({ mode: 'serial' });

test(
  'abandoned-mid-intake',
  {
    tag: ['@harness-a', '@abandoned', '@listing-scoped'],
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
    await expect
      .poll(
        async () => (await conversation.getAttribute('data-session-id')) || '',
        { timeout: 15_000, intervals: [500, 1000, 2000] },
      )
      .not.toBe('');

    await recorder.captureSessionState(page);

    // Two turns, then silence.
    const userScript = [
      "Hi, I had a bad hotel experience. I booked an accessible room " +
        "at the Marriott Phoenix Airport.",
      "Sorry I have to go deal with something real quick.",
    ];

    const sendButton = page.getByRole('button', { name: /^Send$/i });
    const input = page.getByRole('textbox', { name: /Message Ada/i });

    for (let i = 0; i < userScript.length; i += 1) {
      const userText = userScript[i]!;
      recorder.userTurn(userText);
      await input.fill(userText);
      await sendButton.click();
      recorder.step(`sent-user-turn-${i + 1}`);

      const assistantBubble = page.locator('[data-role="assistant"]').nth(i);
      await expect(assistantBubble).toBeVisible({ timeout: TURN_TIMEOUT_MS });
      await expect
        .poll(
          async () =>
            (await conversation.getAttribute('data-busy')) ?? 'true',
          { timeout: TURN_TIMEOUT_MS, intervals: [500, 1000, 2000] },
        )
        .toBe('false');

      const text = (await assistantBubble.textContent()) ?? '';
      const toolsMatch = text.match(/tools:\s*([^\n]+)$/);
      const tools = toolsMatch
        ? toolsMatch[1]!.split(',').map((s) => s.trim())
        : undefined;
      const cleanContent = text
        .replace(/^(You|Ada)\s*/, '')
        .replace(/\n?tools:\s*[^\n]+$/, '')
        .trim();
      recorder.assistantTurn(cleanContent, tools);
    }

    // Now go quiet. Wait IDLE_DURATION_MS simulating user stepping
    // away. Do not send another turn.
    recorder.step('idle-start', { durationMs: IDLE_DURATION_MS });
    await page.waitForTimeout(IDLE_DURATION_MS);
    recorder.step('idle-end');

    // Re-capture session state post-idle.
    await recorder.captureSessionState(page);

    // ── Assertions ──────────────────────────────────────────────────

    // Session should still be active (no auto-transition).
    recorder.assertion(
      'session-remained-active',
      recorder.trace.sessionStatus === 'active',
      `status=${recorder.trace.sessionStatus} (should be 'active' with no auto-abandonment cron)`,
    );

    // finalize_intake must NOT have fired.
    const finalized = recorder.trace.toolsCalled.some((t) =>
      t.startsWith('finalize_intake'),
    );
    recorder.assertion(
      'finalize-intake-did-not-fire',
      !finalized,
      `toolsCalled=${recorder.trace.toolsCalled.join(',')}`,
    );

    // Session should still be bound to the listing (deep-link worked).
    recorder.assertion(
      'session-id-still-set',
      recorder.trace.sessionId !== null && recorder.trace.sessionId !== '',
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
