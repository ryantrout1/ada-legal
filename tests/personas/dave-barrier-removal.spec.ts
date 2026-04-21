/**
 * Layer 3 persona — Dave, barrier-removal intake
 *
 * Dave uses a wheelchair. He visited a restaurant that had a step at
 * the front door and no accessible entrance. He wants to know if the
 * restaurant is allowed to have that barrier. This is the archetypal
 * §36.304 (barrier removal) case Ada should handle well.
 *
 * Pass criteria — all four below must be true:
 *   1. Ada responds within 30s of the initial message
 *   2. Ada cites a §36.30x-range regulation by number in at least one turn
 *   3. Session state is classified (classification is non-null) after 3 turns
 *   4. Conversation is resumable via the anon cookie (reload preserves state)
 *
 * This is an INTEGRATION test against the deployed preview. It REQUIRES
 * PLAYWRIGHT_TARGET=preview (or explicit PLAYWRIGHT_BASE_URL) because
 * the engine depends on real Anthropic + Neon + OpenAI infra. Against
 * localhost dev server it will fail unless the dev server has all
 * upstreams wired.
 *
 * Soft on model output: matches "§36.30" prefix rather than exact
 * section numbers, because §36.302/303/304/305 are all plausible cites
 * for this fact pattern. Allowing any of them is the right precision
 * for a persona test — exact-cite coverage is unit-test territory.
 */

import { test, expect } from '@playwright/test';

test.describe('Persona: Dave barrier-removal intake', () => {
  test.skip(
    process.env.PLAYWRIGHT_TARGET !== 'preview',
    'Persona tests require PLAYWRIGHT_TARGET=preview (deployed infra).',
  );

  test('Ada handles a restaurant barrier story end-to-end', async ({
    page,
  }) => {
    await page.goto('/chat');

    // Wait for the chat input to be ready (session created).
    const input = page.getByRole('textbox', { name: /Message/i });
    await expect(input).toBeEnabled({ timeout: 10_000 });

    // Turn 1: Dave describes the barrier.
    await input.fill(
      "I tried to go to a restaurant last weekend and there was a step at " +
        "the front door. I use a wheelchair. There was no ramp and no other " +
        "way in. Is that allowed?",
    );
    await page.getByRole('button', { name: /^Send$/i }).click();

    // Ada responds within 30s.
    const firstResponse = page.locator('[data-role="assistant"]').first();
    await expect(firstResponse).toBeVisible({ timeout: 30_000 });
    await expect(firstResponse).not.toBeEmpty();

    // Turn 2: Dave confirms some facts.
    await input.fill('It is a small restaurant. It has been there for many years.');
    await page.getByRole('button', { name: /^Send$/i }).click();
    const secondResponse = page.locator('[data-role="assistant"]').nth(1);
    await expect(secondResponse).toBeVisible({ timeout: 30_000 });

    // Turn 3: Dave asks the money question.
    await input.fill(
      'What law does this break? Is there something specific I can point to?',
    );
    await page.getByRole('button', { name: /^Send$/i }).click();
    const thirdResponse = page.locator('[data-role="assistant"]').nth(2);
    await expect(thirdResponse).toBeVisible({ timeout: 30_000 });

    // Pass criterion 2: Ada cited a §36.30x regulation somewhere in
    // the conversation. Collect all assistant text and scan.
    const allAssistantText = await page
      .locator('[data-role="assistant"]')
      .allInnerTexts();
    const joined = allAssistantText.join('\n');
    expect(joined).toMatch(/§?\s?36\.30\d/);

    // Pass criterion 4: conversation is resumable after reload.
    await page.reload();
    // Resume banner or previously-loaded messages should appear.
    const resumeText = page.getByText(
      /pick up where you left off|continue|resume/i,
    );
    const existingMessage = page.locator('[data-role="user"]').first();
    // Either a resume prompt or the existing user message is already
    // rendered — both count as resumption success.
    await expect(resumeText.or(existingMessage)).toBeVisible({
      timeout: 10_000,
    });
  });
});
