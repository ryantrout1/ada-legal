/**
 * Layer 2 integration tests for processAdaTurn.
 *
 * Exercises the full turn loop end-to-end against InMemoryAdaClients with
 * scripted AI responses. The AI responses are written inline rather than
 * loaded from fixtures because these tests cover the turn-loop mechanics
 * (tool dispatch, state changes, loop cap, final message assembly), NOT
 * the quality of Ada's actual prompt understanding — that's a Layer 3
 * persona concern.
 *
 * Fixture-based tests with real captured Anthropic chunks live in
 * tests/personas/ and are the contract for "Ada talking to real users".
 * Those fixtures are recorded once by running the real API manually, then
 * replayed by the InMemoryAiClient on every CI run.
 *
 * What's tested here:
 *   - Turn with no tool calls → plain assistant message, no state changes
 *   - Turn with one extract_field tool call → state.extractedFields patched,
 *     then final text response
 *   - Turn with multiple tool calls (extract + classify + respond)
 *   - Loop cap: 5 consecutive tool-call iterations returns a safety-net message
 *   - Tool error passthrough: invalid tool input → dispatcher error → Ada
 *     sees error and can continue
 */

import { describe, it, expect } from 'vitest';
import { processAdaTurn } from '@/engine/processAdaTurn';
import { createSession } from '@/engine/session/sessionRepo';
import {
  makeInMemoryClients,
  type InMemoryAdaClients,
} from '@/engine/clients/inMemoryClients';
import type { AiStreamChunk } from '@/engine/clients/types';

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const ANON_ID = '00000000-0000-4000-8000-000000000abc';

function newSession(clients: InMemoryAdaClients) {
  return createSession(clients, {
    orgId: ORG_ID,
    sessionType: 'public_ada',
    anonSessionId: ANON_ID,
    userId: null,
  });
}

/** Helper: build a tool_use sequence chunk-by-chunk. */
function toolUseChunks(
  toolId: string,
  toolName: string,
  input: Record<string, unknown>,
): AiStreamChunk[] {
  return [
    { type: 'tool_use_start', toolId, toolName },
    { type: 'tool_use_stop', toolId, toolName, toolInput: input },
  ];
}

/** Helper: a turn that's just text, no tools. */
function textOnlyTurn(text: string): AiStreamChunk[] {
  return [
    { type: 'text_delta', content: text },
    { type: 'message_stop' },
  ];
}

