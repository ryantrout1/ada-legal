/**
 * Persona #9 — Disqualified post-extraction
 * Step 28, Commit 5.
 *
 * Tags: @harness-b @disqualified @listing-scoped
 *
 * Complementary to persona #3 (disqualified-immediate). This user
 * progresses cooperatively through 4-5 turns of intake, answering
 * questions that all sound perfectly eligible, THEN reveals a
 * disqualifying fact deep into the conversation. For example:
 * she gives her name, email, confirms the hotel, confirms the
 * booking channel — and then on turn 5 says "I booked through a
 * third-party site like Expedia" when the listing's
 * disqualifying_conditions include non-direct bookings.
 *
 * The failure mode to guard against: Ada committed to a qualified
 * trajectory after 4 turns of evidence and doesn't reverse course
 * when the late disqualifier lands. Tool calls might include
 * several extract_fields AND a finalize_intake(qualified=true)
 * despite the late fact making the user ineligible.
 *
 * The EXPECTED behavior:
 *   1. Ada recognizes the late disqualifier
 *   2. finalize_intake(qualified=false, disqualifying_reason)
 *   3. Because all earlier fields DID extract, they remain in the
 *      record — we don't nuke intake data just because the outcome
 *      flipped (that's the "intake is a timeline, not a state
 *      snapshot" design principle from Step 20)
 *   4. Ada ideally references WHICH fact disqualified (neutral,
 *      not accusatory)
 *
 * Pass criteria:
 *   1. Multiple extract_field calls fired (the normal intake
 *      succeeded before the late disqualifier)
 *   2. Session reached completed
 *   3. finalize_intake fired
 *   4. Ada's final response references the disqualifying issue
 *      (third-party booking, non-direct, etc.)
 *   5. No console errors
 */

import {
  test,
  expect,
  parseToolsFromBubbleText,
  cleanBubbleContent,
  waitForSessionAdopted,
  waitForTurnComplete,
  throwIfAssertionsFailed,
  DEFAULT_TURN_TIMEOUT_MS,
} from './harness/personaHarness.js';

const LISTING_SLUG = 'hotel-accessible-room-fraud';

test.describe.configure({ mode: 'serial' });

test(
  'disqualified-post-extraction',
  {
    tag: ['@harness-b', '@disqualified', '@listing-scoped'],
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
    await waitForSessionAdopted(conversation);
    await recorder.captureSessionState(page);

    // The user looks qualified on turns 1-4. Late reveal on turn 5
    // flips the eligibility. Third-party booking channel is a common
    // disqualifier for hotel class actions because the class
    // definition typically scopes to direct bookings where the user
    // can prove the accessibility request was communicated to the
    // hotel directly.
    const userScript = [
      "Hi — I booked an accessible room at the Marriott Phoenix " +
        "Airport for March 4, 2026. They gave me the wrong room.",
      "I use a wheelchair. I asked for a roll-in shower. What they " +
        "gave me was a bathtub with a transfer bench, which I cannot " +
        "use. I had to find another hotel that night.",
      "My name is Dana Reyes. dana.reyes.test@example.com.",
      "Yes, I still have the booking confirmation. Out-of-pocket was " +
        "about $240 for the alternate room at the Hyatt.",
      // Late disqualifier: third-party booking channel.
      "Actually — I should mention I booked through Expedia, not " +
        "through Marriott directly. Does that matter?",
      "Okay. Is there anything else I should do?",
    ];

    const sendButton = page.getByRole('button', { name: /^Send$/i });
    const input = page.getByRole('textbox', { name: /Message Ada/i });

    for (let i = 0; i < userScript.length; i += 1) {
      const userText = userScript[i]!;
      recorder.userTurn(userText);
      await input.fill(userText);
      await sendButton.click();

      const bubbles = page.locator('[data-role="assistant"]');
      await expect(bubbles.nth(i)).toBeVisible({
        timeout: DEFAULT_TURN_TIMEOUT_MS,
      });
      await waitForTurnComplete(conversation);

      const text = (await bubbles.nth(i).textContent()) ?? '';
      recorder.assistantTurn(
        cleanBubbleContent(text),
        parseToolsFromBubbleText(text),
      );
      await recorder.captureSessionState(page);

      if (recorder.trace.sessionStatus === 'completed') break;
    }

    // Assertions

    // Early turns DID extract fields (name, email, incident details).
    // We expect ≥2 extract_field calls before the late disqualifier.
    const extractCount = recorder.trace.turns.reduce((n, t) => {
      if (t.role !== 'assistant' || !t.tools) return n;
      return n + t.tools.filter((tool) => tool.startsWith('extract_field')).length;
    }, 0);
    recorder.assertion(
      'multiple-extracts-fired',
      extractCount >= 2,
      `extract_field fired ${extractCount} times (expected ≥2)`,
    );

    recorder.assertion(
      'session-status-completed',
      recorder.trace.sessionStatus === 'completed',
      `status=${recorder.trace.sessionStatus}`,
    );

    recorder.assertion(
      'finalize-intake-fired',
      recorder.trace.toolsCalled.some((t) => t.startsWith('finalize_intake')),
      `toolsCalled=${recorder.trace.toolsCalled.join(',')}`,
    );

    // Final assistant turn or a late turn should reference the
    // third-party/non-direct-booking issue.
    const assistantTurns = recorder.trace.turns.filter(
      (t) => t.role === 'assistant',
    );
    const lateTurns = assistantTurns.slice(-2);
    const lateText = lateTurns.map((t) => t.content.toLowerCase()).join(' ');
    const referencesBookingChannel =
      /third-party|expedia|directly|direct booking|through marriott/i.test(
        lateText,
      );
    recorder.assertion(
      'late-response-references-disqualifier',
      referencesBookingChannel,
      referencesBookingChannel
        ? 'clean'
        : 'final turns did not reference third-party booking issue',
    );

    recorder.assertion(
      'no-console-errors',
      recorder.trace.events.filter(
        (e) => e.kind === 'error' || e.name === 'console-error',
      ).length === 0,
    );

    throwIfAssertionsFailed(recorder);
  },
);
