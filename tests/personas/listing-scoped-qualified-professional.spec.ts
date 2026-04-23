/**
 * Persona #8 — Listing-scoped qualified, professional reader
 * Step 28, Commit 5.
 *
 * Tags: @harness-b @qualified @listing-scoped @reading-level
 *
 * Mirror of persona #7. Same fact pattern, reading_level=professional.
 * Exercises the engine's most verbose/technical voice. A user who
 * identifies as having legal or disability-advocacy background would
 * land here and expect Ada to skip the plain-language framing.
 *
 * Pass criteria:
 *   1. Session creates with reading_level=professional
 *   2. Session is pre-bound class_action_intake
 *   3. extract_field fires, session reaches completed with finalize
 *
 * Professional-mode heuristics:
 *   - Average assistant turn is ≥300 chars (can be longer than simple)
 *   - Ada may use precise terms — "§36.302", "roll-in shower per
 *     Standards §608.2.1", "private right of action" — without
 *     explaining them. Unlike simple-mode, this persona PERMITS the
 *     legal register vocabulary; it doesn't require it.
 *
 * What this persona guards against:
 *   Regression where professional-mode drifts to sound identical to
 *   standard-mode (the middle tier). The value proposition of three
 *   distinct reading levels disappears if they all look the same.
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
  'listing-scoped-qualified-professional',
  {
    tag: ['@harness-b', '@qualified', '@listing-scoped', '@reading-level'],
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

    const createResp = await page.request.post('/api/ada/session', {
      data: { listing_slug: LISTING_SLUG, reading_level: 'professional' },
    });
    if (!createResp.ok()) {
      throw new Error(
        `POST /api/ada/session returned ${createResp.status()}`,
      );
    }
    const sessionBody = (await createResp.json()) as {
      session_id: string;
      reading_level: string;
    };
    recorder.assertion(
      'session-created-professional',
      sessionBody.reading_level === 'professional',
      `reading_level=${sessionBody.reading_level}`,
    );

    await page.goto('/chat');
    recorder.navigate('/chat');

    const conversation = page.getByLabel('Conversation with Ada');
    await expect(conversation).toBeVisible({ timeout: 15_000 });
    await waitForSessionAdopted(conversation);
    await recorder.captureSessionState(page);

    // Same fact pattern but phrased with domain vocabulary — the kind
    // of user who would request professional reading level.
    const userScript = [
      "Title III / §36.302(f) claim. Booked a dedicated accessible " +
        "roll-in shower room at the Marriott Phoenix Airport for " +
        "March 4 2026; on arrival the unit provided a transfer tub " +
        "only, constituting a substantive policy-modification " +
        "failure.",
      "Attempted mitigation at front desk was denied; no alternate " +
        "compliant unit was offered. Out-of-pocket remediation cost " +
        "$240 for a comparable accessible room at the Hyatt, same " +
        "block.",
      "Reservation was made through the Marriott website, " +
        "accessibility preferences captured in the booking record. I " +
        "retain the confirmation email as evidence.",
      "Yes, I consent to join. Dana Reyes, dana.reyes.test@example.com.",
      "Please submit.",
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

    const assistantTurns = recorder.trace.turns.filter(
      (t) => t.role === 'assistant',
    );
    const avgLength =
      assistantTurns.length > 0
        ? assistantTurns.reduce((sum, t) => sum + t.content.length, 0) /
          assistantTurns.length
        : 0;
    recorder.assertion(
      'professional-mode-avg-turn-moderate',
      avgLength >= 300,
      `avg assistant turn = ${Math.round(avgLength)} chars ` +
        `(expected ≥300 for professional mode)`,
    );

    recorder.assertion(
      'extract-field-fired',
      recorder.trace.toolsCalled.some((t) => t.startsWith('extract_field')),
    );
    recorder.assertion(
      'session-status-completed',
      recorder.trace.sessionStatus === 'completed',
    );
    recorder.assertion(
      'finalize-intake-fired',
      recorder.trace.toolsCalled.some((t) => t.startsWith('finalize_intake')),
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
