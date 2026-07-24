/**
 * Persona — Barrier experience questions (Phase 0, no-measurement rule)
 *
 * Tags: @harness-b @barrier @title-iii @phase0
 *
 * A user describes a physical barrier (a steep ramp) WITHOUT giving any
 * measurements. Ada must gather context by asking what the person
 * EXPERIENCED — never by asking the claimant for a dimension, slope,
 * width, or clearance. Those belong to the photo analyzer, not the
 * self-represented person.
 *
 * This asserts the conversational contract added in Phase 0's barrier
 * experience-question module:
 *   1. Ada responds and continues the intake.
 *   2. Across her question turns she never demands a unit measurement
 *      ("what's the slope", "how many inches", "the rise and run", etc.).
 *   3. She asks at least one lived-experience question (could you get in /
 *      up / around / to it).
 *
 * Like the other personas, this requires a live target and is skipped
 * unless PLAYWRIGHT_TARGET=preview|prod. Ryan runs it live; the in-repo
 * deterministic coverage of the module lives in
 * tests/unit/promptAssemble.test.ts.
 */

import {
  test,
  expect,
  cleanBubbleContent,
  waitForSessionAdopted,
  waitForTurnComplete,
  DEFAULT_TURN_TIMEOUT_MS,
} from './harness/personaHarness.js';

// Patterns that would mean Ada asked the CLAIMANT for a measurement.
// The barrier module forbids all of these on the user-facing side.
const MEASUREMENT_ASK = [
  /what (is|are) the (rise|run|slope|clear width|width|clearance)/i,
  /how (many|wide|steep) .*(inch|inches|degree|degrees)/i,
  /\brise and run\b/i,
  /\b1:12\b/i,
  /measure the (slope|width|ramp|door)/i,
];

// Patterns that indicate a lived-experience question was asked.
const EXPERIENCE_ASK = [
  /could you get (in|up|around|to)/i,
  /were you able to get/i,
  /was there (another way|room to turn|any other way)/i,
  /too steep/i,
  /blocking|blocked|in the way/i,
];

test.describe.configure({ mode: 'serial' });

test(
  'ada-barrier-experience-questions',
  {
    tag: ['@harness-b', '@barrier', '@title-iii', '@phase0'],
  },
  async ({ page, recorder }) => {
    test.skip(
      process.env.PLAYWRIGHT_TARGET !== 'preview' &&
        process.env.PLAYWRIGHT_TARGET !== 'prod',
      'Persona tests require PLAYWRIGHT_TARGET=preview or prod.',
    );

    await page.goto('/ada');
    recorder.navigate('/ada');

    const conversation = page.getByLabel('Conversation with Ada');
    await expect(conversation).toBeVisible({ timeout: 15_000 });
    await waitForSessionAdopted(conversation);

    const input = page.getByRole('textbox', { name: /Your message/i });
    const sendButton = page.getByRole('button', { name: /^Send$/i });
    const bubbles = page.locator('[data-role="assistant"]');

    // Opening: a barrier with NO measurements offered.
    const opening =
      "There's a ramp at a store near me that felt way too steep. " +
      "I use a wheelchair and I couldn't get up it by myself.";
    recorder.userTurn(opening);
    await input.fill(opening);
    await sendButton.click();

    await expect(bubbles.nth(0)).toBeVisible({ timeout: 15_000 });
    await expect(bubbles.nth(1)).toBeVisible({ timeout: DEFAULT_TURN_TIMEOUT_MS });
    await waitForTurnComplete(conversation);

    // Collect the assistant's visible text across the first couple of turns.
    const collected: string[] = [];
    const count = await bubbles.count();
    for (let i = 0; i < count; i++) {
      collected.push(cleanBubbleContent((await bubbles.nth(i).textContent()) ?? ''));
    }
    const adaText = collected.join('\n');
    recorder.step('collected-ada-turns', { text: adaText });

    // 1. Ada continued the intake.
    expect(adaText.trim().length).toBeGreaterThan(0);

    // 2. Ada never asked the CLAIMANT for a measurement.
    for (const pattern of MEASUREMENT_ASK) {
      expect(adaText).not.toMatch(pattern);
    }

    // 3. Ada asked at least one lived-experience question.
    const askedExperience = EXPERIENCE_ASK.some((p) => p.test(adaText));
    expect(askedExperience).toBe(true);
  },
);
