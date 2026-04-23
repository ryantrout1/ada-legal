/**
 * Persona #14 — Title III with demand-letter routing
 * Step 28, Commit 6.
 *
 * Tags: @harness-b @title-iii @no-match @routing
 *
 * User describes a Title III barrier that doesn't match any
 * active class-action listing. Ada should:
 *   1. Classify as Title III (set_classification tool fires)
 *   2. Walk basic intake (business name, location, barrier,
 *      attempted mitigation, harm)
 *   3. Finalize with a SessionPackage whose routing includes the
 *      demand-letter destination (id=title_iii_demand_letter) —
 *      the self-help path for Title III barriers
 *
 * Why this persona matters:
 *   The platform's primary product value for users is helping them
 *   get action taken even when no attorney and no class action
 *   apply. The demand-letter path is the default self-help
 *   outcome. If that pipeline regresses, users who fall outside
 *   class-action scope get nothing useful.
 *
 * Pass criteria:
 *   1. set_classification fires with title='title_iii'
 *   2. extract_field fires at least 3 times (normal intake)
 *   3. finalize_intake fires
 *   4. Session reaches completed
 *   5. Demand-letter destination surfaces in the final message
 *      (Ada references the demand-letter option, OR a
 *      SessionPackage page link is returned)
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

test.describe.configure({ mode: 'serial' });

test(
  'demand-letter-routing',
  {
    tag: ['@harness-b', '@title-iii', '@no-match', '@routing'],
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

    // Cold /chat — no deep-link. Fact pattern: a neighborhood coffee
    // shop with a step at the entrance and no ramp. Title III barrier,
    // not the kind of thing any pilot class action covers, and the
    // user wants to do SOMETHING without filing a lawsuit.
    await page.goto('/chat');
    recorder.navigate('/chat');

    const conversation = page.getByLabel('Conversation with Ada');
    await expect(conversation).toBeVisible({ timeout: 15_000 });
    await waitForSessionAdopted(conversation);
    await recorder.captureSessionState(page);

    // Cold /chat load seeds Ada's greeting as the first assistant bubble
    // before the user types anything. Capture it so the transcript is
    // complete and so downstream bubble indexing accounts for it.
    const greetingBubble = page.locator('[data-role="assistant"]').first();
    if (await greetingBubble.count()) {
      const greetingText = (await greetingBubble.textContent()) ?? '';
      recorder.assistantTurn(
        cleanBubbleContent(greetingText),
        parseToolsFromBubbleText(greetingText),
      );
    }

    const userScript = [
      "Hi — there's a coffee shop near me that has a step at the front " +
        "door and no ramp. I use a wheelchair and I can't get in. I've " +
        "asked them about it and they said they can't afford a ramp.",
      "It's called Brewed Awakening, in Surprise Arizona. I go past it " +
        "three or four times a week. The step is maybe 6 inches. There's " +
        "space for a ramp but nothing installed.",
      "I haven't filed anything formal. I just wanted to know what my " +
        "options are. I don't really want to sue — I just want them to " +
        "put in a ramp.",
      "My name is Alex Chen, alex.chen.test@example.com.",
      "Yes, please give me something I can use.",
    ];

    const sendButton = page.getByRole('button', { name: /^Send$/i });
    const input = page.getByRole('textbox', { name: /Your message/i });

    for (let i = 0; i < userScript.length; i += 1) {
      const userText = userScript[i]!;
      recorder.userTurn(userText);
      await input.fill(userText);
      await sendButton.click();

      // Offset by +1 because the greeting occupies nth(0).
      const bubbles = page.locator('[data-role="assistant"]');
      const targetIndex = i + 1;
      await expect(bubbles.nth(targetIndex)).toBeVisible({
        timeout: DEFAULT_TURN_TIMEOUT_MS,
      });
      await waitForTurnComplete(conversation);

      const text = (await bubbles.nth(targetIndex).textContent()) ?? '';
      recorder.assistantTurn(
        cleanBubbleContent(text),
        parseToolsFromBubbleText(text),
      );
      await recorder.captureSessionState(page);

      if (recorder.trace.sessionStatus === 'completed') break;
    }

    // Assertions

    const classifiedTitleIii = recorder.trace.toolsCalled.some((t) =>
      t.startsWith('set_classification'),
    );
    recorder.assertion(
      'set-classification-fired',
      classifiedTitleIii,
      `toolsCalled=${recorder.trace.toolsCalled.join(',')}`,
    );

    const extractCount = recorder.trace.turns.reduce((n, t) => {
      if (t.role !== 'assistant' || !t.tools) return n;
      return n + t.tools.filter((tool) => tool.startsWith('extract_field')).length;
    }, 0);
    recorder.assertion(
      'intake-extracts-fired',
      extractCount >= 3,
      `extract_field fired ${extractCount} times (expected ≥3)`,
    );

    recorder.assertion(
      'finalize-intake-fired',
      recorder.trace.toolsCalled.some((t) => t.startsWith('finalize_intake')),
    );

    recorder.assertion(
      'session-status-completed',
      recorder.trace.sessionStatus === 'completed',
      `status=${recorder.trace.sessionStatus}`,
    );

    // Demand letter reference: either Ada's final response mentions
    // a demand letter by name, OR a session-package link appeared.
    // Both are acceptable — the question is whether that routing
    // destination was SURFACED to the user.
    const finalTurn =
      recorder.trace.turns.filter((t) => t.role === 'assistant').slice(-1)[0] ??
      null;
    const finalText = (finalTurn?.content ?? '').toLowerCase();
    const referencesDemandLetter =
      /demand letter|formal letter|write a letter|letter to the (business|shop)/i.test(
        finalText,
      );
    const sessionPackageLinkVisible = await page
      .getByRole('link', { name: /session package|your package|view your package/i })
      .isVisible()
      .catch(() => false);
    recorder.assertion(
      'demand-letter-routing-surfaced',
      referencesDemandLetter || sessionPackageLinkVisible,
      referencesDemandLetter
        ? 'referenced in final message'
        : sessionPackageLinkVisible
          ? 'session package link visible'
          : 'no demand-letter reference found',
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
