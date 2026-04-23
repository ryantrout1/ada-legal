/**
 * Persona #18 — Chat keyboard flow (a11y)
 * Step 28, Commit 7.
 *
 * Tags: @harness-b @cross-cutting @a11y @keyboard
 *
 * Keyboard-only navigation through the /chat UI. This is the layer
 * of accessibility the static axe-core scan (persona #6) cannot
 * catch: whether tab order makes sense, whether focus visibility
 * is adequate, whether sending a message works without reaching
 * for a mouse, whether the photo-attach affordance is reachable.
 *
 * A keyboard user — a power user who prefers tab navigation OR a
 * screen reader user who MUST use tab navigation — should be able
 * to complete every user-facing action in the chat UI without
 * a pointing device.
 *
 * Scope for Harness B (this persona):
 *   1. Land on /chat (via deep-link or cold)
 *   2. Tab from the page header to the message input in a sensible
 *      order (≤8 tabs to reach input)
 *   3. Type a message, send it with Enter
 *   4. Tab to the photo attach button via keyboard (reachable)
 *   5. Tab to the send button via keyboard (reachable)
 *
 * Pass criteria:
 *   1. Message input is focusable and reachable via tab within
 *      ≤8 tabs from page load
 *   2. Pressing Enter in the filled message input submits (a bubble
 *      appears)
 *   3. Photo-upload label is reachable via keyboard tabbing (so a
 *      screen reader user can attach photos)
 *   4. Send button is reachable via keyboard tabbing
 *   5. No console errors
 *
 * Known limitations:
 *   - Doesn't verify focus ring visibility (requires visual diff)
 *   - Doesn't verify screen-reader announcements (requires a real
 *     AT or Playwright's experimental aria snapshots)
 *   - Doesn't verify Ada's response is announced to AT
 *   These are manual-audit items tracked in
 *   docs/A11Y-MANUAL-CHECKLIST.md, not in this automated harness.
 */

import {
  test,
  expect,
  waitForSessionAdopted,
  waitForTurnComplete,
  throwIfAssertionsFailed,
  DEFAULT_TURN_TIMEOUT_MS,
} from './harness/personaHarness.js';

const MAX_TABS_TO_INPUT = 8;

test.describe.configure({ mode: 'serial' });

test(
  'chat-keyboard-flow-a11y',
  {
    tag: ['@harness-b', '@cross-cutting', '@a11y', '@keyboard'],
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

    // Cold /chat — public_ada session. Keyboard user never touched
    // the mouse, so we explicitly start focus on the body.
    await page.goto('/chat');
    recorder.navigate('/chat');

    const conversation = page.getByLabel('Conversation with Ada');
    await expect(conversation).toBeVisible({ timeout: 15_000 });
    await waitForSessionAdopted(conversation);
    await recorder.captureSessionState(page);

    // Reset focus to the start of the page so tab order is
    // deterministic. An actual a11y user would land here via
    // address-bar navigation or skip-links.
    await page.evaluate(() => {
      const skip = document.querySelector<HTMLElement>(
        'a[href="#main-content"], a[href="#content"], a[href="#chat"]',
      );
      if (skip) skip.focus();
      else document.body.focus();
    });

    // ── Assertion 1: tab-to-input within MAX_TABS_TO_INPUT ──────────
    let tabCount = 0;
    let reachedInput = false;
    for (let i = 0; i < MAX_TABS_TO_INPUT; i += 1) {
      await page.keyboard.press('Tab');
      tabCount += 1;
      const role = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        return {
          tag: el.tagName,
          role: el.getAttribute('role'),
          ariaLabel: el.getAttribute('aria-label'),
          name: (el as HTMLElement).getAttribute('name'),
          id: el.id,
        };
      });
      recorder.step(`tab-${i + 1}`, role ?? {});
      if (
        role &&
        (role.ariaLabel?.toLowerCase().includes('message ada') ||
          role.id === 'message-input' ||
          role.tag === 'TEXTAREA')
      ) {
        reachedInput = true;
        break;
      }
    }
    recorder.assertion(
      'message-input-reachable-via-tab',
      reachedInput,
      reachedInput
        ? `reached in ${tabCount} tabs`
        : `not reached after ${MAX_TABS_TO_INPUT} tabs`,
    );

    if (!reachedInput) {
      // Don't continue testing keyboard flow if we couldn't even
      // reach the input — all subsequent assertions would compound
      // on that failure without adding information.
      throwIfAssertionsFailed(recorder);
      return;
    }

    // ── Assertion 2: type + Enter sends ─────────────────────────────
    const msg = "Hi — keyboard-only user here. Testing a message.";
    recorder.userTurn(msg);
    await page.keyboard.type(msg);
    await page.keyboard.press('Enter');
    recorder.step('sent-via-enter-key');

    const bubbles = page.locator('[data-role="assistant"]');
    await expect(bubbles.nth(0)).toBeVisible({
      timeout: DEFAULT_TURN_TIMEOUT_MS,
    });
    await waitForTurnComplete(conversation);
    recorder.assertion(
      'enter-key-submitted-message',
      true,
      'assistant bubble appeared after Enter',
    );

    // Capture Ada's first response so the transcript is complete.
    const firstText = (await bubbles.nth(0).textContent()) ?? '';
    recorder.assistantTurn(
      firstText.replace(/^(You|Ada)\s*/, '').replace(/\n?tools:\s*[^\n]+\s*$/, '').trim(),
    );

    // ── Assertion 3: photo-upload label reachable via keyboard ──────
    // Reset focus and tab until we hit a label/input associated with
    // photo upload, or run out of patience.
    await page.evaluate(() => document.body.focus());
    let photoReached = false;
    for (let i = 0; i < 20; i += 1) {
      await page.keyboard.press('Tab');
      const found = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return false;
        const html = el as HTMLElement;
        if (html.id === 'photo-upload') return true;
        if (
          html.getAttribute('for') === 'photo-upload' ||
          (html.tagName === 'LABEL' &&
            (html as HTMLLabelElement).htmlFor === 'photo-upload')
        )
          return true;
        // Some setups put a clickable LABEL with explicit role/aria;
        // check for 'Photo' text too.
        if (
          html.textContent?.trim() === 'Photo' ||
          html.getAttribute('aria-label')?.toLowerCase().includes('photo')
        )
          return true;
        return false;
      });
      if (found) {
        photoReached = true;
        recorder.step('photo-upload-reached-via-tab', { atTab: i + 1 });
        break;
      }
    }
    recorder.assertion(
      'photo-upload-reachable-via-keyboard',
      photoReached,
      photoReached
        ? 'clean'
        : 'photo-upload label not reached within 20 tabs',
    );

    // ── Assertion 4: send button reachable ──────────────────────────
    // Reset focus again and look for send button.
    await page.evaluate(() => document.body.focus());
    let sendReached = false;
    for (let i = 0; i < 20; i += 1) {
      await page.keyboard.press('Tab');
      const found = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return false;
        const html = el as HTMLElement;
        return (
          html.tagName === 'BUTTON' &&
          (html.textContent?.trim() === 'Send' ||
            html.getAttribute('aria-label')?.toLowerCase() === 'send')
        );
      });
      if (found) {
        sendReached = true;
        recorder.step('send-button-reached-via-tab', { atTab: i + 1 });
        break;
      }
    }
    recorder.assertion(
      'send-button-reachable-via-keyboard',
      sendReached,
      sendReached ? 'clean' : 'Send button not reached within 20 tabs',
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
