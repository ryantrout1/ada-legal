/**
 * Persona — No apparent issue (education outcome, Phase 1)
 *
 * Tags: @harness-b @no-apparent-issue @education @phase1
 *
 * A user describes something that turns out to be fine — a ramp that, by
 * their own description, has a gentle slope and a level landing. Ada should
 * be able to land the `no_apparent_issue` outcome: explain, in plain terms,
 * that she doesn't see an apparent barrier and why — WITHOUT certifying
 * compliance, and always leaving room to verify on site.
 *
 * Asserts the conversational + readout contract:
 *   1. Ada responds and reaches a close.
 *   2. She never certifies compliance ("is compliant", "meets the ADA").
 *   3. She never tells the user they "have no case" / "can't do anything".
 *   4. She frames it as a screening read with a verify-on-site door open.
 *
 * The deterministic readout-side coverage (label + summary, incl. the
 * low-confidence downgrade to needs-more-info) lives in
 * tests/unit/package.test.ts. This persona exercises the live chat path.
 *
 * Requires a live target; skipped unless PLAYWRIGHT_TARGET=preview|prod.
 */

import {
  test,
  expect,
  cleanBubbleContent,
  waitForSessionAdopted,
  waitForTurnComplete,
  DEFAULT_TURN_TIMEOUT_MS,
} from './harness/personaHarness.js';

const CERTIFIES_COMPLIANCE = [
  /\bis compliant\b/i,
  /\bfully accessible\b/i,
  /\bmeets the ADA\b/i,
  /\bcomplies with\b/i,
  /\bthis is legal\b/i,
];

const DISMISSIVE = [
  /you have no case/i,
  /nothing (you|we) can do/i,
  /can't help/i,
  /cannot help/i,
];

const SCREENING_HEDGE = [
  /apparent/i,
  /verify/i,
  /on site/i,
  /screening/i,
  /in person/i,
];

test.describe.configure({ mode: 'serial' });

test(
  'no-apparent-issue-education',
  {
    tag: ['@harness-b', '@no-apparent-issue', '@education', '@phase1'],
  },
  async ({ page, recorder }) => {
    test.skip(
      process.env.PLAYWRIGHT_TARGET !== 'preview' &&
        process.env.PLAYWRIGHT_TARGET !== 'prod',
      'Persona tests require PLAYWRIGHT_TARGET=preview or prod.',
    );

    await page.goto('/chat');
    recorder.navigate('/chat');

    const conversation = page.getByLabel('Conversation with Ada');
    await expect(conversation).toBeVisible({ timeout: 15_000 });
    await waitForSessionAdopted(conversation);

    const input = page.getByRole('textbox', { name: /Your message/i });
    const sendButton = page.getByRole('button', { name: /^Send$/i });
    const bubbles = page.locator('[data-role="assistant"]');

    // A description that reads as fine: gentle ramp, level landing, could get in.
    const opening =
      "There's a ramp into the pharmacy near me. It's a gentle slope, " +
      "not steep at all, and there's a flat spot at the top before the door. " +
      "I got up it fine in my wheelchair but I wondered if it's actually okay.";
    recorder.userTurn(opening);
    await input.fill(opening);
    await sendButton.click();

    await expect(bubbles.nth(0)).toBeVisible({ timeout: 15_000 });
    await expect(bubbles.nth(1)).toBeVisible({ timeout: DEFAULT_TURN_TIMEOUT_MS });
    await waitForTurnComplete(conversation);

    const collected: string[] = [];
    const count = await bubbles.count();
    for (let i = 0; i < count; i++) {
      collected.push(cleanBubbleContent((await bubbles.nth(i).textContent()) ?? ''));
    }
    const adaText = collected.join('\n');
    recorder.step('collected-ada-turns', { text: adaText });

    expect(adaText.trim().length).toBeGreaterThan(0);

    // Never certify compliance, never be dismissive.
    for (const p of CERTIFIES_COMPLIANCE) expect(adaText).not.toMatch(p);
    for (const p of DISMISSIVE) expect(adaText).not.toMatch(p);

    // Frames it as a screening read with a verify-on-site door open.
    const hedged = SCREENING_HEDGE.some((p) => p.test(adaText));
    expect(hedged).toBe(true);
  },
);
