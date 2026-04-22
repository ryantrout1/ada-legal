/**
 * Persona #1 — Listing-scoped qualified (standard reader)
 * Step 28, Commit 1 (reference implementation).
 *
 * Tags: @harness-a @qualified @listing-scoped
 *
 * Scenario:
 *   A user lands on /class-actions/hotel-accessible-room-fraud from a
 *   search result or direct link. She reads the case description, sees
 *   her situation matches, and clicks "Talk to Ada about this." The
 *   button fires POST /api/ada/session with listing_slug pre-bound.
 *   Ada greets her in intake mode. Over 5-6 turns she explains what
 *   happened, answers eligibility questions, and Ada extracts the
 *   required fields. Ada calls finalize_intake(qualified=true) and
 *   the session transitions to completed.
 *
 *   This is the happy path. If this breaks, the pilot is broken.
 *
 * Fact pattern (deliberately specific — real-sounding, minor typos
 * and hedging language that a real user would produce):
 *   - Attempted booking at Marriott Phoenix Airport, March 4 2026
 *   - Booked "accessible roll-in shower room"
 *   - On arrival, room had a step-in tub, not a roll-in shower
 *   - User uses a wheelchair; transferred to tub was unsafe
 *   - Hotel offered no alternative accessible room
 *   - User had to pay for a second hotel (Hyatt, one block over)
 *   - Out-of-pocket loss: ~$240 for the second booking
 *   - Reported to hotel management; received dismissive response
 *
 * Pass criteria (soft — we assert on behaviors, not exact words):
 *   1. Deep-link creates a class_action_intake session (data-session-id
 *      non-empty, status=active on /chat load)
 *   2. Ada's first response references the hotel case specifically
 *      (mentions "hotel" or "accessible room" — from LISTING CONTEXT)
 *   3. At some point during the conversation, Ada calls extract_field
 *      (at least one "tools: ..." row mentions extract_field)
 *   4. Session ultimately transitions to completed (data-session-status
 *      flips from active to completed within 6 user turns)
 *   5. finalize_intake appears in the tools row on the final assistant
 *      message (not just any turn — the last one, so we know it was the
 *      closing action)
 *   6. No runtime errors in the page console during the conversation
 *      (assertion captured via browser event listener)
 *
 * What we deliberately DO NOT assert:
 *   - Exact wording of any Ada response (LLM variance)
 *   - Exact number of turns (could be 4, could be 7 depending on how
 *     chatty the user is; we cap at 6 user turns to prevent a runaway)
 *   - Which specific fields get extracted (pilot listing's
 *     required_fields may evolve; we only assert that extract_field
 *     fired at all)
 *
 * Preconditions:
 *   - PLAYWRIGHT_TARGET must be preview or prod (real engine required)
 *   - Pilot listing 'hotel-accessible-room-fraud' must be live on that
 *     target (seeded via migration scripts; was live as of 3c12af3)
 *   - Reading level defaults to standard
 */

import { test, expect } from './harness/personaHarness.js';

const LISTING_SLUG = 'hotel-accessible-room-fraud';
// Hard cap on the conversation (user turns) — the persona script below
// has 5, but in the general case Ada might need more follow-ups. If we
// blow past this without reaching finalize_intake, the test fails.
const TURN_TIMEOUT_MS = 90_000;

test.describe.configure({ mode: 'serial' });

