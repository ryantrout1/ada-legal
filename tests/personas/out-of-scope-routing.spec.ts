/**
 * Persona #15 — Out-of-scope routing
 * Step 28, Commit 6.
 *
 * Tags: @harness-b @out-of-scope @routing
 *
 * User describes a non-ADA issue. The platform is for ADA-related
 * matters only (Title I employment, Title II gov services,
 * Title III public accommodation). This persona sends a scenario
 * that is NOT an ADA violation — age discrimination at work, or
 * a landlord-tenant dispute, or a consumer credit problem.
 *
 * The correct behavior:
 *   1. Ada recognizes the matter is outside ADA scope
 *   2. Ada does NOT classify (set_classification with an ADA
 *      title would be wrong); if she does classify, she should
 *      transition the session to completed quickly, not walk
 *      a full intake
 *   3. Ada offers an appropriate referral — EEOC for employment
 *      discrimination, housing counselor for landlord-tenant,
 *      state attorney general for consumer issues, or a generic
 *      "we're only set up to help with ADA matters, here's where
 *      to look instead" referral
 *   4. Ada does NOT fake an intake by calling extract_field on
 *      fields that don't apply
 *
 * The failure mode this guards against:
 *   Ada "be helpful" failure where she tries to treat any story
 *   as an ADA story because the user landed on an ADA platform.
 *   Users who land on ADA with non-ADA problems are doing so by
 *   mistake (or out of desperation); forcing their story into
 *   the wrong mold wastes their time and generates garbage data.
 *
 * Pass criteria:
 *   1. set_classification either didn't fire, or fired with a
 *      sentinel like 'out_of_scope' or 'none'. If it fired with
 *      one of the three ADA titles, that's a FAIL.
 *   2. extract_field fired ≤2 times (minimal, not full intake)
 *   3. Session reaches completed quickly (≤4 user turns)
 *   4. Ada's final response references a NON-ADA resource
 *      (EEOC, housing, civil rights, etc.) OR explicitly says
 *      she can only help with ADA
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

const ADA_TITLES = ['title_i', 'title_ii', 'title_iii'];

test.describe.configure({ mode: 'serial' });

test(
  'out-of-scope-routing',
  {
    tag: ['@harness-b', '@out-of-scope', '@routing'],
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

    await page.goto('/chat');
    recorder.navigate('/chat');

    const conversation = page.getByLabel('Conversation with Ada');
    await expect(conversation).toBeVisible({ timeout: 15_000 });
    await waitForSessionAdopted(conversation);
    await recorder.captureSessionState(page);

    // Fact pattern: landlord-tenant dispute. User's landlord
    // raised the rent beyond the lease's stated cap and is trying
    // to evict when she protested. No disability involved. NOT an
    // ADA matter — classic Title X matter (housing), which Ada
    // does not handle.
    const userScript = [
      "Hi — I need help with a landlord issue. My landlord raised my " +
        "rent beyond what my lease allows and now he's trying to " +
        "evict me because I told him he couldn't do that.",
      "It's a regular rental, nothing to do with a disability. I just " +
        "don't know where to turn. Can you help?",
      "Okay, do you know who I could contact?",
      "Thanks.",
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

    // Classification should not have fired with an ADA title. Ada
    // either avoided classifying (correct) or classified as
    // out_of_scope (also acceptable). We fail if she classified
    // as one of the three ADA titles.
    const adaTitleClassifications = recorder.trace.turns.flatMap((t) => {
      if (t.role !== 'assistant' || !t.tools) return [];
      return t.tools.filter((tool) => {
        if (!tool.startsWith('set_classification')) return false;
        return ADA_TITLES.some((title) => tool.toLowerCase().includes(title));
      });
    });
    recorder.assertion(
      'did-not-misclassify-as-ada',
      adaTitleClassifications.length === 0,
      adaTitleClassifications.length > 0
        ? `misclassified: ${adaTitleClassifications.join(', ')}`
        : 'clean',
    );

    // Intake fields should be minimal — not a full intake on a
    // wrongly-accepted case.
    const extractCount = recorder.trace.turns.reduce((n, t) => {
      if (t.role !== 'assistant' || !t.tools) return n;
      return n + t.tools.filter((tool) => tool.startsWith('extract_field')).length;
    }, 0);
    recorder.assertion(
      'extract-field-count-low',
      extractCount <= 2,
      `extract_field fired ${extractCount} times (expected ≤2)`,
    );

    // Ada should have redirected to a non-ADA resource or said she
    // only handles ADA matters.
    const allAssistantText = recorder.trace.turns
      .filter((t) => t.role === 'assistant')
      .map((t) => t.content.toLowerCase())
      .join(' ');
    const referencesNonAdaResource =
      /legal aid|housing (counselor|court|authority)|tenant (rights|advocacy|hotline)|bar association|only (help|handle) (with )?ada|outside (our scope|what i can help)|cannot (help|assist) with (this|non-ada)/i.test(
        allAssistantText,
      );
    recorder.assertion(
      'referred-to-appropriate-resource',
      referencesNonAdaResource,
      referencesNonAdaResource
        ? 'clean'
        : 'no non-ADA referral or scope-limit phrasing found',
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
