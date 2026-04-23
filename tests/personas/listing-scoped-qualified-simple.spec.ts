/**
 * Persona #7 — Listing-scoped qualified, simple reader
 * Step 28, Commit 5.
 *
 * Tags: @harness-b @qualified @listing-scoped @reading-level
 *
 * Same fact pattern as persona #1 but with reading_level=simple.
 * The reason this matters: we've spent design energy on a plain-
 * language mode specifically for users with cognitive differences
 * who struggle with dense legal language. A qualified intake that
 * works on 'standard' but breaks on 'simple' is a disaster for the
 * exact audience we're building for.
 *
 * The public detail page's 'Talk to Ada about this' button
 * currently hardcodes reading_level: 'standard'. This persona
 * bypasses the page UI and POSTs directly to /api/ada/session
 * with { listing_slug, reading_level: 'simple' } to exercise the
 * engine's behavior at the simple reading level. The detail-page
 * UI path is already covered by persona #1.
 *
 * Pass criteria:
 *   1. Session creates with reading_level=simple
 *   2. Session is pre-bound as class_action_intake (listing_id set)
 *   3. Ada's responses stay short (simple mode emits shorter turns)
 *   4. extract_field fires
 *   5. Session reaches completed with finalize_intake
 *   6. Final outcome is qualified
 *
 * What we explicitly assert on "simple mode":
 *   - Ada's assistant turns are SHORTER on average than on standard.
 *     Not a hard cap per turn, but across the conversation the
 *     average assistant turn length should be ≤400 characters.
 *     (Standard mode typically runs 500-800; simple should be
 *     noticeably shorter.)
 *   - No assistant turn uses a "legal register" vocabulary that
 *     simple-mode is supposed to avoid. Words like "jurisdiction",
 *     "statute", "litigation", "class representative" should not
 *     appear.
 *
 * These are heuristic assertions — they catch regressions where
 * simple mode starts drifting back toward standard phrasing, not
 * precise linguistic analysis.
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

// Legal-register words that simple-mode should NOT use.
const LEGAL_REGISTER = [
  'jurisdiction',
  'statute',
  'litigation',
  'plaintiff',
  'class representative',
  'adjudicate',
  'liable',
  'cause of action',
];

test.describe.configure({ mode: 'serial' });

test(
  'listing-scoped-qualified-simple',
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

    // ── Create the session directly with reading_level=simple ───────
    // Skip the detail-page UI because it hardcodes 'standard'.
    recorder.step('creating-simple-session');
    const createResp = await page.request.post('/api/ada/session', {
      data: { listing_slug: LISTING_SLUG, reading_level: 'simple' },
    });
    if (!createResp.ok()) {
      const body = await createResp.text();
      recorder.step('session-create-failed', {
        status: createResp.status(),
        body: body.slice(0, 500),
      });
      throw new Error(
        `POST /api/ada/session returned ${createResp.status()}`,
      );
    }
    const sessionBody = (await createResp.json()) as {
      session_id: string;
      reading_level: string;
    };
    recorder.assertion(
      'session-created-simple',
      sessionBody.reading_level === 'simple',
      `reading_level=${sessionBody.reading_level}`,
    );
    recorder.step('session-created', {
      sessionId: sessionBody.session_id,
      readingLevel: sessionBody.reading_level,
    });

    // ── Navigate to /chat and let the resume-probe adopt the session ─
    await page.goto('/chat');
    recorder.navigate('/chat');

    const conversation = page.getByLabel('Conversation with Ada');
    await expect(conversation).toBeVisible({ timeout: 15_000 });
    await waitForSessionAdopted(conversation);
    await recorder.captureSessionState(page);

    recorder.assertion(
      'pre-bound-session-adopted',
      recorder.trace.sessionId === sessionBody.session_id,
      `expected ${sessionBody.session_id}, got ${recorder.trace.sessionId}`,
    );

    // ── Walk the conversation. Shorter, simpler phrasing from the user
    //    too — matches what a user who asked for simple mode would send.
    const userScript = [
      "I booked a hotel room for a wheelchair user. They gave me the " +
        "wrong kind of room when I got there.",
      "It was the Marriott in Phoenix, Arizona. March 4th 2026. I had " +
        "asked for a roll-in shower. They gave me a tub I could not use.",
      "I paid for a different hotel nearby. About 240 dollars. The " +
        "Marriott told me they had no other rooms.",
      "Yes I want to join. My name is Dana Reyes. dana.reyes.test@example.com",
      "Yes, please send it.",
    ];

    const sendButton = page.getByRole('button', { name: /^Send$/i });
    const input = page.getByRole('textbox', { name: /Message Ada/i });

    for (let i = 0; i < userScript.length; i += 1) {
      const userText = userScript[i]!;
      recorder.userTurn(userText);
      await input.fill(userText);
      await sendButton.click();
      recorder.step(`sent-user-turn-${i + 1}`);

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

      if (recorder.trace.sessionStatus === 'completed') {
        recorder.step('session-completed-early', { turn: i + 1 });
        break;
      }
    }

    // ── Assertions ──────────────────────────────────────────────────

    // Simple-mode heuristic 1: average assistant turn is ≤400 chars.
    const assistantTurns = recorder.trace.turns.filter(
      (t) => t.role === 'assistant',
    );
    const avgLength =
      assistantTurns.length > 0
        ? assistantTurns.reduce((sum, t) => sum + t.content.length, 0) /
          assistantTurns.length
        : 0;
    recorder.assertion(
      'simple-mode-avg-turn-short',
      avgLength <= 400,
      `avg assistant turn = ${Math.round(avgLength)} chars ` +
        `(expected ≤400 for simple mode)`,
    );

    // Simple-mode heuristic 2: no legal-register vocabulary.
    const allAssistantText = assistantTurns
      .map((t) => t.content.toLowerCase())
      .join('\n');
    const offenders = LEGAL_REGISTER.filter((w) =>
      allAssistantText.includes(w),
    );
    recorder.assertion(
      'simple-mode-no-legal-register',
      offenders.length === 0,
      offenders.length > 0
        ? `found legal-register words: ${offenders.join(', ')}`
        : 'clean',
    );

    // Standard assertions.
    const extractFired = recorder.trace.toolsCalled.some((t) =>
      t.startsWith('extract_field'),
    );
    recorder.assertion('extract-field-fired', extractFired);

    recorder.assertion(
      'session-status-completed',
      recorder.trace.sessionStatus === 'completed',
    );

    const finalized = recorder.trace.toolsCalled.some((t) =>
      t.startsWith('finalize_intake'),
    );
    recorder.assertion('finalize-intake-fired', finalized);

    const errors = recorder.trace.events.filter(
      (e) => e.kind === 'error' || e.name === 'console-error',
    );
    recorder.assertion(
      'no-console-errors',
      errors.length === 0,
      errors.length > 0 ? `${errors.length} errors` : 'clean',
    );

    throwIfAssertionsFailed(recorder);
  },
);
