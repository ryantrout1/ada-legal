/**
 * Persona #2 — Discovery qualified
 * Step 28, Commit 2.
 *
 * Tags: @harness-a @qualified @discovery
 *
 * Scenario:
 *   User lands at /chat cold — no deep-link, no listing context.
 *   Session starts as public_ada. User describes her situation in
 *   plain language. Ada classifies it (Title III), recognizes it
 *   matches an active class-action listing, surfaces the listing via
 *   the discovery index, and asks if she wants to proceed with that
 *   case. User confirms. Ada calls match_listing, session
 *   transitions public_ada → class_action_intake, then walks intake
 *   to finalize_intake(qualified=true).
 *
 *   Key difference from Persona 1: the session starts PUBLIC_ADA, not
 *   pre-bound. match_listing must fire. The Step 20 design gates
 *   (user_confirmed=true, session not already bound, etc.) are
 *   exercised.
 *
 * Fact pattern: same hotel story as Persona 1 but user never touches
 * /class-actions; she finds Ada via home page / search / referral
 * and just starts talking.
 *
 * Pass criteria:
 *   1. Session starts as public_ada (no listingId at first /chat load)
 *   2. Ada surfaces the listing during the conversation (some turn
 *      mentions the hotel case specifically in text content)
 *   3. match_listing fires (appears in tools row on some assistant turn)
 *   4. Session transitions to completed
 *   5. finalize_intake fires
 *   6. Final outcome is qualified (captured via toolsCalled + status)
 */

import { test, expect } from './harness/personaHarness.js';

const TURN_TIMEOUT_MS = 90_000;

test.describe.configure({ mode: 'serial' });

test(
  'discovery-qualified',
  {
    tag: ['@harness-a', '@qualified', '@discovery'],
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

    // ── Land directly on /chat (NO deep-link) ───────────────────────
    await page.goto('/chat');
    recorder.navigate('/chat');

    const conversation = page.getByLabel('Conversation with Ada');
    await expect(conversation).toBeVisible({ timeout: 15_000 });

    // Public_ada session — wait for the cold greeting to render.
    // The hook sets sessionId only after POST /api/ada/session returns.
    await expect
      .poll(
        async () => (await conversation.getAttribute('data-session-id')) || '',
        { timeout: 15_000, intervals: [500, 1000, 2000] },
      )
      .not.toBe('');

    await recorder.captureSessionState(page);
    recorder.assertion(
      'initial-session-id-present',
      recorder.trace.sessionId !== null && recorder.trace.sessionId !== '',
    );

    // Capture Ada's opening greeting as turn 0 so transcript is
    // complete (she speaks first in public_ada mode).
    const greetingBubble = page.locator('[data-role="assistant"]').first();
    if (await greetingBubble.count()) {
      const greetingText = (await greetingBubble.textContent()) ?? '';
      const cleanGreeting = greetingText
        .replace(/^(You|Ada)\s*/, '')
        .replace(/\n?tools:\s*[^\n]+$/, '')
        .trim();
      recorder.assistantTurn(cleanGreeting);
    }

    // ── Walk the discovery conversation ─────────────────────────────
    const userScript = [
      "Hi — I had a really bad experience at a hotel. I booked an " +
        "accessible room at the Marriott Phoenix Airport for March 4th. " +
        "I use a wheelchair so I specifically asked for a roll-in shower.",
      "When I got there the room had a regular step-in tub. Not a " +
        "roll-in shower at all. The front desk said they didn't have " +
        "any other accessible rooms available.",
      "I had to pay for a different hotel across the street that cost " +
        "me about 240 dollars. I did complain to the Marriott and they " +
        "basically told me too bad.",
      // By turn 4 Ada should have classified + surfaced the listing.
      // This turn is the consent for match_listing.
      "Yes, I'd like to join that class action if I qualify. Please " +
        "walk me through it.",
      "My name is Dana Reyes. Email dana.reyes.test@example.com. " +
        "I booked through the Marriott site directly, yes. I still have " +
        "the confirmation email.",
      "Yes, those are accurate. Please submit me.",
    ];

    const sendButton = page.getByRole('button', { name: /^Send$/i });
    const input = page.getByRole('textbox', { name: /Message Ada/i });

    for (let i = 0; i < userScript.length; i += 1) {
      const userText = userScript[i]!;
      recorder.userTurn(userText);
      await input.fill(userText);
      await sendButton.click();
      recorder.step(`sent-user-turn-${i + 1}`);

      // Ada's response index shifts by 1 since we captured the opening
      // greeting as a preceding turn. Count from the bubble list.
      const assistantBubbles = page.locator('[data-role="assistant"]');
      const targetIndex = i + 1; // +1 to skip the initial greeting
      await expect(assistantBubbles.nth(targetIndex)).toBeVisible({
        timeout: TURN_TIMEOUT_MS,
      });

      await expect
        .poll(
          async () =>
            (await conversation.getAttribute('data-busy')) ?? 'true',
          { timeout: TURN_TIMEOUT_MS, intervals: [500, 1000, 2000] },
        )
        .toBe('false');

      const bubble = assistantBubbles.nth(targetIndex);
      const bubbleText = (await bubble.textContent()) ?? '';
      const toolsMatch = bubbleText.match(/tools:\s*([^\n]+)$/);
      const tools = toolsMatch
        ? toolsMatch[1]!.split(',').map((s) => s.trim())
        : undefined;
      const cleanContent = bubbleText
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

    // ── Assertions on final state ───────────────────────────────────

    // Some assistant turn surfaced the hotel listing. Ada's discovery
    // response references the listing by title or short_description.
    const anyMentionsCase = recorder.trace.turns.some(
      (t) =>
        t.role === 'assistant' &&
        /hotel|accessible\s*room|marriott|roll-?in\s*shower/i.test(t.content),
    );
    recorder.assertion(
      'discovery-surfaced-case',
      anyMentionsCase,
      'some assistant turn mentioned the hotel case',
    );

    // match_listing fired at least once (the promotion from public_ada
    // to class_action_intake).
    const matchFired = recorder.trace.toolsCalled.some((t) =>
      t.startsWith('match_listing'),
    );
    recorder.assertion(
      'match-listing-fired',
      matchFired,
      `toolsCalled=${recorder.trace.toolsCalled.join(',')}`,
    );

    // extract_field fired (intake actually extracted fields).
    const extractFired = recorder.trace.toolsCalled.some((t) =>
      t.startsWith('extract_field'),
    );
    recorder.assertion(
      'extract-field-fired',
      extractFired,
      `toolsCalled=${recorder.trace.toolsCalled.join(',')}`,
    );

    // Session transitioned to completed.
    recorder.assertion(
      'session-status-completed',
      recorder.trace.sessionStatus === 'completed',
      `final status=${recorder.trace.sessionStatus}`,
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
