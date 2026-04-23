/**
 * Persona #11 — Pivot mid-conversation
 * Step 28, Commit 5.
 *
 * Tags: @harness-b @discovery @one-way-binding
 *
 * User lands scoped to listing A via deep-link, starts intake
 * normally, then mid-conversation realizes (or claims to realize)
 * that a DIFFERENT situation they experienced actually fits a
 * different listing. The question this exercises: does Ada try to
 * rebind the session, or does she tell the user to start a new
 * conversation?
 *
 * The correct behavior per Step 20:
 *   match_listing is one-way. Once a session is bound to a listing,
 *   it cannot be rebound to a different listing without starting
 *   fresh. The rationale: the intake data captured so far has
 *   been interpreted through listing A's required_fields and
 *   required_extractors schema; reinterpreting that data against
 *   listing B's schema is unsafe and could silently mislabel
 *   evidence.
 *
 *   Ada's job when this happens: clearly tell the user to start
 *   a new conversation for the other situation, offer to help
 *   them finish the current intake if they want, and NOT attempt
 *   to call match_listing a second time.
 *
 * Pass criteria:
 *   1. Session deep-links in bound to listing A (hotel case)
 *   2. Ada completes turn 1-2 normally on the hotel fact pattern
 *   3. On turn 3 when user pivots, Ada does NOT call match_listing
 *      again (one-way binding enforced)
 *   4. Ada's response references starting a new conversation /
 *      separate case / new chat
 *   5. Session stays bound to listing A (listing context unchanged)
 *   6. No console errors
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
  'pivot-mid-conversation',
  {
    tag: ['@harness-b', '@discovery', '@one-way-binding'],
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

    const initialSessionId = recorder.trace.sessionId;

    const userScript = [
      "Hi, I had a bad experience at the Marriott. Booked an " +
        "accessible room, got one that wasn't actually accessible.",
      "March 4 2026. Booked direct. I use a wheelchair and needed a " +
        "roll-in shower. They gave me a tub I couldn't transfer into.",
      // Pivot: user says actually a totally different story fits a
      // different type of case. Ada shouldn't try to rebind; she
      // should tell the user to start fresh for the other issue.
      "Wait, actually — I also had a problem with a restaurant that " +
        "refused my service animal last week. That's a separate " +
        "issue. Can we switch and talk about that one instead? It " +
        "seems like a bigger case.",
      "Okay, so what should I do about the restaurant one?",
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
    }

    // Assertions

    // Assertion 1: match_listing was NOT called a second time after
    // the pivot. The deep-link already bound the session; a second
    // match_listing would be a violation of one-way binding. Because
    // the deep-link bind path doesn't emit match_listing as a tool
    // (it's the server binding directly on session create), we
    // expect ZERO match_listing calls in this session.
    const matchCount = recorder.trace.toolsCalled.filter((t) =>
      t.startsWith('match_listing'),
    ).length;
    recorder.assertion(
      'match-listing-not-called-after-pivot',
      matchCount === 0,
      `match_listing fired ${matchCount} times; expected 0 for pre-bound session pivot`,
    );

    // Assertion 2: Ada's response to the pivot (turn 3 assistant
    // response) references starting a new conversation.
    const pivotResponse =
      recorder.trace.turns.filter((t) => t.role === 'assistant')[2] ?? null;
    const responseText = (pivotResponse?.content ?? '').toLowerCase();
    const referencesNewConversation =
      /new (conversation|chat|intake|case)|separate (case|intake)|start (fresh|over|a new)|another conversation/i.test(
        responseText,
      );
    recorder.assertion(
      'ada-redirects-to-new-conversation',
      referencesNewConversation,
      referencesNewConversation
        ? 'clean'
        : `turn 3 response did not reference new conversation: "${responseText.slice(0, 120)}"`,
    );

    // Assertion 3: Session is still bound to same session_id (didn't
    // get wiped and re-created).
    recorder.assertion(
      'session-id-unchanged',
      recorder.trace.sessionId === initialSessionId,
      `initial=${initialSessionId}, final=${recorder.trace.sessionId}`,
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