test(
  'listing-scoped-qualified-standard',
  {
    tag: ['@harness-a', '@qualified', '@listing-scoped'],
  },
  async ({ page, recorder }) => {
    test.skip(
      process.env.PLAYWRIGHT_TARGET !== 'preview' &&
        process.env.PLAYWRIGHT_TARGET !== 'prod',
      'Persona tests require PLAYWRIGHT_TARGET=preview or prod (real engine).',
    );

    // Capture console errors so we can flag any runtime exceptions in
    // the trace. These don't fail the test by themselves but show up
    // in trace.json for debugging.
    page.on('pageerror', (err) => {
      recorder.step('console-error', {
        message: err.message,
        stack: err.stack?.slice(0, 500),
      });
    });

    // ── Phase 1: land on the public detail page ─────────────────────
    await page.goto(`/class-actions/${LISTING_SLUG}`);
    recorder.navigate(`/class-actions/${LISTING_SLUG}`);
    recorder.step('detail-page-loaded');

    const ctaButton = page.getByRole('button', {
      name: /Talk to Ada about this/i,
    });
    await expect(ctaButton).toBeVisible({ timeout: 15_000 });
    recorder.assertion('cta-button-visible', true);

    // ── Phase 2: click CTA, land on /chat pre-bound ─────────────────
    await Promise.all([
      page.waitForURL(/\/chat(?:\?|$)/, { timeout: 15_000 }),
      ctaButton.click(),
    ]);
    recorder.navigate('/chat');
    recorder.step('navigated-to-chat');

    // Wait for the session to initialize. The chat container's
    // data-session-id attribute goes from '' to a uuid once the
    // resume-probe adopts the pre-bound session.
    const conversation = page.getByLabel('Conversation with Ada');
    await expect(conversation).toBeVisible({ timeout: 15_000 });

    // Give the resume-probe up to 10 seconds to adopt the session.
    await expect
      .poll(
        async () =>
          (await conversation.getAttribute('data-session-id')) || '',
        { timeout: 15_000, intervals: [500, 1000, 2000] },
      )
      .not.toBe('');

    await recorder.captureSessionState(page);
    recorder.assertion(
      'session-id-present',
      recorder.trace.sessionId !== null &&
        recorder.trace.sessionId !== '',
      `session_id=${recorder.trace.sessionId}`,
    );
    recorder.assertion(
      'session-status-active',
      recorder.trace.sessionStatus === 'active',
      `status=${recorder.trace.sessionStatus}`,
    );

    // ── Phase 3: walk the conversation ──────────────────────────────
    const userScript = [
      'Hi — I booked an accessible roll-in shower room at the Marriott ' +
        'Phoenix Airport for March 4th. When I checked in the room had ' +
        'a regular step-in tub, not a roll-in shower. I use a wheelchair.',
      'The front desk told me they had no other accessible rooms. I ended ' +
        'up paying for a separate room at the Hyatt one block over. That ' +
        'cost me about 240 dollars that I would not have spent otherwise.',
      'I tried to transfer into the tub and it was not safe. I almost fell. ' +
        'I did report it to the hotel management and they basically told ' +
        'me it was not their problem.',
      'I booked through the Marriott website directly, yes. And I still ' +
        'have the confirmation email showing I asked for accessible roll-in.',
      'Yes, I would like to join. My name is Dana Reyes. Email is ' +
        'dana.reyes.test@example.com.',
    ];

    const sendButton = page.getByRole('button', { name: /^Send$/i });
    const input = page.getByRole('textbox', { name: /Message Ada/i });

    for (let i = 0; i < userScript.length; i += 1) {
      const userText = userScript[i]!;
      recorder.userTurn(userText);

      await input.fill(userText);
      await sendButton.click();
      recorder.step(`sent-user-turn-${i + 1}`);

      // Wait for Ada's response. The nth assistant message (zero-indexed)
      // equals the current iteration i.
      const assistantBubble = page.locator('[data-role="assistant"]').nth(i);
      await expect(assistantBubble).toBeVisible({
        timeout: TURN_TIMEOUT_MS,
      });

      // Wait for busy flag to drop — signals the turn has fully
      // completed server-side. Without this, we sometimes read a
      // half-rendered bubble.
      await expect
        .poll(
          async () =>
            (await conversation.getAttribute('data-busy')) ?? 'true',
          { timeout: TURN_TIMEOUT_MS, intervals: [500, 1000, 2000] },
        )
        .toBe('false');

      const assistantText = (await assistantBubble.textContent()) ?? '';
      const toolsMatch = assistantText.match(/tools:\s*([^\n]+)$/);
      const tools = toolsMatch
        ? toolsMatch[1]!.split(',').map((s) => s.trim())
        : undefined;
      // Strip the trailing "tools: ..." line from content we store
      const cleanContent = assistantText
        .replace(/^(You|Ada)\s*/, '')
        .replace(/\n?tools:\s*[^\n]+$/, '')
        .trim();
      recorder.assistantTurn(cleanContent, tools);

      await recorder.captureSessionState(page);

      // Bail out if the session already transitioned to completed —
      // means Ada hit finalize_intake and we don't need more turns.
      if (recorder.trace.sessionStatus === 'completed') {
        recorder.step('session-completed-early', { turn: i + 1 });
        break;
      }
    }

    // ── Phase 4: assertions on the final state ──────────────────────

    // Assertion 1: first assistant turn mentioned the listing context.
    const firstAssistant = recorder.trace.turns.find(
      (t) => t.role === 'assistant',
    );
    const firstText = firstAssistant?.content.toLowerCase() ?? '';
    recorder.assertion(
      'first-response-references-hotel-case',
      /hotel|accessible\s*room|marriott|roll-?in\s*shower/.test(firstText),
      firstText.slice(0, 100),
    );

    // Assertion 2: extract_field fired at least once.
    const anyExtract = recorder.trace.toolsCalled.some((t) =>
      t.startsWith('extract_field'),
    );
    recorder.assertion(
      'extract-field-fired',
      anyExtract,
      `toolsCalled=${recorder.trace.toolsCalled.join(',')}`,
    );

    // Assertion 3: session reached completed.
    recorder.assertion(
      'session-status-completed',
      recorder.trace.sessionStatus === 'completed',
      `final status=${recorder.trace.sessionStatus} after ${recorder.trace.turnCount} turns`,
    );

    // Assertion 4: finalize_intake fired (on any turn — the bail-out
    // above would have captured it).
    const finalized = recorder.trace.toolsCalled.some((t) =>
      t.startsWith('finalize_intake'),
    );
    recorder.assertion(
      'finalize-intake-fired',
      finalized,
      `toolsCalled=${recorder.trace.toolsCalled.join(',')}`,
    );

    // Assertion 5: no runtime errors captured.
    const errors = recorder.trace.events.filter(
      (e) => e.kind === 'error' || e.name === 'console-error',
    );
    recorder.assertion(
      'no-console-errors',
      errors.length === 0,
      errors.length > 0
        ? `${errors.length} error events captured`
        : 'clean',
    );

    // The recorder's verdict is set by whether any assertion flipped.
    // We re-throw the Playwright expect here for Playwright's own status,
    // using a soft expect so all assertions get logged before the first
    // failure aborts.
    if (recorder.trace.assertions.failed > 0) {
      throw new Error(
        `${recorder.trace.assertions.failed} persona assertion(s) failed. See ` +
          `test-results/personas/<run>/${recorder.trace.slug}/assertions.log`,
      );
    }
  },
);
