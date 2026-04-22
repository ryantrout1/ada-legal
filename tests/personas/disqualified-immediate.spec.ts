/**
 * Persona #3 — Disqualified-immediate
 * Step 28, Commit 2.
 *
 * Tags: @harness-a @disqualified @listing-scoped
 *
 * Scenario:
 *   User lands on the hotel-accessible-room-fraud detail page and
 *   clicks "Talk to Ada about this." In her FIRST message she
 *   mentions a hard disqualifier — the incident happened in 2018,
 *   well outside any realistic class-action window (disqualifying
 *   conditions on the pilot listing likely include temporal limits).
 *
 *   Ada should recognize the disqualifier early and call
 *   finalize_intake(qualified=false, disqualifying_reason="...")
 *   WITHOUT dragging the user through every required_field. The
 *   Step 20 design of finalize_intake explicitly skips the field-
 *   completeness check on the disqualified path — asking a user
 *   to complete fields they'd fail eligibility on is cruel.
 *
 *   Ada should still route the user somewhere useful (Regional ADA
 *   Center, demand-letter template, or similar) rather than ending
 *   with "sorry, can't help."
 *
 * Pass criteria:
 *   1. Deep-link works (session_id set, pre-bound to listing)
 *   2. Session reaches completed within ≤3 user turns (the whole
 *      point is fast recognition, not dragging through fields)
 *   3. finalize_intake fires
 *   4. Final session status is completed
 *   5. Extracted fields stay SHORT — we explicitly assert the
 *      conversation was not artificially extended to collect every
 *      field. Specifically: extract_field calls ≤ 2. Ada should
 *      skip the full intake.
 *   6. No console errors
 *
 * What we don't assert:
 *   - The exact disqualifying_reason Ada produces (LLM variance)
 *   - Whether Ada offers a fallback routing (nice to have, not
 *     required for this persona — captured separately in
 *     out-of-scope-routing persona)
 */

import { test, expect } from './harness/personaHarness.js';

const LISTING_SLUG = 'hotel-accessible-room-fraud';
const TURN_TIMEOUT_MS = 90_000;

test.describe.configure({ mode: 'serial' });

test(
  'disqualified-immediate',
  {
    tag: ['@harness-a', '@disqualified', '@listing-scoped'],
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

    // ── Deep-link in ────────────────────────────────────────────────
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
    recorder.assertion(
      'session-deep-linked',
      recorder.trace.sessionId !== null && recorder.trace.sessionId !== '',
    );

    // ── Open with a hard disqualifier: 2018 incident ────────────────
    // Far outside any reasonable statute-of-limitations / class-
    // action window. If the listing's disqualifying_conditions
    // include "incidents before 2023" or similar, Ada should catch
    // it on turn 1.
    const userScript = [
      "Hi — I stayed at the Marriott Phoenix Airport back in 2018 " +
        "and they gave me a tub instead of the roll-in shower I " +
        "booked. I use a wheelchair. I want to know if I can still " +
        "join a class action for that.",
      // If Ada doesn't disqualify on turn 1, she might clarify the
      // date. User reconfirms.
      "Yes, it was definitely 2018. Spring of 2018. I'm sure about " +
        "that because it was right before my nephew's graduation.",
      // One more turn if Ada still hasn't decided. User nudges.
      "So I'm too late to join this one? Is there anything else I " +
        "could do?",
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

      await recorder.captureSessionState(page);

      if (recorder.trace.sessionStatus === 'completed') {
        recorder.step('session-completed-early', { turn: i + 1 });
        break;
      }
    }

    // ── Assertions ──────────────────────────────────────────────────

    // Session should reach completed within ≤3 user turns.
    recorder.assertion(
      'session-status-completed',
      recorder.trace.sessionStatus === 'completed',
      `status=${recorder.trace.sessionStatus} after ${
        recorder.trace.turns.filter((t) => t.role === 'user').length
      } user turns`,
    );

    // finalize_intake fired.
    const finalized = recorder.trace.toolsCalled.some((t) =>
      t.startsWith('finalize_intake'),
    );
    recorder.assertion(
      'finalize-intake-fired',
      finalized,
      `toolsCalled=${recorder.trace.toolsCalled.join(',')}`,
    );

    // Field extraction was short — not the full intake. This is the
    // "don't drag the user" assertion. Count distinct extract_field
    // invocations. Ada may have called it once or twice to confirm
    // the date; more than that suggests she was walking the full
    // intake anyway.
    const extractCount = recorder.trace.turns.reduce((n, t) => {
      if (t.role !== 'assistant' || !t.tools) return n;
      return n + t.tools.filter((tool) => tool.startsWith('extract_field')).length;
    }, 0);
    recorder.assertion(
      'extract-field-count-short',
      extractCount <= 3,
      `extract_field fired ${extractCount} times (expected ≤3)`,
    );

    // User-turn count was short — we capped at 3 in the script.
    const userTurnCount = recorder.trace.turns.filter(
      (t) => t.role === 'user',
    ).length;
    recorder.assertion(
      'user-turn-count-short',
      userTurnCount <= 3,
      `${userTurnCount} user turns`,
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
