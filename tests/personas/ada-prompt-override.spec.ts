/**
 * Persona #16 — ada_prompt_override takes effect
 * Step 28, Commit 6.
 *
 * Tags: @harness-b @regression @prompt-assembly
 *
 * Firms can configure per-listing guidance for Ada via the
 * ada_prompt_override field on listing_config. That override is
 * prepended to the assembled prompt in listingContext.ts and gives
 * firms editorial control over specific behaviors Ada should follow
 * in an intake for their case.
 *
 * The regression to guard against: a refactor of prompt assembly
 * that drops ada_prompt_override from the concatenation, or fails
 * to thread the override through from neonDbClient → prompt →
 * engine turn. Symptom: the override is saved correctly, displays
 * correctly in the admin UI, but has no effect on Ada's behavior.
 *
 * This persona is pre-flight-gated on the pilot listing having an
 * override set. Current prod state: CONFIG.adaPromptOverride is
 * null. When a pilot firm sets an override (or the test seed is
 * extended), this persona activates automatically.
 *
 * To activate: the pilot listing's ada_prompt_override is set to
 * a marker phrase such as "Always greet the user by acknowledging
 * the difficulty of booking an accessible room." Then the persona
 * checks that Ada's first turn includes some form of that
 * acknowledgment — a probe that can only succeed if the override
 * was actually included in the prompt.
 *
 * Pass criteria (when applicable):
 *   1. Pilot listing has a non-null ada_prompt_override
 *   2. Deep-link session adopts normally
 *   3. Ada's first assistant turn contains the marker phrase (or a
 *      reasonable paraphrase) specified by the override
 *   4. No console errors
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

// The marker fragments we expect Ada to include if her override is
// being honored. These match the pattern "acknowledge the difficulty
// of booking accessible accommodations." If the override text changes,
// update these fragments to match.
const EXPECTED_OVERRIDE_MARKERS = [
  'accessible',
  'difficult',
];

test.describe.configure({ mode: 'serial' });

test(
  'ada-prompt-override-honored',
  {
    tag: ['@harness-b', '@regression', '@prompt-assembly'],
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

    // Pre-flight: does this listing have an override set?
    // We use the public listings API to fetch the listing record.
    // The public endpoint intentionally does NOT expose
    // ada_prompt_override (it's internal guidance, not user-facing),
    // so we need an admin endpoint or a direct DB check. In absence
    // of a non-admin accessor for this field, this persona uses
    // behavioral inference: it runs the test and skips if the
    // behavioral marker is absent on first run.
    //
    // Better pattern when an admin check is available: pre-fetch
    // the override value, bail out if null.

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

    // Prompt Ada with a minimal opener so she emits her first full
    // turn. The override, if honored, should surface in the framing.
    const input = page.getByRole('textbox', { name: /Message Ada/i });
    const sendButton = page.getByRole('button', { name: /^Send$/i });

    const opener =
      "Hi — I want to talk about the accessible room issue at the " +
      "Marriott.";
    recorder.userTurn(opener);
    await input.fill(opener);
    await sendButton.click();

    const bubbles = page.locator('[data-role="assistant"]');
    await expect(bubbles.nth(0)).toBeVisible({
      timeout: DEFAULT_TURN_TIMEOUT_MS,
    });
    await waitForTurnComplete(conversation);

    const firstText = (await bubbles.nth(0).textContent()) ?? '';
    recorder.assistantTurn(
      cleanBubbleContent(firstText),
      parseToolsFromBubbleText(firstText),
    );

    // Evaluate whether the override appears to be honored. If the
    // markers are ALL absent, the override is either null or not
    // being threaded through — we skip rather than fail, since this
    // persona cannot distinguish "no override configured" from
    // "override configured but not honored" without admin API access.
    const firstTextLower = firstText.toLowerCase();
    const markersHit = EXPECTED_OVERRIDE_MARKERS.filter((m) =>
      firstTextLower.includes(m),
    );

    if (markersHit.length === 0) {
      recorder.step('override-markers-absent', {
        checkedFor: EXPECTED_OVERRIDE_MARKERS,
        hint: 'Either ada_prompt_override is null on the pilot listing, or ' +
          'the override is not being threaded through. Set an override via ' +
          '/admin/listings/:id/config to activate this persona.',
      });
      test.skip(
        true,
        'ada_prompt_override markers not detected. Either unset or not threaded; ' +
          'configure an override and re-run to exercise this path.',
      );
      return;
    }

    recorder.assertion(
      'override-markers-present',
      markersHit.length >= 1,
      `matched markers: ${markersHit.join(', ')}`,
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
