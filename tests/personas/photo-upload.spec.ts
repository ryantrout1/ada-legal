/**
 * Persona #13 — Photo upload (Title III with visual evidence)
 * Step 28, Commit 6.
 *
 * Tags: @harness-b @photo-upload @title-iii
 *
 * User describes an accessibility violation AND attaches a photo.
 * The admin-side PhotoAnalyzer pipeline was fully integrated in
 * April 2026 (per the recent ADALL memory notes). The public chat
 * UI already has the photo-upload affordance: input#photo-upload
 * accepts image/jpeg|png|webp. When a message includes a photo,
 * the payload sent to /api/ada/turn carries both the text and the
 * image; the engine passes the image to the AI with vision, and
 * downstream extract_field can populate violation_subtype from
 * the analysis result.
 *
 * This persona doesn't assert on the structured extraction of
 * photo_analysis (that's server-side and requires intercepting
 * request bodies to verify). It asserts the CLIENT SIDE contract:
 *   1. Photo can be selected without error
 *   2. Photo preview renders (thumbnail + filename)
 *   3. Send button submits the turn
 *   4. Ada's response doesn't fail
 *   5. The conversation continues normally
 *
 * A deeper test that exercises the server-side photo_analysis
 * extraction lives in integration tests that mock OpenAI vision.
 *
 * Pass criteria:
 *   1. Photo preview appears after file selection
 *   2. Sending a photo-attached message succeeds
 *   3. Ada returns a response
 *   4. Session remains in a valid state
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

// A tiny 1x1 red PNG, base64. Playwright's setInputFiles accepts a
// Buffer; this is just enough to exercise the upload path without
// depending on a real image file on disk.
const TINY_RED_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

test.describe.configure({ mode: 'serial' });

test(
  'photo-upload',
  {
    tag: ['@harness-b', '@photo-upload', '@title-iii'],
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

    // Cold /chat load — public_ada session. Fact pattern is a Title
    // III barrier (inaccessible restaurant entrance) rather than a
    // class-action scoped intake. Ada should classify and route
    // appropriately; with a photo, she should also reference what
    // the photo shows.
    await page.goto('/chat');
    recorder.navigate('/chat');

    const conversation = page.getByLabel('Conversation with Ada');
    await expect(conversation).toBeVisible({ timeout: 15_000 });
    await waitForSessionAdopted(conversation);
    await recorder.captureSessionState(page);

    // Turn 1: user's opening message (text only, to set context).
    const input = page.getByRole('textbox', { name: /Message Ada/i });
    const sendButton = page.getByRole('button', { name: /^Send$/i });

    const openingText =
      "Hi — I had a problem at a restaurant. They have a step at the " +
      "entrance with no ramp. I use a wheelchair. I couldn't get in " +
      "and they said they couldn't help me. I took a photo.";
    recorder.userTurn(openingText);
    await input.fill(openingText);
    await sendButton.click();
    recorder.step('sent-user-turn-1-text-only');

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

    // Turn 2: attach the photo + send. This exercises the upload path.
    const fileInput = page.locator('input#photo-upload');
    await fileInput.setInputFiles({
      name: 'restaurant-entrance.png',
      mimeType: 'image/png',
      buffer: Buffer.from(TINY_RED_PNG_BASE64, 'base64'),
    });
    recorder.step('photo-file-selected');

    // Preview should appear. The preview element uses alt text from
    // the filename; look for an image with that alt.
    const preview = page.getByAltText(/restaurant-entrance\.png|Photo preview/i);
    await expect(preview).toBeVisible({ timeout: 10_000 });
    recorder.assertion('photo-preview-visible', true);

    const turn2Text = "Here's the photo I took at the entrance.";
    recorder.userTurn(turn2Text);
    await input.fill(turn2Text);
    await sendButton.click();
    recorder.step('sent-user-turn-2-with-photo');

    await expect(bubbles.nth(1)).toBeVisible({
      timeout: DEFAULT_TURN_TIMEOUT_MS,
    });
    await waitForTurnComplete(conversation);

    const secondText = (await bubbles.nth(1).textContent()) ?? '';
    recorder.assistantTurn(
      cleanBubbleContent(secondText),
      parseToolsFromBubbleText(secondText),
    );
    await recorder.captureSessionState(page);

    // Assertions

    recorder.assertion(
      'ada-responded-after-photo',
      secondText.length > 0,
      `response length=${secondText.length}`,
    );

    // Preview should be GONE after send (the photo was attached to
    // the sent message and the input area should have cleared).
    const previewStillVisible = await page
      .getByAltText(/restaurant-entrance\.png/i)
      .isVisible()
      .catch(() => false);
    recorder.assertion(
      'photo-preview-cleared-after-send',
      !previewStillVisible,
      previewStillVisible ? 'preview stayed visible' : 'clean',
    );

    // Session should still be active (an error in the upload pipeline
    // would likely break the session entirely).
    recorder.assertion(
      'session-still-active',
      recorder.trace.sessionStatus === 'active' ||
        recorder.trace.sessionStatus === 'completed',
      `status=${recorder.trace.sessionStatus}`,
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