describe('processAdaTurn — integration', () => {
  it('text-only response: no tool calls, returns plain assistant message', async () => {
    const clients = makeInMemoryClients();
    const state = newSession(clients);
    clients.ai.enqueueResponse(textOnlyTurn('Hi! What happened?'));

    const result = await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'hello' },
    });

    expect(result.assistantMessage.role).toBe('assistant');
    expect(result.assistantMessage.content).toBe('Hi! What happened?');
    expect(result.toolInvocations).toHaveLength(0);
    // History: user + assistant
    expect(result.nextState.conversationHistory).toHaveLength(2);
    expect(result.nextState.conversationHistory[0].role).toBe('user');
    expect(result.nextState.conversationHistory[0].content).toBe('hello');
  });

  it('one extract_field call: state.extractedFields is patched, then Ada replies', async () => {
    const clients = makeInMemoryClients();
    const state = newSession(clients);

    // Turn 1: Ada calls extract_field. Turn 2: Ada responds with text.
    clients.ai.enqueueResponse(
      toolUseChunks('tu_1', 'extract_field', {
        field: 'location_state',
        value: 'AZ',
        confidence: 0.95,
      }),
    );
    clients.ai.enqueueResponse(textOnlyTurn('Got it — Arizona. Tell me more?'));

    const result = await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'a restaurant in Phoenix refused my service dog' },
    });

    expect(result.toolInvocations).toHaveLength(1);
    expect(result.toolInvocations[0].name).toBe('extract_field');
    expect(result.toolInvocations[0].isError).toBe(false);
    expect(result.nextState.extractedFields.location_state?.value).toBe('AZ');
    expect(result.nextState.extractedFields.location_state?.confidence).toBe(0.95);
    expect(result.assistantMessage.content).toBe('Got it — Arizona. Tell me more?');
  });

  it('short-circuits an all-extract_field iteration with streamed text: one model round-trip, no reset (turn-latency fix)', async () => {
    const clients = makeInMemoryClients();
    const state = newSession(clients);
    const reply = "You couldn't get in. That's a Title III access issue.";

    // Iteration 1: model emits its conversational reply ALONGSIDE the
    // extract_field call. Under the short-circuit this is the WHOLE turn —
    // no second response is queued, so a second stream() would throw.
    clients.ai.enqueueResponse([
      { type: 'text_delta', content: reply },
      ...toolUseChunks('tu_1', 'extract_field', {
        field: 'access_denied',
        value: true,
        confidence: 1,
      }),
    ]);

    // Simulate the browser: append deltas, clear on reset.
    let bubble = '';
    let resetCount = 0;

    const result = await processAdaTurn({
      clients,
      state,
      input: {
        userMessage: 'there was no ramp and I could not get inside',
        onTextDelta: (d) => {
          bubble += d;
        },
        onStreamReset: () => {
          resetCount += 1;
          bubble = '';
        },
      },
    });

    // Exactly one model round-trip — the extract_field result never goes
    // back to the model.
    expect(clients.ai.requests.length).toBe(1);
    // No reset: the buffered text IS the final reply.
    expect(resetCount).toBe(0);
    expect(bubble).toBe(reply);
    expect(result.assistantMessage.content).toBe(reply);
    // The extraction still landed.
    expect(result.nextState.extractedFields.access_denied?.value).toBe(true);
    // tools_invoked sidecar still records the call (QC / attorneyMatched read it).
    expect(
      result.nextState.metadata.tools_invoked?.some(
        (t) => t.name === 'extract_field' && t.result_kind === 'ok',
      ),
    ).toBe(true);
    // History keeps the normal completed-loop shape: assistant tool_use →
    // user tool_result → assistant text — with the reply present exactly
    // once (no doubled transcript bubble).
    const history = result.nextState.conversationHistory;
    const last = history[history.length - 1];
    expect(last.role).toBe('assistant');
    expect(last.content).toBe(reply);
    const copies = history.filter(
      (m) =>
        m.role === 'assistant' &&
        (typeof m.content === 'string'
          ? m.content.includes(reply)
          : JSON.stringify(m.content).includes(reply)),
    );
    expect(copies.length).toBe(1);
  });

  it('does NOT short-circuit a silent all-extract_field iteration — loops so the user still gets a reply', async () => {
    const clients = makeInMemoryClients();
    const state = newSession(clients);
    const reply = 'Got it — recorded. What state did this happen in?';

    // Iteration 1: extract_field with NO text (legacy silent extraction).
    clients.ai.enqueueResponse([
      ...toolUseChunks('tu_1', 'extract_field', {
        field: 'business_name',
        value: 'Subway',
        confidence: 0.9,
      }),
    ]);
    // Iteration 2: the model produces the reply.
    clients.ai.enqueueResponse(textOnlyTurn(reply));

    let resetCount = 0;
    const result = await processAdaTurn({
      clients,
      state,
      input: {
        userMessage: 'no ramp at Subway',
        onStreamReset: () => {
          resetCount += 1;
        },
      },
    });

    expect(clients.ai.requests.length).toBe(2);
    // No text streamed in iteration 1, so no reset was needed either.
    expect(resetCount).toBe(0);
    expect(result.assistantMessage.content).toBe(reply);
  });

  it('does NOT short-circuit when an extract_field dispatch fails — loops so Ada can correct', async () => {
    const clients = makeInMemoryClients();
    const state = newSession(clients);
    const reply = 'Noted — thanks.';
    const corrected = 'Let me note that properly. What state was this in?';

    // Iteration 1: text + an INVALID extract_field (confidence out of
    // range → validateInput rejects → { ok: false }).
    clients.ai.enqueueResponse([
      { type: 'text_delta', content: reply },
      ...toolUseChunks('tu_1', 'extract_field', {
        field: 'location_state',
        value: 'AZ',
        confidence: 5,
      }),
    ]);
    // Iteration 2: model sees the error tool_result and recovers.
    clients.ai.enqueueResponse(textOnlyTurn(corrected));

    let resetCount = 0;
    const result = await processAdaTurn({
      clients,
      state,
      input: {
        userMessage: 'it was in AZ',
        onStreamReset: () => {
          resetCount += 1;
        },
      },
    });

    // Failure path keeps the loop: two round-trips, reset fired for the
    // superseded iteration-1 text.
    expect(clients.ai.requests.length).toBe(2);
    expect(resetCount).toBe(1);
    expect(result.assistantMessage.content).toBe(corrected);
  });

  it('does NOT short-circuit when a non-extract_field tool rides along — loops with reset as before', async () => {
    const clients = makeInMemoryClients();
    const state = newSession(clients);
    const reply = 'That sounds like a Title III issue.';

    clients.ai.enqueueResponse([
      { type: 'text_delta', content: reply },
      ...toolUseChunks('tu_1', 'extract_field', {
        field: 'access_denied',
        value: true,
        confidence: 1,
      }),
      ...toolUseChunks('tu_2', 'set_reading_level', { level: 'simple' }),
    ]);
    clients.ai.enqueueResponse(textOnlyTurn(reply));

    let bubble = '';
    let resetCount = 0;
    const result = await processAdaTurn({
      clients,
      state,
      input: {
        userMessage: 'no ramp, please keep it simple',
        onTextDelta: (d) => {
          bubble += d;
        },
        onStreamReset: () => {
          resetCount += 1;
          bubble = '';
        },
      },
    });

    expect(clients.ai.requests.length).toBe(2);
    expect(resetCount).toBe(1);
    expect(bubble).toBe(reply);
    expect(result.assistantMessage.content).toBe(reply);
  });

  it('does not emit onStreamReset on a plain text-only turn', async () => {
    const clients = makeInMemoryClients();
    const state = newSession(clients);
    clients.ai.enqueueResponse(textOnlyTurn('Hi! What happened?'));

    let resetCount = 0;
    await processAdaTurn({
      clients,
      state,
      input: {
        userMessage: 'hello',
        onStreamReset: () => {
          resetCount += 1;
        },
      },
    });
    expect(resetCount).toBe(0);
  });

  it('chain of tool calls: extract + classify + respond', async () => {
    const clients = makeInMemoryClients();
    const state = newSession(clients);

    // Turn 1: extract_field
    clients.ai.enqueueResponse(
      toolUseChunks('tu_1', 'extract_field', {
        field: 'business_type',
        value: 'Restaurant',
        confidence: 0.9,
      }),
    );
    // Turn 2: set_classification
    clients.ai.enqueueResponse(
      toolUseChunks('tu_2', 'set_classification', {
        title: 'III',
        tier: 'high',
        reasoning: 'Service animal denial at a restaurant — classic Title III',
        standard: '28 CFR §36.302(c)',
      }),
    );
    // Turn 3: final text
    clients.ai.enqueueResponse(
      textOnlyTurn("This looks like a Title III violation. Let's find an attorney."),
    );

    const result = await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'a restaurant in Phoenix refused my service dog' },
    });

    expect(result.toolInvocations.map((t) => t.name)).toEqual([
      'extract_field',
      'set_classification',
    ]);
    expect(result.nextState.extractedFields.business_type?.value).toBe('Restaurant');
    expect(result.nextState.classification?.title).toBe('III');
    expect(result.nextState.classification?.tier).toBe('high');
    expect(result.assistantMessage.content).toContain('Title III');
  });

  it('session transition via end_session: status moves active → completed', async () => {
    const clients = makeInMemoryClients();
    const base = newSession(clients);
    // A summary was proposed on a prior turn (R5a gate); the user's message
    // this turn is their confirmation, so end_session is allowed to complete.
    const state = { ...base, metadata: { ...base.metadata, summary_proposed_at_user_turns: 0 } };

    clients.ai.enqueueResponse(
      toolUseChunks('tu_1', 'end_session', {
        outcome: 'referred_to_eeoc',
        summary: 'Title I — gave EEOC link',
      }),
    );
    clients.ai.enqueueResponse(textOnlyTurn('Thanks for reaching out.'));

    const result = await processAdaTurn({
      clients,
      state,
      input: { userMessage: "it's a workplace issue" },
    });

    expect(result.nextState.status).toBe('completed');
    expect(result.toolInvocations[0].name).toBe('end_session');
    expect(result.toolInvocations[0].isError).toBe(false);
    // Regression (tools_invoked gap): the turn's tool calls are recorded into
    // metadata.tools_invoked — the source QC + attorneyMatched read.
    expect(result.nextState.metadata.tools_invoked?.map((t) => t.name)).toContain('end_session');
    expect(result.nextState.metadata.tools_invoked?.[0].result_kind).toBe('ok');
  });

  it('set_reading_level: state.readingLevel updates mid-turn', async () => {
    const clients = makeInMemoryClients();
    const state = newSession(clients);
    expect(state.readingLevel).toBe('standard');

    clients.ai.enqueueResponse(
      toolUseChunks('tu_1', 'set_reading_level', {
        level: 'simple',
        reason: 'user asked for plain language',
      }),
    );
    clients.ai.enqueueResponse(textOnlyTurn('Got it. I will use simpler words.'));

    const result = await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'Can you say it simpler?' },
    });

    expect(result.nextState.readingLevel).toBe('simple');
  });

  it('invalid tool input: dispatcher returns error, Ada sees it and continues', async () => {
    const clients = makeInMemoryClients();
    const state = newSession(clients);

    // Ada calls set_classification with an invalid title.
    clients.ai.enqueueResponse(
      toolUseChunks('tu_1', 'set_classification', {
        title: 'IV', // invalid
        tier: 'high',
        reasoning: 'testing',
        standard: '§',
      }),
    );
    clients.ai.enqueueResponse(
      textOnlyTurn('Sorry, let me reconsider — could you tell me more?'),
    );

    const result = await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'something happened' },
    });

    expect(result.toolInvocations).toHaveLength(1);
    expect(result.toolInvocations[0].isError).toBe(true);
    // Classification NOT set because the tool errored.
    expect(result.nextState.classification).toBeNull();
    expect(result.assistantMessage.content).toContain('reconsider');
  });

  it('loop cap: after MAX_TOOL_LOOPS consecutive tool calls returns safety-net message', async () => {
    const clients = makeInMemoryClients();
    const state = newSession(clients);

    // Queue 6 tool-use responses — one more than the cap of 5.
    for (let i = 0; i < 6; i++) {
      clients.ai.enqueueResponse(
        toolUseChunks(`tu_${i}`, 'extract_field', {
          field: `field_${i}`,
          value: i,
          confidence: 0.5,
        }),
      );
    }
    // Plus a text response that shouldn't be reached.
    clients.ai.enqueueResponse(textOnlyTurn('Should not be reached.'));

    const result = await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'test' },
    });

    // Exactly 5 tool invocations despite 6 scripted.
    expect(result.toolInvocations).toHaveLength(5);
    // Safety-net message shown to user.
    expect(result.assistantMessage.content).toMatch(/hit a limit/i);
  });

  describe('knowledge base retrieval (Step 10.5)', () => {
    it('embeds the user message and searches the KB once per turn', async () => {
      const clients = makeInMemoryClients();
      const state = newSession(clients);
      clients.db.knowledgeChunks.push({
        id: 'chunk-1',
        topic: 'service_animals',
        title: '§36.302(c)(1) — Service animals — general rule',
        content: 'Generally, a public accommodation shall modify policies.',
        standardRefs: ['36.302(c)(1)', '36.302(c)', '36.302', '36'],
        source: '28 CFR §36',
        similarity: null,
        matchType: 'citation',
      });
      clients.ai.enqueueResponse(textOnlyTurn('Per §36.302(c)(1), yes.'));

      await processAdaTurn({
        clients,
        state,
        input: { userMessage: 'Can a restaurant refuse my service animal under §36.302?' },
      });

      expect(clients.embeddings.embedCalls).toHaveLength(1);
      expect(clients.embeddings.embedCalls[0]).toContain('service animal');
    });

    it('tool-loop iterations reuse the same KB results without re-searching', async () => {
      const clients = makeInMemoryClients();
      const state = newSession(clients);
      clients.db.knowledgeChunks.push({
        id: 'chunk-1',
        topic: 'service_animals',
        title: '§36.302(c)(1) — Service animals — general rule',
        content: 'body',
        standardRefs: ['36.302(c)(1)'],
        source: '28 CFR §36',
        similarity: null,
        matchType: 'citation',
      });
      // First response calls a tool, second is final text.
      clients.ai.enqueueResponse(
        toolUseChunks('t1', 'set_reading_level', { level: 'simple' }),
      );
      clients.ai.enqueueResponse(textOnlyTurn('OK.'));

      await processAdaTurn({
        clients,
        state,
        input: { userMessage: 'Tell me about §36.302 in simple words.' },
      });

      // Only ONE embed call despite two loop iterations.
      expect(clients.embeddings.embedCalls).toHaveLength(1);
    });

    it('proceeds without retrieval when embedding client throws', async () => {
      const clients = makeInMemoryClients();
      clients.embeddings.shouldFail = true;
      const state = newSession(clients);
      // Seed with a chunk that would be found by citation match even
      // without a vector embedding. Citation path should still run.
      clients.db.knowledgeChunks.push({
        id: 'chunk-1',
        topic: 'service_animals',
        title: '§36.302(c)(1) — title',
        content: 'body',
        standardRefs: ['36.302(c)(1)'],
        source: '28 CFR §36',
        similarity: null,
        matchType: 'citation',
      });
      clients.ai.enqueueResponse(textOnlyTurn('Answer.'));

      const result = await processAdaTurn({
        clients,
        state,
        input: { userMessage: 'What does §36.302(c)(1) say?' },
      });

      // Turn still completes successfully.
      expect(result.assistantMessage.content).toBe('Answer.');
    });

    it('omits KNOWLEDGE section when no chunks match', async () => {
      const clients = makeInMemoryClients();
      const state = newSession(clients);
      // KB is empty — no chunks seeded.
      clients.ai.enqueueResponse(textOnlyTurn('Answer.'));

      await processAdaTurn({
        clients,
        state,
        input: { userMessage: 'What colors should I paint my house?' },
      });

      // Inspect the system prompt sent to the AI client.
      const sentRequest = clients.ai.requests[clients.ai.requests.length - 1];
      expect(sentRequest.systemPrompt).not.toContain('# KNOWLEDGE');
    });

    it('injects KNOWLEDGE section when chunks are retrieved', async () => {
      const clients = makeInMemoryClients();
      const state = newSession(clients);
      clients.db.knowledgeChunks.push({
        id: 'chunk-1',
        topic: 'service_animals',
        title: '§36.302(c)(1) — Service animals — general rule',
        content: 'A public accommodation shall modify policies to permit service animals.',
        standardRefs: ['36.302(c)(1)'],
        source: '28 CFR §36',
        similarity: null,
        matchType: 'citation',
      });
      clients.ai.enqueueResponse(textOnlyTurn('Answer.'));

      await processAdaTurn({
        clients,
        state,
        input: { userMessage: 'Tell me about §36.302(c)(1).' },
      });

      const sentRequest = clients.ai.requests[clients.ai.requests.length - 1];
      expect(sentRequest.systemPrompt).toContain('# KNOWLEDGE');
      expect(sentRequest.systemPrompt).toContain('§36.302(c)(1)');
    });
  });
});
